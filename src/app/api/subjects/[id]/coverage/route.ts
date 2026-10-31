import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeSubjectCoverage } from '@/lib/outline-service';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const outline = await prisma.courseOutline.findFirst({
      where: { subjectId: params.id, isActive: true },
    });

    if (!outline) {
      return NextResponse.json({ error: 'No active course outline found' }, { status: 404 });
    }

    const coverageResult = await computeSubjectCoverage(params.id, outline.id);

    return NextResponse.json({
      success: true,
      coverage: coverageResult,
    });
  } catch (error) {
    console.error('Error recomputing coverage:', error);
    return NextResponse.json({ error: 'Failed to recompute coverage' }, { status: 500 });
  }
}
