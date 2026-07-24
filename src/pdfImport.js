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
  // "Carousel N - Title" format (dash or en-dash)
  const carousel = header.match(/Carousel\s+\d+\s*[-–—]\s*(.+?)(?=\s+Slide\s+\d+|\s*$)/i)
  if (carousel) return normalize(carousel[1])
  // "Idea N: 'Title'" — matched-pair quotes so inner quotes don't cut it early
  const doubleQ = header.match(/["“”]([^"“”\n]{1,220})["“”]/)
  if (doubleQ) return normalize(doubleQ[1])
  const singleQ = header.match(/['‘’]([^'‘’\n]{1,220})['‘’]/)
  if (singleQ) return normalize(singleQ[1])
  const bare = header.match(/Idea\s+\d+\s*:\s*(.+?)(?=\s+Slide\s+\d+|\s*$)/i)
  if (bare) return normalize(bare[1])
  return fallback
}

/* Parse structured sub-fields inside a slide. Some PDFs label their slide
   content with "First line:" / "Second line:" / "Body copy:" — extract them
   so we can map onto the take's title / accent / body respectively. */
function parseSlideFields(rawText) {
  const t = ' ' + rawText + ' '
  const grab = (label) => {
    const re = new RegExp(
      `${label}\\s*:\\s*(.+?)(?=\\s+(?:First\\s+line|Second\\s+line|Body\\s+copy)\\s*:|\\s*$)`,
      'i'
    )
    const m = t.match(re)
    return m ? normalize(m[1]) : ''
  }
  const first  = grab('First\\s+line')
  const second = grab('Second\\s+line')
  const body   = grab('Body\\s+copy')
  return { first, second, body, hasLabels: !!(first || second || body) }
}

/* Split a single idea's block on Slide markers. Handles:
   Slide 1 (Hook): ...
   Slide 2: ...
   Slide 5 (CTA): ... */
function extractSlides(block) {
  // Trailing colon is optional — legacy PDFs write "Slide 1 (Hook):" but the
  // release format uses "Slide 1 (Hook)" with no colon.
  const slidePattern = /Slide\s+(\d+)(?:\s*\(([^)]+)\))?\s*:?\s*/gi
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

/* Given the raw text of the whole PDF, return an array of post blocks.
   Supports both formats we've seen so far:
     - "Idea N: 'Title'"      (legacy)
     - "Carousel N - Title"   (release format with labeled sub-fields) */
function splitIdeas(rawText) {
  const marker = /(?=Idea\s+\d+\s*:|Carousel\s+\d+\s*[-–—])/i
  return rawText
    .split(marker)
    .filter(b => /(Idea\s+\d+\s*:|Carousel\s+\d+\s*[-–—])/i.test(b))
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
    const explicitCta = slides.find(s => (s.label || '').toLowerCase().includes('cta'))
    /* Only treat the last slide as a CTA if the slide is *explicitly* labeled
       CTA. The release format only has 4 slides per carousel (all takes) with
       no CTA line, so we must NOT steal slide 4 for the CTA sub-headline. */
    const cta = explicitCta || null
    const takes = slides
      .filter(s => s !== hook && s !== cta)
      .slice(0, 4)
      .map((s, i) => {
        const { first, second, body, hasLabels } = parseSlideFields(s.text)
        return {
          number: String(i + 1).padStart(2, '0'),
          title:  hasLabels ? first  : '',
          accent: hasLabels ? second : '',
          body:   hasLabels ? body   : s.text,
        }
      })
    /* If the Hook slide itself has "First line:" / "Second line:" labels,
       flatten to a single hookText string (the hook is a plain punchy
       statement — not a title/accent split). */
    const hookFields = hook ? parseSlideFields(hook.text) : null
    const hookText = hookFields && hookFields.hasLabels
      ? [hookFields.first, hookFields.second, hookFields.body].filter(Boolean).join(' ')
      : (hook?.text || '')
    return {
      title,
      hookText,
      takes,
      ctaSub: cta?.text || '',
    }
  })
}
