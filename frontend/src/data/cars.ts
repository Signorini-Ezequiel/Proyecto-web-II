export interface CarSpecs {
  engine: string;
  power: string;
  torque: string;
  acceleration: string;
  topSpeed: string;
  consumption: string;
  dimensions: string;
  weight: string;
  features: string[];
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  location: string;
  description: string;
  images: string[];
  specs: CarSpecs;
}

export const CARS: Car[] = [
  {
    id: "1",
    make: "Toyota",
    model: "Corolla Cross",
    year: 2022,
    price: 27800,
    mileage: 42000,
    transmission: "Automática",
    fuel: "Nafta",
    color: "Blanco",
    location: "Córdoba",
    description: "Excelente estado, único dueño, mantenimiento al día. Equipado con pantalla táctil, cámara de retroceso, sensores de estacionamiento y más.",
    images: ["/images/auto1-1.jpg", "/images/auto1-2.jpg", "/images/auto1-3.jpg", "/images/auto1-4.jpg"],
    specs: {
      engine: "1.8L 4 cilindros",
      power: "140 CV",
      torque: "173 Nm",
      acceleration: "0-100 km/h en 10.2s",
      topSpeed: "180 km/h",
      consumption: "6.5L/100km",
      dimensions: "4.46m x 1.83m x 1.62m",
      weight: "1.280 kg",
      features: [
        "Pantalla táctil 8\"",
        "Cámara de retroceso",
        "Sensores de estacionamiento",
        "Bluetooth",
        "Control de crucero",
        "Aire acondicionado",
        "Levantavidrios eléctricos",
        "Espejos eléctricos",
        "Asientos de cuero",
        "Sistema de navegación"
      ]
    }
  },
  {
    id: "2",
    make: "Volkswagen",
    model: "Amarok",
    year: 2021,
    price: 33500,
    mileage: 68000,
    transmission: "Manual",
    fuel: "Diesel",
    color: "Negro",
    location: "Buenos Aires",
    description: "Camioneta de trabajo en perfecto estado. Muy resistente y confiable con excelente consumo de combustible.",
    images: ["/images/auto1-1.jpg", "/images/auto1-2.jpg", "/images/auto1-3.jpg"],
    specs: {
      engine: "2.0L TDI V4",
      power: "163 CV",
      torque: "390 Nm",
      acceleration: "0-100 km/h en 9.8s",
      topSpeed: "195 km/h",
      consumption: "7.2L/100km",
      dimensions: "5.25m x 1.86m x 1.74m",
      weight: "1.520 kg",
      features: [
        "Aire acondicionado frío",
        "Cierre centralizado",
        "Radio CD/MP3",
        "Dirección asistida",
        "Frenos ABS",
        "Control de tracción",
        "Caja de carga con revestimiento",
        "Espejos laterales eléctricos"
      ]
    }
  },
  {
    id: "3",
    make: "Peugeot",
    model: "208 Allure",
    year: 2023,
    price: 20900,
    mileage: 15000,
    transmission: "Manual",
    fuel: "Nafta",
    color: "Rojo",
    location: "Rosario",
    description: "Auto compacto moderno con bajo kilometraje. Garantía vigente y revisión técnica al día.",
    images: ["/images/auto1-1.jpg", "/images/auto1-2.jpg"],
    specs: {
      engine: "1.2L 3 cilindros",
      power: "110 CV",
      torque: "150 Nm",
      acceleration: "0-100 km/h en 10.9s",
      topSpeed: "175 km/h",
      consumption: "5.8L/100km",
      dimensions: "4.00m x 1.74m x 1.50m",
      weight: "980 kg",
      features: [
        "Pantalla táctil 7\"",
        "Aire acondicionado",
        "Bluetooth",
        "USB/AUX",
        "Cierre centralizado",
        "Espejos eléctricos",
        "Dirección asistida",
        "Bolsas de aire múltiples"
      ]
    }
  },
  {
    id: "4",
    make: "Honda",
    model: "Civic",
    year: 2020,
    price: 25500,
    mileage: 55000,
    transmission: "Automática",
    fuel: "Nafta",
    color: "Gris",
    location: "Mendoza",
    description: "Sedán confiable con buen mantenimiento. Ideal para viajes largos con excelente confort.",
    images: ["/images/auto1-1.jpg", "/images/auto1-2.jpg", "/images/auto1-3.jpg"],
    specs: {
      engine: "1.8L 4 cilindros",
      power: "150 CV",
      torque: "173 Nm",
      acceleration: "0-100 km/h en 9.5s",
      topSpeed: "190 km/h",
      consumption: "6.9L/100km",
      dimensions: "4.63m x 1.80m x 1.43m",
      weight: "1.300 kg",
      features: [
        "Pantalla táctil 8\"",
        "Cámara trasera",
        "Sensores de parkeo",
        "Bluetooth",
        "Volante multifunción",
        "Control de crucero",
        "Luz LED",
        "Asientos tapizados",
        "Vidrrios polarizados"
      ]
    }
  },
  {
    id: "5",
    make: "Renault",
    model: "Logan",
    year: 2019,
    price: 15800,
    mileage: 78000,
    transmission: "Manual",
    fuel: "Nafta",
    color: "Blanco",
    location: "La Plata",
    description: "Sedan económico y práctico. Bajo costo de mantenimiento y consumo moderado.",
    images: ["/images/auto1-1.jpg", "/images/auto1-2.jpg"],
    specs: {
      engine: "1.6L 4 cilindros",
      power: "105 CV",
      torque: "144 Nm",
      acceleration: "0-100 km/h en 11.5s",
      topSpeed: "172 km/h",
      consumption: "6.0L/100km",
      dimensions: "4.48m x 1.68m x 1.50m",
      weight: "1.050 kg",
      features: [
        "Radio AM/FM",
        "Aire acondicionado",
        "Cierre centralizado",
        "Dirección asistida",
        "Espejos manuales",
        "Frenos ABS",
        "Maletero amplio"
      ]
    }
  }
];

export function getCarById(id: string): Car | undefined {
  return CARS.find(car => car.id === id);
}

export function filterCars(filters: {
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  fuel?: string;
  transmission?: string;
  location?: string;
  minYear?: number;
  searchQuery?: string;
}, cars: Car[] = CARS): Car[] {
  return cars.filter(car => {
    if (filters.make && car.make !== filters.make) return false;
    if (filters.minPrice && car.price < filters.minPrice) return false;
    if (filters.maxPrice && car.price > filters.maxPrice) return false;
    if (filters.fuel && car.fuel !== filters.fuel) return false;
    if (filters.transmission && car.transmission !== filters.transmission) return false;
    if (filters.location && car.location !== filters.location) return false;
    if (filters.minYear && car.year < filters.minYear) return false;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const carName = `${car.make} ${car.model}`.toLowerCase();
      if (!carName.includes(query)) return false;
    }
    return true;
  });
}

export function getUniqueValues(key: keyof Car): (string | number)[] {
  const values = CARS.map(car => car[key]).filter((v): v is string | number => typeof v === 'string' || typeof v === 'number');
  return [...new Set(values)].sort();
}
