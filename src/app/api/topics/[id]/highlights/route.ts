import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const highlights = await prisma.studyHighlight.findMany({
      where: { topicId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(highlights);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { highlightedText, color = '#fef08a' } = body;

    if (!highlightedText || !highlightedText.trim()) {
      return NextResponse.json({ error: 'Highlighted text is required' }, { status: 400 });
    }

    const highlight = await prisma.studyHighlight.create({
      data: {
        topicId: params.id,
        highlightedText: highlightedText.trim(),
        color,
      },
    });

    return NextResponse.json(highlight);
  } catch (error) {
    console.error('Error saving highlight:', error);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}
