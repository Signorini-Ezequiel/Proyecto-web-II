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
const MAX_IMAGES = 6;
const AI_REQUEST_COOLDOWN_MS = 10_000;
const TEMPORARY_UNAVAILABLE_MESSAGE =
  'Analisis IA temporalmente no disponible';

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
    const model = this.getGroqModelName();
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
    const imageAnalysis = await this.callGroq(() =>
      this.analyzeCarImages(car, imageKeys),
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
          generatedBy: 'groq',
          source: 'vehicle-image-estimate',
          imageCount: imageKeys.length,
          note: 'Groq text model estimate based on vehicle metadata and image URLs.',
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
    const uniqueCarIds = Array.from(new Set(carIds.map((id) => id.trim()))).filter(
      Boolean,
    );

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
        throw new BadRequestException('Uno o mas vehiculos no estan publicados.');
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

    this.logger.log(`cache miss IA comparison carIds=${uniqueCarIds.join(',')}`);
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
    const parsed = await this.createStructuredResponse<VehicleDataAnalysisResult>(
      {
        systemInstruction:
          'Eres un asesor automotor profesional. Analiza solo los datos provistos. No inventes historial, mantenimiento, titularidad, fallas mecanicas ni inspecciones. Responde en espanol claro, corto y natural.',
        userPrompt:
          'Analiza estos datos publicados por el usuario. Maximo dos parrafos entre summary y recommendation. Devuelve solo JSON valido con: summary string, positives string[], negatives string[], recommendation string, score integer 0-100.\n' +
          JSON.stringify(this.carToPromptData(car)),
      },
    );

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
    const parsed =
      await this.createStructuredResponse<VehicleImageAnalysisResult>({
        systemInstruction:
          'Eres un inspector automotor. Groq no esta evaluando pixeles de imagen en este flujo: debes hacer una estimacion honesta basada en metadata del vehiculo y URLs publicadas. Aclara que es una estimacion automatica, no inspeccion visual definitiva. No inventes danos concretos; habla de posibles riesgos visibles a verificar.',
        userPrompt:
          'Genera un analisis visual razonable para frontend usando metadata + URLs. Devuelve solo JSON valido con: visualCondition string, detectedIssues string[], positiveAspects string[], confidence integer 0-100.\n' +
          JSON.stringify({
            vehiculo: this.carToPromptData(car),
            imagenes: imageUrls,
            instruccion:
              'Si hay fotos, estima calidad/cobertura de publicacion y posibles puntos a revisar: pintura, golpes, cubiertas, interior, desgaste. Debe quedar claro que no es vision real.',
          }),
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
      throw new BadRequestException('La publicacion no existe o no esta activa.');
    }

    return car;
  }

  private normalizeImageKeys(images: string[]): string[] {
    return images.map((image) => image.trim()).filter(Boolean).slice(0, MAX_IMAGES);
  }

  private getGroqModelName(): string {
    return this.configService.get('GROQ_MODEL', { infer: true });
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

  private stripJsonFence(value: string): string {
    return value
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
  }
}
