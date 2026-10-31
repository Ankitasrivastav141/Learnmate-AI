# LearnMate AI — Advanced Academic Study Material Generator

LearnMate AI is a production-grade personal Learning Management System (LMS) and **Advanced AI Academic Study Material Generator** that uses modern LLM reasoning and retrieval architecture (RAG) to transform academic course outlines, lecture presentation slides (PPTX), textbooks (PDF), Word documents (DOCX), and notes into examination-oriented, MBA-level study material.

---

## 🌟 Advanced AI Study Material Generator Architecture

### 1. 🗺️ Official Course Outline (Syllabus) Backbone
* **Upload Syllabus:** Dedicated section accepting official course outlines (PDF, DOCX, PPTX).
* **Taxonomy Extraction:** Extracts Subject Name, Units/Modules, Chapters, Topics, Subtopics, Learning Objectives, and Expected Outcomes.
* **Structural Anchor:** The syllabus serves as the primary organizational backbone for all generated study material.
* **Replaceable:** Users can replace or update the syllabus at any time, instantly recalculating coverage.

### 2. 📂 Multi-Document Study Resources & Provenance Tracking
* **Multi-Format Ingestion:** Associates multiple PPTX, PDF, DOCX, and TXT files with a single subject.
* **Provenance-Preserving Chunking:** Extends document parsing to preserve exact slide numbers, page boundaries, and section headers (`[Doc: PM2-Day1, Slide 14]`).
* **Multi-Resource Association:** Cross-references and deduplicates complementary explanations across multiple files.

### 3. 🔍 Course Outline Mapping & Gap Analysis Report
* **Semantic Cross-Document Mapping:** Maps every uploaded deck and document against syllabus topics.
* **Coverage Diagnostics:**
  * 🟢 **Fully Covered:** Concept is thoroughly addressed in uploaded slides with exact slide/page citations.
  * 🟡 **Partially Covered:** Brief mention or incomplete technical detail found.
  * 🔴 **Missing Material:** 0 references found in uploaded materials — flagged for supplementary resources.
* **No Silently Ignored Topics:** Complete transparency on syllabus coverage and gap analysis.

### 4. 📚 8-Part Comprehensive MBA-Level Study Material
Clicking **"Generate Comprehensive Study Material"** synthesizes thorough academic material following the course outline. For every topic, it includes:
* **A. Introduction:** Conceptual significance and role in modern organizations.
* **B. Detailed Explanation:** Continuous, in-depth prose (converts fragmented PPT bullet points into rigorous academic narrative).
* **C. Important Definitions & Terminology:** Formal academic definitions citing source slides.
* **D. Real-World Business Examples & Case Studies:** Concrete enterprise implementations (e.g., Stripe, Netflix, Amazon).
* **E. Frameworks & Models:** Structural explanations and step-by-step application instructions.
* **F. Comparative Evaluation Tables:** Clear markdown tables contrasting trade-offs, approaches, and latency profiles.
* **G. High-Yield Examination Takeaways:** Key principles and pitfalls to avoid in exams.
* **H. Potential Examination Questions:** Short-answer conceptual questions and long-answer essay questions with grading criteria.
* **Strict Source Provenance:** Factual content explicitly cites `[Source: DocName, Slide X]`; supplementary depth is marked `[AI Academic Synthesis]`.

### 5. 📖 Dedicated Distraction-Free Reading Suite
* **Sticky Table of Contents (TOC):** Unit and topic hierarchy with reading status checkboxes.
* **Search & Bookmarks:** Real-time search across topics and persistent bookmarking.
* **Reading Progress:** Real-time progress bar tracking topics completed.
* **Inline Granular Modifiers:** Modify any topic on the fly:
  * 🔍 **Expand Explanation:** Deepens theoretical proofs and technical depth.
  * 💡 **Simplify with Analogy:** Explains concepts with intuitive real-world analogies.
  * 🏢 **Add Business Examples:** Injects additional corporate case studies.
  * 🔄 **Regenerate Topic:** Updates material without touching the rest of the syllabus.
* **Print / PDF Export:** Clean, distraction-free view ready for printing or saving to PDF.

### 6. 📝 Multi-Tier Examination Question Bank
Generates on demand:
* **MCQs (4 choices with detailed explanations)**
* **Conceptual Questions**
* **Short-Answer Questions**
* **Long-Answer Essay Questions**
* **Case-Based Scenario Questions**

---

## 🛠️ Tech Stack
* **Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide Icons, Recharts
* **Database & ORM:** Prisma ORM with SQLite (zero-config local persistence)
* **Document Extraction:** `officeparser`, `pdf-parse`, `mammoth` (with slide/page provenance tracking)
* **AI Engine:** Google Gemini Flash (`@google/generative-ai`) + offline semantic heuristic synthesizer

---

## 💻 Quick Start Guide

### 1. Install & Database Setup
```bash
npm install
npx prisma db push
```

### 2. Configure Gemini API Key (Optional)
In `.env`:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key"
```
*(If left blank, LearnMate AI seamlessly uses its built-in semantic heuristic engine so all features work immediately offline!)*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
