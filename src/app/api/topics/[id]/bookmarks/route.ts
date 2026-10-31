import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.studyBookmark.findFirst({
      where: { topicId: params.id },
    });

    if (existing) {
      await prisma.studyBookmark.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ bookmarked: false });
    }

    const bookmark = await prisma.studyBookmark.create({
      data: {
        topicId: params.id,
      },
    });

    return NextResponse.json({ bookmarked: true, bookmark });
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}
