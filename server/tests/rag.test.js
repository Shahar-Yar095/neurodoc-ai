import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { RagEngine } from '../src/engine/RagEngine.js';

describe('NeuroDoc AI RAG Engine & API Test Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    const { app } = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/health returns operational status and document count', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'UP');
    assert.ok(body.stats.totalDocuments >= 3);
  });

  test('POST /api/query returns synthesized answer with citations for microservices query', async () => {
    const res = await fetch(`${baseUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How do circuit breakers and retry policies help microservices?' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.matchedCount > 0);
    assert.ok(body.data.citations.length > 0);
    assert.ok(body.data.answer.includes('circuit'));
  });

  test('POST /api/documents chunks and indexes custom text document', async () => {
    const payload = {
      title: 'Docker Swarm Deployment',
      category: 'DevOps',
      content: 'Docker Swarm provides native clustering and container scheduling capabilities with encrypted overlay networks.'
    };

    const res = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.title, 'Docker Swarm Deployment');
  });

  test('POST /api/query rejects empty question with 400', async () => {
    const res = await fetch(`${baseUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '' })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('RagEngine cosine similarity handles exact match vs orthogonal vectors', () => {
    const engine = new RagEngine();
    const vecA = engine.vectorize('quantum computing cryptography');
    const vecB = engine.vectorize('quantum computing cryptography');
    const vecC = engine.vectorize('banana apple strawberry');

    const simHigh = engine.cosineSimilarity(vecA, vecB);
    const simLow = engine.cosineSimilarity(vecA, vecC);

    assert.ok(simHigh > 0.95);
    assert.equal(simLow, 0);
  });
});
