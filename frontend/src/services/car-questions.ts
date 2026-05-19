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
const BASE = 'http://localhost:3333';

function parseIdToNumber(id: string | null | undefined): number | string | undefined {
  if (!id) return undefined;
  return /^[0-9]+$/.test(id) ? Number(id) : id;
}

export async function getQuestionsByCarId(carId: string): Promise<PublicCarQuestion[]> {
  const res = await fetch(`${BASE}/questions/car/${encodeURIComponent(carId)}`);
  if (!res.ok) return [];
  const data = await res.json();

  return Array.isArray(data)
    ? data.map((q: any) => ({
        id: q.id,
        carId: q.carId,
        buyerId: parseIdToNumber(q.buyerId) as number,
        sellerId: parseIdToNumber(q.sellerId) as number,
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
  const body = {
    carId: input.carId,
    buyerId: String(input.buyerId),
    sellerId: String(input.sellerId),
    question: input.question,
  };

  const res = await fetch(`${BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const q = await res.json();

  return {
    id: q.id,
    carId: q.carId,
    buyerId: parseIdToNumber(q.buyerId) as number,
    sellerId: parseIdToNumber(q.sellerId) as number,
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
  const body = {
    sellerId: String(input.sellerId),
    answer: input.answer,
  };

  const res = await fetch(`${BASE}/questions/${encodeURIComponent(input.questionId)}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.ok;
}
