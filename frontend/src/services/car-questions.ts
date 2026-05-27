import { apiGet, apiPost } from "./api";
import type {
  AnswerCarQuestionDto,
  CreateCarQuestionDto,
  PublicCarQuestion,
  PublicQuestionMessage,
  PublicQuestionThread,
} from "../types/questions";

export type {
  PublicCarQuestion,
  PublicQuestionMessage,
  PublicQuestionThread,
} from "../types/questions";

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

type ThreadApiResponse = PublicQuestionThread;
type MessageApiResponse = PublicQuestionMessage;

const conversationCache = new Map<string, PublicQuestionThread[]>();
const conversationRequests = new Map<string, Promise<PublicQuestionThread[]>>();

function normalizeThread(thread: ThreadApiResponse): PublicQuestionThread {
  return {
    threadId: thread.threadId,
    carId: thread.carId,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    messages: Array.isArray(thread.messages)
      ? thread.messages
          .map(normalizeMessage)
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      : [],
  };
}

function normalizeMessage(message: MessageApiResponse): PublicQuestionMessage {
  return {
    messageId: message.messageId,
    threadId: message.threadId,
    senderId: message.senderId,
    senderRole: message.senderRole === "seller" ? "seller" : "buyer",
    carId: message.carId,
    content: message.content,
    createdAt: message.createdAt,
    sender: {
      id: message.sender?.id ?? message.senderId,
      name: message.sender?.name ?? "Usuario",
      role: message.sender?.role === "seller" ? "seller" : "buyer",
      avatarUrl: message.sender?.avatarUrl ?? null,
    },
  };
}

export function getCachedQuestionThreads(carId: string): PublicQuestionThread[] | null {
  return conversationCache.get(carId) ?? null;
}

export function setCachedQuestionThreads(carId: string, threads: PublicQuestionThread[]): void {
  conversationCache.set(carId, threads);
}

export async function getQuestionThreadsByCarId(carId: string): Promise<PublicQuestionThread[]> {
  const cached = conversationCache.get(carId);
  if (cached) return cached;

  const pending = conversationRequests.get(carId);
  if (pending) return pending;

  const request = apiGet<ThreadApiResponse[]>(`questions/threads/car/${encodeURIComponent(carId)}`)
    .then((threads) => {
      const normalized = Array.isArray(threads) ? threads.map(normalizeThread) : [];
      conversationCache.set(carId, normalized);
      return normalized;
    })
    .catch(() => [])
    .finally(() => {
      conversationRequests.delete(carId);
    });

  conversationRequests.set(carId, request);
  return request;
}

export async function createQuestionThread(input: {
  carId: string;
  content: string;
}): Promise<PublicQuestionThread | null> {
  const thread = await apiPost<ThreadApiResponse>("questions/threads", input).catch(() => null);
  if (!thread) return null;

  const normalized = normalizeThread(thread);
  const nextThreads = [...(conversationCache.get(input.carId) ?? []), normalized];
  conversationCache.set(input.carId, nextThreads);
  return normalized;
}

export async function sendQuestionMessage(input: {
  threadId: string;
  carId: string;
  content: string;
}): Promise<PublicQuestionMessage | null> {
  const message = await apiPost<MessageApiResponse>(
    `questions/threads/${encodeURIComponent(input.threadId)}/messages`,
    { content: input.content },
  ).catch(() => null);

  if (!message) return null;

  const normalized = normalizeMessage(message);
  const threads = conversationCache.get(input.carId);
  if (threads) {
    conversationCache.set(
      input.carId,
      threads.map((thread) =>
        thread.threadId === input.threadId
          ? { ...thread, messages: [...thread.messages.filter((item) => !item.pending), normalized] }
          : thread,
      ),
    );
  }

  return normalized;
}

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
  buyerId?: number | string;
  sellerId?: number | string;
  question: string;
}): Promise<PublicCarQuestion | null> {
  const body: CreateCarQuestionDto = {
    carId: input.carId,
    buyerId: String(input.buyerId ?? ""),
    sellerId: String(input.sellerId ?? ""),
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
  sellerId?: number | string;
  answer: string;
}): Promise<boolean> {
  const body: AnswerCarQuestionDto = {
    sellerId: String(input.sellerId ?? ""),
    answer: input.answer,
  };

  return apiPost<PublicCarQuestion, AnswerCarQuestionDto>(`questions/${encodeURIComponent(input.questionId)}/answer`, body)
    .then(() => true)
    .catch(() => false);
}
