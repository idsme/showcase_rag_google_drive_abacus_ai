import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getEmbedding } from '@/lib/rag';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function extractTextFromPDF(filePath: string): Promise<{ text: string; pages: { page: number; text: string }[] }> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const fileName = path.basename(filePath);
  
  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'file', file: { filename: fileName, file_data: `data:application/pdf;base64,${base64}` } },
          { type: 'text', text: 'Extract ALL text from this PDF document. For each page, format it as: [PAGE X]\n<text content>\n\nExtract everything - all paragraphs, tables, headers, bullet points. Return the complete text content.' }
        ]
      }],
      max_tokens: 16000
    })
  });
  
  const data = await response.json();
  const fullText = data?.choices?.[0]?.message?.content ?? '';
  
  // Parse pages from extracted text
  const pages: { page: number; text: string }[] = [];
  const pageRegex = /\[PAGE\s*(\d+)\]/gi;
  const parts = fullText.split(pageRegex);
  
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      const pageNum = parseInt(parts[i] ?? '1', 10);
      const pageText = parts[i + 1]?.trim() ?? '';
      if (pageText) {
        pages.push({ page: pageNum, text: pageText });
      }
    }
  }
  
  if (pages.length === 0) {
    pages.push({ page: 1, text: fullText });
  }
  
  return { text: fullText, pages };
}

async function extractTextFromDOCX(filePath: string): Promise<{ text: string; pages: { page: number; text: string }[] }> {
  const mammoth = await import('mammoth');
  const fileBuffer = fs.readFileSync(filePath);
  
  let result;
  try {
    result = await mammoth.extractRawText({ buffer: fileBuffer });
  } catch {
    result = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) });
  }
  
  const fullText = result?.value ?? '';
  
  // Split into chunks (simulating pages for DOCX)
  const chunkSize = 2000;
  const pages: { page: number; text: string }[] = [];
  let pageNum = 1;
  
  for (let i = 0; i < fullText.length; i += chunkSize) {
    const chunk = fullText.slice(i, i + chunkSize);
    if (chunk?.trim()) {
      pages.push({ page: pageNum, text: chunk });
      pageNum++;
    }
  }
  
  if (pages.length === 0 && fullText?.trim()) {
    pages.push({ page: 1, text: fullText });
  }
  
  return { text: fullText, pages };
}

function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text?.split(/(?<=[.!?])\s+/) ?? [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk.length + (sentence?.length ?? 0)) > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence ?? '';
    } else {
      currentChunk += (currentChunk ? ' ' : '') + (sentence ?? '');
    }
  }
  
  if (currentChunk?.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const { documentPath } = await request.json();
    
    if (!documentPath) {
      return NextResponse.json({ error: 'Document path is required' }, { status: 400 });
    }
    
    const fileName = path.basename(documentPath);
    const fileExt = path.extname(documentPath).toLowerCase();
    
    // Check if already ingested
    const existing = await prisma.document.findUnique({
      where: { path: documentPath }
    });
    
    if (existing) {
      return NextResponse.json({ message: 'Document already ingested', documentId: existing.id });
    }
    
    // Extract text based on file type
    let extracted: { text: string; pages: { page: number; text: string }[] };
    
    if (fileExt === '.pdf') {
      extracted = await extractTextFromPDF(documentPath);
    } else if (fileExt === '.docx') {
      extracted = await extractTextFromDOCX(documentPath);
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        name: fileName,
        path: documentPath,
        fileType: fileExt
      }
    });
    
    // Process each page and create chunks with embeddings
    for (const pageData of extracted?.pages ?? []) {
      const pageChunks = chunkText(pageData?.text ?? '', 1000);
      
      for (const chunkText of pageChunks) {
        if (!chunkText?.trim()) continue;
        
        const embedding = await getEmbedding(chunkText);
        
        await prisma.chunk.create({
          data: {
            documentId: document.id,
            pageNumber: pageData?.page ?? 1,
            content: chunkText,
            embedding: JSON.stringify(embedding)
          }
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      documentId: document.id,
      chunksCreated: extracted?.pages?.length ?? 0
    });
    
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: 'Failed to ingest document' }, { status: 500 });
  }
}
