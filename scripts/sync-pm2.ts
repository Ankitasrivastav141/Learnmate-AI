import { prisma } from '../src/lib/prisma';

async function main() {
  const good = await prisma.document.findUnique({
    where: { id: 'cmvv2qpjh006lwgez3bytr3k6' },
    include: { notes: true, topics: true, flashcards: true, questions: true },
  });
  if (!good) return;

  const badId = 'cmvw3viui0001e6if2hnv7qim';
  await prisma.note.deleteMany({ where: { documentId: badId } });
  await prisma.flashcard.deleteMany({ where: { documentId: badId } });
  await prisma.question.deleteMany({ where: { documentId: badId } });
  await prisma.topic.deleteMany({ where: { documentId: badId } });

  const topicMap = new Map();
  for (const t of good.topics) {
    const created = await prisma.topic.create({
      data: {
        documentId: badId,
        title: t.title,
        summary: t.summary,
      },
    });
    topicMap.set(t.id, created.id);
  }

  for (const n of good.notes) {
    await prisma.note.create({
      data: {
        documentId: badId,
        topicId: n.topicId ? topicMap.get(n.topicId) : null,
        title: n.title,
        markdownContent: n.markdownContent,
      },
    });
  }

  for (const f of good.flashcards) {
    await prisma.flashcard.create({
      data: {
        documentId: badId,
        topicId: f.topicId ? topicMap.get(f.topicId) : null,
        front: f.front,
        back: f.back,
        difficulty: f.difficulty,
      },
    });
  }

  for (const q of good.questions) {
    await prisma.question.create({
      data: {
        documentId: badId,
        topicId: q.topicId ? topicMap.get(q.topicId) : null,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      },
    });
  }
  console.log('Successfully replaced duplicate PM2-Databases notes!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
