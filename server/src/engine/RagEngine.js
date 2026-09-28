// Semantic Vector Chunking, Cosine Indexing, and RAG Query Engine

export class RagEngine {
  constructor() {
    this.documents = new Map();
    this.chunks = []; // { id, docId, docTitle, text, vector, index }
  }

  // Tokenize & normalize text into vocabulary map
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  // Generate normalized frequency vector
  vectorize(text) {
    const tokens = this.tokenize(text);
    const vector = new Map();
    if (tokens.length === 0) return vector;

    for (const token of tokens) {
      vector.set(token, (vector.get(token) || 0) + 1);
    }

    // Compute L2 norm for cosine normalization
    let sumSq = 0;
    for (const count of vector.values()) {
      sumSq += count * count;
    }
    const magnitude = Math.sqrt(sumSq) || 1;

    for (const [token, count] of vector.entries()) {
      vector.set(token, count / magnitude);
    }

    return vector;
  }

  // Cosine similarity calculation between two unit vectors
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    const [smaller, larger] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];

    for (const [term, valA] of smaller.entries()) {
      if (larger.has(term)) {
        dotProduct += valA * larger.get(term);
      }
    }
    return Math.min(1.0, Math.max(0.0, dotProduct));
  }

  // Split raw text into semantic chunks with overlap
  chunkText(text, chunkSize = 300, overlap = 50) {
    const words = text.split(/\s+/);
    const chunks = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkWords = words.slice(start, end);
      chunks.push(chunkWords.join(' '));
      if (end >= words.length) break;
      start += chunkSize - overlap;
    }

    return chunks;
  }

  // Ingest and index document
  indexDocument({ id, title, content, category = 'General' }) {
    const docId = id || `doc-${Date.now().toString(36)}`;
    const textChunks = this.chunkText(content);

    const docRecord = {
      id: docId,
      title: title || 'Untitled Document',
      category,
      chunkCount: textChunks.length,
      createdAt: new Date().toISOString()
    };

    this.documents.set(docId, docRecord);

    textChunks.forEach((chunkText, index) => {
      this.chunks.push({
        id: `${docId}_chunk_${index}`,
        docId,
        docTitle: docRecord.title,
        category,
        chunkIndex: index + 1,
        totalChunks: textChunks.length,
        text: chunkText,
        vector: this.vectorize(chunkText)
      });
    });

    return docRecord;
  }

  // Query RAG knowledge base
  query({ question, topK = 3, minScore = 0.08 }) {
    if (!question || question.trim().length === 0) {
      throw new Error("Question parameter cannot be empty.");
    }

    const qVector = this.vectorize(question);
    const scored = this.chunks.map((chunk) => {
      const score = this.cosineSimilarity(qVector, chunk.vector);
      return {
        chunkId: chunk.id,
        docTitle: chunk.docTitle,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        category: chunk.category,
        score: Math.round(score * 1000) / 1000,
        text: chunk.text
      };
    });

    const relevant = scored
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const synthesis = this._synthesizeResponse(question, relevant);

    return {
      query: question,
      totalChunksIndexed: this.chunks.length,
      totalDocs: this.documents.size,
      matchedCount: relevant.length,
      citations: relevant,
      answer: synthesis
    };
  }

  _synthesizeResponse(question, chunks) {
    if (chunks.length === 0) {
      return "I could not find sufficiently relevant context in the uploaded documents to answer this question. Try uploading more related documentation or lowering the similarity threshold.";
    }

    const primary = chunks[0];
    const confidencePct = Math.min(99, Math.round(primary.score * 150));
    const qTokens = this.tokenize(question);

    // Score sentences in primary chunk by token overlap
    const sentences = primary.text.split(/(?<=[.?!])\s+/).filter(Boolean);
    let bestSentence = sentences[0] || primary.text.substring(0, 180);
    let bestOverlap = -1;

    for (const sent of sentences) {
      const sentTokens = this.tokenize(sent);
      const overlap = qTokens.filter((t) => sentTokens.includes(t)).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestSentence = sent;
      }
    }

    return `Based on "${primary.docTitle}" (${confidencePct}% semantic confidence): ${bestSentence} Relevant context was extracted from Section ${primary.chunkIndex} of ${primary.totalChunks}.`;
  }

  getStats() {
    return {
      totalDocuments: this.documents.size,
      totalChunks: this.chunks.length,
      documents: Array.from(this.documents.values())
    };
  }
}
