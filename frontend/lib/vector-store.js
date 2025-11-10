import { getPineconeChatIndex, getPineconeIndex } from './vectorDB';
import hfEmbeddings from './huggingFace';
import chatSession from '@/models/chatSession';
import { connectToDatabase } from './mongoDB';

export async function storeDocuments({documents, userId , sessionId}) {
  const index = await getPineconeIndex();
  
  try {
    console.log(`📦 Generating embeddings for ${documents.length} documents with Hugging Face...`);
    
    // Generate embeddings using Hugging Face
    const texts = documents.map(doc => doc.text);
    const embeddings = await hfEmbeddings.generateEmbeddings(texts);
    
    // Prepare vectors for Pinecone
    const vectors = documents.map((doc, index) => ({
      id: generateVectorId(doc.metadata.fileName, doc.metadata.chunkIndex),
      values: embeddings[index],
      metadata: {
        fileName: doc.metadata.fileName,
        fileType: doc.metadata.fileType,
        fileSize: doc.metadata.fileSize,
        chunkIndex: doc.metadata.chunkIndex,
        totalChunks: doc.metadata.totalChunks,
        text: doc.text.substring(0, 1000),
        uploadedAt: doc.metadata.uploadedAt,
        pageCount: doc.metadata.pageCount || 0,
        chunkId: doc.metadata.chunkId,
        userId : userId,
        sessionId : sessionId
      }
    }));
    
    console.log(`🚀 Storing ${vectors.length} vectors in Pinecone...`);
    const upsertResponse = await index.upsert(vectors);
    
    return {
      success: true,
      count: vectors.length,
      upserted: upsertResponse?.upsertedCount || vectors.length
    };
    
  } catch (error) {
    console.error('❌ Error storing documents in Pinecone:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function generateChatVectorId(sessionId, timestamp = Date.now()) {
  return `${sessionId}-${timestamp}`;
}

export async function saveMessageToVectorStore({ userId, sessionId, role, message }) {
  try {
    const index = await getPineconeChatIndex();

    console.log(`💬 Generating embedding for chat message (user: ${userId}, session: ${sessionId})...`);

    const embedding = await hfEmbeddings.generateEmbeddings([message]);
    const vector = embedding[0];

    const vectorId = generateChatVectorId(sessionId, Date.now());

    const payload = {
      id: vectorId,
      values: vector,
      metadata: {
        userId,
        sessionId,
        role,
        text: message.substring(0, 1000),
        createdAt: new Date().toISOString(),
      },
    };

    console.log(`🚀 Saving chat message vector ${vectorId} to Pinecone...`);
    await index.upsert([payload]);

    return { success: true, id: vectorId };
  } catch (error) {
    console.error('❌ Error saving message to Pinecone:', error);
    return { success: false, error: error.message };
  }
}

export async function searchSimilarMessages({ query, userId, sessionId, topK = 5 }) {
  try {
    const index = await getPineconeChatIndex();
    const queryEmbedding = await hfEmbeddings.generateEmbeddings([query]);

    const results = await index.query({
      vector: queryEmbedding[0],
      topK,
      filter: {
        userId: userId,
        sessionId: sessionId,
      },
      includeMetadata: true,
    });

    if (!results?.matches?.length) {
      return { success: true, matches: [] };
    }

    // Clean up structure for easier use
    const matches = results.matches.map((m) => ({
      id: m.id,
      score: m.score,
      metadata: {
        text: m.metadata?.text || "",
        role: m.metadata?.role || "user",
        userId: m.metadata?.userId,
        sessionId: m.metadata?.sessionId,
      },
    }));

    return { success: true, matches };
  } catch (error) {
    console.error("❌ Error searching chat messages:", error);
    return { success: false, error: error.message };
  }
}

export async function searchSimilarDocuments({ query, limit = 5, userId , sessionId }) {
  const index = await getPineconeIndex();

  try {
    console.log(`🔍 Searching for: "${query.substring(0, 50)}..." (User: ${userId})`);

    // Generate embedding for the query
    const queryEmbedding = await hfEmbeddings.generateEmbedding(query);
    if (!queryEmbedding) throw new Error('Failed to generate query embedding');

    // Query Pinecone with userId filter
    const searchResponse = await index.namespace('__default__').query({
      vector: queryEmbedding,
      topK: Math.max(limit * 3, 15),
      includeMetadata: true,
      includeValues: false,
      filter: {
        userId: userId,
        sessionId : sessionId
      },
    });

    if (!searchResponse.matches?.length) {
      return {
        success: true,
        matches: [],
        totalFound: 0,
        message: "No matches found for this user",
      };
    }

    // Enhanced scoring
    const scoredMatches = searchResponse.matches.map(match => ({
      id: match.id,
      semanticScore: match.score,
      hybridScore: calculateHybridScore(match, query),
      text: match.metadata.text,
      metadata: {
        fileName: match.metadata.fileName,
        fileType: match.metadata.fileType,
        chunkIndex: match.metadata.chunkIndex,
        totalChunks: match.metadata.totalChunks,
        uploadedAt: match.metadata.uploadedAt,
        chunkId: match.metadata.chunkId,
        userId: match.metadata.userId,
        sessionId : match.metadata.sessionId
      },
    }));

    // Filter & sort results
    const relevantMatches = scoredMatches
      .filter(m => m.hybridScore >= 0.15)
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);

    console.log(`✅ Found ${relevantMatches.length} relevant matches for ${userId}`);

    return {
      success: true,
      matches: relevantMatches.length > 0 ? relevantMatches : scoredMatches.slice(0, limit),
      totalFound: searchResponse.matches.length,
      message: `Found ${relevantMatches.length} relevant matches`,
    };
  } catch (error) {
    console.error('❌ Error searching documents:', error);
    return {
      success: false,
      error: error.message,
      matches: [],
    };
  }
}

export async function getVectorStats() {
  try {
    const index = await getPineconeIndex();
    const stats = await index.describeIndexStats();
    
    return {
      success: true,
      totalVectors: stats.totalVectorCount || 0,
      dimension: stats.dimension || 0,
      indexFullness: stats.indexFullness || 0
    };
  } catch (error) {
    console.error('❌ Error getting vector stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function deleteVectorsByUserId(userId) {
  try {
    const index = await getPineconeIndex();

    if (!userId) throw new Error("User ID is required to delete vectors");

    const deleteResponse = await index.deleteMany({
      userId : userId,
    });

    return {
      success: true,
      message: `Deleted all vectors for user ${userId}`,
      response: deleteResponse,
    };
  } catch (error) {
    console.error("❌ Error deleting vectors by user:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteChatSession(sessionId, userId) {
  try {
    if (!sessionId || !userId) {
      throw new Error("Both sessionId and userId are required to delete session vectors");
    }

    const index = await getPineconeChatIndex();
    const deleteResponse = await index.deleteMany({
        sessionId: sessionId
    });

    return {
      success: true,
      message: `Deleted chats for user ${userId}, session ${sessionId}`,
      response: deleteResponse,
    };
  } catch (error) {
    console.error("❌ Error deleting session chats:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
export async function deleteLongTermMemory(sessionId, userId) {
  try {
    if (!sessionId || !userId) {
      throw new Error("Both sessionId and userId are required to delete long-term memory");
    }

    await connectToDatabase();
    const deleteResult = await chatSession.deleteOne({ sessionId, userId });

    if (deleteResult.deletedCount === 0) {
      return {
        success: false,
        message: `No long-term memory found for user ${userId}, session ${sessionId}`,
      };
    }

    return {
      success: true,
      message: `Deleted long-term memory for user ${userId}, session ${sessionId}`,
    };
  } catch (error) {
    console.error("❌ Error deleting long-term memory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function calculateHybridScore(match, query) {
  const semanticWeight = 0.6;
  const keywordWeight = 0.4;
  
  const keywordScore = calculateKeywordRelevance(match.metadata.text, query);
  const normalizedKeywordScore = Math.min(keywordScore / 5, 1);
  
  return (match.score * semanticWeight) + (normalizedKeywordScore * keywordWeight);
}

function calculateKeywordRelevance(text, query) {
  const queryKeywords = query.toLowerCase().split(/\s+/).filter(word => 
    word.length >= 3 && !['what', 'how', 'when', 'where', 'which', 'with', 'from', 'the', 'and', 'for'].includes(word)
  );
  
  if (queryKeywords.length === 0) return 0;
  
  const textLower = text.toLowerCase();
  let score = 0;
  
  queryKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      score += matches.length;
    }
  });
  
  return score / queryKeywords.length;
}

function generateVectorId(fileName, chunkIndex) {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `doc_${safeFileName}_${timestamp}_${chunkIndex}`;
}
