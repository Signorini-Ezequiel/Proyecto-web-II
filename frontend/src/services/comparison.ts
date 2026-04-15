const COMPARISON_KEY = "autopoint_comparison";
const MAX_COMPARISON_CARS = 4;

export function getComparisonIds(): string[] {
  const stored = localStorage.getItem(COMPARISON_KEY);

  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveComparisonIds(ids: string[]): void {
  localStorage.setItem(COMPARISON_KEY, JSON.stringify(ids.slice(0, MAX_COMPARISON_CARS)));
}

export function isInComparison(carId: string): boolean {
  return getComparisonIds().includes(carId);
}

export function addToComparison(carId: string): { ok: boolean; reason?: "duplicate" | "limit" } {
  const ids = getComparisonIds();

  if (ids.includes(carId)) {
    return { ok: false, reason: "duplicate" };
  }

  if (ids.length >= MAX_COMPARISON_CARS) {
    return { ok: false, reason: "limit" };
  }

  saveComparisonIds([...ids, carId]);
  return { ok: true };
}

export function removeFromComparison(carId: string): void {
  saveComparisonIds(getComparisonIds().filter((id) => id !== carId));
}

export function toggleComparison(carId: string): { selected: boolean; reason?: "limit" } {
  if (isInComparison(carId)) {
    removeFromComparison(carId);
    return { selected: false };
  }

  const result = addToComparison(carId);
  if (!result.ok) {
    return { selected: false, reason: result.reason === "limit" ? "limit" : undefined };
  }

  return { selected: true };
}

export function clearComparison(): void {
  localStorage.removeItem(COMPARISON_KEY);
}
