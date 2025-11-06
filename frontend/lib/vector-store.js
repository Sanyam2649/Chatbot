import { getPineconeIndex } from './vectorDB';
import hfEmbeddings from './huggingFace';

export async function storeDocuments(documents) {
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
        chunkId: doc.metadata.chunkId
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

export async function searchSimilarDocuments(query, limit = 5) {
  const index = await getPineconeIndex();
  
  try {
    console.log(`🔍 Searching for: "${query.substring(0, 50)}..."`);
    
    // Generate embedding for the query using Hugging Face
    const queryEmbedding = await hfEmbeddings.generateEmbedding(query);
    
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }
    
    // Query Pinecone
    const searchResponse = await index.query({
      vector: queryEmbedding,
      topK: Math.max(limit * 3, 15),
      includeMetadata: true,
      includeValues: false
    });
    
    if (searchResponse.matches.length === 0) {
      return {
        success: true,
        matches: [],
        totalFound: 0,
        message: "No matches found"
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
        chunkId: match.metadata.chunkId
      }
    }));
    
    // Filter and sort
    const relevantMatches = scoredMatches
      .filter(match => match.hybridScore >= 0.15)
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);
    
    console.log(`✅ Found ${relevantMatches.length} relevant matches`);
    return {
      success: true,
      matches: relevantMatches.length > 0 ? relevantMatches : scoredMatches.slice(0, limit),
      totalFound: searchResponse.matches.length,
      message: `Found ${relevantMatches.length} relevant matches`
    };
    
  } catch (error) {
    console.error('❌ Error searching documents:', error);
    return {
      success: false,
      error: error.message,
      matches: []
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

// Delete vectors by file name
export async function deleteVectorsByFileName(fileName) {
  try {
    const index = await getPineconeIndex();
    
    // First, find all vectors for this file
    const searchResponse = await index.query({
      vector: Array(384).fill(0), // Dummy vector matching the 384-dimension
      topK: 10000,
      includeMetadata: true,
      filter: { fileName: { $eq: fileName } }
    });
    
    if (searchResponse.matches.length === 0) {
      return { success: true, deleted: 0, message: 'No vectors found for this file' };
    }
    
    // Delete the vectors
    const idsToDelete = searchResponse.matches.map(match => match.id);
    await index.deleteMany(idsToDelete);
    
    return {
      success: true,
      deleted: idsToDelete.length,
      message: `Deleted ${idsToDelete.length} vectors for ${fileName}`
    };
    
  } catch (error) {
    console.error('❌ Error deleting vectors:', error);
    return {
      success: false,
      error: error.message
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

// Add this function to lib/vector-store.js
export async function debugVectorStore() {
  try {
    const index = await getPineconeIndex();
    const stats = await index.describeIndexStats();
    
    console.log('🔍 VECTOR STORE DEBUG INFO:');
    console.log('Total vectors:', stats.totalVectorCount);
    console.log('Dimension:', stats.dimension);
    console.log('Index fullness:', stats.indexFullness);
    
    // Sample query to test
    const testQuery = 'test query';
    const queryEmbedding = Array(384).fill(0.1); // Simple test embedding
    const testResults = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });
    
    console.log('Test query results:', testResults.matches.length, 'matches');
    testResults.matches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`, {
        id: match.id,
        score: match.score,
        fileName: match.metadata?.fileName,
        textPreview: match.metadata?.text?.substring(0, 100)
      });
    });
    
    return { success: true, stats, testResults };
  } catch (error) {
    console.error('Vector store debug failed:', error);
    return { success: false, error: error.message };
  }
}