import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { Car } from './entities/car.entity';

const defaultSpecs = {
  engine: 'No especificado',
  power: 'No especificada',
  torque: 'No especificado',
  acceleration: 'No especificada',
  topSpeed: 'No especificada',
  consumption: 'No especificado',
  dimensions: 'No especificadas',
  weight: 'No especificado',
  features: [],
};

@Injectable()
export class CarsRepository {
  private readonly cars = new Map<string, Car>();
  private nextId = 6;

  constructor() {
    this.seed();
  }

  findAll(filters: FilterCarsDto = {}): Car[] {
    return [...this.cars.values()].filter((car) =>
      this.matchesFilters(car, filters),
    );
  }

  findById(id: string): Car | undefined {
    return this.cars.get(id);
  }

  requireById(id: string): Car {
    const car = this.findById(id);

    if (!car) {
      throw new NotFoundException('Auto no encontrado.');
    }

    return car;
  }

  create(dto: CreateCarDto): Car {
    const car: Car = {
      id: String(this.nextId++),
      ...dto,
    };

    this.cars.set(car.id, car);
    return car;
  }

  getUniqueValues(key: keyof Car): Array<string | number> {
    const values = [...this.cars.values()]
      .map((car) => car[key])
      .filter((value): value is string | number => {
        return typeof value === 'string' || typeof value === 'number';
      });

    return [...new Set(values)].sort();
  }

  private matchesFilters(car: Car, filters: FilterCarsDto): boolean {
    if (filters.make && car.make !== filters.make) return false;
    if (filters.minPrice !== undefined && car.price < filters.minPrice)
      return false;
    if (filters.maxPrice !== undefined && car.price > filters.maxPrice)
      return false;
    if (filters.fuel && car.fuel !== filters.fuel) return false;
    if (filters.transmission && car.transmission !== filters.transmission)
      return false;
    if (filters.location && car.location !== filters.location) return false;
    if (filters.minYear !== undefined && car.year < filters.minYear)
      return false;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const carName = `${car.make} ${car.model}`.toLowerCase();
      return carName.includes(query);
    }

    return true;
  }

  private seed(): void {
    const cars: Car[] = [
      {
        id: '1',
        make: 'Toyota',
        model: 'Corolla Cross',
        year: 2022,
        price: 27800,
        mileage: 42000,
        transmission: 'Automatica',
        fuel: 'Nafta',
        color: 'Blanco',
        location: 'Cordoba',
        description: 'Excelente estado, unico dueno, mantenimiento al dia.',
        images: [
          '/images/auto1-1.jpg',
          '/images/auto1-2.jpg',
          '/images/auto1-3.jpg',
        ],
        specs: {
          ...defaultSpecs,
          engine: '1.8L 4 cilindros',
          power: '140 CV',
          features: ['Pantalla tactil 8"', 'Camara de retroceso', 'Bluetooth'],
        },
      },
      {
        id: '2',
        make: 'Volkswagen',
        model: 'Amarok',
        year: 2021,
        price: 33500,
        mileage: 68000,
        transmission: 'Manual',
        fuel: 'Diesel',
        color: 'Negro',
        location: 'Buenos Aires',
        description: 'Camioneta de trabajo en perfecto estado.',
        images: ['/images/auto1-1.jpg', '/images/auto1-2.jpg'],
        specs: {
          ...defaultSpecs,
          engine: '2.0L TDI V4',
          power: '163 CV',
          features: ['Aire acondicionado', 'Frenos ABS', 'Control de traccion'],
        },
      },
      {
        id: '3',
        make: 'Peugeot',
        model: '208 Allure',
        year: 2023,
        price: 20900,
        mileage: 15000,
        transmission: 'Manual',
        fuel: 'Nafta',
        color: 'Rojo',
        location: 'Rosario',
        description: 'Auto compacto moderno con bajo kilometraje.',
        images: ['/images/auto1-1.jpg'],
        specs: {
          ...defaultSpecs,
          engine: '1.2L 3 cilindros',
          power: '110 CV',
          features: ['Pantalla tactil 7"', 'Bluetooth', 'USB/AUX'],
        },
      },
    ];

    cars.forEach((car) => this.cars.set(car.id, car));
  }
}
