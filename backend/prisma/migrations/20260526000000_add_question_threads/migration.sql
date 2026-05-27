CREATE TABLE "QuestionThread" (
    "id" UUID NOT NULL,
    "carId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionMessage" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "carId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionThread_carId_idx" ON "QuestionThread"("carId");
CREATE INDEX "QuestionThread_senderId_idx" ON "QuestionThread"("senderId");
CREATE INDEX "QuestionMessage_threadId_idx" ON "QuestionMessage"("threadId");
CREATE INDEX "QuestionMessage_carId_idx" ON "QuestionMessage"("carId");
CREATE INDEX "QuestionMessage_senderId_idx" ON "QuestionMessage"("senderId");

ALTER TABLE "QuestionThread" ADD CONSTRAINT "QuestionThread_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionThread" ADD CONSTRAINT "QuestionThread_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionMessage" ADD CONSTRAINT "QuestionMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "QuestionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionMessage" ADD CONSTRAINT "QuestionMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionMessage" ADD CONSTRAINT "QuestionMessage_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
