export interface PublicCarQuestion {
  id: string;
  carId: string;
  buyerId: number;
  sellerId: number;
  question: string;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
}
