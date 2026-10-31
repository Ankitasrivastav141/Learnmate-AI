import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTopicStudyMaterial } from '@/lib/study-generator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const topic = await prisma.outlineTopic.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          select: { unitNumber: true, title: true },
        },
        studyMaterial: true,
        bookmarks: true,
        highlights: true,
        questions: true,
      },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error fetching topic study material:', error);
    return NextResponse.json({ error: 'Failed to fetch study material' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const mode = (body.mode || 'standard') as 'standard' | 'expand' | 'simplify' | 'add_examples';

    const content = await generateTopicStudyMaterial(params.id, mode);

    const updatedMaterial = await prisma.comprehensiveTopicStudyMaterial.upsert({
      where: { topicId: params.id },
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
        topicId: params.id,
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

    return NextResponse.json({
      success: true,
      material: updatedMaterial,
    });
  } catch (error) {
    console.error('Error modifying topic study material:', error);
    return NextResponse.json({ error: 'Failed to update study material' }, { status: 500 });
  }
}
