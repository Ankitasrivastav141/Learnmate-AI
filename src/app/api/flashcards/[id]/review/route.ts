import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { remembered } = body as { remembered: boolean };

    const card = await prisma.flashcard.findUnique({
      where: { id: params.id },
    });

    if (!card) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    const updated = await prisma.flashcard.update({
      where: { id: params.id },
      data: {
        reviewCount: { increment: 1 },
        ...(remembered && { correctCount: { increment: 1 } }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating flashcard review:', error);
    return NextResponse.json({ error: 'Failed to update flashcard' }, { status: 500 });
  }
}
