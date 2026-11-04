import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { prisma } from '../src/lib/prisma';
import { generateLearningMaterialFromDocument } from '../src/lib/ai-service';

async function main() {
  console.log('=== Ingesting Real MBA Course Materials ===');

  // 1. Ensure clean single 'Market Research' subject
  const mrSubjects = await prisma.subject.findMany({
    where: { name: { contains: 'Market Research' } },
  });

  let primaryMrSubject = mrSubjects[0];
  if (!primaryMrSubject) {
    primaryMrSubject = await prisma.subject.create({
      data: {
        name: 'Market Research',
        description: 'MBA Term 2: Research Design, Methodologies, Qualitative and Quantitative Analysis',
        color: '#2563EB',
        icon: 'BarChart2',
      },
    });
  } else {
    // If there are duplicate empty subjects, remove them
    for (const s of mrSubjects.slice(1)) {
      const docCount = await prisma.document.count({ where: { subjectId: s.id } });
      if (docCount === 0) {
        await prisma.subject.delete({ where: { id: s.id } });
        console.log(`Deleted empty duplicate subject: ${s.id}`);
      }
    }
  }

  console.log(`Using primary Market Research subject ID: ${primaryMrSubject.id}`);

  // List of files to process
  const filesToProcess = [
    {
      filePath: 'C:/Users/Ankita/Desktop/Term2/marketResearch/Research_Design_Blueprint.pdf',
      title: 'Research Design Blueprint',
      docId: 'cmw2it01y005e103p9mmu9gw9',
    },
    {
      filePath: 'C:/Users/Ankita/Desktop/Term2/marketResearch/Qualitative_Research_Design.pdf',
      title: 'Qualitative Research Design',
      docId: 'cmw2qualres001mktres2026x',
    },
    {
      filePath: 'C:/Users/Ankita/Desktop/Term2/marketResearch/Course Outline - Marketing Research - Oct2026 (1).pdf',
      title: 'Course Outline - Marketing Research',
      docId: 'cmw2mroutline001mktres2026x',
    },
  ];

  for (const item of filesToProcess) {
    if (!fs.existsSync(item.filePath)) {
      console.warn(`File not found: ${item.filePath}`);
      continue;
    }

    console.log(`\n--- Processing: ${item.title} ---`);
    const buffer = fs.readFileSync(item.filePath);
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;
    const pageCount = pdfData.numpages;
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const fileSize = buffer.length;

    console.log(`Extracted ${wordCount} words across ${pageCount} pages. Generating AI study pack with Gemini...`);

    const material = await generateLearningMaterialFromDocument(item.title, rawText);

    console.log(`Generated ${material.notes.length} notes, ${material.topics.length} topics, ${material.flashcards.length} flashcards, ${material.questions.length} questions.`);

    // Upsert document
    const doc = await prisma.document.upsert({
      where: { id: item.docId },
      update: {
        title: item.title,
        fileName: path.basename(item.filePath),
        filePath: item.filePath,
        fileType: 'pdf',
        fileSize,
        rawText,
        pageCount,
        wordCount,
        status: 'READY',
        subjectId: primaryMrSubject.id,
      },
      create: {
        id: item.docId,
        title: item.title,
        fileName: path.basename(item.filePath),
        filePath: item.filePath,
        fileType: 'pdf',
        fileSize,
        rawText,
        pageCount,
        wordCount,
        status: 'READY',
        subjectId: primaryMrSubject.id,
      },
    });

    // Clean old relational data
    await prisma.note.deleteMany({ where: { documentId: doc.id } });
    await prisma.flashcard.deleteMany({ where: { documentId: doc.id } });
    await prisma.question.deleteMany({ where: { documentId: doc.id } });
    await prisma.topic.deleteMany({ where: { documentId: doc.id } });

    // Insert Topics
    const topicRecords = [];
    for (const t of material.topics) {
      const createdTopic = await prisma.topic.create({
        data: {
          documentId: doc.id,
          title: t.title,
          summary: t.summary || null,
        },
      });
      topicRecords.push(createdTopic);
    }

    // Insert Notes
    for (const n of material.notes) {
      const topicId =
        n.topicIndex !== undefined && topicRecords[n.topicIndex]
          ? topicRecords[n.topicIndex].id
          : topicRecords[0]?.id || null;

      await prisma.note.create({
        data: {
          documentId: doc.id,
          topicId,
          title: n.title,
          markdownContent: n.markdownContent,
        },
      });
    }

    // Insert Flashcards
    for (const f of material.flashcards) {
      const topicId =
        f.topicIndex !== undefined && topicRecords[f.topicIndex]
          ? topicRecords[f.topicIndex].id
          : topicRecords[0]?.id || null;

      await prisma.flashcard.create({
        data: {
          documentId: doc.id,
          topicId,
          front: f.front,
          back: f.back,
          difficulty: f.difficulty || 'Medium',
        },
      });
    }

    // Insert Questions
    for (const q of material.questions) {
      const topicId =
        q.topicIndex !== undefined && topicRecords[q.topicIndex]
          ? topicRecords[q.topicIndex].id
          : topicRecords[0]?.id || null;

      await prisma.question.create({
        data: {
          documentId: doc.id,
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

    console.log(`Successfully saved ${item.title} to database!`);
  }

  console.log('\n=== Ingestion Completed Successfully! ===');
}

main()
  .catch((e) => {
    console.error('Fatal error during ingestion:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
