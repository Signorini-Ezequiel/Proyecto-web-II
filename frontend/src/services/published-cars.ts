import { type Car, CARS } from "../data/cars";

export interface PublishedCar extends Omit<Car, 'specs'> {
  sellerId: number;
  publishedAt: string;
  specs?: Car['specs'];
}

const PUBLISHED_CARS_KEY = 'published_cars';

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
  const convertedPublishedCars: Car[] = publishedCars.map(published => ({
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
    specs: published.specs || {
      engine: "",
      power: "",
      torque: "",
      acceleration: "",
      topSpeed: "",
      consumption: "",
      dimensions: "",
      weight: "",
      features: []
    }
  }));

  return [...CARS, ...convertedPublishedCars];
}
