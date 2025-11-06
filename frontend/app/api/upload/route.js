import { NextResponse } from 'next/server';
import { processFile, validateFile } from '@/lib/fileProcessor';
import { storeDocuments } from '@/lib/vector-store';
import { getPineconeIndex } from '@/lib/vectorDB';

const EmbeddingModal = process.env.HF_MODAL;

export async function POST(request) {
  try {
    // Check if Pinecone is available
    try {
      await getPineconeIndex();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Vector database unavailable', 
          details: error.message,
          suggestion: 'Please check your Pinecone configuration'
        },
        { status: 500 }
      );
    }

    // Check if Hugging Face API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Embedding service unavailable', 
          details: 'HUGGINGFACE_API_KEY is not configured',
          suggestion: 'Please add your Hugging Face API key to environment variables'
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const results = [];
    let totalChunksProcessed = 0;

    for (const file of files) {
      try {
        // Validate file
        const validation = await validateFile(file);
        if (!validation.valid) {
          results.push({
            fileName: file.name,
            status: 'success',
            chunks: chunks.length,
            message: `Successfully processed ${chunks.length} chunks with ${fileType.includes('image') ? 'OCR' : 'text extraction'}`
          });
          continue;
        }

        console.log(`Processing file: ${file.name}`);
        
        // Process file into chunks
        const chunks = await processFile(file);
        
        if (chunks.length === 0) {
          results.push({
            fileName: file.name,
            status: 'error',
            message: 'No extractable text found in file.'
          });
          continue;
        }

        console.log(`Created ${chunks.length} chunks from ${file.name}`);
        
        // Store in Pinecone (now using Hugging Face for embeddings)
        const storeResult = await storeDocuments(chunks);
        
        if (storeResult.success) {
          totalChunksProcessed += chunks.length;
          results.push({
            fileName: file.name,
            status: 'success',
            chunks: chunks.length,
            message: `Successfully processed ${chunks.length} chunks with Hugging Face embeddings`
          });
        } else {
          throw new Error(storeResult.error);
        }

      } catch (fileError) {
        console.error(`Error processing ${file.name}:`, fileError);
        
        // Provide more specific error messages for Hugging Face-related issues
        let errorMessage = `Failed to process file: ${fileError.message}`;
        
        if (fileError.message.includes('HUGGINGFACE_API_KEY') || fileError.message.includes('authentication')) {
          errorMessage = 'Embedding service authentication failed. Please check your Hugging Face API key.';
        } else if (fileError.message.includes('rate limit')) {
          errorMessage = 'Embedding service rate limit exceeded. Please try again in a moment.';
        } else if (fileError.message.includes('embedding')) {
          errorMessage = 'Failed to generate embeddings for document chunks.';
        }
        
        results.push({
          fileName: file.name,
          status: 'error',
          message: errorMessage
        });
      }
    }

    return NextResponse.json({ 
      results,
      summary: {
        totalFiles: files.length,
        totalChunks: totalChunksProcessed,
        database: 'Pinecone',
        embeddingService: 'Hugging Face',
        embeddingModel: EmbeddingModal,
        embeddingDimension: 384 // Hugging Face model uses 384-dim embeddings
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Enhanced error handling for Hugging Face-specific issues
    let errorDetails = error.message;
    let suggestion = 'Please try again later';
    
    if (error.message.includes('HUGGINGFACE_API_KEY')) {
      errorDetails = 'Hugging Face API key is missing or invalid';
      suggestion = 'Please check your HUGGINGFACE_API_KEY environment variable';
    } else if (error.message.includes('rate limit')) {
      errorDetails = 'Hugging Face API rate limit exceeded';
      suggestion = 'Please wait a moment and try again';
    } else if (error.message.includes('authentication')) {
      errorDetails = 'Hugging Face API authentication failed';
      suggestion = 'Please verify your API key is correct';
    }
    
    return NextResponse.json(
      { 
        error: 'Upload processing failed',
        details: errorDetails,
        suggestion: suggestion
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for upload status/health check
export async function GET() {
  try {
    // Test both Pinecone and Hugging Face availability
    const pineconeIndex = await getPineconeIndex();
    const stats = await pineconeIndex.describeIndexStats();
    
    return NextResponse.json({
      status: 'healthy',
      services: {
        pinecone: {
          status: 'connected',
          totalVectors: stats.totalVectorCount,
          dimension: stats.dimension
        },
        huggingface: {
          status: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'missing_api_key',
          embeddingModel: EmbeddingModal,
          dimension: 384
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}