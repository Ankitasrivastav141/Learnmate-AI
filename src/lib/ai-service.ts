import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedStudyMaterial {
  summary: string;
  topics: Array<{
    title: string;
    summary: string;
  }>;
  concepts: Array<{
    term: string;
    definition: string;
    importance: 'High' | 'Medium' | 'Low';
    topicIndex?: number;
  }>;
  notes: Array<{
    title: string;
    markdownContent: string;
    topicIndex?: number;
  }>;
  flashcards: Array<{
    front: string;
    back: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicIndex?: number;
  }>;
  questions: Array<{
    type: 'mcq' | 'conceptual';
    questionText: string;
    options: string[]; // 4 options for MCQs
    correctAnswer: string;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicIndex?: number;
  }>;
}

// Strictly blacklist non-academic items from ever becoming topics or headings
const NON_ACADEMIC_PATTERNS = [
  /\b(?:dr\.?|prof\.?|professor|faculty|lecturer|instructor|teacher|presenter|author)\b/i,
  /\b(?:anand\s+fadte|gopal\s+naik)\b/i,
  /\b(?:agenda|session\s*roadmap|roadmap|course\s*outline|syllabus|table\s*of\s*contents)\b/i,
  /\b(?:session\s*\d+|day\s*\d+|lecture\s*\d+|slide\s*\d+|part\s*\d+)\b/i,
  /\b(?:thank\s*you|q&a|questions\?|any\s*questions|announcements|housekeeping)\b/i,
  /\b(?:combined\s*overview|visual\s*field\s*guide)\b/i,
];

export function isNonAcademicItem(text: string): boolean {
  if (!text || text.trim().length < 3) return true;
  const trimmed = text.trim();
  // Check against blacklisted regexes
  for (const pattern of NON_ACADEMIC_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  // Check if it looks like a person's name (e.g. "Firstname Lastname" with no domain words)
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(?:,\s*[A-Za-z\s]+)?$/.test(trimmed)) {
    // If it doesn't contain standard academic words like Theory, Model, Analysis, Management, etc.
    const academicWords = /\b(theory|curve|model|analysis|management|system|market|demand|supply|database|economics|function|process|design|structure|architecture|strategy|concept)\b/i;
    if (!academicWords.test(trimmed)) {
      return true;
    }
  }
  return false;
}

export async function generateLearningMaterialFromDocument(
  title: string,
  rawText: string
): Promise<GeneratedStudyMaterial> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      return await generateWithGemini(title, rawText, apiKey);
    } catch (err) {
      console.warn('Gemini API call failed or timed out. Falling back to semantic heuristic engine:', err);
      return generateWithSemanticEngine(title, rawText);
    }
  }

  // Fallback to intelligent grounded semantic parser
  return generateWithSemanticEngine(title, rawText);
}

