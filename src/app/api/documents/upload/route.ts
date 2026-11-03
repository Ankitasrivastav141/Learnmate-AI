import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { prisma } from '@/lib/prisma';
import { parseDocumentFile } from '@/lib/document-parser';
import { generateLearningMaterialFromDocument } from '@/lib/ai-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const subjectId = formData.get('subjectId') as string | null;
    const customTitle = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    // Verify subject exists or gracefully auto-recover
    let subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          id: subjectId,
          name: 'Micro',
          description: 'Microeconomics Course Workspace',
          color: '#652D3D',
          icon: 'BookOpen',
        },
      });
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

    // Use writable OS temp directory (works everywhere including Vercel /tmp)
    const uploadsDir = path.join(os.tmpdir(), 'learnmate-uploads');
    let filePath = path.join(uploadsDir, uniqueFileName);
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(filePath, buffer);
    } catch (fsErr) {
      console.warn('Non-fatal: could not persist copy to temp disk, processing from memory buffer:', fsErr);
      filePath = `memory://${uniqueFileName}`;
    }

    const docTitle = customTitle?.trim() || originalFilename.replace(/\.[^/.]+$/, '');

    // Create document record in PROCESSING state
    const document = await prisma.document.create({
      data: {
        subjectId,
        title: docTitle,
        fileName: originalFilename,
        fileType: ext,
        fileSize: buffer.length,
        filePath,
        rawText: '',
        status: 'PROCESSING',
      },
    });

    try {
      // 1. Extract text directly from buffer
      const parsed = await parseDocumentFile(buffer, originalFilename);

      if (!parsed.text || parsed.text.trim().length === 0) {
        throw new Error('Extracted text is empty. The document may be scanned, image-only, or encrypted.');
      }

      // 2. Generate learning material
      const learningMaterial = await generateLearningMaterialFromDocument(docTitle, parsed.text);

      // 3. Persist in database transaction
      await prisma.$transaction(async (tx) => {
        // Update document
        await tx.document.update({
          where: { id: document.id },
          data: {
            rawText: parsed.text,
            pageCount: parsed.pageCount,
            wordCount: parsed.wordCount,
            summary: learningMaterial.summary,
            status: 'READY',
          },
        });

        // Insert Resource Chunks for RAG and slide provenance
        if (parsed.chunks && parsed.chunks.length > 0) {
          for (const ch of parsed.chunks) {
            await tx.resourceChunk.create({
              data: {
                documentId: document.id,
                pageOrSlideNumber: ch.pageOrSlideNumber,
                sectionHeader: ch.sectionHeader,
                content: ch.content,
              },
            });
          }
        }

        // Insert Topics
        const createdTopics: Array<{ id: string }> = [];
        for (let i = 0; i < learningMaterial.topics.length; i++) {
          const t = learningMaterial.topics[i];
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

        // Insert Concepts
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

        // Insert Notes
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

        // Insert Flashcards
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

        // Insert Questions (MCQs)
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

        // Log Activity
        await tx.activityLog.create({
          data: {
            subjectId,
            type: 'UPLOAD',
            description: `Processed "${docTitle}": generated ${learningMaterial.notes.length} notes, ${learningMaterial.flashcards.length} flashcards, and ${learningMaterial.questions.length} quiz questions.`,
          },
        });
      });

      return NextResponse.json({
        id: document.id,
        title: docTitle,
        status: 'READY',
        message: 'Document successfully processed and learning material generated!',
      });
    } catch (processError) {
      console.error('Error during document processing pipeline:', processError);
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'FAILED',
          errorMessage: processError instanceof Error ? processError.message : String(processError),
        },
      });

      return NextResponse.json(
        {
          id: document.id,
          status: 'FAILED',
          error: processError instanceof Error ? processError.message : 'Processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json({
      error: error?.message || 'Server error processing upload',
      details: error?.stack || String(error),
    }, { status: 500 });
  }
}
