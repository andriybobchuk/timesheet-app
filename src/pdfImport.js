/* =============================================
   PDF -> Posts importer
   Reads a Mooney "ideas" PDF (Idea N: title + Slide 1..5),
   returns an array of Post objects that match the Mooney
   carousel content shape.
   ============================================= */

import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

/* Normalise the extracted text — the PDF's text layer often has multiple
   spaces between letters, weird newlines mid-sentence, and stray line
   breaks between an emoji and the surrounding word. Collapse whitespace,
   then collapse multi-spaced words like "S l i d e" back into "Slide". */
function normalize(text) {
  if (!text) return ''
  return text
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function extractPdfText(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let out = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    out += content.items.map(it => it.str).join(' ') + '\n'
  }
  return out
}

/* Extract the title from an Idea header. The PDF uses several quote styles:
   Idea 1: "Budgeting is for Broke People"
   Idea 21: "Wedding culture is a financial scam"
   We accept ASCII " smart quotes " and even Polish/Latin punctuation. */
function extractIdeaTitle(header, fallback) {
  // Try quoted forms first
  const quoted = header.match(/["'“”‘’]([^"'“”‘’\n]{1,220})["'“”‘’]/)
  if (quoted) return normalize(quoted[1])
  // Fall back to the text after "Idea N:" up to the first newline or "Slide"
  const bare = header.match(/Idea\s+\d+\s*:\s*(.+?)(?=\s+Slide\s+\d+|\s*$)/i)
  if (bare) return normalize(bare[1])
  return fallback
}

/* Split a single idea's block on Slide markers. Handles:
   Slide 1 (Hook): ...
   Slide 2: ...
   Slide 5 (CTA): ... */
function extractSlides(block) {
  const slidePattern = /Slide\s+(\d+)(?:\s*\(([^)]+)\))?\s*:\s*/gi
  const matches = [...block.matchAll(slidePattern)]
  const slides = []
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const nextStart = i < matches.length - 1 ? matches[i + 1].index : block.length
    const raw = block.slice(m.index + m[0].length, nextStart)
    slides.push({
      num: parseInt(m[1], 10),
      label: m[2] ? m[2].trim() : null,
      text: normalize(raw),
    })
  }
  return slides
}

/* Given the raw text of the whole PDF, return an array of Idea blocks. */
function splitIdeas(rawText) {
  // Ideas start with "Idea NN:" or "Idea NN :" — capture with lookahead so
  // the marker stays at the head of the following block.
  return rawText
    .split(/(?=Idea\s+\d+\s*:)/i)
    .filter(b => /Idea\s+\d+\s*:/i.test(b))
}

/* Parse the whole PDF file into an array of Post-shaped objects. Each Post
   has hookText / takes[] / ctaSub set from the PDF; the rest of the fields
   (save, cta headline+button+badge, photo, hookVariant) are handled by the
   caller which merges these into full posts using its own defaults. */
export async function parsePdfToPosts(file) {
  const raw = await extractPdfText(file)
  const ideas = splitIdeas(raw)
  return ideas.map((block, idx) => {
    const header = block.split(/Slide\s+\d/i)[0] || block.slice(0, 400)
    const title = extractIdeaTitle(header, `Post ${idx + 1}`)
    const slides = extractSlides(block)
    const hook = slides.find(s => s.num === 1 || (s.label || '').toLowerCase().includes('hook'))
    const cta  = slides.find(s => (s.label || '').toLowerCase().includes('cta'))
                || slides[slides.length - 1]
    const takes = slides
      .filter(s => s !== hook && s !== cta)
      .slice(0, 4)
      .map((s, i) => ({
        number: String(i + 1).padStart(2, '0'),
        title: '',
        accent: '',
        body: s.text,
      }))
    return {
      title,
      hookText: hook?.text || '',
      takes,
      ctaSub: cta?.text || '',
    }
  })
}
