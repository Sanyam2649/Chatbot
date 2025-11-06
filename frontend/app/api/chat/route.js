import { NextResponse } from 'next/server';
import { searchSimilarDocuments } from '@/lib/vector-store';
import groq from '@/lib/ollama';

export async function POST(request) {
  try {
    const { message, userId } = await request.json();
    
    console.log(userId , "userId-1");
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const docResults = await searchSimilarDocuments({
  query: message,
  userId,
});

    if (docResults?.success && docResults.matches?.length > 0) {
      const context = docResults.matches
        .map(
          (match, i) =>
            `Excerpt ${i + 1} (from ${match.metadata.fileName}):\n${match.text}`
        )
        .join('\n\n');

      const messages = [
        {
          role: 'system',
          content: `You are a helpful document assistant. Use the provided context to answer the user's question.
If the answer is not in the context, say you cannot find it instead of guessing.`
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${message}`
        }
      ];

      const response = await groq.chatCompletion(messages, 'llama-3.1-8b-instant', {
        temperature: 0.1,
        max_tokens: 1024
      });

      return NextResponse.json({
        response: response.choices[0].message.content,
        sources: docResults.matches.map(m => ({
          fileName: m.metadata.fileName,
          chunkIndex: m.metadata.chunkIndex,
          score: m.hybridScore
        })),
        type: 'document',
        debug: {
          message: 'Used document context',
          matchesFound: docResults.matches.length,
          timestamp: new Date().toISOString()
        }
      });
    }
    // 🧠 <<< END OF ADDED SECTION

    // Fallback if no relevant docs found
    const messages = [
      { 
        role: 'system', 
        content: `You are a helpful AI assistant. Answer the user's question clearly and concisely. 
        
If the user asks about documents or files, let them know they need to upload documents first to get document-specific answers.

User's question: ${message}` 
      },
      { role: 'user', content: message }
    ];    
    
    const response = await groq.chatCompletion(messages, 'llama-3.1-8b-instant', {
      temperature: 0.1,
      max_tokens: 1024
    });

    return NextResponse.json({
      response: response.choices[0].message.content,
      sources: [],
      type: 'ai',
      debug: {
        message: 'Using fallback (no document matches)',
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

// function getQuickResponse(userMessage) {
//   const greetings = ['hi', 'hello', 'hey', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening'];
//   const capabilities = ['what can you do', 'how do you work', 'who are you', 'help', 'capabilities'];
//   const thanks = ['thanks', 'thank you', 'thankyou', 'appreciate it'];
  
//   if (greetings.some(greet => new RegExp(`\\b${greet}\\b`, 'i').test(userMessage))) {
//     return quickResponses.greetings[Math.floor(Math.random() * quickResponses.greetings.length)];
//   }
  
//   if (capabilities.some(cap => userMessage.includes(cap))) {
//     return quickResponses.capabilities[Math.floor(Math.random() * quickResponses.capabilities.length)];
//   }
  
//   if (thanks.some(thank => userMessage.includes(thank))) {
//     return "You're welcome! Is there anything else I can help you with?";
//   }
  
//   if (userMessage.includes('how are you')) {
//     return "I'm functioning well and ready to help you with your documents!";
//   }
  
//   return null;
// }

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