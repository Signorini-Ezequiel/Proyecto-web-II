import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import Groq from 'groq-sdk';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import type { EnvironmentVariables } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import {
  VehicleAIAnalysisResponse,
  VehicleComparisonAnalysisResponse,
  VehicleComparisonAnalysisResult,
  VehicleDataAnalysisResponse,
  VehicleDataAnalysisResult,
  VehicleImageAnalysisResponse,
  VehicleImageAnalysisResult,
} from './ai-analysis.entity';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_VISION_IMAGES = 3;
const MAX_BASE64_IMAGE_BYTES = 3 * 1024 * 1024;
const AI_REQUEST_COOLDOWN_MS = 10_000;
const TEMPORARY_UNAVAILABLE_MESSAGE = 'Analisis IA temporalmente no disponible';

type GroqVisionContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type PreparedVisionImage = {
  original: string;
  absoluteUrl: string;
  inputUrl: string;
  transport: 'url' | 'base64';
};

type GroqVisionAnalysisJson = {
  overallCondition?: string;
  positivePoints?: string[];
  negativePoints?: string[];
  damageDetected?: string[];
  estimatedVisualCondition?: string;
  summary?: string;
};

type PublishedCarForAI = {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: Prisma.Decimal;
  fuelType: string;
  transmission: string;
  description: string;
  color: string;
  location: string;
  images: string[];
  engine: string | null;
  power: string | null;
  torque: string | null;
  acceleration: string | null;
  topSpeed: string | null;
  consumption: string | null;
  dimensions: string | null;
  weight: string | null;
  features: string[];
  updatedAt: Date;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly lastRequestByUser = new Map<string, number>();
  private groq: Groq | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async analyzeCar(
    carId: string,
    userId: string,
    force = false,
  ): Promise<VehicleAIAnalysisResponse> {
    const dataResponse = await this.analyzeCarDataById(carId, userId, force);
    const imageResponse = await this.analyzeCarImagesById(
      carId,
      userId,
      force,
      true,
    );

    return {
      carId,
      cached: dataResponse.cached && imageResponse.cached,
      generatedAt: new Date(
        Math.max(
          new Date(dataResponse.generatedAt).getTime(),
          new Date(imageResponse.generatedAt).getTime(),
        ),
      ).toISOString(),
      dataAnalysis: dataResponse.dataAnalysis,
      imageAnalysis: imageResponse.imageAnalysis,
      models: {
        data: dataResponse.model,
        vision: imageResponse.model,
      },
    };
  }

  async analyzeCarDataById(
    carId: string,
    userId: string,
    force = false,
  ): Promise<VehicleDataAnalysisResponse> {
    const startedAt = Date.now();
    const car = await this.requirePublishedCar(carId);
    const model = this.getGroqModelName();
    const dataHash = this.hash(this.buildDataSignature(car));

    this.logger.log(`request IA data carId=${carId} force=${force}`);
    const cached = force
      ? null
      : await this.prisma.aIAnalysis.findFirst({
          where: { carId, dataHash },
          orderBy: { createdAt: 'desc' },
        });

    if (cached) {
      this.logger.log(
        `cache hit IA data carId=${carId} ms=${Date.now() - startedAt}`,
      );
      return {
        carId,
        cached: true,
        generatedAt: cached.createdAt.toISOString(),
        dataAnalysis: cached.result as unknown as VehicleDataAnalysisResult,
        model: cached.model,
      };
    }

    this.logger.log(`cache miss IA data carId=${carId}`);
    this.enforceRateLimit(userId);
    const dataAnalysis = await this.callGroq(() => this.analyzeCarData(car));
    const stored = await this.prisma.aIAnalysis.create({
      data: {
        carId,
        dataHash,
        model,
        result: this.toJson(dataAnalysis),
        score: dataAnalysis.score,
        metadata: {
          generatedBy: 'groq',
          source: 'vehicle-data',
        },
      },
    });

    this.logger.log(
      `response IA data carId=${carId} cached=false ms=${Date.now() - startedAt}`,
    );
    return {
      carId,
      cached: false,
      generatedAt: stored.createdAt.toISOString(),
      dataAnalysis,
      model,
    };
  }

  async analyzeCarImagesById(
    carId: string,
    userId: string,
    force = false,
    skipRateLimit = false,
  ): Promise<VehicleImageAnalysisResponse> {
    const startedAt = Date.now();
    const car = await this.requirePublishedCar(carId);
    const model = this.getGroqVisionModelName();
    const imageKeys = this.normalizeImageKeys(car.images);
    const imageHash = this.hash(imageKeys.join('|') || 'no-images');

    this.logger.log(
      `request IA images carId=${carId} force=${force} images=${imageKeys.length}`,
    );
    if (imageKeys.length === 0) {
      return {
        carId,
        cached: true,
        generatedAt: new Date().toISOString(),
        imageAnalysis: null,
        model: null,
      };
    }

    const cached = force
      ? null
      : await this.prisma.imageAnalysis.findFirst({
          where: { carId, imageHash },
          orderBy: { createdAt: 'desc' },
        });

    if (cached) {
      this.logger.log(
        `cache hit IA images carId=${carId} ms=${Date.now() - startedAt}`,
      );
      return {
        carId,
        cached: true,
        generatedAt: cached.createdAt.toISOString(),
        imageAnalysis: cached.result as unknown as VehicleImageAnalysisResult,
        model: cached.model,
      };
    }

    this.logger.log(`cache miss IA images carId=${carId}`);
    if (!skipRateLimit) this.enforceRateLimit(userId);
    const imageAnalysis = await this.analyzeCarImagesSafely(car, imageKeys);
    if (imageAnalysis.confidence === 0) {
      this.logger.warn(
        `response IA images fallback carId=${carId} ms=${Date.now() - startedAt}`,
      );
      return {
        carId,
        cached: false,
        generatedAt: new Date().toISOString(),
        imageAnalysis,
        model,
      };
    }

    const stored = await this.prisma.imageAnalysis.create({
      data: {
        carId,
        imageHash,
        model,
        images: imageKeys,
        result: this.toJson(imageAnalysis),
        score: imageAnalysis.confidence,
        metadata: {
          generatedBy: 'groq',
          source: 'vehicle-image-vision',
          imageCount: imageKeys.length,
          note: 'Groq multimodal vision analysis.',
        },
      },
    });

    this.logger.log(
      `response IA images carId=${carId} cached=false ms=${Date.now() - startedAt}`,
    );
    return {
      carId,
      cached: false,
      generatedAt: stored.createdAt.toISOString(),
      imageAnalysis,
      model,
    };
  }

  async analyzeComparison(
    carIds: string[],
    userId: string,
    force = false,
  ): Promise<VehicleComparisonAnalysisResponse> {
    const startedAt = Date.now();
    const uniqueCarIds = Array.from(
      new Set(carIds.map((id) => id.trim())),
    ).filter(Boolean);

    this.logger.log(
      `request IA comparison carIds=${uniqueCarIds.join(',')} force=${force}`,
    );
    if (uniqueCarIds.length < 2 || uniqueCarIds.length > 4) {
      throw new BadRequestException('Debes comparar entre 2 y 4 vehiculos.');
    }

    const cars = await this.prisma.car.findMany({
      where: { id: { in: uniqueCarIds }, isPublished: true },
      orderBy: { createdAt: 'asc' },
    });

    if (cars.length !== uniqueCarIds.length) {
      throw new BadRequestException('Uno o mas vehiculos no estan publicados.');
    }

    const carsById = new Map(cars.map((car) => [car.id, car]));
    const orderedCars = uniqueCarIds.map((id) => {
      const car = carsById.get(id);
      if (!car) {
        throw new BadRequestException(
          'Uno o mas vehiculos no estan publicados.',
        );
      }

      return car;
    });
    const model = this.getGroqModelName();
    const dataHash = this.hash(
      `comparison:${orderedCars
        .map((car) => this.buildDataSignature(car))
        .join('|')}`,
    );
    const cacheCarId = orderedCars[0].id;

    const cached = force
      ? null
      : await this.prisma.aIAnalysis.findFirst({
          where: { carId: cacheCarId, dataHash },
          orderBy: { createdAt: 'desc' },
        });

    if (cached) {
      this.logger.log(
        `cache hit IA comparison carIds=${uniqueCarIds.join(',')} ms=${
          Date.now() - startedAt
        }`,
      );
      return {
        carIds: uniqueCarIds,
        cached: true,
        generatedAt: cached.createdAt.toISOString(),
        comparisonAnalysis:
          cached.result as unknown as VehicleComparisonAnalysisResult,
        model: cached.model,
      };
    }

    this.logger.log(
      `cache miss IA comparison carIds=${uniqueCarIds.join(',')}`,
    );
    this.enforceRateLimit(userId);
    const comparisonAnalysis = await this.callGroq(() =>
      this.generateComparisonAnalysis(orderedCars),
    );
    const stored = await this.prisma.aIAnalysis.create({
      data: {
        carId: cacheCarId,
        dataHash,
        model,
        result: this.toJson(comparisonAnalysis),
        score: comparisonAnalysis.score,
        metadata: {
          generatedBy: 'groq',
          source: 'vehicle-comparison',
          carIds: uniqueCarIds,
        },
      },
    });

    this.logger.log(
      `response IA comparison carIds=${uniqueCarIds.join(',')} cached=false ms=${
        Date.now() - startedAt
      }`,
    );
    return {
      carIds: uniqueCarIds,
      cached: false,
      generatedAt: stored.createdAt.toISOString(),
      comparisonAnalysis,
      model,
    };
  }

  async analyzeCarData(
    car: PublishedCarForAI,
  ): Promise<VehicleDataAnalysisResult> {
    const parsed =
      await this.createStructuredResponse<VehicleDataAnalysisResult>({
        systemInstruction:
          'Eres un asesor automotor profesional. Analiza solo los datos provistos. No inventes historial, mantenimiento, titularidad, fallas mecanicas ni inspecciones. Responde en espanol claro, corto y natural.',
        userPrompt:
          'Analiza estos datos publicados por el usuario. Maximo dos parrafos entre summary y recommendation. Devuelve solo JSON valido con: summary string, positives string[], negatives string[], recommendation string, score integer 0-100.\n' +
          JSON.stringify(this.carToPromptData(car)),
      });

    return {
      summary: parsed.summary.trim(),
      positives: this.cleanList(parsed.positives),
      negatives: this.cleanList(parsed.negatives),
      recommendation: parsed.recommendation.trim(),
      score: this.clampScore(parsed.score),
    };
  }

  async analyzeCarImages(
    car: PublishedCarForAI,
    imageUrls: string[],
  ): Promise<VehicleImageAnalysisResult> {
    const preparedImages = await this.prepareVisionImages(imageUrls);
    if (preparedImages.length === 0) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    try {
      return await this.createVisionAnalysis(car, preparedImages);
    } catch (error) {
      this.logger.error(
        `GROQ Vision URL/base64 mixed request failed: ${String(error)}`,
      );
      const inlineImages =
        await this.prepareInlineFallbackImages(preparedImages);
      const hasChangedTransport = inlineImages.some(
        (image, index) => image.inputUrl !== preparedImages[index]?.inputUrl,
      );

      if (!hasChangedTransport || inlineImages.length === 0) {
        throw error;
      }

      this.logger.warn(
        `retrying GROQ Vision with inline base64 images count=${inlineImages.length}`,
      );
      return this.createVisionAnalysis(car, inlineImages);
    }
  }

  private async analyzeCarImagesSafely(
    car: PublishedCarForAI,
    imageUrls: string[],
  ): Promise<VehicleImageAnalysisResult> {
    try {
      return await this.callGroq(() => this.analyzeCarImages(car, imageUrls));
    } catch (error) {
      this.logger.error(`GROQ Vision unavailable: ${String(error)}`);
      return this.getTemporaryImageAnalysis();
    }
  }

  private async createVisionAnalysis(
    car: PublishedCarForAI,
    images: PreparedVisionImage[],
  ): Promise<VehicleImageAnalysisResult> {
    const model = this.getGroqVisionModelName();
    const startedAt = Date.now();
    const prompt =
      'Analiza visualmente este auto usado a partir de las imagenes adjuntas. ' +
      'Evalua solamente lo que se vea en las fotos: estado general, danos visibles, pintura, ruedas, interior, desgaste, modificaciones, limpieza, senales de choque y estado percibido. ' +
      'No inventes danos ni historial. Si algo no se ve, indicalo como no verificable. ' +
      'Devuelve solo JSON valido con esta forma exacta: {"overallCondition":"","positivePoints":[],"negativePoints":[],"damageDetected":[],"estimatedVisualCondition":"","summary":""}.\n' +
      JSON.stringify({ vehiculo: this.carToPromptData(car) });
    const content: GroqVisionContentPart[] = [
      { type: 'text', text: prompt },
      ...images.map((image) => ({
        type: 'image_url' as const,
        image_url: { url: image.inputUrl },
      })),
    ];

    this.logger.log(
      `GROQ Vision request model=${model} images=${images.length} transports=${images
        .map((image) => image.transport)
        .join(',')}`,
    );
    this.logger.debug(
      `GROQ Vision images=${JSON.stringify(
        images.map((image) => ({
          original: image.original,
          absoluteUrl: image.absoluteUrl,
          transport: image.transport,
        })),
      )}`,
    );
    this.logger.debug(
      `GROQ Vision multimodal parts=${content.map((part) => part.type).join(',')}`,
    );

    const completion = await this.withTimeout(
      this.getClient().chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Eres un inspector automotor profesional. Responde en espanol claro. Devuelve exclusivamente JSON valido, sin markdown.',
          },
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.1,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
    );
    const output = completion.choices[0]?.message?.content;

    this.logger.log(
      `GROQ Vision response model=${model} ms=${Date.now() - startedAt} hasOutput=${Boolean(
        output,
      )}`,
    );

    if (!output) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    try {
      const parsed = JSON.parse(
        this.stripJsonFence(output),
      ) as GroqVisionAnalysisJson;
      return this.mapVisionJsonToFrontendShape(parsed);
    } catch {
      this.logger.error(`Respuesta GROQ Vision no parseable: ${output}`);
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }
  }

  private async prepareVisionImages(
    imageUrls: string[],
  ): Promise<PreparedVisionImage[]> {
    const images: PreparedVisionImage[] = [];
    const selectedImages = imageUrls.slice(0, MAX_VISION_IMAGES);

    this.logger.log(
      `GROQ Vision received images=${JSON.stringify(selectedImages)}`,
    );

    for (const original of selectedImages) {
      const absoluteUrl = this.toAbsoluteImageUrl(original);
      const localPath =
        this.tryLocalUploadPath(original) ??
        this.tryLocalUploadPath(absoluteUrl);

      if (this.isPublicHttpUrl(absoluteUrl)) {
        const isReachable = await this.isReachableImageUrl(absoluteUrl);
        if (isReachable) {
          images.push({
            original,
            absoluteUrl,
            inputUrl: absoluteUrl,
            transport: 'url',
          });
          continue;
        }

        this.logger.warn(`GROQ Vision image URL not reachable: ${absoluteUrl}`);
      }

      if (localPath && (await this.fileExists(localPath))) {
        const dataUrl = await this.localImageToDataUrl(localPath);
        if (dataUrl) {
          images.push({
            original,
            absoluteUrl,
            inputUrl: dataUrl,
            transport: 'base64',
          });
        }
        continue;
      }

      this.logger.warn(
        `GROQ Vision skipped image original=${original} absoluteUrl=${absoluteUrl}`,
      );
    }

    this.logger.log(
      `GROQ Vision prepared images=${images.length} absoluteUrls=${JSON.stringify(
        images.map((image) => image.absoluteUrl),
      )}`,
    );

    return images;
  }

  private async prepareInlineFallbackImages(
    images: PreparedVisionImage[],
  ): Promise<PreparedVisionImage[]> {
    const fallbackImages: PreparedVisionImage[] = [];

    for (const image of images) {
      if (image.transport === 'base64') {
        fallbackImages.push(image);
        continue;
      }

      const dataUrl = await this.remoteImageToDataUrl(image.inputUrl);
      if (!dataUrl) continue;

      fallbackImages.push({
        ...image,
        inputUrl: dataUrl,
        transport: 'base64',
      });
    }

    return fallbackImages;
  }

  private mapVisionJsonToFrontendShape(
    parsed: GroqVisionAnalysisJson,
  ): VehicleImageAnalysisResult {
    const overallCondition = this.cleanText(parsed.overallCondition);
    const estimatedVisualCondition = this.cleanText(
      parsed.estimatedVisualCondition,
    );
    const summary = this.cleanText(parsed.summary);
    const visualCondition = [
      overallCondition,
      estimatedVisualCondition,
      summary,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      visualCondition:
        visualCondition ||
        'Analisis visual completado sin observaciones claras.',
      detectedIssues: this.cleanList([
        ...this.cleanList(parsed.negativePoints),
        ...this.cleanList(parsed.damageDetected),
      ]),
      positiveAspects: this.cleanList(parsed.positivePoints),
      confidence: 80,
    };
  }

  private getTemporaryImageAnalysis(): VehicleImageAnalysisResult {
    return {
      visualCondition: TEMPORARY_UNAVAILABLE_MESSAGE,
      detectedIssues: [],
      positiveAspects: [],
      confidence: 0,
    };
  }

  private async generateComparisonAnalysis(
    cars: PublishedCarForAI[],
  ): Promise<VehicleComparisonAnalysisResult> {
    const parsed =
      await this.createStructuredResponse<VehicleComparisonAnalysisResult>({
        systemInstruction:
          'Eres un asesor automotor profesional. Compara solo datos publicados. No inventes inspecciones, historial ni fallas. Si un dato no esta, tratalo como no informado.',
        userPrompt:
          'Compara estos vehiculos y recomienda uno. Considera precio, kilometraje, marca/modelo, anio, transmision, combustible, descripcion, ubicacion y equipamiento declarado. Devuelve solo JSON valido con: winnerCarId string, summary string, positives string[], tradeoffs string[], recommendation string, score integer 0-100.\n' +
          JSON.stringify(cars.map((car) => this.carToPromptData(car))),
      });

    const fallbackWinnerId = cars[0].id;
    const winnerCarId = cars.some((car) => car.id === parsed.winnerCarId)
      ? parsed.winnerCarId
      : fallbackWinnerId;

    return {
      winnerCarId,
      summary: parsed.summary.trim(),
      positives: this.cleanList(parsed.positives),
      tradeoffs: this.cleanList(parsed.tradeoffs),
      recommendation: parsed.recommendation.trim(),
      score: this.clampScore(parsed.score),
    };
  }

  private async createStructuredResponse<T>(params: {
    systemInstruction: string;
    userPrompt: string;
  }): Promise<T> {
    const model = this.getGroqModelName();
    const completion = await this.withTimeout(
      this.getClient().chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              `${params.systemInstruction}\n` +
              'Devuelve exclusivamente JSON valido. No uses markdown.',
          },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      }),
    );
    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    try {
      return JSON.parse(this.stripJsonFence(output)) as T;
    } catch {
      this.logger.error(`Respuesta Groq no parseable: ${output}`);
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }
  }

  private getClient(): Groq {
    if (this.groq) return this.groq;

    const apiKey = this.configService.get('GROQ_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    this.groq = new Groq({ apiKey });
    return this.groq;
  }

  private async callGroq<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`error GROQ: ${String(error)}`);
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(
        () => reject(new Error('Groq request timed out')),
        REQUEST_TIMEOUT_MS,
      );
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private async requirePublishedCar(carId: string): Promise<PublishedCarForAI> {
    const car = await this.prisma.car.findFirst({
      where: { id: carId, isPublished: true },
    });

    if (!car) {
      throw new BadRequestException(
        'La publicacion no existe o no esta activa.',
      );
    }

    return car;
  }

  private normalizeImageKeys(images: string[]): string[] {
    return images
      .map((image) => image.trim())
      .filter(Boolean)
      .slice(0, MAX_VISION_IMAGES);
  }

  private toAbsoluteImageUrl(image: string): string {
    if (/^https?:\/\//i.test(image)) return image;

    const publicBaseUrl = this.getBackendPublicUrl();
    const normalizedPath = image.startsWith('/') ? image : `/uploads/${image}`;

    return new URL(normalizedPath, publicBaseUrl).toString();
  }

  private getBackendPublicUrl(): string {
    const configuredUrl = this.configService.get('BACKEND_PUBLIC_URL', {
      infer: true,
    });
    const fallbackUrl = `http://localhost:${this.configService.get('PORT', {
      infer: true,
    })}`;
    const baseUrl = configuredUrl || fallbackUrl;

    return baseUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '') + '/';
  }

  private isPublicHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();

      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1'
      ) {
        return false;
      }

      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private async isReachableImageUrl(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      const contentType = response.headers.get('content-type') ?? '';

      return response.ok && contentType.toLowerCase().startsWith('image/');
    } catch (error) {
      this.logger.warn(
        `No se pudo validar URL de imagen: ${url} ${String(error)}`,
      );
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private tryLocalUploadPath(image: string): string | null {
    try {
      const pathname = /^https?:\/\//i.test(image)
        ? new URL(image).pathname
        : image;
      if (!pathname.startsWith('/uploads/')) return null;

      return this.resolveUploadPath(pathname);
    } catch {
      return null;
    }
  }

  private resolveUploadPath(pathname: string): string {
    const relativePath = pathname.replace(/^\/uploads\/?/, '');
    const resolvedPath = normalize(
      join(process.cwd(), 'uploads', relativePath),
    );
    const uploadsRoot = normalize(join(process.cwd(), 'uploads'));

    if (!resolvedPath.startsWith(uploadsRoot)) {
      throw new BadRequestException('Ruta de imagen invalida.');
    }

    return resolvedPath;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async localImageToDataUrl(path: string): Promise<string | null> {
    try {
      const bytes = await readFile(path);
      return this.bytesToDataUrl(bytes, path);
    } catch (error) {
      this.logger.warn(
        `No se pudo leer imagen local para GROQ: ${String(error)}`,
      );
      return null;
    }
  }

  private async remoteImageToDataUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || undefined;
      return this.bytesToDataUrl(bytes, url, contentType);
    } catch (error) {
      this.logger.warn(
        `No se pudo convertir imagen remota a base64 para GROQ: ${String(error)}`,
      );
      return null;
    }
  }

  private bytesToDataUrl(
    bytes: Buffer,
    source: string,
    contentType?: string,
  ): string | null {
    if (bytes.length > MAX_BASE64_IMAGE_BYTES) {
      this.logger.warn(
        `Imagen demasiado grande para fallback base64 source=${source} bytes=${bytes.length}`,
      );
      return null;
    }

    const mimeType = contentType?.startsWith('image/')
      ? contentType
      : this.getImageMimeType(source);

    return `data:${mimeType};base64,${bytes.toString('base64')}`;
  }

  private getImageMimeType(image: string): string {
    const pathname = /^https?:\/\//i.test(image)
      ? new URL(image).pathname
      : image;
    const extension = extname(pathname).toLowerCase();

    if (extension === '.png') return 'image/png';
    if (extension === '.webp') return 'image/webp';
    return 'image/jpeg';
  }

  private getGroqModelName(): string {
    return this.configService.get('GROQ_MODEL', { infer: true });
  }

  private getGroqVisionModelName(): string {
    return this.configService.get('GROQ_VISION_MODEL', { infer: true });
  }

  private enforceRateLimit(userId: string): void {
    const now = Date.now();
    const lastRequest = this.lastRequestByUser.get(userId) ?? 0;
    const elapsed = now - lastRequest;

    if (elapsed < AI_REQUEST_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((AI_REQUEST_COOLDOWN_MS - elapsed) / 1000);
      throw new HttpException(
        `Espera ${waitSeconds}s antes de pedir otro analisis IA.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.lastRequestByUser.set(userId, now);
  }

  private carToPromptData(car: PublishedCarForAI): Record<string, unknown> {
    return {
      id: car.id,
      precio: Number(car.price),
      kilometraje: car.mileage,
      marca: car.brand,
      modelo: car.model,
      anio: car.year,
      combustible: car.fuelType,
      transmision: car.transmission,
      descripcion: car.description,
      ubicacion: car.location,
      color: car.color,
      motor: car.engine,
      potencia: car.power,
      torque: car.torque,
      aceleracion: car.acceleration,
      velocidadMaxima: car.topSpeed,
      consumo: car.consumption,
      dimensiones: car.dimensions,
      peso: car.weight,
      equipamiento: car.features,
    };
  }

  private buildDataSignature(car: PublishedCarForAI): string {
    return JSON.stringify(
      {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        mileage: car.mileage,
        price: car.price,
        fuelType: car.fuelType,
        transmission: car.transmission,
        description: car.description,
        location: car.location,
        color: car.color,
        engine: car.engine,
        power: car.power,
        torque: car.torque,
        acceleration: car.acceleration,
        topSpeed: car.topSpeed,
        consumption: car.consumption,
        dimensions: car.dimensions,
        weight: car.weight,
        features: car.features,
        updatedAt: car.updatedAt,
      },
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private clampScore(value: number): number {
    if (!Number.isFinite(value)) return 50;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private cleanList(items: string[] | undefined): string[] {
    return Array.isArray(items)
      ? items
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];
  }

  private cleanText(value: string | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private stripJsonFence(value: string): string {
    return value
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
  }
}
