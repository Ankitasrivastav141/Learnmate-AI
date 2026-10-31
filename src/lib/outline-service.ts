import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

export interface ParsedOutlineData {
  subjectName: string;
  courseDescription: string;
  learningObjectives: string[];
  expectedOutcomes: string[];
  units: Array<{
    unitNumber: number;
    title: string;
    description: string;
    topics: Array<{
      title: string;
      subtopics: string[];
      learningObjective: string;
    }>;
  }>;
}

export async function parseCourseOutlineText(
  rawText: string,
  fileName: string
): Promise<ParsedOutlineData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const truncatedText = rawText.slice(0, 45000);
      const prompt = `
You are an expert university curriculum architect.
Analyze the following official course outline or syllabus text from "${fileName}".
Extract the official course structure into a clean, hierarchical JSON object.

Syllabus Text:
"""
${truncatedText}
"""

You MUST output ONLY a valid JSON object matching this exact structure:
{
  "subjectName": "Extracted Subject or Course Title",
  "courseDescription": "Brief 2-3 sentence overview of the course scope and relevance.",
  "learningObjectives": [
    "Understand the core strategic principles...",
    "Analyze real-world business frameworks..."
  ],
  "expectedOutcomes": [
    "Ability to formulate and evaluate...",
    "Proficiency in applying models..."
  ],
  "units": [
    {
      "unitNumber": 1,
      "title": "Unit 1: Title of Unit or Module",
      "description": "What this unit encompasses",
      "topics": [
        {
          "title": "Specific Topic Name",
          "subtopics": ["Subtopic A", "Subtopic B", "Subtopic C"],
          "learningObjective": "Specific competence or concept to be mastered"
        }
      ]
    }
  ]
}

REQUIREMENTS:
- Identify between 3 to 6 logical Units or Modules.
- Each unit must contain 2 to 6 specific topics.
- Break down each topic into concrete subtopics.
- Ensure all extracted information is accurately derived from the syllabus text.
`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text()) as ParsedOutlineData;
      if (parsed.units && parsed.units.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini syllabus parse failed, falling back to heuristic parser:', err);
    }
  }

  // Heuristic outline extraction fallback
  return parseOutlineHeuristically(rawText, fileName);
}

