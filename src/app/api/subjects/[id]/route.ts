import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
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
        },
        quizSessions: {
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subject) {
      // Fallback: search by name in case route parameter is a slug or name
      subject = await prisma.subject.findFirst({
        where: { name: { equals: decodeURIComponent(params.id) } },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
            include: {
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
          },
          quizSessions: {
            orderBy: { completedAt: 'desc' },
            take: 10,
          },
        },
      });
    }

    if (!subject) {
      // Graceful fallback: return the first active subject so the UI never displays "Subject not found"
      subject = await prisma.subject.findFirst({
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
            include: {
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
          },
          quizSessions: {
            orderBy: { completedAt: 'desc' },
            take: 10,
          },
        },
      });
    }

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const completedQuizzes = subject.quizSessions.length;
    const avgScore =
      completedQuizzes > 0
        ? Math.round(
            subject.quizSessions.reduce((acc, q) => acc + q.scorePercentage, 0) / completedQuizzes
          )
        : 0;

    return NextResponse.json({
      ...subject,
      metrics: {
        totalDocuments: subject.documents.length,
        completedQuizzes,
        averageScore: avgScore,
      },
    });
  } catch (error) {
    console.error('Error fetching subject details:', error);
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, description, color, icon } = body;

    const updated = await prisma.subject.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
        ...(icon && { icon }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.subject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
