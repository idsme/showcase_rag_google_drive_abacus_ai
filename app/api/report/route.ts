import { NextRequest } from 'next/server';
import { retrieveRelevantChunks, RetrievalResult } from '@/lib/rag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { questions } = await request.json();
    
    if (!questions?.length) {
      return new Response(JSON.stringify({ error: 'Questions are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Combine all questions for retrieval
    const combinedQuery = questions.join(' ');
    
    // Get more chunks for report
    const relevantChunks = await retrieveRelevantChunks(combinedQuery, 10);
    
    const context = relevantChunks?.map((c: RetrievalResult, i: number) => 
      `[Bron ${i + 1}: ${c?.documentName ?? 'Unknown'}, Pagina ${c?.pageNumber ?? 0}]\n${c?.content ?? ''}`
    )?.join('\n\n---\n\n') ?? '';
    
    const questionsFormatted = questions?.map((q: string, i: number) => `${i + 1}. ${q}`)?.join('\n') ?? '';
    
    const prompt = `Je bent een ervaren startup coach en solution architect. Genereer een uitgebreid rapport gebaseerd op de volgende vragen en de gegeven context uit documenten over een Nederlands waterschapsproject platform.

Vragen om te beantwoorden:
${questionsFormatted}

Context uit documenten:
${context}

---

Genereer een gestructureerd rapport met de volgende kenmerken:
1. Beantwoord elke vraag in een aparte sectie met een duidelijke koptekst
2. Gebruik bronverwijzingen in het format [Bron X] waar relevant
3. Geef concrete en actionable inzichten
4. Schrijf in professioneel Nederlands
5. Eindig met een korte samenvatting en aanbevelingen

Begin het rapport:`;
    
    // Stream response from LLM
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 8000
      })
    });
    
    const citations = relevantChunks?.map((c: RetrievalResult, i: number) => ({
      sourceNumber: i + 1,
      documentName: c?.documentName ?? 'Unknown',
      pageNumber: c?.pageNumber ?? 0,
      snippet: (c?.content ?? '').slice(0, 150) + '...'
    })) ?? [];
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        // Send citations first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`));
        
        try {
          let partialRead = '';
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed?.choices?.[0]?.delta?.content ?? '';
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
                  }
                } catch {}
              }
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('Report error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
