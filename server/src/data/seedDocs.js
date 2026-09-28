export const seedDocuments = [
  {
    id: "doc-microservices",
    title: "Enterprise Microservices Resiliency Guide",
    category: "Architecture",
    content: `Microservice architectures decouple software into autonomous, independently deployable services. To maintain high availability, distributed services must implement circuit breaker patterns, bulkhead isolation, and exponential backoff retry policies. 
When a downstream database or third-party payment gateway exhibits high latency, circuit breakers trip to prevent cascading failures throughout the distributed mesh. 
Health probes (readiness and liveness checks) enable Kubernetes orchestrators to route traffic only to operational nodes, preventing 504 gateway timeout errors.`
  },
  {
    id: "doc-rag-systems",
    title: "Retrieval-Augmented Generation (RAG) Architecture Overview",
    category: "Artificial Intelligence",
    content: `Retrieval-Augmented Generation (RAG) grounds Large Language Models on verified enterprise domain data to eliminate hallucinations. 
The pipeline consists of three core phases: ingestion, semantic vector retrieval, and context-augmented generation. 
Documents are segmented into overlapping text chunks to preserve local sentence context. Vector embeddings are generated and stored in vector indexes. 
During inference, the user prompt is converted into a query vector, enabling cosine similarity matching to extract the Top-K most relevant document chunks as verified citations.`
  },
  {
    id: "doc-caching-patterns",
    title: "Distributed Redis Caching & Invalidation Strategies",
    category: "Performance",
    content: `In high-throughput web applications, caching reduces database query load by up to 90%. 
The Cache-Aside pattern queries the Redis cache first; on a cache miss, the application loads data from PostgreSQL and writes it back to Redis with a Time-To-Live (TTL). 
To avoid cache stampedes during traffic spikes, applications utilize distributed locking and probabilistic early expiration algorithms. 
Write-through and write-behind caching ensure write consistency while offloading database IOPS.`
  }
];
