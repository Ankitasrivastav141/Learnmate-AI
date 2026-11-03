import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        documents: {
          select: { id: true, status: true, pageCount: true },
        },
        quizSessions: {
          select: { scorePercentage: true, totalQuestions: true },
        },
      },
    });

    const enrichedSubjects = subjects.map((sub) => {
      const totalDocs = sub.documents.length;
      const completedQuizzes = sub.quizSessions.length;
      const avgScore =
        completedQuizzes > 0
          ? Math.round(
              sub.quizSessions.reduce((acc, q) => acc + q.scorePercentage, 0) / completedQuizzes
            )
          : null;

      return {
        id: sub.id,
        name: sub.name,
        description: sub.description,
        color: sub.color,
        icon: sub.icon,
        documentCount: totalDocs,
        quizCount: completedQuizzes,
        averageScore: avgScore,
        createdAt: sub.createdAt,
      };
    });

    return NextResponse.json(enrichedSubjects);
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subjects',
        details: error?.message || String(error),
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, color, icon } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        icon: icon || 'BookOpen',
      },
    });

    await prisma.activityLog.create({
      data: {
        subjectId: subject.id,
        type: 'SUBJECT_CREATED',
        description: `Created new subject: "${subject.name}"`,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
