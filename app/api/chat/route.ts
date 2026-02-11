import { NextRequest } from 'next/server';
import { retrieveRelevantChunks, buildRAGPrompt, RetrievalResult } from '@/lib/rag';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(message, 5);
    
    // Build RAG prompt
    const prompt = buildRAGPrompt(message, relevantChunks);
    
    // Save user message
    await prisma.chatMessage.create({
      data: { role: 'user', content: message }
    });
    
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
        max_tokens: 4000
      })
    });
    
    const citations = relevantChunks?.map((c: RetrievalResult) => ({
      documentName: c?.documentName ?? 'Unknown',
      pageNumber: c?.pageNumber ?? 0,
      snippet: (c?.content ?? '').slice(0, 100) + '...'
    })) ?? [];
    
    let fullResponse = '';
    
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
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
                  }
                } catch {}
              }
            }
          }
          
          // Save assistant response
          await prisma.chatMessage.create({
            data: { 
              role: 'assistant', 
              content: fullResponse,
              citations: JSON.stringify(citations)
            }
          });
          
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
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
