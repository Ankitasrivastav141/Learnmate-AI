import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    const documents = await prisma.document.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: {
            topics: true,
            concepts: true,
            notes: true,
            flashcards: true,
            questions: true,
          },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
