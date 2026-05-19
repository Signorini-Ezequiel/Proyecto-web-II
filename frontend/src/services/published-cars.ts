import { type Car, CARS } from "../data/cars";
import type {
  CreatePublishedCarDto,
  PublishedCarDto,
  Transmission,
  UpdatePublishedCarDto,
} from "../types/car";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import { normalizeUploadedImageUrl } from "./upload.service";

export type PublishedCar = PublishedCarDto;

const PUBLISHED_CARS_KEY = "published_cars";

export const DEFAULT_CAR_SPECS: Car["specs"] = {
  engine: "No especificado",
  power: "No especificada",
  torque: "No especificado",
  acceleration: "No especificada",
  topSpeed: "No especificada",
  consumption: "No especificado",
  dimensions: "No especificadas",
  weight: "No especificado",
  features: [],
};

export function normalizeCarSpecs(specs?: Partial<Car["specs"]>): Car["specs"] {
  return {
    engine: specs?.engine || DEFAULT_CAR_SPECS.engine,
    power: specs?.power || DEFAULT_CAR_SPECS.power,
    torque: specs?.torque || DEFAULT_CAR_SPECS.torque,
    acceleration: specs?.acceleration || DEFAULT_CAR_SPECS.acceleration,
    topSpeed: specs?.topSpeed || DEFAULT_CAR_SPECS.topSpeed,
    consumption: specs?.consumption || DEFAULT_CAR_SPECS.consumption,
    dimensions: specs?.dimensions || DEFAULT_CAR_SPECS.dimensions,
    weight: specs?.weight || DEFAULT_CAR_SPECS.weight,
    features: Array.isArray(specs?.features) ? specs.features : DEFAULT_CAR_SPECS.features,
  };
}

function normalizeTransmission(value: string | undefined): string {
  const normalized = value ?? "";
  const transmissionMap: Record<Transmission, string> = {
    MANUAL: "Manual",
    AUTOMATIC: "AutomÃ¡tica",
    SEMI_AUTOMATIC: "CVT",
  };

  return transmissionMap[normalized as Transmission] ?? normalized;
}

function normalizeFuel(value: string | undefined): string {
  const normalized = value ?? "";
  const fuelMap: Record<string, string> = {
    GASOLINE: "Nafta",
    DIESEL: "Diesel",
    HYBRID: "HÃ­brido",
    ELECTRIC: "ElÃ©ctrico",
    CNG: "GNC",
    LPG: "Otro",
    OTHER: "Otro",
  };

  return fuelMap[normalized] ?? normalized;
}

function normalizePublishedCar(car: Partial<PublishedCar> & { id: string }): PublishedCar {
  const specs = normalizeCarSpecs(car.specs);

  return {
    id: car.id,
    make: car.make ?? "",
    model: car.model ?? "",
    year: Number(car.year ?? 0),
    price: Number(car.price ?? 0),
    mileage: Number(car.mileage ?? 0),
    transmission: normalizeTransmission(car.transmission),
    fuel: normalizeFuel(car.fuel),
    color: car.color ?? "No especificado",
    location: car.location ?? "",
    description: car.description ?? "",
    images: Array.isArray(car.images) ? car.images.map(normalizeUploadedImageUrl) : [],
    sellerId: Number(car.sellerId ?? 0),
    publishedAt: car.publishedAt ?? new Date().toISOString(),
    updatedAt: car.updatedAt ?? car.publishedAt ?? new Date().toISOString(),
    specs,
  };
}

export function publishedCarToCar(published: PublishedCar): Car {
  return {
    id: published.id,
    make: published.make,
    model: published.model,
    year: published.year,
    price: published.price,
    mileage: published.mileage,
    transmission: published.transmission,
    fuel: published.fuel,
    color: published.color,
    location: published.location,
    description: published.description,
    images: published.images,
    specs: normalizeCarSpecs(published.specs),
  };
}

export function getPublishedCars(): PublishedCar[] {
  try {
    const stored = localStorage.getItem(PUBLISHED_CARS_KEY);
    const parsed = stored ? (JSON.parse(stored) as Array<Partial<PublishedCar> & { id: string }>) : [];
    return parsed.map(normalizePublishedCar);
  } catch (error) {
    console.error("Error loading published cars:", error);
    return [];
  }
}

export async function fetchPublishedCars(): Promise<PublishedCar[]> {
  const cars = await apiGet<Array<Partial<PublishedCar> & { id: string }>>("published-cars")
    .then((items) => items.map(normalizePublishedCar))
    .catch(() => getPublishedCars());
  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(cars));
  return cars;
}

export async function savePublishedCar(
  car: CreatePublishedCarDto,
): Promise<PublishedCar> {
  const newCar = normalizePublishedCar(
    await apiPost<Partial<PublishedCar> & { id: string }, CreatePublishedCarDto>("published-cars", car),
  );
  const publishedCars = getPublishedCars();
  publishedCars.push(newCar);
  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(publishedCars));
  return newCar;
}

export async function updatePublishedCar(
  carId: string,
  updates: UpdatePublishedCarDto,
): Promise<boolean> {
  const updatedCar = await apiPatch<Partial<PublishedCar> & { id: string }, UpdatePublishedCarDto>(
    `published-cars/${encodeURIComponent(carId)}`,
    updates,
  )
    .then(normalizePublishedCar)
    .catch(() => null);

  if (!updatedCar) return false;

  const publishedCars = getPublishedCars();
  const index = publishedCars.findIndex((car) => car.id === carId);

  if (index !== -1) {
    publishedCars[index] = { ...publishedCars[index], ...updatedCar };
  } else {
    publishedCars.push(updatedCar);
  }

  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(publishedCars));
  return true;
}

export async function deletePublishedCar(carId: string): Promise<boolean> {
  const deleted = await apiDelete<{ ok: true }>(`published-cars/${encodeURIComponent(carId)}`)
    .then(() => true)
    .catch(() => false);

  if (!deleted) return false;

  const publishedCars = getPublishedCars();
  const filtered = publishedCars.filter((car) => car.id !== carId);
  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(filtered));
  return true;
}

export function getPublishedCarById(carId: string): PublishedCar | null {
  const publishedCars = getPublishedCars();
  return publishedCars.find((car) => car.id === carId) || null;
}

export function getPublishedCarsBySeller(sellerId: number): PublishedCar[] {
  return getPublishedCars().filter((car) => car.sellerId === sellerId);
}

export function getAllCarsForDisplay(): Car[] {
  const convertedPublishedCars = getPublishedCars().map(publishedCarToCar);
  return [...CARS, ...convertedPublishedCars];
}
