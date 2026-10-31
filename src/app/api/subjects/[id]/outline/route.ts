import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { parseDocumentFile } from '@/lib/document-parser';
import { parseCourseOutlineText, computeSubjectCoverage } from '@/lib/outline-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const outline = await prisma.courseOutline.findFirst({
      where: { subjectId: params.id, isActive: true },
      include: {
        units: {
          orderBy: { unitNumber: 'asc' },
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' },
              include: {
                studyMaterial: {
                  select: { id: true, status: true, version: true, updatedAt: true },
                },
                _count: {
                  select: { bookmarks: true, highlights: true, questions: true },
                },
              },
            },
          },
        },
      },
    });

    if (!outline) {
      return NextResponse.json({ outline: null });
    }

    // Compute aggregate coverage statistics
    let fully = 0;
    let partial = 0;
    let missing = 0;
    let generatedCount = 0;

    outline.units.forEach((u) => {
      u.topics.forEach((t) => {
        if (t.coverageStatus === 'FULLY_COVERED') fully++;
        else if (t.coverageStatus === 'PARTIALLY_COVERED') partial++;
        else missing++;

        if (t.studyMaterial) generatedCount++;
      });
    });

    const totalTopics = fully + partial + missing;
    const coveragePercentage =
      totalTopics > 0 ? Math.round(((fully + partial * 0.5) / totalTopics) * 100) : 0;

    return NextResponse.json({
      outline,
      stats: {
        totalTopics,
        fullyCovered: fully,
        partiallyCovered: partial,
        missing,
        coveragePercentage,
        generatedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching course outline:', error);
    return NextResponse.json({ error: 'Failed to fetch outline' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No course outline file provided' }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
    });
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const originalFilename = file.name;
    const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
    const allowed = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt'];

    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: 'Invalid file format. Upload PDF, DOCX, PPTX, or TXT.' },
        { status: 400 }
      );
    }

    // Save syllabus file
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, `outline-${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    await fs.writeFile(filePath, buffer);

    // Parse document text
    const parsed = await parseDocumentFile(filePath, originalFilename);

    // Extract syllabus hierarchy
    const outlineData = await parseCourseOutlineText(parsed.text, originalFilename);

    // Deactivate existing outlines for this subject
    await prisma.courseOutline.updateMany({
      where: { subjectId: params.id },
      data: { isActive: false },
    });

    // Create new Course Outline
    const newOutline = await prisma.courseOutline.create({
      data: {
        subjectId: params.id,
        title: outlineData.subjectName || subject.name,
        fileName: originalFilename,
        fileType: ext,
        filePath,
        rawText: parsed.text,
        status: 'PARSED',
        learningObjectives: JSON.stringify(outlineData.learningObjectives),
        expectedOutcomes: JSON.stringify(outlineData.expectedOutcomes),
        isActive: true,
      },
    });

    // Insert Units and Topics
    for (let uIdx = 0; uIdx < outlineData.units.length; uIdx++) {
      const u = outlineData.units[uIdx];
      const unit = await prisma.outlineUnit.create({
        data: {
          outlineId: newOutline.id,
          unitNumber: u.unitNumber || uIdx + 1,
          title: u.title,
          description: u.description || null,
          orderIndex: uIdx,
        },
      });

      for (let tIdx = 0; tIdx < u.topics.length; tIdx++) {
        const t = u.topics[tIdx];
        await prisma.outlineTopic.create({
          data: {
            unitId: unit.id,
            orderIndex: tIdx,
            title: t.title,
            subtopics: JSON.stringify(t.subtopics || []),
            learningObjective: t.learningObjective || null,
            coverageStatus: 'MISSING',
          },
        });
      }
    }

    // Immediately compute initial coverage against existing subject documents
    const coverageResult = await computeSubjectCoverage(params.id, newOutline.id);

    await prisma.activityLog.create({
      data: {
        subjectId: params.id,
        type: 'UPLOAD',
        description: `Uploaded official course outline "${originalFilename}": extracted ${outlineData.units.length} units and ${coverageResult.totalTopics} topics.`,
      },
    });

    return NextResponse.json({
      success: true,
      outlineId: newOutline.id,
      coverageResult,
    });
  } catch (error) {
    console.error('Error uploading course outline:', error);
    return NextResponse.json({ error: 'Failed to process course outline' }, { status: 500 });
  }
}
