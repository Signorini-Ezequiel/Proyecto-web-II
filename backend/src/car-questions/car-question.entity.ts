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

export interface QuestionParticipant {
  id: string;
  name: string;
  role: 'buyer' | 'seller';
  avatarUrl: string | null;
}

export interface PublicQuestionMessage {
  messageId: string;
  threadId: string;
  senderId: string;
  senderRole: 'buyer' | 'seller';
  carId: string;
  content: string;
  createdAt: string;
  sender: QuestionParticipant;
}

export interface PublicQuestionThread {
  threadId: string;
  carId: string;
  createdAt: string;
  updatedAt: string;
  messages: PublicQuestionMessage[];
}
