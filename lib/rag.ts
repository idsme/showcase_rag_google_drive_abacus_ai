import { prisma } from './db';

export interface Citation {
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export interface RetrievalResult {
  content: string;
  documentName: string;
  pageNumber: number;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) * (a[i] ?? 0);
    normB += (b[i] ?? 0) * (b[i] ?? 0);
  }
  const norm = Math.sqrt(normA) * Math.sqrt(normB);
  return norm === 0 ? 0 : dotProduct / norm;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://apps.abacus.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text?.slice(0, 8000) ?? ''
    })
  });
  
  const data = await response.json();
  return data?.data?.[0]?.embedding ?? [];
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 5
): Promise<RetrievalResult[]> {
  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding?.length) return [];
  
  const chunks = await prisma.chunk.findMany({
    include: {
      document: true
    }
  });
  
  const scoredChunks = chunks?.map(chunk => {
    let embedding: number[] = [];
    try {
      embedding = JSON.parse(chunk?.embedding ?? '[]');
    } catch {
      embedding = [];
    }
    const score = cosineSimilarity(queryEmbedding, embedding);
    return {
      content: chunk?.content ?? '',
      documentName: chunk?.document?.name ?? 'Unknown',
      pageNumber: chunk?.pageNumber ?? 0,
      score
    };
  }) ?? [];
  
  scoredChunks.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  return scoredChunks.slice(0, topK);
}

export function buildRAGPrompt(query: string, chunks: RetrievalResult[]): string {
  const context = chunks?.map((c, i) => 
    `[Source ${i + 1}: ${c?.documentName ?? 'Unknown'}, Page ${c?.pageNumber ?? 0}]\n${c?.content ?? ''}`
  )?.join('\n\n---\n\n') ?? '';
  
  return `Je bent een startup coach assistent. Beantwoord de vraag gebaseerd op de gegeven context uit documenten over een Nederlands waterschapsproject platform.\n\nIMPORTANT: Always cite your sources using the format [Source X] when referencing information from the documents.\n\nContext:\n${context}\n\n---\n\nVraag: ${query}\n\nGeef een duidelijk en behulpzaam antwoord in het Nederlands, met bronverwijzingen waar relevant.`;
}
