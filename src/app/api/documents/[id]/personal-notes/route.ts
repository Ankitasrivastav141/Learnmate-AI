import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    let personalNote = await prisma.personalNote.findFirst({
      where: { documentId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!personalNote) {
      // Find document to get subjectId
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { subjectId: true },
      });

      personalNote = await prisma.personalNote.create({
        data: {
          documentId,
          subjectId: doc?.subjectId || null,
          title: 'My Notes',
          content: '',
        },
      });
    }

    return NextResponse.json(personalNote);
  } catch (error) {
    console.error('Error fetching personal note:', error);
    return NextResponse.json({ error: 'Failed to fetch personal note' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const body = await req.json();
    const { content, title } = body;

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { subjectId: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const existing = await prisma.personalNote.findFirst({
      where: { documentId },
    });

    let savedNote;
    if (existing) {
      savedNote = await prisma.personalNote.update({
        where: { id: existing.id },
        data: {
          content: typeof content === 'string' ? content : '',
          title: title || existing.title || 'My Notes',
          subjectId: doc.subjectId,
          updatedAt: new Date(),
        },
      });
    } else {
      savedNote = await prisma.personalNote.create({
        data: {
          documentId,
          subjectId: doc.subjectId,
          title: title || 'My Notes',
          content: typeof content === 'string' ? content : '',
        },
      });
    }

    return NextResponse.json(savedNote);
  } catch (error) {
    console.error('Error saving personal note:', error);
    return NextResponse.json({ error: 'Failed to save personal note' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    await prisma.personalNote.deleteMany({
      where: { documentId },
    });
    return NextResponse.json({ success: true, message: 'Personal note deleted successfully' });
  } catch (error) {
    console.error('Error deleting personal note:', error);
    return NextResponse.json({ error: 'Failed to delete personal note' }, { status: 500 });
  }
}
