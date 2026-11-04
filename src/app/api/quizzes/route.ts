import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLearningMaterialFromDocument } from '@/lib/ai-service';

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
    const { documentId, subjectId, questionCount = 10, difficulty = 'Mixed' } = body;

    // Filter questions
    const whereClause: {
      documentId?: string;
      document?: { subjectId?: string };
      difficulty?: string;
    } = {};

    if (documentId) {
      whereClause.documentId = documentId;
    } else if (subjectId) {
      whereClause.document = { subjectId };
    }

    if (difficulty && difficulty !== 'Mixed') {
      whereClause.difficulty = difficulty;
    }

    // Fetch questions
    let allQuestions = await prisma.question.findMany({
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

    // Fallback if specific difficulty has no questions, try without difficulty constraint
    if (allQuestions.length === 0 && difficulty !== 'Mixed') {
      const fallbackWhere = { ...whereClause };
      delete fallbackWhere.difficulty;
      allQuestions = await prisma.question.findMany({
        where: fallbackWhere,
        include: {
          document: {
            select: { id: true, title: true, subjectId: true },
          },
          topic: {
            select: { id: true, title: true },
          },
        },
      });
    }

    if (allQuestions.length === 0) {
      // Auto-generate questions on the fly if document or subject exists
      let targetDoc = null;
      if (documentId) {
        targetDoc = await prisma.document.findUnique({ where: { id: documentId } });
      } else if (subjectId) {
        targetDoc = await prisma.document.findFirst({
          where: { subjectId, rawText: { not: '' } },
        });
      } else {
        targetDoc = await prisma.document.findFirst({
          where: { rawText: { not: '' } },
        });
      }

      if (targetDoc && targetDoc.rawText) {
        try {
          const mat = await generateLearningMaterialFromDocument(targetDoc.title, targetDoc.rawText);
          if (mat.questions && mat.questions.length > 0) {
            for (const q of mat.questions) {
              await prisma.question.create({
                data: {
                  documentId: targetDoc.id,
                  type: q.type || 'mcq',
                  questionText: q.questionText,
                  options: JSON.stringify(q.options),
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                  difficulty: q.difficulty || 'Medium',
                },
              });
            }

            allQuestions = await prisma.question.findMany({
              where: { documentId: targetDoc.id },
              include: {
                document: { select: { id: true, title: true, subjectId: true } },
                topic: { select: { id: true, title: true } },
              },
            });
          }
        } catch (genErr) {
          console.warn('Failed to dynamically generate questions for quiz:', genErr);
        }
      }

      if (allQuestions.length === 0) {
        return NextResponse.json(
          { error: 'No study materials with questions found. Please upload a lecture presentation (PPTX/PDF) first!' },
          { status: 400 }
        );
      }
    }

    // Shuffle and pick up to questionCount
    const count = parseInt(String(questionCount), 10) || 10;
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

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

    // Client questions payload (without correctAnswer)
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
        documentTitle: q.document?.title || 'Course Material',
      };
    });

    return NextResponse.json({
      sessionId: session.id,
      title: session.title,
      totalQuestions: session.totalQuestions,
      questions: clientQuestions,
      difficulty,
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
  }
}
