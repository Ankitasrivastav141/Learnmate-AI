import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { prisma } from '@/lib/prisma';
import { parseDocumentFile } from '@/lib/document-parser';
import { generateLearningMaterialFromDocument, isNonAcademicItem } from '@/lib/ai-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No replacement file provided' }, { status: 400 });
    }

    const originalFilename = file.name;
    const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
    const allowedExtensions = ['pptx', 'ppt', 'pdf', 'docx', 'doc', 'txt'];

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file format (.${ext}). Supported formats: PPTX, PDF, DOCX, TXT` },
        { status: 400 }
      );
    }

    // Process file in memory buffer
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);
    const uniqueFileName = `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const uploadsDir = path.join(os.tmpdir(), 'learnmate-uploads');
    let filePath = path.join(uploadsDir, uniqueFileName);
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(filePath, buffer);
    } catch {
      filePath = `memory://${uniqueFileName}`;
    }

    // Parse the new file
    const parsed = await parseDocumentFile(buffer, originalFilename);
    if (!parsed.text || parsed.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Extracted text is empty. The replacement document may be scanned or empty.' },
        { status: 400 }
      );
    }

    // Mark as PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // Generate new study material
    const learningMaterial = await generateLearningMaterialFromDocument(
      document.title,
      parsed.text
    );

    // Update in transaction: replace AI artifacts while maintaining subjectId, documentId, and personal notes!
    await prisma.$transaction(async (tx) => {
      // Clear outdated AI artifacts
      await tx.concept.deleteMany({ where: { documentId } });
      await tx.note.deleteMany({ where: { documentId } });
      await tx.flashcard.deleteMany({ where: { documentId } });
      await tx.question.deleteMany({ where: { documentId } });
      await tx.topic.deleteMany({ where: { documentId } });
      await tx.resourceChunk.deleteMany({ where: { documentId } });

      // Update Document record
      await tx.document.update({
        where: { id: documentId },
        data: {
          fileName: originalFilename,
          fileType: ext,
          fileSize: buffer.length,
          filePath,
          rawText: parsed.text,
          pageCount: parsed.pageCount,
          wordCount: parsed.wordCount,
          summary: learningMaterial.summary,
          status: 'READY',
          updatedAt: new Date(),
        },
      });

      // Insert Resource Chunks
      if (parsed.chunks && parsed.chunks.length > 0) {
        for (const ch of parsed.chunks) {
          await tx.resourceChunk.create({
            data: {
              documentId,
              pageOrSlideNumber: ch.pageOrSlideNumber,
              sectionHeader: ch.sectionHeader,
              content: ch.content,
            },
          });
        }
      }

      // Insert Topics (filtering non-academic items)
      const validTopics = learningMaterial.topics.filter((t) => !isNonAcademicItem(t.title));
      const createdTopics: Array<{ id: string }> = [];
      for (let i = 0; i < validTopics.length; i++) {
        const t = validTopics[i];
        const topic = await tx.topic.create({
          data: {
            documentId,
            title: t.title,
            summary: t.summary,
            orderIndex: i,
          },
        });
        createdTopics.push(topic);
      }

      // Insert Concepts
      for (const c of learningMaterial.concepts) {
        const topicId =
          c.topicIndex !== undefined && createdTopics[c.topicIndex]
            ? createdTopics[c.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.concept.create({
          data: {
            documentId,
            topicId,
            term: c.term,
            definition: c.definition,
            importance: c.importance || 'Medium',
          },
        });
      }

      // Insert Notes (ONE consolidated note)
      for (const n of learningMaterial.notes) {
        const topicId =
          n.topicIndex !== undefined && createdTopics[n.topicIndex]
            ? createdTopics[n.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.note.create({
          data: {
            documentId,
            topicId,
            title: n.title,
            markdownContent: n.markdownContent,
          },
        });
      }

      // Insert Flashcards
      for (const f of learningMaterial.flashcards) {
        const topicId =
          f.topicIndex !== undefined && createdTopics[f.topicIndex]
            ? createdTopics[f.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.flashcard.create({
          data: {
            documentId,
            topicId,
            front: f.front,
            back: f.back,
            difficulty: f.difficulty || 'Medium',
          },
        });
      }

      // Insert Questions
      for (const q of learningMaterial.questions) {
        const topicId =
          q.topicIndex !== undefined && createdTopics[q.topicIndex]
            ? createdTopics[q.topicIndex].id
            : createdTopics[0]?.id || null;

        await tx.question.create({
          data: {
            documentId,
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

      // Record Activity
      await tx.activityLog.create({
        data: {
          subjectId: document.subjectId,
          type: 'UPLOAD',
          description: `Replaced study material with "${originalFilename}" and regenerated notes & quizzes.`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Document replaced successfully. New notes and quizzes have been generated.',
      documentId,
    });
  } catch (error: any) {
    console.error('Error replacing document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to replace document' },
      { status: 500 }
    );
  }
}
