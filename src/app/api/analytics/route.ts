import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Overall counts
    const [totalSubjects, totalDocuments, totalFlashcards, quizSessions, recentActivities] =
      await Promise.all([
        prisma.subject.count(),
        prisma.document.count(),
        prisma.flashcard.count(),
        prisma.quizSession.findMany({
          orderBy: { completedAt: 'asc' },
          include: {
            subject: { select: { id: true, name: true, color: true } },
            document: { select: { id: true, title: true } },
          },
        }),
        prisma.activityLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            subject: { select: { name: true, color: true } },
          },
        }),
      ]);

    const completedQuizzesCount = quizSessions.length;
    const avgScore =
      completedQuizzesCount > 0
        ? Math.round(
            quizSessions.reduce((acc, q) => acc + q.scorePercentage, 0) / completedQuizzesCount
          )
        : 0;

    // 2. Score progression trend
    const scoreTrend = quizSessions.map((session) => ({
      id: session.id,
      title: session.title,
      score: Math.round(session.scorePercentage),
      date: new Date(session.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      subjectName: session.subject?.name || 'General',
    }));

    // 3. Subject-wise performance
    const subjects = await prisma.subject.findMany({
      include: {
        documents: { select: { id: true } },
        quizSessions: { select: { scorePercentage: true } },
      },
    });

    const subjectPerformance = subjects.map((sub) => {
      const qCount = sub.quizSessions.length;
      const subAvg =
        qCount > 0
          ? Math.round(sub.quizSessions.reduce((acc, q) => acc + q.scorePercentage, 0) / qCount)
          : 0;
      return {
        id: sub.id,
        name: sub.name,
        color: sub.color,
        documentsCount: sub.documents.length,
        quizzesCompleted: qCount,
        averageScore: subAvg,
      };
    });

    // 4. Identify Weak Topics from Quiz Answers
    const answers = await prisma.quizAnswer.findMany({
      include: {
        question: {
          include: {
            topic: { select: { id: true, title: true } },
            document: { select: { id: true, title: true, subjectId: true } },
          },
        },
      },
    });

    const topicStats: Record<
      string,
      {
        topicId: string;
        topicTitle: string;
        documentId: string;
        documentTitle: string;
        totalAnswers: number;
        correctAnswers: number;
      }
    > = {};

    for (const ans of answers) {
      const topic = ans.question.topic;
      const doc = ans.question.document;
      const topicKey = topic?.id || ans.question.documentId;
      const topicTitle = topic?.title || 'General Concepts';

      if (!topicStats[topicKey]) {
        topicStats[topicKey] = {
          topicId: topic?.id || '',
          topicTitle,
          documentId: doc?.id || '',
          documentTitle: doc?.title || 'Document',
          totalAnswers: 0,
          correctAnswers: 0,
        };
      }

      topicStats[topicKey].totalAnswers += 1;
      if (ans.isCorrect) {
        topicStats[topicKey].correctAnswers += 1;
      }
    }

    const weakTopics = Object.values(topicStats)
      .map((t) => {
        const accuracy = Math.round((t.correctAnswers / t.totalAnswers) * 100);
        return {
          ...t,
          accuracy,
        };
      })
      .filter((t) => t.accuracy < 70) // Flag topics under 70% accuracy
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalSubjects,
        totalDocuments,
        totalFlashcards,
        completedQuizzesCount,
        averageScore: avgScore,
      },
      scoreTrend,
      subjectPerformance,
      weakTopics,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
