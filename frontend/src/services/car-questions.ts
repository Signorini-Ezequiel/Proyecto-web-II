import { apiGet, apiPatch, apiPost } from "./api";
import type {
  AnswerCarQuestionDto,
  CreateCarQuestionDto,
  PublicCarQuestion,
} from "../types/questions";

export type { PublicCarQuestion } from "../types/questions";

type QuestionApiResponse = PublicCarQuestion & {
  id: string;
  carId: string;
  buyerId: string;
  sellerId: string | null;
  question: string;
  createdAt: string;
  answer?: string | null;
  answeredAt?: string | null;
};

export async function getQuestionsByCarId(carId: string): Promise<PublicCarQuestion[]> {
  const data = await apiGet<QuestionApiResponse[]>(`questions/car/${encodeURIComponent(carId)}`).catch(() => []);

  return Array.isArray(data)
    ? data.map((q) => ({
        id: q.id,
        carId: q.carId,
        buyerId: q.buyerId,
        sellerId: q.sellerId,
        question: q.question,
        answer: q.answer ?? undefined,
        createdAt: q.createdAt,
        answeredAt: q.answeredAt ?? undefined,
      }))
    : [];
}

export async function addPublicQuestion(input: {
  carId: string;
  buyerId: number | string;
  sellerId: number | string;
  question: string;
}): Promise<PublicCarQuestion | null> {
  const body: CreateCarQuestionDto = {
    carId: input.carId,
    buyerId: String(input.buyerId),
    sellerId: String(input.sellerId),
    question: input.question,
  };

  const q = await apiPost<QuestionApiResponse>("questions", body).catch(() => null);

  if (!q) return null;

  return {
    id: q.id,
    carId: q.carId,
    buyerId: q.buyerId,
    sellerId: q.sellerId,
    question: q.question,
    answer: q.answer ?? undefined,
    createdAt: q.createdAt,
    answeredAt: q.answeredAt ?? undefined,
  };
}

export async function answerPublicQuestion(input: {
  questionId: string;
  sellerId: number | string;
  answer: string;
}): Promise<boolean> {
  const body: AnswerCarQuestionDto = {
    sellerId: String(input.sellerId),
    answer: input.answer,
  };

  return apiPatch<PublicCarQuestion, AnswerCarQuestionDto>(`questions/${encodeURIComponent(input.questionId)}/answer`, body)
    .then(() => true)
    .catch(() => false);
}
