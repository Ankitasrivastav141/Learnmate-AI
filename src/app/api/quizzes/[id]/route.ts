import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.quizSession.findUnique({
      where: { id: params.id },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        document: { select: { id: true, title: true } },
        answers: {
          include: {
            question: {
              include: {
                topic: { select: { id: true, title: true } },
                document: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Quiz session not found' }, { status: 404 });
    }

    const formattedAnswers = session.answers.map((ans) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(ans.question.options);
      } catch {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      return {
        id: ans.id,
        questionId: ans.questionId,
        questionText: ans.question.questionText,
        options: parsedOptions,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer: ans.question.correctAnswer,
        isCorrect: ans.isCorrect,
        explanation: ans.question.explanation,
        difficulty: ans.question.difficulty,
        topic: ans.question.topic?.title || 'General',
        documentTitle: ans.question.document?.title || session.document?.title || 'Course Material',
      };
    });

    return NextResponse.json({
      id: session.id,
      title: session.title,
      subjectId: session.subjectId,
      subjectName: session.subject?.name,
      documentId: session.documentId,
      documentTitle: session.document?.title,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      scorePercentage: session.scorePercentage,
      timeSpentSeconds: session.timeSpentSeconds,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
      answers: formattedAnswers,
    });
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz details' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete associated answers first
    await prisma.quizAnswer.deleteMany({
      where: { quizSessionId: params.id },
    });

    await prisma.quizSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz session:', error);
    return NextResponse.json({ error: 'Failed to delete quiz session' }, { status: 500 });
  }
}
