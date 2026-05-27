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
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
  type Part,
  type ResponseSchema,
} from '@google/generative-ai';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
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

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_IMAGES = 6;
const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 4;
const TEMPORARY_UNAVAILABLE_MESSAGE = 'Analisis IA temporalmente no disponible';

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
  private readonly requestsByUser = new Map<string, number[]>();
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async analyzeCar(
    carId: string,
    userId: string,
    force = false,
  ): Promise<VehicleAIAnalysisResponse> {
    const [dataResponse, imageResponse] = await Promise.all([
      this.analyzeCarDataById(carId, userId, force),
      this.analyzeCarImagesById(carId, userId, force),
    ]);

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
    this.enforceRateLimit(userId);
    const car = await this.requirePublishedCar(carId);
    const model = this.getTextModelName();
    const dataHash = this.hash(this.buildDataSignature(car));

    const cached = force
      ? null
      : await this.prisma.aIAnalysis.findFirst({
          where: { carId, dataHash },
          orderBy: { createdAt: 'desc' },
        });

    if (cached) {
      return {
        carId,
        cached: true,
        generatedAt: cached.createdAt.toISOString(),
        dataAnalysis: cached.result as unknown as VehicleDataAnalysisResult,
        model: cached.model,
      };
    }

    const dataAnalysis = await this.callGemini(() => this.analyzeCarData(car));
    const stored = await this.prisma.aIAnalysis.create({
      data: {
        carId,
        dataHash,
        model,
        result: this.toJson(dataAnalysis),
        score: dataAnalysis.score,
        metadata: {
          generatedBy: 'google-gemini',
          source: 'vehicle-data',
        },
      },
    });

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
  ): Promise<VehicleImageAnalysisResponse> {
    this.enforceRateLimit(userId);
    const car = await this.requirePublishedCar(carId);
    const model = this.getVisionModelName();
    const imageKeys = this.normalizeImageKeys(car.images);
    const imageHash = this.hash(imageKeys.join('|') || 'no-images');

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
      return {
        carId,
        cached: true,
        generatedAt: cached.createdAt.toISOString(),
        imageAnalysis: cached.result as unknown as VehicleImageAnalysisResult,
        model: cached.model,
      };
    }

    const imageParts = await this.callGemini(() =>
      this.buildImageParts(imageKeys),
    );

    if (imageParts.length === 0) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    const imageAnalysis = await this.callGemini(() =>
      this.analyzeCarImages(car, imageParts),
    );
    const stored = await this.prisma.imageAnalysis.create({
      data: {
        carId,
        imageHash,
        model,
        images: imageKeys,
        result: this.toJson(imageAnalysis),
        score: imageAnalysis.confidence,
        metadata: {
          generatedBy: 'google-gemini',
          imageCount: imageParts.length,
        },
      },
    });

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
    this.enforceRateLimit(userId);
    const uniqueCarIds = Array.from(new Set(carIds.map((id) => id.trim()))).filter(
      Boolean,
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
        throw new BadRequestException('Uno o mas vehiculos no estan publicados.');
      }

      return car;
    });
    const model = this.getTextModelName();
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
      return {
        carIds: uniqueCarIds,
        cached: true,
        generatedAt: cached.createdAt.toISOString(),
        comparisonAnalysis:
          cached.result as unknown as VehicleComparisonAnalysisResult,
        model: cached.model,
      };
    }

    const comparisonAnalysis = await this.callGemini(() =>
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
          generatedBy: 'google-gemini',
          source: 'vehicle-comparison',
          carIds: uniqueCarIds,
        },
      },
    });

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
        modelName: this.getTextModelName(),
        schema: this.dataSchema(),
        systemInstruction:
          'Eres un asesor automotor profesional. Analiza solo los datos provistos. No inventes historial, mantenimiento, titularidad, fallas mecanicas ni inspecciones. Responde en espanol claro, corto y natural.',
        parts: [
          {
            text:
              'Analiza estos datos publicados por el usuario. Maximo dos parrafos entre summary y recommendation. Devuelve solo JSON valido.\n' +
              JSON.stringify(this.carToPromptData(car)),
          },
        ],
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
    imageParts: Part[],
  ): Promise<VehicleImageAnalysisResult> {
    const parsed =
      await this.createStructuredResponse<VehicleImageAnalysisResult>({
        modelName: this.getVisionModelName(),
        schema: this.imageSchema(),
        systemInstruction:
          'Eres un inspector visual automotor. Evalua solo lo visible en imagenes. Si algo no se ve, indica que no es evaluable. Se breve, honesto y util.',
        parts: [
          {
            text:
              `Analiza fotos reales publicadas de un ${car.brand} ${car.model} ${car.year}. ` +
              'Detecta solo condiciones visibles: danos, estado exterior, pintura, limpieza, desgaste, calidad de fotos y coherencia con la descripcion. No inventes problemas mecanicos invisibles.',
          },
          { text: `Descripcion publicada: ${car.description}` },
          ...imageParts,
        ],
      });

    return {
      visualCondition: parsed.visualCondition.trim(),
      detectedIssues: this.cleanList(parsed.detectedIssues),
      positiveAspects: this.cleanList(parsed.positiveAspects),
      confidence: this.clampScore(parsed.confidence),
    };
  }

  private async generateComparisonAnalysis(
    cars: PublishedCarForAI[],
  ): Promise<VehicleComparisonAnalysisResult> {
    const parsed =
      await this.createStructuredResponse<VehicleComparisonAnalysisResult>({
        modelName: this.getTextModelName(),
        schema: this.comparisonSchema(cars.map((car) => car.id)),
        systemInstruction:
          'Eres un asesor automotor profesional. Compara solo datos publicados. No inventes inspecciones, historial ni fallas. Si un dato no esta, tratalo como no informado.',
        parts: [
          {
            text:
              'Compara estos vehiculos y recomienda uno. Considera precio, kilometraje, marca/modelo, anio, transmision, combustible, descripcion, ubicacion y equipamiento declarado. Devuelve solo JSON valido.\n' +
              JSON.stringify(cars.map((car) => this.carToPromptData(car))),
          },
        ],
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
    modelName: string;
    schema: ResponseSchema;
    systemInstruction: string;
    parts: Part[];
  }): Promise<T> {
    const model = this.getModel(params.modelName, params.systemInstruction);
    const result = await this.withTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: params.parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: params.schema,
        },
      }),
    );
    const output = result.response.text();

    if (!output) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    try {
      return JSON.parse(this.stripJsonFence(output)) as T;
    } catch {
      this.logger.error(`Respuesta Gemini no parseable: ${output}`);
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }
  }

  private getModel(modelName: string, systemInstruction: string): GenerativeModel {
    return this.getClient().getGenerativeModel({
      model: modelName,
      systemInstruction,
    });
  }

  private getClient(): GoogleGenerativeAI {
    if (this.genAI) return this.genAI;

    const apiKey = this.configService.get('GEMINI_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    return this.genAI;
  }

  private async callGemini<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Gemini error: ${String(error)}`);
      throw new ServiceUnavailableException(TEMPORARY_UNAVAILABLE_MESSAGE);
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(
        () => reject(new Error('Gemini request timed out')),
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
      throw new BadRequestException('La publicacion no existe o no esta activa.');
    }

    return car;
  }

  private normalizeImageKeys(images: string[]): string[] {
    return images.map((image) => image.trim()).filter(Boolean).slice(0, MAX_IMAGES);
  }

  private async buildImageParts(images: string[]): Promise<Part[]> {
    const parts = await Promise.all(
      images.map(async (image) => this.imageToInlinePart(image)),
    );

    return parts.filter((part): part is Part => Boolean(part));
  }

  private async imageToInlinePart(image: string): Promise<Part | null> {
    try {
      const bytes = await this.readImageBytes(image);
      if (!bytes || bytes.length > MAX_INLINE_IMAGE_BYTES) return null;

      return {
        inlineData: {
          data: bytes.toString('base64'),
          mimeType: this.getImageMimeType(image),
        },
      };
    } catch (error) {
      this.logger.warn(`No se pudo preparar imagen para Gemini: ${String(error)}`);
      return null;
    }
  }

  private async readImageBytes(image: string): Promise<Buffer | null> {
    if (/^https?:\/\//i.test(image)) {
      const localPath = this.tryLocalUploadPathFromUrl(image);
      if (localPath) return readFile(localPath);

      const response = await fetch(image);
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    }

    if (image.startsWith('/uploads/')) {
      return readFile(this.resolveUploadPath(image));
    }

    return null;
  }

  private tryLocalUploadPathFromUrl(image: string): string | null {
    try {
      const url = new URL(image);
      if (
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
        url.pathname.startsWith('/uploads/')
      ) {
        return this.resolveUploadPath(url.pathname);
      }
    } catch {
      return null;
    }

    return null;
  }

  private resolveUploadPath(pathname: string): string {
    const relativePath = pathname.replace(/^\/uploads\/?/, '');
    const resolvedPath = normalize(join(process.cwd(), 'uploads', relativePath));
    const uploadsRoot = normalize(join(process.cwd(), 'uploads'));

    if (!resolvedPath.startsWith(uploadsRoot)) {
      throw new BadRequestException('Ruta de imagen invalida.');
    }

    return resolvedPath;
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

  private getTextModelName(): string {
    return this.configService.get('AI_MODEL', { infer: true });
  }

  private getVisionModelName(): string {
    return this.configService.get('AI_VISION_MODEL', { infer: true });
  }

  private enforceRateLimit(userId: string): void {
    const now = Date.now();
    const recent = (this.requestsByUser.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );

    if (recent.length >= RATE_LIMIT_MAX) {
      throw new HttpException(
        'Demasiadas solicitudes de analisis IA. Intenta nuevamente en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.requestsByUser.set(userId, recent);
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
      consumo: car.consumption,
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

  private cleanList(items: string[]): string[] {
    return items
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  private stripJsonFence(value: string): string {
    return value
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
  }

  private dataSchema(): ResponseSchema {
    return {
      type: SchemaType.OBJECT,
      required: ['summary', 'positives', 'negatives', 'recommendation', 'score'],
      properties: {
        summary: { type: SchemaType.STRING },
        positives: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        negatives: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        recommendation: { type: SchemaType.STRING },
        score: { type: SchemaType.INTEGER },
      },
    };
  }

  private imageSchema(): ResponseSchema {
    return {
      type: SchemaType.OBJECT,
      required: [
        'visualCondition',
        'detectedIssues',
        'positiveAspects',
        'confidence',
      ],
      properties: {
        visualCondition: { type: SchemaType.STRING },
        detectedIssues: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        positiveAspects: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        confidence: { type: SchemaType.INTEGER },
      },
    };
  }

  private comparisonSchema(carIds: string[]): ResponseSchema {
    return {
      type: SchemaType.OBJECT,
      required: [
        'winnerCarId',
        'summary',
        'positives',
        'tradeoffs',
        'recommendation',
        'score',
      ],
      properties: {
        winnerCarId: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: carIds,
        },
        summary: { type: SchemaType.STRING },
        positives: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        tradeoffs: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        recommendation: { type: SchemaType.STRING },
        score: { type: SchemaType.INTEGER },
      },
    };
  }
}
