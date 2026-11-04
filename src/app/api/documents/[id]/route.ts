import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          select: { id: true, name: true, color: true, icon: true },
        },
        topics: {
          orderBy: { orderIndex: 'asc' },
          include: {
            concepts: true,
            notes: true,
            flashcards: true,
            questions: true,
          },
        },
        concepts: {
          orderBy: { createdAt: 'asc' },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
        },
        flashcards: {
          orderBy: { createdAt: 'asc' },
        },
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: { title: title.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      select: { filePath: true, title: true, subjectId: true },
    });

    if (doc) {
      // Clean up file from disk
      try {
        await fs.unlink(doc.filePath);
      } catch (err) {
        console.warn('Could not remove file from disk:', err);
      }

      await prisma.document.delete({
        where: { id: params.id },
      });

      await prisma.activityLog.create({
        data: {
          subjectId: doc.subjectId,
          type: 'UPLOAD',
          description: `Deleted document: "${doc.title}"`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
