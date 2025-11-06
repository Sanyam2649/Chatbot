import mammoth from 'mammoth';
import { extractText } from 'unpdf';

export async function processFile(file) {
  const buffer = await file.arrayBuffer();
  const fileType = file.type;
  const fileName = file.name;

  console.log(`📄 Processing file: ${fileName}, type: ${fileType}, size: ${file.size} bytes`);

  let text = '';
  let pageCount = 0;

  try {
    if (fileType === 'application/pdf') {
      console.log('🔍 Extracting text from PDF...');
      const pdfResult = await extractTextFromPDF(buffer);
      text = pdfResult.text;
      pageCount = pdfResult.pageCount;
      
    } else if (fileType.includes('word') || fileName.endsWith('.docx')) {
      console.log('🔍 Extracting text from DOCX...');
      text = await extractTextFromDOCX(buffer);
      
    } else if (fileType.includes('text') || fileName.endsWith('.txt')) {
      console.log('📝 Reading text file...');
      text = new TextDecoder('utf-8').decode(buffer);
      
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error('No text content could be extracted from the file');
    }

    // Clean the text
    text = cleanExtractedText(text);
    
    console.log(`✅ Extracted ${text.length} characters from ${fileName}`);
    
    const chunks = chunkText(text, fileName, fileType, file.size, pageCount);
    console.log(`✅ Created ${chunks.length} chunks from ${fileName}`);
    
    return chunks;

  } catch (error) {
    console.error(`❌ Error processing file ${fileName}:`, error);
    throw new Error(`Failed to process ${fileName}: ${error.message}`);
  }
}

async function extractTextFromPDF(buffer) {
  try {
    console.log('📖 Loading PDF document...');
    
    // Convert ArrayBuffer to Uint8Array for unpdf
    const uint8Array = new Uint8Array(buffer);
    
    // Extract text using unpdf
    const { text, totalPages } = await extractText(uint8Array, {
      mergePages: true // Combines all pages into one string
    });
    
    console.log(`📄 PDF has ${totalPages} pages`);
    
    if (!text || text.trim().length === 0) {
      // Try fallback extraction
      const fallbackText = await extractTextFallback(buffer);
      if (fallbackText && fallbackText.trim().length > 0) {
        console.log('🔄 Used fallback text extraction');
        return {
          text: fallbackText,
          pageCount: totalPages || 0
        };
      }
      throw new Error('No readable text found in PDF');
    }
    
    console.log(`✅ Extracted ${text.length} characters from PDF`);
    
    return { 
      text: text,
      pageCount: totalPages 
    };
    
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    
    // Try fallback extraction
    try {
      const fallbackText = await extractTextFallback(buffer);
      if (fallbackText && fallbackText.trim().length > 0) {
        console.log('🔄 Used fallback text extraction after error');
        return {
          text: fallbackText,
          pageCount: 0
        };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback extraction also failed:', fallbackError);
    }
    
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

// Fallback extraction for problematic PDFs
async function extractTextFallback(buffer) {
  try {
    console.log('🔄 Trying fallback text extraction...');
    const uint8Array = new Uint8Array(buffer);
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    let text = '';
    
    // Extract text from parentheses (common in PDF text objects)
    const textMatches = pdfString.match(/\(([^)]*)\)/g) || [];
    for (const match of textMatches) {
      const content = match.slice(1, -1);
      // Filter out binary content and keep only readable text
      if (content.length > 2 && 
          content.length < 200 && 
          !content.includes('\\') && 
          /^[a-zA-Z0-9\s.,!?;:()-]+$/.test(content)) {
        text += content + ' ';
      }
    }
    
    return text.trim();
  } catch (error) {
    console.error('Fallback extraction error:', error);
    return '';
  }
}

async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    if (result.value.trim().length === 0) {
      throw new Error('DOCX file appears to be empty');
    }
    
    return cleanExtractedText(result.value);
  } catch (error) {
    console.error('❌ DOCX extraction failed:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}

function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    // Remove binary/non-printable characters
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove extra line breaks but keep paragraph separation
    .replace(/\n\s*\n/g, '\n\n')
    // Trim and clean up
    .trim();
}

function chunkText(text, fileName, fileType, fileSize, pageCount = 0, chunkSize = 600, overlap = 80) {
  const chunks = [];
  
  if (!text || text.trim().length === 0) {
    return chunks;
  }
  
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Simple sentence-based chunking
  const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const sentenceWithSpace = sentence.trim() + ' ';
    
    if (currentChunk.length + sentenceWithSpace.length > chunkSize && currentChunk.length > 0) {
      if (currentChunk.trim().length > 30) {
        chunks.push(createChunk(currentChunk, fileName, fileType, fileSize, chunks.length, pageCount));
      }
      
      // Keep last 2 sentences for overlap
      const sentencesInChunk = currentChunk.split(/(?<=[.!?])\s+/);
      const overlapText = sentencesInChunk.slice(-2).join(' ');
      currentChunk = overlapText + ' ' + sentenceWithSpace;
    } else {
      currentChunk += sentenceWithSpace;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 30) {
    chunks.push(createChunk(currentChunk, fileName, fileType, fileSize, chunks.length, pageCount));
  }
  
  // Update metadata with total chunks
  return chunks.map((chunk, index) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      totalChunks: chunks.length,
      chunkIndex: index
    }
  }));
}

function createChunk(text, fileName, fileType, fileSize, chunkIndex, pageCount) {
  return {
    text: text.trim(),
    metadata: {
      fileName,
      fileType,
      chunkIndex,
      totalChunks: 0, // Will be updated in chunkText
      fileSize,
      pageCount: pageCount || 0,
      uploadedAt: new Date().toISOString(),
      chunkId: `${fileName}-${chunkIndex}-${Date.now()}`
    }
  };
}

export async function validateFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/msword'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (!allowedTypes.includes(file.type) && 
      !file.name.endsWith('.pdf') && 
      !file.name.endsWith('.docx') && 
      !file.name.endsWith('.doc') && 
      !file.name.endsWith('.txt')) {
    return { valid: false, error: 'File type not supported. Please upload PDF, DOCX, or TXT files.' };
  }

  return { valid: true };
}
