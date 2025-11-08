// lib/ollama.js - UPDATED STREAMING METHOD
import Groq from "groq-sdk";

class GroqClient {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async chatCompletion(messages, model, options = {}) {
    try {
      console.log(`🔄 Getting chat response from Groq ${model}...`);
      
      const response = await this.groq.chat.completions.create({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 1024,
        top_p: 0.9,
        stream: false,
      });

      console.log('✅ Got response from Groq');
      return response;
      
    } catch (error) {
      console.error('❌ Groq chat completion error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }
  
  async chatCompletionStream(messages, model, options = {}) {
    try {
      console.log(`🌀 Getting streaming chat response from Groq ${model}...`);
      
      const stream = await this.groq.chat.completions.create({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 1024,
        top_p: 0.9,
        stream: true,
      });

      console.log('✅ Groq streaming started');
      return stream;
      
    } catch (error) {
      console.error('❌ Groq streaming chat completion error:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      console.error('Groq health check failed:', error);
      return false;
    }
  }
}

const groq = new GroqClient();
export default groq;