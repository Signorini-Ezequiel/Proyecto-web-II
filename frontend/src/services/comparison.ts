import { apiDelete, apiGet, apiPost } from "./api";
import type { ComparisonResponseDto } from "../types/comparison";

const MAX_COMPARISON_CARS = 4;

type ToggleResult = {
  selected: boolean;
  reason?: "duplicate" | "limit";
};

async function fetchComparison(): Promise<ComparisonResponseDto | null> {
  try {
    return await apiGet<ComparisonResponseDto>("comparisons/me");
  } catch {
    return null;
  }
}

export async function getComparisonIds(): Promise<string[]> {
  const comparison = await fetchComparison();
  return comparison?.carIds ?? [];
}

export async function isInComparison(carId: string): Promise<boolean> {
  const ids = await getComparisonIds();
  return ids.includes(carId);
}

export async function addToComparison(carId: string): Promise<{ ok: boolean; reason?: "duplicate" | "limit" }> {
  const comparison = await fetchComparison();
  if (!comparison) {
    return { ok: false, reason: "limit" };
  }

  if (comparison.carIds.includes(carId)) {
    return { ok: false, reason: "duplicate" };
  }

  if (comparison.carIds.length >= MAX_COMPARISON_CARS) {
    return { ok: false, reason: "limit" };
  }

  try {
    await apiPost<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`);
  } catch {
    return { ok: false, reason: "limit" };
  }

  return { ok: true };
}

export async function removeFromComparison(carId: string): Promise<void> {
  const comparison = await fetchComparison();
  if (!comparison) return;

  await apiDelete<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`);
}

export async function toggleComparison(carId: string): Promise<ToggleResult> {
  const comparison = await fetchComparison();
  if (!comparison) {
    return { selected: false };
  }

  if (comparison.carIds.includes(carId)) {
    await removeFromComparison(carId);
    return { selected: false };
  }

  const result = await addToComparison(carId);
  return { selected: result.ok, reason: result.reason };
}

export async function clearComparison(): Promise<void> {
  const comparison = await fetchComparison();
  if (!comparison) return;

  await Promise.all(
    comparison.carIds.map((carId) =>
      apiDelete<ComparisonResponseDto>(`comparisons/${comparison.id}/cars/${carId}`),
    ),
  );
}
