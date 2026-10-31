import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { answers, timeSpentSeconds = 0 } = body as {
      answers: Record<string, string>; // questionId -> selectedOption
      timeSpentSeconds: number;
    };

    const session = await prisma.quizSession.findUnique({
      where: { id: params.id },
      include: { subject: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Quiz session not found' }, { status: 404 });
    }

    const questionIds = Object.keys(answers);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: {
        topic: { select: { title: true } },
      },
    });

    let correctCount = 0;
    const answerRecords: Array<{
      questionId: string;
      questionText: string;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
      topic: string;
    }> = [];

    // Evaluate each question
    for (const q of questions) {
      const selected = answers[q.id] || '';
      const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        correctCount++;
      }

      answerRecords.push({
        questionId: q.id,
        questionText: q.questionText,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic?.title || 'General',
      });

      // Save individual answer record
      await prisma.quizAnswer.create({
        data: {
          quizSessionId: session.id,
          questionId: q.id,
          selectedAnswer: selected,
          isCorrect,
        },
      });
    }

    const total = questions.length;
    const scorePercentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Update session record
    const updatedSession = await prisma.quizSession.update({
      where: { id: session.id },
      data: {
        totalQuestions: total,
        correctAnswers: correctCount,
        scorePercentage,
        timeSpentSeconds,
        completedAt: new Date(),
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        subjectId: session.subjectId,
        type: 'QUIZ_COMPLETED',
        description: `Completed "${session.title}" with a score of ${scorePercentage}% (${correctCount}/${total}).`,
      },
    });

    return NextResponse.json({
      session: updatedSession,
      score: {
        correct: correctCount,
        total,
        percentage: scorePercentage,
        timeSpentSeconds,
      },
      results: answerRecords,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
