export interface CreateCarQuestionDto {
  carId: string;
  buyerId: string;
  sellerId: string;
  question: string;
}

export interface AnswerCarQuestionDto {
  sellerId: string;
  answer: string;
}

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
