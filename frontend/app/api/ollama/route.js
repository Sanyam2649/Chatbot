import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {InferenceClient } from '@huggingface/inference';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Hugging Face for embeddings
const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const HF_EMBEDDING_MODEL = process.env.HF_MODAL

export async function POST(request) {
  try {
    const { endpoint, model, messages, prompt, ...body } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }
    
    console.log(`Proxying ${endpoint} to ${endpoint === 'embeddings' ? 'Hugging Face' : 'Groq'}, model: ${model}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      let result;
      
      if (endpoint === 'embeddings') {
        // Handle embeddings with Hugging Face
        if (!process.env.HUGGINGFACE_API_KEY) {
          return NextResponse.json({ 
            error: 'Hugging Face API key not configured',
            details: 'Please set HUGGINGFACE_API_KEY environment variable'
          }, { status: 500 });
        }

        const inputText = body.prompt || body.input;
        if (!inputText) {
          return NextResponse.json({ error: 'Prompt or input is required for embeddings' }, { status: 400 });
        }

        console.log(`Generating Hugging Face embeddings for text: ${inputText.substring(0, 100)}...`);
        
        const hfResponse = await hf.featureExtraction({
          model: HF_EMBEDDING_MODEL,
          inputs: inputText,
        });

        if (!hfResponse || !Array.isArray(hfResponse)) {
          throw new Error('Invalid embedding response from Hugging Face');
        }

        result = {
          embedding: hfResponse,
          model: HF_EMBEDDING_MODEL,
          dimension: 384
        };
        
      } else if (endpoint === 'chat') {
        // Handle chat with Groq
        const groqModel = 'llama-3.1-8b-instant';
        const groqResponse = await groq.chat.completions.create({
          model: groqModel,
          messages: messages,
          temperature: body.options?.temperature || 0.1,
          max_tokens: body.options?.num_predict || 1024,
          top_p: body.options?.top_p || 0.9,
          stream: false,
        });

        result = {
          message: {
            content: groqResponse.choices[0].message.content,
            role: 'assistant'
          },
          model: groqModel,
          provider: 'Groq'
        };
        
      } else if (endpoint === 'generate') {
        // Handle generate endpoint - convert to chat format using Groq
        const groqModel = 'llama-3.1-8b-instant';
        const groqResponse = await groq.chat.completions.create({
          model: groqModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: body.options?.temperature || 0.1,
          max_tokens: body.options?.num_predict || 1024,
          stream: false,
        });

        result = {
          response: groqResponse.choices[0].message.content,
          model: groqModel,
          provider: 'Groq'
        };
        
      } else {
        return NextResponse.json({ error: 'Unsupported endpoint' }, { status: 400 });
      }

      clearTimeout(timeoutId);
      return NextResponse.json(result);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    // Handle Hugging Face specific errors
    if (error.message?.includes('Hugging Face') || error.message?.includes('HUGGINGFACE')) {
      return NextResponse.json({ 
        error: 'Hugging Face embedding service unavailable',
        details: error.message 
      }, { status: 500 });
    }
    
    // Handle Groq API specific errors
    if (error.status === 401) {
      return NextResponse.json({ 
        error: 'Groq API authentication failed',
        details: 'Please check your GROQ_API_KEY' 
      }, { status: 401 });
    }
    
    if (error.status === 429) {
      return NextResponse.json({ 
        error: 'Groq API rate limit exceeded',
        details: 'Please try again later' 
      }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Service unavailable',
      details: error.message,
      endpoint: endpoint 
    }, { status: 500 });
  }
}

// Updated GET method for health check (both services)
export async function GET() {
  try {
    let hfStatus = 'unknown';
    try {
      if (process.env.HUGGINGFACE_API_KEY) {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        hfStatus = apiKey.startsWith('hf_') ? 'configured' : 'invalid_key_format';
      } else {
        hfStatus = 'missing_api_key';
      }
    } catch (hfError) {
      hfStatus = 'error';
    }
    
    return NextResponse.json({ 
      status: 'healthy', 
      services: {
        groq: {
          status: 'connected',
          models: [
            'llama-3.1-8b-instant',
            'llama-3.1-70b-versatile', 
            'mixtral-8x7b-32768',
            'gemma2-9b-it'
          ]
        },
        huggingface: {
          status: hfStatus,
          embedding_model: HF_EMBEDDING_MODEL,
          dimension: 384
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}