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
