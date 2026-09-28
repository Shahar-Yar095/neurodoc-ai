import express from 'express';
import cors from 'cors';
import { RagEngine } from './engine/RagEngine.js';
import { seedDocuments } from './data/seedDocs.js';

export const createApp = (customEngine) => {
  const app = express();
  const engine = customEngine || new RagEngine();

  // Populate seed docs if new engine
  if (engine.chunks.length === 0) {
    seedDocuments.forEach((doc) => engine.indexDocument(doc));
  }

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'neurodoc-ai-rag',
      stats: engine.getStats(),
      timestamp: new Date().toISOString()
    });
  });

  // Query RAG pipeline
  app.post('/api/query', (req, res) => {
    const { question, topK = 3, minScore = 0.05 } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: "Query parameter 'question' is required." });
    }

    try {
      const result = engine.query({ question, topK, minScore });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all indexed documents
  app.get('/api/documents', (req, res) => {
    res.json({
      success: true,
      data: engine.getStats()
    });
  });

  // Index new document
  app.post('/api/documents', (req, res) => {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: "Fields 'title' and 'content' are required." });
    }

    const doc = engine.indexDocument({ title, content, category });
    res.status(201).json({
      success: true,
      message: 'Document chunked and indexed into vector knowledge base successfully',
      data: doc
    });
  });

  // Get raw chunks for visualizer
  app.get('/api/chunks', (req, res) => {
    res.json({
      success: true,
      total: engine.chunks.length,
      data: engine.chunks.map((c) => ({
        id: c.id,
        docTitle: c.docTitle,
        category: c.category,
        chunkIndex: c.chunkIndex,
        totalChunks: c.totalChunks,
        preview: c.text.substring(0, 140) + '...'
      }))
    });
  });

  return { app, engine };
};
