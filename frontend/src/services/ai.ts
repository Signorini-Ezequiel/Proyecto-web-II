import { ApiError, apiGet, apiPost } from "./api";
import type {
  VehicleAIAnalysisResponse,
  VehicleComparisonAnalysisResponse,
} from "../types/ai";

const aiAnalysisCache = new Map<string, Promise<VehicleAIAnalysisResponse>>();
const comparisonAnalysisCache = new Map<string, Promise<VehicleComparisonAnalysisResponse>>();
const AI_REQUEST_COOLDOWN_MS = 10_000;
let lastAIRequestAt = 0;

function enforceClientCooldown(): void {
  const now = Date.now();
  const elapsed = now - lastAIRequestAt;
  if (elapsed < AI_REQUEST_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((AI_REQUEST_COOLDOWN_MS - elapsed) / 1000);
    throw new Error(`Espera ${waitSeconds}s antes de pedir otro analisis IA.`);
  }

  lastAIRequestAt = now;
}

export async function getVehicleAIAnalysis(carId: string): Promise<VehicleAIAnalysisResponse> {
  const cached = aiAnalysisCache.get(carId);
  if (cached) return cached;

  const request = fetchVehicleAIAnalysis(carId, false)
    .catch((error) => {
      aiAnalysisCache.delete(carId);
      throw error;
    });

  aiAnalysisCache.set(carId, request);
  return request;
}

export async function regenerateVehicleAIAnalysis(carId: string): Promise<VehicleAIAnalysisResponse> {
  const request = fetchVehicleAIAnalysis(carId, true);
  aiAnalysisCache.set(carId, request);
  return request;
}

export async function getComparisonAIAnalysis(
  carIds: string[],
): Promise<VehicleComparisonAnalysisResponse> {
  const normalizedIds = [...new Set(carIds)].sort();
  const cacheKey = normalizedIds.join("|");
  const cached = comparisonAnalysisCache.get(cacheKey);
  if (cached) return cached;

  enforceClientCooldown();
  const request = apiPost<VehicleComparisonAnalysisResponse>(
    "ai/compare-cars",
    { carIds: normalizedIds },
  ).catch((error) => {
    comparisonAnalysisCache.delete(cacheKey);
    throw error;
  });

  comparisonAnalysisCache.set(cacheKey, request);
  return request;
}

async function fetchVehicleAIAnalysis(
  carId: string,
  force: boolean,
): Promise<VehicleAIAnalysisResponse> {
  const encodedId = encodeURIComponent(carId);
  const suffix = force ? "?force=true" : "";
  if (force || !aiAnalysisCache.has(carId)) {
    enforceClientCooldown();
  }
  return apiGet<VehicleAIAnalysisResponse>(`ai/cars/${encodedId}/analysis${suffix}`);
}

export function getAIErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Analisis IA temporalmente no disponible";
}
