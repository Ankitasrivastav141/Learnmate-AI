const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const officeParser = require('officeparser');

const prisma = new PrismaClient();

async function backfill() {
  console.log('Starting chunk backfill for all existing documents...');
  const docs = await prisma.document.findMany();

  for (const doc of docs) {
    console.log(`Processing: ${doc.title} (${doc.fileName})...`);
    let rawText = doc.rawText;
    let chunks = [];

    if (rawText && rawText.length > 0) {
      const blocks = rawText.split(/\n{2,}/).map(b => b.trim()).filter(b => b.length > 20);
      blocks.forEach((block, idx) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const header = lines[0] || `Slide ${idx + 1}`;
        chunks.push({
          documentId: doc.id,
          pageOrSlideNumber: idx + 1,
          sectionHeader: header.slice(0, 90),
          content: block,
        });
      });
    }

    if (chunks.length > 0) {
      await prisma.resourceChunk.deleteMany({ where: { documentId: doc.id } });
      for (const ch of chunks) {
        await prisma.resourceChunk.create({ data: ch });
      }
      console.log(`Saved ${chunks.length} chunks for ${doc.title}`);
    }
  }

  // Check if Product Management II subject exists, or create one for the user's uploaded PM2 decks
  let pmSubject = await prisma.subject.findFirst({
    where: { name: { contains: 'Product Management' } }
  });

  if (!pmSubject) {
    pmSubject = await prisma.subject.create({
      data: {
        name: 'Product Management II (Tech Stacks & Systems)',
        description: 'Advanced technical curriculum for MBA product managers covering APIs, Data Modeling, Python Ecosystems, and Cloud Architecture.',
        color: '#6366f1',
        icon: 'Layers'
      }
    });
    console.log(`Created subject: ${pmSubject.name}`);
  }

  // Check if CourseOutline exists for PM Subject
  let outline = await prisma.courseOutline.findFirst({
    where: { subjectId: pmSubject.id, isActive: true }
  });

  if (!outline) {
    outline = await prisma.courseOutline.create({
      data: {
        subjectId: pmSubject.id,
        title: 'MBA Product Management II: Technical Systems & Architecture Syllabus',
        fileName: 'pm2_official_syllabus.docx',
        fileType: 'docx',
        rawText: 'Course Outline: Product Management II. Unit 1: Foundations of Technical Product Management. Unit 2: APIs & System Integration Architecture. Unit 3: Data Modeling, Databases & ACID Guarantees. Unit 4: Tech Stacks & Modern Cloud Deployment.',
        status: 'PARSED',
        learningObjectives: JSON.stringify([
          'Evaluate trade-offs between architectural paradigms (REST vs GraphQL vs gRPC, Monolith vs Microservices).',
          'Formulate data modeling schemas and enforce ACID guarantees for enterprise transactional systems.',
          'Critique tech stack selections (Django vs Flask vs FastAPI) based on product latency and scaling requirements.'
        ]),
        expectedOutcomes: JSON.stringify([
          'Proficiency in communicating technical trade-offs with senior engineering architects.',
          'Competence in drafting API contracts, ER diagrams, and microservice boundary definitions.'
        ]),
        isActive: true,
      }
    });

    const unitsData = [
      {
        unitNumber: 1,
        title: 'Unit 1: Technical Foundations for Product Managers',
        description: 'Decision variables, system constraints, cost structures, and communication interfaces.',
        topics: [
          {
            title: 'Key Technical Decisions Made by Product Managers',
            subtopics: JSON.stringify(['Feature Prioritization', 'Capacity Planning', 'Throughput vs Latency', 'Cost of Infrastructure']),
            learningObjective: 'Understand how technical constraints dictate product feasibility and unit economics.'
          },
          {
            title: 'Technical Inputs Required for Product Roadmaps',
            subtopics: JSON.stringify(['Production Facilities', 'Resource Allocation', 'Architectural Debt', 'Technology Selection']),
            learningObjective: 'Identify essential engineering criteria when estimating delivery timelines.'
          }
        ]
      },
      {
        unitNumber: 2,
        title: 'Unit 2: APIs, Integrations & Distributed Systems',
        description: 'RESTful architectures, asynchronous event queues, and third-party integrations.',
        topics: [
          {
            title: 'API Design Patterns & High-Concurrency Architecture',
            subtopics: JSON.stringify(['FastAPI vs Flask', 'Async Event Loops', 'Plaid / Payment Integrations', 'Latency Bounding']),
            learningObjective: 'Architect scalable API interfaces with non-blocking I/O.'
          },
          {
            title: 'System Integration & Microservice Contract Guarantees',
            subtopics: JSON.stringify(['Idempotency Keys', 'Rate Limiting', 'Circuit Breakers', 'Error Handling']),
            learningObjective: 'Prevent cascading failures across third-party microservice dependencies.'
          }
        ]
      },
      {
        unitNumber: 3,
        title: 'Unit 3: Databases, Data Modeling & ACID Guarantees',
        description: 'Relational data modeling, consistency models, and transaction management.',
        topics: [
          {
            title: 'Relational Data Modeling & Schema Design',
            subtopics: JSON.stringify(['Entity-Relationship Diagrams', 'Normalization', 'Indexing Strategies', 'Query Optimization']),
            learningObjective: 'Design robust schemas for complex business entities.'
          },
          {
            title: 'ACID Guarantees vs BASE Consistency in FinTech',
            subtopics: JSON.stringify(['Atomicity', 'Consistency', 'Isolation Levels', 'Durability & WAL']),
            learningObjective: 'Enforce transactional integrity in mission-critical payment workflows.'
          }
        ]
      },
      {
        unitNumber: 4,
        title: 'Unit 4: Modern Tech Stacks & Cloud Deployment',
        description: 'The Python ecosystem, containerization, and serverless vs dedicated infrastructure.',
        topics: [
          {
            title: 'The Python Ecosystem for Modern Web & AI Products',
            subtopics: JSON.stringify(['Django vs Flask vs FastAPI', 'Data Science & PyTorch', 'Package Isolation with uv/Poetry', 'Dockerization']),
            learningObjective: 'Select the optimal framework based on development speed vs execution performance.'
          },
          {
            title: 'Cloud Deployment Architectures: Serverless vs Containers',
            subtopics: JSON.stringify(['AWS Lambda', 'Kubernetes Clusters', 'PaaS vs IaaS', 'Cost-Optimized Stacks']),
            learningObjective: 'Formulate deployment strategies that balance operational overhead and operational expenditure.'
          }
        ]
      }
    ];

    for (const u of unitsData) {
      const createdUnit = await prisma.outlineUnit.create({
        data: {
          outlineId: outline.id,
          unitNumber: u.unitNumber,
          title: u.title,
          description: u.description
        }
      });

      for (let i = 0; i < u.topics.length; i++) {
        const t = u.topics[i];
        await prisma.outlineTopic.create({
          data: {
            unitId: createdUnit.id,
            orderIndex: i,
            title: t.title,
            subtopics: t.subtopics,
            learningObjective: t.learningObjective,
            coverageStatus: 'MISSING'
          }
        });
      }
    }
    console.log(`Created Course Outline with 4 units and 8 topics.`);
  }

  console.log('Backfill complete!');
}

backfill()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
