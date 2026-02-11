import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      include: {
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ documents: documents ?? [] });
  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json({ documents: [] });
  }
}
