// app/api/chat/route.js - COMPLETELY UPDATED
import { NextResponse } from 'next/server';
import { searchSimilarDocuments } from '@/lib/vector-store';
import groq from '@/lib/ollama';

const quickResponses = {
  greetings: [
    "Hello! I'm your document assistant. How can I help you today?",
    "Hi there! I'm ready to help you search through your documents.",
    "Greetings! I can answer questions about your uploaded files."
  ],
  capabilities: [
    "I can search through your documents and answer questions based on their content. Just upload some files and ask away!",
    "I'm specialized in document analysis. I'll help you find information in your PDFs, DOCX files, and text documents."
  ]
};

export async function POST(request) {
  try {
    const { message, history = [] } = await request.json();

    console.log('📨 Received message:', message);

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const userMessage = message.trim().toLowerCase();
    
    // Handle quick responses without vector search
    const quickResponse = getQuickResponse(userMessage);
    if (quickResponse) {
      console.log('⚡ Using quick response');
      return NextResponse.json({
        response: quickResponse,
        sources: [],
        type: 'quick'
      });
    }

    // For now, let's SIMPLIFY and skip vector search to test
    console.log(`🔍 SIMPLIFIED: Processing message without vector search: "${message}"`);
    
    let context = 'No specific document context found. Please upload documents first.';
    let relevantDocs = [];

    // Prepare messages for Groq - SIMPLIFIED VERSION
    const messages = [
      { 
        role: 'system', 
        content: `You are a helpful AI assistant. Answer the user's question clearly and concisely. 
        
If the user asks about documents or files, let them know they need to upload documents first to get document-specific answers.

User's question: ${message}` 
      },
      { role: 'user', content: message }
    ];

    // Use NON-STREAMING version first to test
    console.log('🤖 Calling Groq API (non-streaming for testing)...');
    
    const response = await groq.chatCompletion(messages, 'llama-3.1-8b-instant', {
      temperature: 0.1,
      max_tokens: 1024
    });

    console.log('✅ Got response from Groq');

    return NextResponse.json({
      response: response.choices[0].message.content,
      sources: [],
      type: 'ai',
      debug: {
        message: 'Using simplified non-streaming version',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error.message,
        suggestion: 'Please try again with a different question'
      },
      { status: 500 }
    );
  }
}

function getQuickResponse(userMessage) {
  const greetings = ['hi', 'hello', 'hey', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening'];
  const capabilities = ['what can you do', 'how do you work', 'who are you', 'help', 'capabilities'];
  const thanks = ['thanks', 'thank you', 'thankyou', 'appreciate it'];
  
  if (greetings.some(greet => userMessage.includes(greet))) {
    return quickResponses.greetings[Math.floor(Math.random() * quickResponses.greetings.length)];
  }
  
  if (capabilities.some(cap => userMessage.includes(cap))) {
    return quickResponses.capabilities[Math.floor(Math.random() * quickResponses.capabilities.length)];
  }
  
  if (thanks.some(thank => userMessage.includes(thank))) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  if (userMessage.includes('how are you')) {
    return "I'm functioning well and ready to help you with your documents!";
  }
  
  return null;
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