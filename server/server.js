import { createApp } from './src/app.js';

const { app } = createApp();
const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`⚡ NeuroDoc AI RAG Server running at http://localhost:${PORT}`);
  console.log(`📚 Health & Telemetry: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Query Endpoint: POST http://localhost:${PORT}/api/query`);
});
