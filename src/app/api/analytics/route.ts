import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Overall counts
    const [
      totalSubjects,
      totalDocuments,
      totalFlashcards,
      quizSessions,
      recentActivities,
      recentDocuments,
      recentNotes,
      topicsCount,
    ] = await Promise.all([
      prisma.subject.count(),
      prisma.document.count(),
      prisma.flashcard.count(),
      prisma.quizSession.findMany({
        orderBy: { completedAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true, color: true } },
          document: { select: { id: true, title: true } },
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          subject: { select: { name: true, color: true } },
        },
      }),
      prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.note.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          document: { select: { id: true, title: true, subjectId: true } },
        },
      }),
      prisma.topic.count(),
    ]);

    const completedQuizzesCount = quizSessions.length;
    const avgScore =
      completedQuizzesCount > 0
        ? Math.round(
            quizSessions.reduce((acc, q) => acc + q.scorePercentage, 0) / completedQuizzesCount
          )
        : 0;

    // Total Study Sessions = completed quizzes + documents processed
    const totalStudySessions = completedQuizzesCount + totalDocuments;

    // 2. Score progression trend (chronological order)
    const scoreTrend = [...quizSessions]
      .reverse()
      .map((session) => ({
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
        documents: {
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        },
        quizSessions: {
          select: { id: true, scorePercentage: true, completedAt: true, timeSpentSeconds: true },
          orderBy: { completedAt: 'desc' },
        },
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
        description: sub.description,
        documentsCount: sub.documents.length,
        quizzesCompleted: qCount,
        averageScore: subAvg,
        latestDocument: sub.documents[0]?.title || null,
        lastActivity: sub.quizSessions[0]?.completedAt || sub.documents[0]?.updatedAt || null,
      };
    });

    // 4. Continue Learning (Subjects sorted by most recent activity)
    const continueLearning = [...subjectPerformance]
      .filter((s) => s.documentsCount > 0 || s.quizzesCompleted > 0)
      .sort((a, b) => {
        const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 4);

    // 5. Identify Weak Topics from Quiz Answers ("What Should I Study Next?")
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
        subjectId: string;
        documentId: string;
        documentTitle: string;
        totalAnswers: number;
        correctAnswers: number;
      }
    > = {};

    for (const ans of answers) {
      const topic = ans.question.topic;
      const doc = ans.question.document;
      const topicKey = topic?.id || ans.question.documentId || 'general';
      const topicTitle = topic?.title || doc?.title || 'Core Concepts';

      if (!topicStats[topicKey]) {
        topicStats[topicKey] = {
          topicId: topic?.id || '',
          topicTitle,
          subjectId: doc?.subjectId || '',
          documentId: doc?.id || '',
          documentTitle: doc?.title || 'Uploaded Document',
          totalAnswers: 0,
          correctAnswers: 0,
        };
      }

      topicStats[topicKey].totalAnswers += 1;
      if (ans.isCorrect) {
        topicStats[topicKey].correctAnswers += 1;
      }
    }

    let weakTopics = Object.values(topicStats)
      .map((t) => {
        const accuracy = Math.round((t.correctAnswers / t.totalAnswers) * 100);
        return {
          ...t,
          accuracy,
          reason:
            accuracy < 60
              ? `High error rate (${accuracy}% accuracy) in recent quizzes`
              : `Needs reinforcement (${accuracy}% accuracy)`,
        };
      })
      .filter((t) => t.accuracy < 75)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 4);

    // If no weak topics identified yet from answers, recommend topics from available subjects
    if (weakTopics.length === 0 && subjects.length > 0) {
      weakTopics = subjects
        .filter((s) => s.documents.length > 0)
        .slice(0, 3)
        .map((s) => ({
          topicId: s.documents[0]?.id || '',
          topicTitle: s.documents[0]?.title || s.name,
          subjectId: s.id,
          documentId: s.documents[0]?.id || '',
          documentTitle: s.documents[0]?.title || s.name,
          totalAnswers: 0,
          correctAnswers: 0,
          accuracy: 0,
          reason: 'Recommended for initial practice and mastery',
        }));
    }

    // 6. Weekly Learning Activity (Last 7 days, actual recorded session minutes & quizzes)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weeklyData: Record<string, { day: string; minutes: number; quizzes: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const dayLabel = daysOfWeek[d.getDay()];
      weeklyData[dayKey] = { day: dayLabel, minutes: 0, quizzes: 0 };
    }

    for (const qs of quizSessions) {
      const qsDate = new Date(qs.completedAt).toISOString().split('T')[0];
      if (weeklyData[qsDate]) {
        weeklyData[qsDate].quizzes += 1;
        weeklyData[qsDate].minutes += Math.max(1, Math.round(qs.timeSpentSeconds / 60));
      }
    }

    const weeklyProgress = Object.values(weeklyData);

    return NextResponse.json({
      summary: {
        totalSubjects,
        totalDocuments,
        totalFlashcards,
        completedQuizzesCount,
        averageScore: avgScore,
        totalStudySessions,
        topicsCompleted: topicsCount,
      },
      continueLearning,
      recommendations: weakTopics,
      weeklyProgress,
      scoreTrend,
      subjectPerformance,
      recentActivities,
      recentDocuments: recentDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        subjectName: d.subject?.name,
        subjectColor: d.subject?.color,
        createdAt: d.createdAt,
      })),
      recentNotes: recentNotes.map((n) => ({
        id: n.id,
        title: n.title,
        documentTitle: n.document?.title,
        createdAt: n.createdAt,
      })),
      recentQuizzes: quizSessions.slice(0, 5).map((q) => ({
        id: q.id,
        title: q.title,
        scorePercentage: q.scorePercentage,
        subjectName: q.subject?.name,
        completedAt: q.completedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
