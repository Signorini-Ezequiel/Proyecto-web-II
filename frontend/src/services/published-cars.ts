import { type Car, CARS } from "../data/cars";

export interface PublishedCar extends Omit<Car, 'specs'> {
  sellerId: number;
  publishedAt: string;
  specs?: Car['specs'];
}

const PUBLISHED_CARS_KEY = 'published_cars';
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
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading published cars:', error);
    return [];
  }
}

export function savePublishedCar(car: Omit<PublishedCar, 'id' | 'publishedAt'>): PublishedCar {
  const publishedCars = getPublishedCars();
  const newCar: PublishedCar = {
    ...car,
    id: `published_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    publishedAt: new Date().toISOString(),
  };

  console.log("Saving published car with sellerId:", car.sellerId, "newCar:", newCar);
  publishedCars.push(newCar);
  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(publishedCars));
  return newCar;
}

export function updatePublishedCar(carId: string, updates: Partial<PublishedCar>): boolean {
  const publishedCars = getPublishedCars();
  const index = publishedCars.findIndex(car => car.id === carId);

  if (index === -1) return false;

  publishedCars[index] = { ...publishedCars[index], ...updates };
  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(publishedCars));
  return true;
}

export function deletePublishedCar(carId: string): boolean {
  const publishedCars = getPublishedCars();
  const filtered = publishedCars.filter(car => car.id !== carId);

  if (filtered.length === publishedCars.length) return false;

  localStorage.setItem(PUBLISHED_CARS_KEY, JSON.stringify(filtered));
  return true;
}

export function getPublishedCarById(carId: string): PublishedCar | null {
  const publishedCars = getPublishedCars();
  return publishedCars.find(car => car.id === carId) || null;
}

export function getPublishedCarsBySeller(sellerId: number): PublishedCar[] {
  const publishedCars = getPublishedCars();
  console.log("Published cars:", publishedCars, "filtering by sellerId:", sellerId);
  return publishedCars.filter(car => car.sellerId === sellerId);
}

export function getAllCarsForDisplay(): Car[] {
  const publishedCars = getPublishedCars();

  // Convertir published cars al formato Car para compatibilidad
  const convertedPublishedCars: Car[] = publishedCars.map(publishedCarToCar);

  return [...CARS, ...convertedPublishedCars];
}