function parseOutlineHeuristically(rawText: string, fileName: string): ParsedOutlineData {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Identify unit or chapter lines
  const unitRegex = /^(unit|module|chapter|part|section)\s*(\d+|[IVXLCDM]+)[\s:.-]+(.*)$/i;
  const discoveredUnits: Array<{
    unitNumber: number;
    title: string;
    description: string;
    topics: Array<{ title: string; subtopics: string[]; learningObjective: string }>;
  }> = [];

  let currentUnit: {
    unitNumber: number;
    title: string;
    description: string;
    topics: Array<{ title: string; subtopics: string[]; learningObjective: string }>;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(unitRegex);

    if (match) {
      if (currentUnit && currentUnit.topics.length > 0) {
        discoveredUnits.push(currentUnit);
      }
      currentUnit = {
        unitNumber: discoveredUnits.length + 1,
        title: line,
        description: `Covers theoretical and analytical principles of ${line}.`,
        topics: [],
      };
    } else if (
      currentUnit &&
      line.length > 5 &&
      line.length < 80 &&
      !line.endsWith('.') &&
      !line.includes('Page ')
    ) {
      currentUnit.topics.push({
        title: line.replace(/^[\d.-]+\s*/, ''),
        subtopics: [
          'Conceptual Foundations',
          'Analytical Frameworks',
          'Real-World Business Applications',
        ],
        learningObjective: `Master core principles and examination applications of ${line}.`,
      });
    }
  }

  if (currentUnit && currentUnit.topics.length > 0) {
    discoveredUnits.push(currentUnit);
  }

  // If no explicit units detected, generate structured standard curriculum units
  if (discoveredUnits.length === 0) {
    const candidateTopics = lines
      .filter((l) => l.length > 6 && l.length < 75 && !l.endsWith('.') && !/^\d+$/.test(l))
      .slice(0, 16);

    const defaultUnits = [
      {
        unitNumber: 1,
        title: 'Unit 1: Foundations & Core Architecture',
        description: 'Underlying principles, foundational concepts, and initial frameworks.',
        topics: candidateTopics.slice(0, 4).map((t) => ({
          title: t,
          subtopics: ['Core Definitions', 'System Architecture', 'Foundational Rules'],
          learningObjective: `Understand the primary mechanics and context of ${t}.`,
        })),
      },
      {
        unitNumber: 2,
        title: 'Unit 2: Methodologies, Frameworks & Process Flow',
        description: 'Operational logic, models, trade-off comparisons, and implementation steps.',
        topics: candidateTopics.slice(4, 8).map((t) => ({
          title: t,
          subtopics: ['Procedural Workflow', 'Framework Implementation', 'Performance Criteria'],
          learningObjective: `Evaluate and execute strategies for ${t}.`,
        })),
      },
      {
        unitNumber: 3,
        title: 'Unit 3: Practical Applications, Analysis & Case Studies',
        description: 'Industry examples, empirical evaluations, and real-world system designs.',
        topics: candidateTopics.slice(8, 12).map((t) => ({
          title: t,
          subtopics: ['Industry Case Studies', 'Failure Modes & Edge Cases', 'Comparative Analysis'],
          learningObjective: `Apply ${t} concepts to solve business and technical dilemmas.`,
        })),
      },
    ];

    return {
      subjectName: cleanTitle,
      courseDescription: `Structured examination syllabus for ${cleanTitle}, encompassing core theoretical foundations, architectural frameworks, and practical applications.`,
      learningObjectives: [
        `Develop critical comprehension of ${cleanTitle} core models and theories.`,
        `Synthesize multi-source academic materials to formulate examination-ready analyses.`,
        `Critique real-world implementation trade-offs using standard business frameworks.`,
      ],
      expectedOutcomes: [
        `Demonstrate fluency in academic terminology and operational definitions.`,
        `Solve scenario-based examination problems with structured methodologies.`,
      ],
      units: defaultUnits,
    };
  }

  return {
    subjectName: cleanTitle,
    courseDescription: `Comprehensive course curriculum for ${cleanTitle} extracted from official syllabus document.`,
    learningObjectives: [
      `Master core concepts and academic definitions across all syllabus modules.`,
      `Evaluate business trade-offs and structural models.`,
    ],
    expectedOutcomes: [
      `Readiness for comprehensive examination questions and case evaluations.`,
    ],
    units: discoveredUnits,
  };
}

/**
 * Computes Course Outline Mapping against all uploaded resources.
 * Identifies for each topic:
 * - Available source documents & exact slide/page numbers
 * - Coverage status (FULLY_COVERED, PARTIALLY_COVERED, MISSING)
 * - Detailed diagnostic notes
 */
