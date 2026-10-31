import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await prisma.quizSession.findMany({
      orderBy: { completedAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        document: { select: { id: true, title: true } },
        _count: {
          select: { answers: true },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching quiz sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentId, subjectId, questionCount = 10 } = body;

    // Filter questions
    const whereClause: { documentId?: string; document?: { subjectId?: string } } = {};
    if (documentId) {
      whereClause.documentId = documentId;
    } else if (subjectId) {
      whereClause.document = { subjectId };
    }

    // Fetch questions
    const allQuestions = await prisma.question.findMany({
      where: whereClause,
      include: {
        document: {
          select: { id: true, title: true, subjectId: true },
        },
        topic: {
          select: { id: true, title: true },
        },
      },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available for this selection. Upload a document first!' },
        { status: 400 }
      );
    }

    // Shuffle and pick up to questionCount (standard 10)
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Determine target subject & document for session tracking
    const finalSubjectId = subjectId || selectedQuestions[0]?.document?.subjectId || null;
    const finalDocumentId = documentId || (selectedQuestions.every((q) => q.documentId === selectedQuestions[0].documentId) ? selectedQuestions[0].documentId : null);

    const docTitle = finalDocumentId
      ? (await prisma.document.findUnique({ where: { id: finalDocumentId }, select: { title: true } }))?.title
      : null;

    const session = await prisma.quizSession.create({
      data: {
        subjectId: finalSubjectId,
        documentId: finalDocumentId,
        title: docTitle ? `Practice Quiz: ${docTitle}` : 'Comprehensive Subject Quiz',
        totalQuestions: selectedQuestions.length,
        correctAnswers: 0,
        scorePercentage: 0,
        timeSpentSeconds: 0,
      },
    });

    // Strip out correctAnswer from client questions payload
    const clientQuestions = selectedQuestions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      return {
        id: q.id,
        questionText: q.questionText,
        options: parsedOptions,
        difficulty: q.difficulty,
        topic: q.topic?.title || 'General',
      };
    });

    return NextResponse.json({
      sessionId: session.id,
      title: session.title,
      totalQuestions: session.totalQuestions,
      questions: clientQuestions,
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
  }
}
