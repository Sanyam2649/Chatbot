import { getPineconeIndex } from './vectorDB';
import hfEmbeddings from './huggingFace';

export async function storeDocuments({documents, userId}) {
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
        text: doc.text.substring(0, 1000), // Store first 1000 chars for preview
        uploadedAt: doc.metadata.uploadedAt,
        pageCount: doc.metadata.pageCount || 0,
        chunkId: doc.metadata.chunkId,
        userId : userId
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

export async function searchSimilarDocuments({ query, limit = 5, userId }) {
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
        userId: userId, // Only fetch results belonging to this user
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


// Get statistics about stored vectors
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

// lib/vector-store.js
export async function deleteVectorsByUserId(userId) {
  try {
    const index = await getPineconeIndex();
    console.log(Object.keys(index))

    if (!userId) throw new Error("User ID is required to delete vectors");

    console.log(`🗑️ Deleting all vectors for user: ${userId}`);
    const ns = await index.namespace("");
    const deleteResponse = await ns.delete({
      filter: { userId: userId }
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




// Enhanced hybrid scoring
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

// Helper function to generate unique vector IDs
function generateVectorId(fileName, chunkIndex) {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `doc_${safeFileName}_${timestamp}_${chunkIndex}`;
}
