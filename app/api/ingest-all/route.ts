import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Documents are stored in the data directory within the project
const DOCUMENTS_DIR = path.join(process.cwd(), 'data', 'documents');

export async function POST() {
  try {
    const files = fs.readdirSync(DOCUMENTS_DIR);
    const results: { file: string; status: string; error?: string }[] = [];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext !== '.pdf' && ext !== '.docx') continue;
      
      const filePath = path.join(DOCUMENTS_DIR, file);
      
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentPath: filePath })
        });
        
        const data = await response.json();
        results.push({ file, status: data?.success ? 'success' : (data?.message ?? 'skipped') });
      } catch (err) {
        results.push({ file, status: 'error', error: String(err) });
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Ingest all error:', error);
    return NextResponse.json({ error: 'Failed to ingest documents' }, { status: 500 });
  }
}