export async function computeSubjectCoverage(subjectId: string, outlineId: string) {
  // 1. Fetch outline with units and topics
  const outline = await prisma.courseOutline.findUnique({
    where: { id: outlineId },
    include: {
      units: {
        orderBy: { unitNumber: 'asc' },
        include: {
          topics: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  });

  if (!outline) throw new Error('Outline not found');

  // 2. Fetch all resource chunks for documents belonging to this subject
  const docs = await prisma.document.findMany({
    where: { subjectId, status: 'READY' },
    include: {
      chunks: true,
    },
  });

  const allChunks = docs.flatMap((d) =>
    d.chunks.map((c) => ({
      documentId: d.id,
      documentTitle: d.title,
      fileName: d.fileName,
      fileType: d.fileType,
      pageOrSlide: c.pageOrSlideNumber,
      header: c.sectionHeader || '',
      content: c.content,
    }))
  );

  let fullyCoveredCount = 0;
  let partiallyCoveredCount = 0;
  let missingCount = 0;
  const missingTopicsList: string[] = [];

  for (const unit of outline.units) {
    for (const topic of unit.topics) {
      // Find matching chunks
      const topicTerms = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !['unit', 'chapter', 'topic', 'intro', 'with', 'from'].includes(w));

      let matchedChunks = allChunks.filter((chunk) => {
        const textToSearch = `${chunk.header} ${chunk.content}`.toLowerCase();
        // check match score
        const matchCount = topicTerms.filter((term) => textToSearch.includes(term)).length;
        return matchCount >= Math.min(2, Math.max(1, topicTerms.length));
      });

      // If no direct match, check subtopics
      let subtopicsList: string[] = [];
      try {
        if (topic.subtopics) subtopicsList = JSON.parse(topic.subtopics);
      } catch {}

      if (matchedChunks.length === 0 && subtopicsList.length > 0) {
        matchedChunks = allChunks.filter((chunk) => {
          const text = `${chunk.header} ${chunk.content}`.toLowerCase();
          return subtopicsList.some((sub) => {
            const subWords = sub.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
            return subWords.some((sw) => text.includes(sw));
          });
        });
      }

      // Group citations by document
      const docCitationsMap = new Map<
        string,
        { documentTitle: string; fileName: string; slidesOrPages: number[] }
      >();

      matchedChunks.forEach((mc) => {
        if (!docCitationsMap.has(mc.documentId)) {
          docCitationsMap.set(mc.documentId, {
            documentTitle: mc.documentTitle,
            fileName: mc.fileName,
            slidesOrPages: [],
          });
        }
        const entry = docCitationsMap.get(mc.documentId)!;
        if (!entry.slidesOrPages.includes(mc.pageOrSlide)) {
          entry.slidesOrPages.push(mc.pageOrSlide);
        }
      });

      const citations = Array.from(docCitationsMap.values()).map((c) => ({
        documentTitle: c.documentTitle,
        fileName: c.fileName,
        slidesOrPages: c.slidesOrPages.sort((a, b) => a - b),
      }));

      // Determine status
      let status: 'FULLY_COVERED' | 'PARTIALLY_COVERED' | 'MISSING' = 'MISSING';
      let notes = '';

      if (citations.length > 0) {
        const totalSlides = citations.reduce((sum, c) => sum + c.slidesOrPages.length, 0);
        if (totalSlides >= 3 || (citations.length >= 2 && totalSlides >= 2)) {
          status = 'FULLY_COVERED';
          notes = `Thoroughly covered across ${citations.length} uploaded resource(s) (${totalSlides} total slide/page citations).`;
          fullyCoveredCount++;
        } else {
          status = 'PARTIALLY_COVERED';
          notes = `Partially addressed in ${citations[0].documentTitle} (${citations[0].slidesOrPages.length} slide/page citations). Additional depth recommended.`;
          partiallyCoveredCount++;
        }
      } else {
        status = 'MISSING';
        notes = 'No corresponding content found in current uploaded materials. Supplementary reading required.';
        missingCount++;
        missingTopicsList.push(topic.title);
      }

      // Update topic in DB
      await prisma.outlineTopic.update({
        where: { id: topic.id },
        data: {
          coverageStatus: status,
          coverageNotes: notes,
          sourceCitations: JSON.stringify(citations),
        },
      });
    }
  }

  const totalTopics = fullyCoveredCount + partiallyCoveredCount + missingCount;
  const coveragePercentage =
    totalTopics > 0 ? Math.round(((fullyCoveredCount + partiallyCoveredCount * 0.5) / totalTopics) * 100) : 0;

  return {
    outlineId,
    totalTopics,
    fullyCoveredCount,
    partiallyCoveredCount,
    missingCount,
    coveragePercentage,
    missingTopicsList,
  };
}
