import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLearningMaterialFromDocument, isNonAcademicItem } from '@/lib/ai-service';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.rawText) {
      return NextResponse.json({ error: 'No extracted text found in document' }, { status: 400 });
    }

    // Set processing
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'PROCESSING' },
    });

    // Re-run AI Learning Engine
    const learningMaterial = await generateLearningMaterialFromDocument(
      document.title,
      document.rawText
    );

    // Replace previous AI artifacts
    await prisma.$transaction(async (tx) => {
      // Delete old generated artifacts
      await tx.concept.deleteMany({ where: { documentId: document.id } });
      await tx.note.deleteMany({ where: { documentId: document.id } });
      await tx.flashcard.deleteMany({ where: { documentId: document.id } });
      await tx.question.deleteMany({ where: { documentId: document.id } });
      await tx.topic.deleteMany({ where: { documentId: document.id } });

      // Insert Topics (filter non-academic items like teacher names, roadmaps)
      const validTopics = learningMaterial.topics.filter((t) => !isNonAcademicItem(t.title));
      const createdTopics: Array<{ id: string }> = [];
      for (let i = 0; i < validTopics.length; i++) {
        const t = validTopics[i];
        const topic = await tx.topic.create({
          data: {
            documentId: document.id,
            title: t.title,
            summary: t.summary,
            orderIndex: i,
          },
        });
        createdTopics.push(topic);
      }

      // Concepts
      for (const c of learningMaterial.concepts) {
        const topicId =
          c.topicIndex !== undefined && createdTopics[c.topicIndex]
            ? createdTopics[c.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.concept.create({
          data: {
            documentId: document.id,
            topicId,
            term: c.term,
            definition: c.definition,
            importance: c.importance || 'Medium',
          },
        });
      }

      // Notes
      for (const n of learningMaterial.notes) {
        const topicId =
          n.topicIndex !== undefined && createdTopics[n.topicIndex]
            ? createdTopics[n.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.note.create({
          data: {
            documentId: document.id,
            topicId,
            title: n.title,
            markdownContent: n.markdownContent,
          },
        });
      }

      // Flashcards
      for (const f of learningMaterial.flashcards) {
        const topicId =
          f.topicIndex !== undefined && createdTopics[f.topicIndex]
            ? createdTopics[f.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.flashcard.create({
          data: {
            documentId: document.id,
            topicId,
            front: f.front,
            back: f.back,
            difficulty: f.difficulty || 'Medium',
          },
        });
      }

      // Questions
      for (const q of learningMaterial.questions) {
        const topicId =
          q.topicIndex !== undefined && createdTopics[q.topicIndex]
            ? createdTopics[q.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.question.create({
          data: {
            documentId: document.id,
            topicId,
            type: q.type || 'mcq',
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || 'Medium',
          },
        });
      }

      // Finalize document status
      await tx.document.update({
        where: { id: document.id },
        data: {
          status: 'READY',
          summary: learningMaterial.summary,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          subjectId: document.subjectId,
          type: 'UPLOAD',
          description: `Regenerated learning pack for "${document.title}".`,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Learning pack regenerated successfully' });
  } catch (error) {
    console.error('Error regenerating material:', error);
    await prisma.document.update({
      where: { id: params.id },
      data: { status: 'FAILED' },
    });
    return NextResponse.json({ error: 'Failed to regenerate material' }, { status: 500 });
  }
}
