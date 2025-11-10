import {connectToDatabase } from "./mongoDB";
import ChatSession from "@/models/chatSession";

export async function saveMessage({ userId, sessionId, role, message }) {
  await connectToDatabase();

  const newMessage = {
    role,          // 'user' or 'assistant'
    message,       // text content
    timestamp: new Date(),
  };

  await ChatSession.findOneAndUpdate(
    { userId, sessionId },
    {
      $push: { messages: newMessage },
      $setOnInsert: { userId, sessionId, createdAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

export async function getChatHistory(sessionId, userId) {
  await connectToDatabase();
  const session = await ChatSession.findOne({ sessionId, userId });

  if (!session) {
    return { success: true, messages: [] };
  }

  const sortedMessages = session.messages
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(msg => ({
      role: msg.role,
      message: msg.message,
      timestamp: msg.timestamp,
    }));

  return {
    success: true,
    userId: session.userId,
    sessionId: session.sessionId,
    messages: sortedMessages,
  };
}

export async function deleteChat(sessionId) {
  await connectToDatabase();
  await ChatSession.deleteOne({ sessionId });
}
