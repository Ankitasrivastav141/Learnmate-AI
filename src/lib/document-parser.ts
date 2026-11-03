import fs from 'fs/promises';
import path from 'path';
// @ts-ignore
import officeParser from 'officeparser';
// @ts-ignore
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
// @ts-ignore
import yauzl from 'yauzl';

export interface DocumentChunk {
  pageOrSlideNumber: number;
  sectionHeader: string;
  content: string;
}

export interface ParsedDocumentResult {
  text: string;
  pageCount: number;
  wordCount: number;
  fileType: string;
  chunks: DocumentChunk[];
}

function parsePptxWithYauzl(buffer: Buffer): Promise<Array<{ slideNum: number; header: string; content: string }>> {
  return new Promise((resolve) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err: any, zipfile: any) => {
      if (err || !zipfile) return resolve([]);
      const slides: Array<{ slideNum: number; header: string; content: string }> = [];
      zipfile.readEntry();
      zipfile.on('entry', (entry: any) => {
        if (/^ppt\/slides\/slide\d+\.xml$/.test(entry.fileName)) {
          const match = entry.fileName.match(/slide(\d+)\.xml/);
          const slideNum = match ? parseInt(match[1], 10) : 1;
          zipfile.openReadStream(entry, (openErr: any, readStream: any) => {
            if (openErr || !readStream) {
              zipfile.readEntry();
              return;
            }
            const chunks: Buffer[] = [];
            readStream.on('data', (c: Buffer) => chunks.push(c));
            readStream.on('end', () => {
              const xml = Buffer.concat(chunks).toString('utf-8');
              const textMatches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
              const textParts = textMatches.map((m: string) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
              if (textParts.length > 0) {
                const header = textParts[0].slice(0, 90);
                const content = textParts.join(' ');
                slides.push({ slideNum, header, content });
              }
              zipfile.readEntry();
            });
          });
        } else {
          zipfile.readEntry();
        }
      });
      zipfile.on('end', () => {
        slides.sort((a, b) => a.slideNum - b.slideNum);
        resolve(slides);
      });
      zipfile.on('error', () => resolve(slides));
    });
  });
}

export async function parseDocumentFile(
  input: string | Buffer,
  originalFilename: string
): Promise<ParsedDocumentResult> {
  const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
  let extractedText = '';
  let pageCount = 1;
  const chunks: DocumentChunk[] = [];

  const buffer = Buffer.isBuffer(input) ? input : await fs.readFile(input);

  try {
    if (ext === 'pdf') {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
      pageCount = pdfData.numpages || 1;

      // Split PDF by form feeds (\f) or double newlines
      const rawPages = extractedText.split('\f');
      if (rawPages.length > 1) {
        rawPages.forEach((pageText: string, idx: number) => {
          const cleanPage = pageText.trim();
          if (cleanPage.length > 20) {
            const firstLine = cleanPage.split('\n')[0].replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 80).trim();
            chunks.push({
              pageOrSlideNumber: idx + 1,
              sectionHeader: firstLine || `Page ${idx + 1}`,
              content: cleanPage,
            });
          }
        });
      }
    } else if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
      const words = extractedText.trim().split(/\s+/).length;
      pageCount = Math.max(1, Math.ceil(words / 400));

      // Split by double newlines or headers
      const sections = extractedText.split(/\n\s*\n/).filter((s) => s.trim().length > 30);
      sections.forEach((sec, idx) => {
        const clean = sec.trim();
        const header = clean.split('\n')[0].slice(0, 80).trim();
        const pageEstimated = Math.min(pageCount, Math.floor(idx / 3) + 1);
        chunks.push({
          pageOrSlideNumber: pageEstimated,
          sectionHeader: header || `Section ${idx + 1}`,
          content: clean,
        });
      });
    } else if (ext === 'pptx' || ext === 'ppt') {
      // 1. First attempt: Direct slide-by-slide XML extraction via yauzl
      const slideEntries = await parsePptxWithYauzl(buffer);
      if (slideEntries.length > 0) {
        pageCount = slideEntries.length;
        extractedText = slideEntries.map((s) => `[Slide ${s.slideNum}: ${s.header}]\n${s.content}`).join('\n\n');
        slideEntries.forEach((s) => {
          chunks.push({
            pageOrSlideNumber: s.slideNum,
            sectionHeader: s.header,
            content: s.content,
          });
        });
      } else {
        // 2. Second attempt: officeParser on buffer
        try {
          const text = await officeParser.parseOfficeAsync(buffer);
          extractedText = typeof text === 'string' ? text : JSON.stringify(text);
        } catch (pptErr) {
          extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        }

        const rawBlocks = extractedText
          .split(/\n{2,}/)
          .map((b) => b.trim())
          .filter((b) => b.length > 15);

        pageCount = Math.max(1, Math.min(80, rawBlocks.length));

        rawBlocks.forEach((block, idx) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          const headerCandidate = lines[0] || `Slide ${idx + 1}`;
          chunks.push({
            pageOrSlideNumber: idx + 1,
            sectionHeader: headerCandidate.slice(0, 90),
            content: block,
          });
        });
      }
    } else if (ext === 'txt') {
      extractedText = buffer.toString('utf-8');
      const words = extractedText.trim().split(/\s+/).length;
      pageCount = Math.max(1, Math.ceil(words / 400));

      const sections = extractedText.split(/\n{2,}/).filter((s) => s.trim().length > 25);
      sections.forEach((sec, idx) => {
        chunks.push({
          pageOrSlideNumber: Math.min(pageCount, Math.floor(idx / 3) + 1),
          sectionHeader: sec.split('\n')[0].slice(0, 80) || `Section ${idx + 1}`,
          content: sec.trim(),
        });
      });
    } else {
      extractedText = buffer.toString('utf-8');
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error(
      `Failed to extract text from ${originalFilename}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // Clean and sanitize whitespace
  const sanitizedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = sanitizedText.length > 0 ? sanitizedText.split(/\s+/).filter(Boolean).length : 0;

  // Fallback if chunks array is empty
  if (chunks.length === 0 && sanitizedText.length > 0) {
    const paragraphs = sanitizedText.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    paragraphs.forEach((p, idx) => {
      chunks.push({
        pageOrSlideNumber: Math.floor(idx / 2) + 1,
        sectionHeader: p.split('\n')[0].slice(0, 80) || `Segment ${idx + 1}`,
        content: p.trim(),
      });
    });
  }

  return {
    text: sanitizedText,
    pageCount: Math.max(1, pageCount),
    wordCount: words,
    fileType: ext,
    chunks,
  };
}
