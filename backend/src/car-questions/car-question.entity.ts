export interface PublicCarQuestion {
  id: string;
  carId: string;
  buyerId: string;
  sellerId: string | null;
  question: string;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
}
