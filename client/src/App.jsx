import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function App() {
  const [docs, setDocs] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Engineering');
  const [newContent, setNewContent] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) {
        const json = await res.json();
        setDocs(json.data.documents || []);
        setTotalChunks(json.data.totalChunks || 0);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleQuery = async (queryText) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, topK: 3, minScore: 0.05 }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (err) {
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: newContent,
        }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        fetchDocs();
      }
    } catch (err) {
      console.error('Ingestion error:', err);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="app-wrapper">
      <header className="header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🧠 NeuroDoc AI</h1>
            <span className="title-badge">RAG Vector Intelligence</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Retrieval-Augmented Generation with semantic chunking & cosine similarity search
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="mono-num" style={{ fontWeight: 700, color: '#38bdf8' }}>
              {docs.length} Docs / {totalChunks} Chunks
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>In-Memory Vector DB</div>
          </div>
        </div>
      </header>

      <div className="two-col-grid">
        {/* Left Column: Knowledge Base & Upload */}
        <aside>
          <div className="panel">
            <h2 className="panel-title">Indexed Knowledge Base</h2>
            {docs.map((doc) => (
              <div key={doc.id} className="doc-list-item">
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{doc.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  <span>{doc.category}</span>
                  <span className="mono-num">{doc.chunkCount} vector chunks</span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h2 className="panel-title">Ingest Custom Document</h2>
            <form onSubmit={handleIngest}>
              <input
                type="text"
                className="input-field"
                placeholder="Document Title (e.g. AWS Lambda Scaling)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <select
                className="input-field"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Engineering">Engineering</option>
                <option value="DevOps">DevOps</option>
                <option value="Architecture">Architecture</option>
                <option value="Machine Learning">Machine Learning</option>
              </select>
              <textarea
                className="textarea-field"
                rows="5"
                placeholder="Paste plain text content to chunk, vectorize, and index..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={ingesting}
              >
                {ingesting ? 'Vectorizing...' : 'Chunk & Index Document'}
              </button>
            </form>
          </div>
        </aside>

        {/* Right Column: Semantic RAG Q&A Engine */}
        <main>
          <div className="panel">
            <h2 className="panel-title">Semantic Natural Language Query</h2>
            <div className="query-box">
              <input
                type="text"
                className="input-field query-input"
                placeholder="Ask any question grounded in the knowledge base..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleQuery()}
                disabled={loading}
              >
                {loading ? 'Retrieving...' : 'Ask RAG'}
              </button>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginRight: '0.5rem' }}>Try Prompts:</span>
              <button
                className="sample-chip"
                onClick={() => {
                  setQuestion('How do circuit breakers and retry policies help microservices?');
                  handleQuery('How do circuit breakers and retry policies help microservices?');
                }}
              >
                Microservice circuit breakers
              </button>
              <button
                className="sample-chip"
                onClick={() => {
                  setQuestion('Explain the 3 phases of a RAG pipeline');
                  handleQuery('Explain the 3 phases of a RAG pipeline');
                }}
              >
                3 phases of RAG pipeline
              </button>
              <button
                className="sample-chip"
                onClick={() => {
                  setQuestion('What is the Cache-Aside pattern in Redis?');
                  handleQuery('What is the Cache-Aside pattern in Redis?');
                }}
              >
                Redis Cache-Aside pattern
              </button>
            </div>
          </div>

          {result && (
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Synthesized AI Context & Citations</h3>
                <span className="title-badge mono-num">
                  {result.matchedCount} Citations Found
                </span>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#111827', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #1e293b' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#f8fafc' }}>
                  {result.answer}
                </p>
              </div>

              <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Source Document Citations (Ranked by Cosine Match)
              </h4>

              {result.citations.map((c, i) => (
                <div key={i} className="citation-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.85rem' }}>
                      📄 {c.docTitle} (Chunk #{c.chunkIndex} of {c.totalChunks})
                    </span>
                    <span className="mono-num" style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                      Score: {c.score}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    "{c.text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
