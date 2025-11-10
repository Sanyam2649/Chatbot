import { NextResponse } from 'next/server';
import { saveMessageToVectorStore, searchSimilarDocuments, searchSimilarMessages } from '@/lib/vector-store';
import groq from '@/lib/ollama';
import { saveMessage } from '@/lib/chatSession';

export async function POST(request) {
  try {
    const { message, userId, sessionId, isDeepThinking } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1️⃣ Try to find similar chat messages (short-term memory)
    const chatResults = await searchSimilarMessages({ query: message, userId, sessionId });

    // 2️⃣ If no useful chat memory found, fall back to document memory
    let contextSource = "memory";
    let contextMatches = chatResults?.matches || [];

    if (!contextMatches?.length) {
      const docResults = await searchSimilarDocuments({ query: message, userId, sessionId });
      contextMatches = docResults?.matches || [];
      if (contextMatches.length) contextSource = "document";
    }

    // 3️⃣ Build system + user messages based on available context
    let systemPrompt;
    let userPrompt;

    if (contextMatches.length && contextSource === "memory") {
      const context = contextMatches
        .map((m, i) => `Past chat ${i + 1}:\n${m.metadata.text}`)
        .join("\n\n");

      systemPrompt = `You are a helpful assistant who remembers context from this user's past messages.
Use the past chat context if relevant to respond naturally and consistently.
If not relevant, answer using your own knowledge.`;

      userPrompt = `Past chat context:\n${context}\n\nCurrent message: ${message}`;
    }

    else if (contextMatches.length && contextSource === "document") {
      const context = contextMatches
        .map((m, i) => `Excerpt ${i + 1} (from ${m.metadata.fileName}):\n${m.text}`)
        .join("\n\n");

      systemPrompt = `You are a document assistant. Use the provided excerpts to answer precisely.
If the answer isn't present in them, say you don't have enough info instead of guessing.`;

      userPrompt = `Context:\n${context}\n\nQuestion: ${message}`;
    }

    else {
      systemPrompt = `You are a calm, focused AI assistant.
Keep responses clear, grounded, and conversational.
If user greets you, greet back briefly.
If user asks about documents, remind them they need to upload first.`;

      userPrompt = message;
      contextSource = "general";
    }

    // 4️⃣ Generate the model's reply
    const selectedModel = isDeepThinking
      ? process.env.HIGHER_MODAL
      : process.env.NORMAL_MODAL;

    const response = await groq.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      selectedModel,
      {
        temperature: isDeepThinking ? 0.2 : 0.1,
        max_tokens: isDeepThinking ? 4096 : 1024,
      }
    );

    const aiMessage = response.choices[0].message.content;

    // 5️⃣ Save both user + AI messages (for long-term persistence & memory)
    await Promise.all([
      saveMessage({ userId, sessionId, role: "user", message }),
      saveMessage({ userId, sessionId, role: "assistant", message: aiMessage }),
      saveMessageToVectorStore({ userId, sessionId, role: "user", message }),
      saveMessageToVectorStore({ userId, sessionId, role: "assistant", message: aiMessage }),
    ]);

    return NextResponse.json({
      response: aiMessage,
      type: contextSource,
      debug: {
        contextUsed: contextSource,
        matches: contextMatches.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isHealthy = await groq.checkHealth();
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      groq: isHealthy ? 'connected' : 'disconnected',
      models: ['llama-3.1-8b-instant'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      groq: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}