async function generateWithGemini(
  title: string,
  rawText: string,
  apiKey: string
): Promise<GeneratedStudyMaterial> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  // Limit raw text to safe limits
  const truncatedText = rawText.slice(0, 60000);

  const prompt = `
You are the Master Academic Professor and Senior Curriculum Designer for LearnMate AI.
Analyze the complete uploaded academic presentation titled "${title}".
Extracted Document Content:
"""
${truncatedText}
"""

CORE OBJECTIVE:
Generate ONE single consolidated, deeply educational, textbook-grade study notes document for this presentation.
A student must be able to read and understand this document independently without needing to open the original PPT.

CRITICAL RULES:
1. ONE PPT = ONE COMPLETE STUDY NOTES DOCUMENT. All topics must be unified in one single markdown document inside notes[0].
2. PRESERVE ACADEMIC FLOW: Follow the natural slide order and progression of the original presentation.
3. ACTUAL TOPICS ONLY: Create headings and subheadings using the ACTUAL academic topics and concepts present in the PPT.
4. STRICT PROHIBITIONS:
   - Faculty names, presenters, professors, or lecturers (e.g., Dr. Anand Fadte, Prof. Gopal Naik, etc.) MUST NEVER be treated as topics or headings. A teacher's name is not an academic concept!
   - Agendas, session roadmaps, instructor bios, slide metadata, course logistics, and Q&A MUST NEVER become study topics.
   - Do NOT invent artificial headings (e.g. "Core Architecture", "Underlying Principles") unless they are genuinely the subject matter.
5. EXPLANATION STANDARD (Follow Consumer Behavior benchmark):
   For each genuine academic topic:
   - Start with a clear explanation of what the topic means and why it is important.
   - Explain how it works step by step in clear, simple English.
   - Define all important terminology in a clean comparison or glossary Markdown table:
     | Term / Acronym | Rigorous Definition | In Plain English & Why It Matters |
   - Provide concrete examples (practical business/product examples for Product Management; economic scenarios and calculations for Economics; step-by-step logic for Technical topics).
   - Comparative tables where useful: | Concept / Model | Characteristics | Key Trade-offs |
   - Formulas and calculations wherever relevant in the text.
   - High-yield examination prep tips and common student pitfalls.
6. NO RAW MARKDOWN SYMBOLS IN DISPLAY: Notes must be clean, structured, and easy to read.

You MUST output ONLY a valid JSON object matching this exact schema:
{
  "summary": "3-4 sentence comprehensive overview explaining the core principles and scope of this entire presentation.",
  "topics": [
    {
      "title": "Actual Academic Topic Title (Strictly no teacher names or agenda items)",
      "summary": "Clear 2-sentence summary of what this topic covers."
    }
  ],
  "concepts": [
    {
      "term": "Term Name",
      "definition": "Clear academic definition with plain-English intuition.",
      "importance": "High",
      "topicIndex": 0
    }
  ],
  "notes": [
    {
      "title": "${title}: Complete Digital Textbook Study Guide",
      "markdownContent": "# ${title}\\n\\n## Overview & Course Context\\n[Comprehensive explanation of the presentation's scope]\\n\\n## [Topic 1 Name]\\n### 1. Conceptual Foundations\\n[Detailed explanation in simple English]\\n\\n### 2. Slide Terminology & Glossary\\n| Term / Acronym | Rigorous Definition | In Plain English & Why It Matters |\\n|---|---|---|\\n| ... | ... | ... |\\n\\n### 3. Mechanisms & Step-by-Step Logic\\n[How it works]\\n\\n### 4. Practical Real-World Applications\\n[Business/product or economic examples]\\n\\n### 5. Comparative Trade-offs & Alternatives\\n| Dimension | Option A | Option B |\\n|---|---|---|\\n| ... | ... | ... |\\n\\n### 6. High-Yield Exam Prep & Pitfalls\\n- **Exam Tip:** ...\\n- **Common Pitfall:** ...\\n\\n[Repeat full depth for Topic 2, Topic 3, etc.]\\n\\n## Quick Revision Summary & Key Takeaways\\n- Concise bullet point 1\\n- Concise bullet point 2",
      "topicIndex": 0
    }
  ],
  "flashcards": [
    {
      "front": "Clear question, term, or prompt",
      "back": "Precise, grounded answer and definition",
      "difficulty": "Medium",
      "topicIndex": 0
    }
  ],
  "questions": [
    {
      "type": "mcq",
      "questionText": "Grounded question testing real comprehension",
      "options": ["Correct Option", "Distractor 1", "Distractor 2", "Distractor 3"],
      "correctAnswer": "Correct Option",
      "explanation": "Detailed explanation explaining why this option is correct and why others are false.",
      "difficulty": "Medium",
      "topicIndex": 0
    }
  ]
}

Ensure you generate 8-12 high-quality flashcards and 8-12 rigorous 4-option MCQs with full explanations.
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsed = JSON.parse(responseText) as GeneratedStudyMaterial;

  return sanitizeMaterial(parsed, title, rawText);
}

/**
 * Intelligent Grounded Heuristic Engine
 * Extracts realistic topics, notes, flashcards, concepts, and 10 MCQs
 * from the actual uploaded text when offline or without an API key.
 * Strictly filters out faculty names, agendas, and metadata.
 */
function generateWithSemanticEngine(
  title: string,
  rawText: string
): GeneratedStudyMaterial {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 25);

  const sentences = rawText
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 250);

  // Discover candidate topics from headings, filtering out teacher names and metadata
  const candidateHeadings = lines.filter((line) => {
    if (isNonAcademicItem(line)) return false;
    return (
      (line.length < 70 && line.length > 4 && !line.endsWith('.') && /^[A-Z0-9]/.test(line)) ||
      line.startsWith('#') ||
      line.startsWith('Chapter') ||
      line.startsWith('Unit') ||
      line.startsWith('Topic')
    );
  });

  const uniqueCandidates = Array.from(
    new Set(candidateHeadings.map((h) => h.replace(/^#+\s*/, '').trim()))
  ).filter((h) => !isNonAcademicItem(h));

  const topicTitles = uniqueCandidates.length >= 2
    ? uniqueCandidates.slice(0, 5)
    : [
        `${title} Core Principles`,
        `Theoretical Framework & Mechanisms`,
        `Practical Applications & Trade-offs`,
        `Evaluation & Key Metrics`,
      ];

  const topics = topicTitles.map((t) => ({
    title: t,
    summary: `Explains foundational mechanisms, practical implications, and core principles of ${t}.`,
  }));

  // Extract genuine technical terms & definitions from text patterns
  const extractedTerms: Array<{ term: string; definition: string }> = [];
  const termRegex = /(?:^|\n)\s*([A-Z][A-Za-z0-9\s-]{2,35}?)\s*(?::|—|-|\bis\s+a\b|\brefers\s+to\b)\s*([^\n.]{15,180}\.?)/g;
  let match;
  while ((match = termRegex.exec(rawText)) !== null) {
    const rawTerm = match[1].trim();
    const rawDef = match[2].trim();
    if (
      rawTerm.length > 2 &&
      !isNonAcademicItem(rawTerm) &&
      !extractedTerms.some((t) => t.term === rawTerm)
    ) {
      extractedTerms.push({
        term: rawTerm,
        definition: rawDef.endsWith('.') ? rawDef : `${rawDef}.`,
      });
    }
    if (extractedTerms.length >= 20) break;
  }

  // Fallback defaults if terms were terse
  if (extractedTerms.length < 3) {
    extractedTerms.push(
      { term: `${topicTitles[0] || title} Analysis`, definition: `Analytical framework used to evaluate behaviors, constraints, and outcomes in this domain.` },
      { term: `Operational Equilibrium`, definition: `State of balance where competing pressures or preferences stabilize across all parameters.` },
      { term: `Systemic Trade-off`, definition: `The opportunity cost or compromise incurred when choosing one configuration over another.` }
    );
  }

  const concepts = extractedTerms.slice(0, 12).map((et, i) => ({
    term: et.term,
    definition: et.definition,
    importance: (i % 2 === 0 ? 'High' : 'Medium') as 'High' | 'Medium' | 'Low',
    topicIndex: i % Math.max(1, topics.length),
  }));

  // Build ONE consolidated textbook-grade markdown document
  const consolidatedSections = topics.map((t, idx) => {
    const topicConcepts = concepts.filter((c) => c.topicIndex === idx);
    const termsTable = topicConcepts.length > 0
      ? `| Term / Acronym | Rigorous Definition | In Plain English & Why It Matters |\n|---|---|---|\n${topicConcepts
          .map((c) => `| **${c.term}** | ${c.definition} | Provides concrete grounding for ${t.title}. |`)
          .join('\n')}`
      : `| Concept | Definition | Importance |\n|---|---|---|\n| **${t.title}** | Core concept analyzed in this section. | Essential for understanding domain dynamics. |`;

    const topicParagraphs = paragraphs.slice(idx * 2, idx * 2 + 2);
    const bodyExplanation = topicParagraphs.length > 0
      ? topicParagraphs.join('\n\n')
      : `This section explains the core theories, working mechanisms, and practical considerations governing **${t.title}**. Students should focus on understanding the underlying logic rather than memorizing isolated terms.`;

    return `
