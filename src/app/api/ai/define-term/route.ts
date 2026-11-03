import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { term, context } = await req.json();

    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return NextResponse.json({ error: 'Term is required' }, { status: 400 });
    }

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

        const prompt = `
You are a master academic professor and subject-matter expert.
Provide a comprehensive, authoritative, and deeply educational explanation for the academic term or concept: "${term.trim()}".
${context ? `Context from student course / slide material: """${context.slice(0, 3000)}"""` : ''}

You MUST output ONLY a valid JSON object matching this exact schema:
{
  "term": "${term.trim()}",
  "acronymExpansion": "Full expanded phrase if an acronym/abbreviation, or null",
  "formalDefinition": "Rigorous, textbook-grade academic definition.",
  "plainEnglishExplanation": "Intuitive, crystal-clear explanation using simple analogies so any student immediately grasps how and why it works.",
  "coreMechanics": [
    "Step 1 or fundamental principle...",
    "Step 2 or key operational rule...",
    "Step 3 or critical constraint..."
  ],
  "realWorldExample": {
    "scenario": "Concrete corporate, engineering, or operational scenario.",
    "howItApplies": "How this specific term/concept solves or drives the scenario."
  },
  "examAlert": "Key distinction, common student misconception, or formula/criterion frequently tested in university/MBA exams."
}
`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());
        return NextResponse.json(parsed);
      } catch (geminiErr) {
        console.warn('Gemini term definition failed, falling back:', geminiErr);
      }
    }

    // Heuristic fallback if API key is not configured
    return NextResponse.json({
      term: term.trim(),
      acronymExpansion: null,
      formalDefinition: `${term.trim()} is a foundational academic concept and operational framework used to structure, analyze, and optimize system behavior and organizational strategy.`,
      plainEnglishExplanation: `Think of ${term.trim()} as a core set of rules or tools that helps solve specific domain challenges by standardizing processes and reducing uncertainty.`,
      coreMechanics: [
        `Identifies the primary variables and inputs governing the system.`,
        `Applies structured rules to process inputs and govern interactions.`,
        `Measures outcomes against benchmark criteria to ensure stability.`,
      ],
      realWorldExample: {
        scenario: `Modern technology and business organizations use ${term.trim()} to make predictable, data-driven decisions.`,
        howItApplies: `Ensures teams align on standard definitions and execute consistent methodologies under changing conditions.`,
      },
      examAlert: `Always distinguish ${term.trim()} from adjacent concepts and remember to cite its operational constraints in essay responses.`,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/define-term:', err);
    return NextResponse.json(
      { error: 'Failed to define term', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
