import { apiDelete, apiGet, apiPost } from "./api";
import type { ComparisonResponseDto } from "../types/comparison";

const MAX_COMPARISON_CARS = 4;
let comparisonCache: ComparisonResponseDto | null = null;
let comparisonRequest: Promise<ComparisonResponseDto | null> | null = null;

type ToggleResult = {
  selected: boolean;
  reason?: "duplicate" | "limit";
};

async function fetchComparison(): Promise<ComparisonResponseDto | null> {
  if (comparisonCache) return comparisonCache;
  if (comparisonRequest) return comparisonRequest;

  comparisonRequest = apiGet<ComparisonResponseDto>("comparisons/me")
    .then((comparison) => {
      comparisonCache = comparison;
      return comparison;
    })
    .catch(() => null)
    .finally(() => {
      comparisonRequest = null;
    });

  return comparisonRequest;
}

async function refreshComparison(): Promise<ComparisonResponseDto | null> {
  comparisonCache = null;
  return fetchComparison();
}

function setComparisonCache(comparison: ComparisonResponseDto): void {
  comparisonCache = comparison;
}

function updateCachedCarIds(carIds: string[]): void {
  if (!comparisonCache) return;
  comparisonCache = {
    ...comparisonCache,
    carIds,
  };
}

async function getComparison(): Promise<ComparisonResponseDto | null> {
  try {
    return await fetchComparison();
  } catch {
    return null;
  }
}

export async function getComparisonIds(): Promise<string[]> {
  const comparison = await getComparison();
  return comparison?.carIds ?? [];
}

export async function isInComparison(carId: string): Promise<boolean> {
  const ids = await getComparisonIds();
  return ids.includes(carId);
}

export function isInComparisonCached(carId: string): boolean {
  return comparisonCache?.carIds.includes(carId) ?? false;
}

export async function addToComparison(carId: string): Promise<{ ok: boolean; reason?: "duplicate" | "limit" }> {
  const comparison = await getComparison();
  if (!comparison) {
    return { ok: false, reason: "limit" };
  }

  if (comparison.carIds.includes(carId)) {
    return { ok: false, reason: "duplicate" };
  }

  if (comparison.carIds.length >= MAX_COMPARISON_CARS) {
    return { ok: false, reason: "limit" };
  }

  updateCachedCarIds([...comparison.carIds, carId]);

  try {
    const updated = await apiPost<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`);
    setComparisonCache(updated);
  } catch {
    setComparisonCache(comparison);
    return { ok: false, reason: "limit" };
  }

  return { ok: true };
}

export async function removeFromComparison(carId: string): Promise<void> {
  const comparison = await getComparison();
  if (!comparison) return;

  updateCachedCarIds(comparison.carIds.filter((id) => id !== carId));

  const updated = await apiDelete<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`);
  setComparisonCache(updated);
}

export async function toggleComparison(carId: string): Promise<ToggleResult> {
  const comparison = await getComparison();
  if (!comparison) {
    return { selected: false };
  }

  if (comparison.carIds.includes(carId)) {
    updateCachedCarIds(comparison.carIds.filter((id) => id !== carId));
    const updated = await apiDelete<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`);
    setComparisonCache(updated);
    return { selected: false };
  }

  const result = await addToComparison(carId);
  return { selected: result.ok, reason: result.reason };
}

export async function clearComparison(): Promise<void> {
  const comparison = await getComparison();
  if (!comparison) return;

  await Promise.all(
    comparison.carIds.map((carId) =>
      apiDelete<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`),
    ),
  );
  await refreshComparison();
}