## ${t.title}

### 1. Conceptual Foundations & Theory
${bodyExplanation}

### 2. Slide Terminology & Glossary
${termsTable}

### 3. Mechanisms, Architecture & Step-by-Step Logic
1. **Core Mechanism:** How inputs, constraints, and preferences interact to generate observable outcomes.
2. **Key Dependencies:** Underlying factors that must hold true for standard models to apply.
3. **Behavioral Optimization:** How rational agents or systems make trade-offs under scarcity or performance bounds.

### 4. Practical Real-World Applications
In industry and organizational practice, understanding **${t.title}** enables practitioners to analyze trade-offs, predict behavioral responses, and design more effective solutions.

### 5. Comparative Trade-offs & Alternatives
| Dimension | Primary Approach | Alternative Approach |
|---|---|---|
| Focus | Immediate operational optimization | Long-term structural flexibility |
| Key Benefit | Direct alignment with immediate goals | Resilience against unforeseen variance |
| Main Limitation | Requires accurate baseline assumptions | Higher coordination or initial overhead |

### 6. High-Yield Examination Prep & Common Pitfalls
- **Exam Tip:** Clearly state initial assumptions before walking through derivations or strategic recommendations.
- **Common Pitfall:** Conflating correlation with direct causation when analyzing outcomes in ${t.title}.
`.trim();
  });

  const fullConsolidatedMarkdown = `
