// lib/vectorDB.js - UPDATED DIMENSION
import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;
let pineconeIndex = null;

export async function getPineconeClient() {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }

    pineconeClient = new Pinecone({
      apiKey: apiKey,
    });
    console.log('Pinecone client initialized');
  }
  return pineconeClient;
}

export async function getPineconeIndex() {
  if (!pineconeIndex) {
    const pc = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'document-chatbot-groq';
    
    try {
      const indexes = await pc.listIndexes();
      const indexExists = indexes.indexes?.some(index => index.name === indexName);
      
      if (!indexExists) {
        console.log(`Creating new index for Groq: ${indexName}`);
        await pc.createIndex({
          name: indexName,
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
          waitUntilReady: true,
        });
        
        console.log(`Index ${indexName} created successfully with 384 dimensions`);
      } else {
        console.log(`Using existing index: ${indexName}`);
      }
      
      pineconeIndex = pc.index(indexName);
      
    } catch (error) {
      console.error('Pinecone setup failed:', error);
      throw new Error(`Pinecone error: ${error.message}`);
    }
  }
  return pineconeIndex;
}
