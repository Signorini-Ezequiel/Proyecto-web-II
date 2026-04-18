import type { Car } from "../data/cars";

export interface ScoreResult {
  carId: string;
  totalScore: number;
  scores: {
    price: number;
    mileage: number;
    year: number;
    power: number;
    features: number;
  };
}

export interface ComparisonMetrics {
  bestPrice: ScoreResult;
  lowestMileage: ScoreResult;
  newestYear: ScoreResult;
  mostPowerful: ScoreResult;
  bestEquipment: ScoreResult;
  overallWinner: ScoreResult;
}

function extractPower(powerStr: string): number {
  const match = powerStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function countFeatures(features: string[]): number {
  return features ? features.length : 0;
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 20;
  return ((value - min) / (max - min)) * 20;
}

export function calculateCarScore(car: Car, allCars: Car[]): ScoreResult {
  const scores = {
    price: 0,
    mileage: 0,
    year: 0,
    power: 0,
    features: 0,
  };

  // Scoring de precio (menor es mejor): inversamente proporcional
  const prices = allCars.map(c => c.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  scores.price = normalizeScore(maxPrice - car.price, 0, maxPrice - minPrice);

  // Scoring de kilometraje (menor es mejor)
  const mileages = allCars.map(c => c.mileage);
  const maxMileage = Math.max(...mileages);
  const minMileage = Math.min(...mileages);
  scores.mileage = normalizeScore(maxMileage - car.mileage, 0, maxMileage - minMileage);

  // Scoring de año (más nuevo es mejor)
  const years = allCars.map(c => c.year);
  const maxYear = Math.max(...years);
  const minYear = Math.min(...years);
  scores.year = normalizeScore(car.year, minYear, maxYear);

  // Scoring de potencia (mayor es mejor)
  const powers = allCars.map(c => extractPower(c.specs.power));
  const maxPower = Math.max(...powers);
  const minPower = Math.min(...powers);
  const carPower = extractPower(car.specs.power);
  scores.power = normalizeScore(carPower, minPower, maxPower);

  // Scoring de equipamiento (más características es mejor)
  const allFeatures = allCars.map(c => countFeatures(c.specs.features));
  const maxFeatures = Math.max(...allFeatures);
  const minFeatures = Math.min(...allFeatures);
  const carFeatures = countFeatures(car.specs.features);
  scores.features = normalizeScore(carFeatures, minFeatures, maxFeatures);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    carId: car.id,
    totalScore: Math.round(totalScore * 100) / 100,
    scores,
  };
}

export function calculateComparisonScores(cars: Car[]): ScoreResult[] {
  return cars.map(car => calculateCarScore(car, cars));
}

export function getComparisonMetrics(cars: Car[]): {
  scores: ScoreResult[];
  metrics: ComparisonMetrics;
} {
  const scores = calculateComparisonScores(cars);

  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);

  return {
    scores,
    metrics: {
      bestPrice: scores.reduce((a, b) => (a.scores.price > b.scores.price ? a : b)),
      lowestMileage: scores.reduce((a, b) => (a.scores.mileage > b.scores.mileage ? a : b)),
      newestYear: scores.reduce((a, b) => (a.scores.year > b.scores.year ? a : b)),
      mostPowerful: scores.reduce((a, b) => (a.scores.power > b.scores.power ? a : b)),
      bestEquipment: scores.reduce((a, b) => (a.scores.features > b.scores.features ? a : b)),
      overallWinner: sorted[0],
    },
  };
}

export function isWinnerInCategory(
  carId: string,
  category: "price" | "mileage" | "year" | "power" | "features",
  metrics: ComparisonMetrics
): boolean {
  const categoryMap = {
    price: metrics.bestPrice,
    mileage: metrics.lowestMileage,
    year: metrics.newestYear,
    power: metrics.mostPowerful,
    features: metrics.bestEquipment,
  };
  return categoryMap[category].carId === carId;
}

export function isOverallWinner(carId: string, metrics: ComparisonMetrics): boolean {
  return metrics.overallWinner.carId === carId;
}
