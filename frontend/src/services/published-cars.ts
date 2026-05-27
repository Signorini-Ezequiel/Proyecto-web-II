import type { Car } from "../types/car";
import type {
  CreatePublishedCarDto,
  PublishedCarDto,
  Transmission,
  UpdatePublishedCarDto,
} from "../types/car";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import { normalizeUploadedImageUrl } from "./upload.service";

export type PublishedCar = PublishedCarDto;

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
    AUTOMATIC: "Automática",
    SEMI_AUTOMATIC: "CVT",
  };

  return transmissionMap[normalized as Transmission] ?? normalized;
}

function normalizeFuel(value: string | undefined): string {
  const normalized = value ?? "";
  const fuelMap: Record<string, string> = {
    GASOLINE: "Nafta",
    DIESEL: "Diesel",
    HYBRID: "Híbrido",
    ELECTRIC: "Eléctrico",
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
    sellerId: String(car.sellerId ?? ""),
    seller: car.seller
      ? {
          id: String(car.seller.id ?? ""),
          name: String(car.seller.name ?? "Vendedor"),
          role: car.seller.role === "seller" ? "seller" : "buyer",
          avatarUrl: car.seller.avatarUrl ?? null,
        }
      : undefined,
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

let publishedCarsCache: PublishedCar[] | null = null;
let publishedCarsRequest: Promise<PublishedCar[]> | null = null;

function clearPublishedCarsCache(): void {
  publishedCarsCache = null;
  publishedCarsRequest = null;
}

export async function fetchPublishedCars(): Promise<PublishedCar[]> {
  if (publishedCarsCache) return publishedCarsCache;
  if (publishedCarsRequest) return publishedCarsRequest;

  publishedCarsRequest = apiGet<Partial<PublishedCar> & { id: string }[]>("published-cars")
    .then((items) => {
      const normalized = items.map(normalizePublishedCar);
      publishedCarsCache = normalized;
      return normalized;
    })
    .finally(() => {
      publishedCarsRequest = null;
    });

  return publishedCarsRequest;
}

export async function fetchPublishedCarById(carId: string): Promise<PublishedCar | null> {
  return apiGet<Partial<PublishedCar> & { id: string }>(`published-cars/${encodeURIComponent(carId)}`)
    .then(normalizePublishedCar)
    .catch(() => null);
}

export async function fetchPublishedCarsBySeller(sellerId: string): Promise<PublishedCar[]> {
  return apiGet<Partial<PublishedCar> & { id: string }[]>(
    `published-cars/seller/${encodeURIComponent(sellerId)}`,
  ).then((items) => items.map(normalizePublishedCar));
}

export async function savePublishedCar(
  car: CreatePublishedCarDto,
): Promise<PublishedCar> {
  const newCar = await apiPost<Partial<PublishedCar> & { id: string }, CreatePublishedCarDto>("published-cars", car);
  clearPublishedCarsCache();
  return normalizePublishedCar(newCar);
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

  if (updatedCar) clearPublishedCarsCache();
  return updatedCar !== null;
}

export async function deletePublishedCar(carId: string): Promise<boolean> {
  return apiDelete<{ ok: true }>(`published-cars/${encodeURIComponent(carId)}`)
    .then(() => {
      clearPublishedCarsCache();
      return true;
    })
    .catch(() => false);
}

export async function getPublishedCarById(id: string) {
  const car = await fetchPublishedCarById(id);

  if (!car) {
    throw new Error("No se pudo obtener el vehiculo.");
  }

  return car;
}
