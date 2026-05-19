import { getSessionToken, getSessionUser } from "./auth";

const BASE = "http://localhost:3000";
const MAX_COMPARISON_CARS = 4;

type ComparisonResponse = {
  id: string;
  carIds: string[];
};

type ToggleResult = {
  selected: boolean;
  reason?: "limit";
};

function getAuthHeaders(): HeadersInit | null {
  const token = getSessionToken();
  if (!token) return null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function fetchComparison(): Promise<ComparisonResponse | null> {
  const headers = getAuthHeaders();
  if (!headers) return null;

  const response = await fetch(`${BASE}/comparisons/me`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
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

  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, reason: "limit" };
  }

  const response = await fetch(`${BASE}/comparisons/${comparison.id}/cars/${carId}`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    return { ok: false, reason: "limit" };
  }

  return { ok: true };
}

export async function removeFromComparison(carId: string): Promise<void> {
  const comparison = await fetchComparison();
  const headers = getAuthHeaders();
  if (!comparison || !headers) return;

  await fetch(`${BASE}/comparisons/${comparison.id}/cars/${carId}`, {
    method: "DELETE",
    headers,
  });
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
  const headers = getAuthHeaders();
  if (!comparison || !headers) return;

  await Promise.all(
    comparison.carIds.map((carId) =>
      fetch(`${BASE}/comparisons/${comparison.id}/cars/${carId}`, {
        method: "DELETE",
        headers,
      }),
    ),
  );
}
