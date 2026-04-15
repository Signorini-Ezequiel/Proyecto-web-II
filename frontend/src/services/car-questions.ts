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

const CAR_QUESTIONS_KEY = "autopoint_car_questions";

function getAllQuestions(): PublicCarQuestion[] {
  const stored = localStorage.getItem(CAR_QUESTIONS_KEY);

  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllQuestions(questions: PublicCarQuestion[]): void {
  localStorage.setItem(CAR_QUESTIONS_KEY, JSON.stringify(questions));
}

export function getQuestionsByCarId(carId: string): PublicCarQuestion[] {
  return getAllQuestions()
    .filter((question) => question.carId === carId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addPublicQuestion(input: {
  carId: string;
  buyerId: number;
  sellerId: number;
  question: string;
}): PublicCarQuestion {
  const questions = getAllQuestions();
  const newQuestion: PublicCarQuestion = {
    id: `question_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    carId: input.carId,
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    question: input.question.trim(),
    createdAt: new Date().toISOString(),
  };

  questions.push(newQuestion);
  saveAllQuestions(questions);
  return newQuestion;
}

export function answerPublicQuestion(input: {
  questionId: string;
  sellerId: number;
  answer: string;
}): boolean {
  const questions = getAllQuestions();
  const index = questions.findIndex((question) => question.id === input.questionId);

  if (index === -1) return false;
  if (questions[index].sellerId !== input.sellerId) return false;

  questions[index] = {
    ...questions[index],
    answer: input.answer.trim(),
    answeredAt: new Date().toISOString(),
  };

  saveAllQuestions(questions);
  return true;
}