# ${title}

## Overview & Academic Context
This document consolidates all lecture slides and study materials for **${title}** into a unified digital textbook. It systematically covers the core theoretical models, defined terminology, step-by-step mechanisms, practical real-world applications, and examination prep points.

${consolidatedSections.join('\n\n---\n\n')}

---

## Quick Revision Summary & Key Takeaways
${topics.map((t) => `- **${t.title}:** Master the definitions, primary trade-offs, and practical applications outlined above.`).join('\n')}
- **Final Exam Recommendation:** Review the glossary tables and attempt the practice quiz to verify your retention of key concepts.
`.trim();

  // Return ONE consolidated note
  const notes = [
    {
      title: `${title} - Complete Digital Textbook Notes`,
      markdownContent: fullConsolidatedMarkdown,
      topicIndex: 0,
    },
  ];

  // Flashcards (generate 10)
  const flashcards = [];
  for (let i = 0; i < Math.min(10, Math.max(8, sentences.length)); i++) {
    const s = sentences[i % sentences.length] || `Core principle of ${title}`;
    const words = s.split(' ');
    const chunk = words.slice(0, Math.min(6, words.length)).join(' ');
    flashcards.push({
      front: `What is the significance or definition of: "${chunk}..."?`,
      back: s,
      difficulty: (i % 3 === 0 ? 'Hard' : i % 2 === 0 ? 'Medium' : 'Easy') as 'Easy' | 'Medium' | 'Hard',
      topicIndex: i % Math.max(1, topics.length),
    });
  }

  // MCQs (generate 10)
  const questions = [];
  for (let q = 1; q <= 10; q++) {
    const targetSentence = sentences[(q * 2) % Math.max(1, sentences.length)] || `Key statement regarding ${title}.`;
    const targetTopic = topics[q % topics.length];

    questions.push({
      type: 'mcq' as const,
      questionText: `According to "${title}", which statement correctly describes ${targetTopic.title}?`,
      options: [
        `${targetSentence}`,
        `It is strictly used for external deprecated interfaces with no persistent state.`,
        `It completely replaces foundational data without verification or auditing.`,
        `It operates independently of any underlying constraints or models.`,
      ],
      correctAnswer: `${targetSentence}`,
      explanation: `Directly supported by the study material: "${targetSentence}". The alternate choices contradict documented principles.`,
      difficulty: (q % 3 === 0 ? 'Hard' : q % 2 === 0 ? 'Medium' : 'Easy') as 'Easy' | 'Medium' | 'Hard',
      topicIndex: q % Math.max(1, topics.length),
    });
  }

  const summary = paragraphs[0]
    ? paragraphs[0].slice(0, 300) + '...'
    : `Comprehensive study guide for ${title}, covering essential theoretical models, defined terminology, step-by-step logic, and exam prep.`;

  return {
    summary,
    topics,
    concepts,
    notes,
    flashcards,
    questions,
  };
}

function sanitizeMaterial(
  parsed: GeneratedStudyMaterial,
  title: string,
  rawText: string
): GeneratedStudyMaterial {
  // Filter out any topics that match teacher names, agendas, or non-academic patterns
  if (parsed.topics && Array.isArray(parsed.topics)) {
    parsed.topics = parsed.topics.filter((t) => !isNonAcademicItem(t.title));
  }

  // Ensure at least 1 consolidated note exists
  if (!parsed.notes || parsed.notes.length === 0) {
    const fallback = generateWithSemanticEngine(title, rawText);
    parsed.notes = fallback.notes;
  }

  // Ensure minimums and option array validity
  if (!parsed.questions || parsed.questions.length < 5) {
    const fallback = generateWithSemanticEngine(title, rawText);
    parsed.questions = [
      ...(parsed.questions || []),
      ...fallback.questions.slice(0, 10 - (parsed.questions?.length || 0)),
    ];
  }

  // Validate MCQ options
  parsed.questions.forEach((q) => {
    if (!q.options || q.options.length < 4) {
      q.options = [
        q.correctAnswer || 'Correct conceptual understanding',
        'Incorrect distractor based on standard misconceptions',
        'Contradictory hypothesis without empirical support',
        'None of the above',
      ];
    }
    if (!q.options.includes(q.correctAnswer)) {
      q.options[0] = q.correctAnswer;
    }
  });

  return parsed;
}
