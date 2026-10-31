import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTopicStudyMaterial } from '@/lib/study-generator';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const outline = await prisma.courseOutline.findFirst({
      where: { subjectId: params.id, isActive: true },
      include: {
        units: {
          include: {
            topics: {
              include: { studyMaterial: true },
            },
          },
        },
      },
    });

    if (!outline) {
      return NextResponse.json(
        { error: 'No active course outline found. Please upload a course outline first!' },
        { status: 400 }
      );
    }

    // Collect all topics that need generation
    const topicsToGenerate: Array<{ id: string; title: string }> = [];
    outline.units.forEach((u) => {
      u.topics.forEach((t) => {
        topicsToGenerate.push({ id: t.id, title: t.title });
      });
    });

    if (topicsToGenerate.length === 0) {
      return NextResponse.json({ error: 'No topics found in the course outline.' }, { status: 400 });
    }

    let generatedCount = 0;

    // Generate comprehensive study material for each topic
    for (const t of topicsToGenerate) {
      const content = await generateTopicStudyMaterial(t.id, 'standard');

      await prisma.comprehensiveTopicStudyMaterial.upsert({
        where: { topicId: t.id },
        update: {
          introduction: content.introduction,
          detailedExplanation: content.detailedExplanation,
          definitions: JSON.stringify(content.definitions),
          businessExamples: JSON.stringify(content.businessExamples),
          frameworksAndModels: JSON.stringify(content.frameworksAndModels),
          comparativeTables: content.comparativeTables,
          keyTakeaways: JSON.stringify(content.keyTakeaways),
          potentialQuestions: JSON.stringify(content.potentialQuestions),
          sourceReferences: JSON.stringify(content.sourceReferences),
          status: 'GENERATED',
          version: { increment: 1 },
        },
        create: {
          topicId: t.id,
          introduction: content.introduction,
          detailedExplanation: content.detailedExplanation,
          definitions: JSON.stringify(content.definitions),
          businessExamples: JSON.stringify(content.businessExamples),
          frameworksAndModels: JSON.stringify(content.frameworksAndModels),
          comparativeTables: content.comparativeTables,
          keyTakeaways: JSON.stringify(content.keyTakeaways),
          potentialQuestions: JSON.stringify(content.potentialQuestions),
          sourceReferences: JSON.stringify(content.sourceReferences),
          status: 'GENERATED',
          version: 1,
        },
      });

      generatedCount++;
    }

    await prisma.activityLog.create({
      data: {
        subjectId: params.id,
        type: 'STUDY_MATERIAL_GENERATED',
        description: `Synthesized comprehensive MBA-level study material across ${generatedCount} course outline topics.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synthesized study material for ${generatedCount} topics.`,
      generatedCount,
    });
  } catch (error) {
    console.error('Error generating study material:', error);
    return NextResponse.json({ error: 'Failed to generate study material' }, { status: 500 });
  }
}
