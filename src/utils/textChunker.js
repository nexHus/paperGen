/**
 * Utility functions for text chunking and processing
 */

/**
 * Split text into chunks of specified size with overlap
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - Maximum size of each chunk
 * @param {number} overlap - Number of characters to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.length === 0) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // If we're not at the end of the text, try to break at a sentence or word boundary
    if (end < text.length) {
      // Look for sentence ending
      const sentenceEnd = text.lastIndexOf('.', end);
      const questionEnd = text.lastIndexOf('?', end);
      const exclamationEnd = text.lastIndexOf('!', end);
      
      const sentenceBoundary = Math.max(sentenceEnd, questionEnd, exclamationEnd);
      
      if (sentenceBoundary > start + chunkSize * 0.5) {
        end = sentenceBoundary + 1;
      } else {
        // Fall back to word boundary
        const wordBoundary = text.lastIndexOf(' ', end);
        if (wordBoundary > start + chunkSize * 0.5) {
          end = wordBoundary;
        }
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start position with overlap
    start = end - overlap;
    if (start <= 0) start = end;
  }

  return chunks;
}

/**
 * Clean and preprocess text
 * @param {string} text - Raw text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .replace(/[^\w\s\.\,\!\?\;\:\-\(\)]/g, '') // Remove special characters except basic punctuation
    .trim();
}

/**
 * Send chunks to Flask API for embedding
 * @param {Array<string>} chunks - Text chunks to embed
 * @param {string} flaskApiUrl - Flask API endpoint URL
 * @returns {Promise<Array>} Array of embeddings
 */
export async function sendChunksForEmbedding(chunks, flaskApiUrl) {
  try {
    const response = await fetch(flaskApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: chunks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Flask API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.embeddings;
  } catch (error) {
    console.error('Error sending chunks to Flask API:', error);
    throw error;
  }
}
