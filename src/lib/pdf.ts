import type { TextItem } from 'pdfjs-dist/types/src/display/api'

/** List markers (bullets, numbered/lettered/roman-numeral list items) always
    start a new paragraph, even when the PDF sets list line-height the same
    as body text — vertical-gap detection alone would otherwise glue them to
    the previous line. */
const LIST_MARKER_RE = /^(?:[•●◦▪‣○*-]|\d{1,3}[.)]|[ivxlcdm]{1,5}[.)]|[IVXLCDM]{1,5}[.)]|[a-zA-Z][.)])\s/

interface Line { text: string; y: number }

function isTextItem(item: TextItem | { type: string }): item is TextItem {
  return 'str' in item
}

/** Groups a page's text runs into lines using pdf.js's own `hasEOL` flag
    (it already resolves line breaks from glyph layout, so we don't need to
    reimplement that from raw positions), then reads off each line's
    baseline y so callers can compare vertical spacing between lines. */
function buildLines(items: Array<TextItem | { type: string }>): Line[] {
  const lines: Line[] = []
  let parts: string[] = []
  let y = 0

  const flush = () => {
    const text = parts.join(' ').replace(/\s+/g, ' ').trim()
    if (text) lines.push({ text, y })
    parts = []
  }

  for (const item of items) {
    if (!isTextItem(item)) continue
    if (parts.length === 0) y = item.transform[5]
    if (item.str) parts.push(item.str)
    if (item.hasEOL) flush()
  }
  flush()

  return lines
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Rejoins a page's lines into paragraphs. A line starts a new paragraph
    when it's a list marker, or when the vertical gap from the previous
    line is noticeably wider than the page's typical single-line gap
    (i.e. the PDF itself left paragraph spacing) — otherwise it's a wrapped
    continuation of the current paragraph. */
function linesToParagraphs(lines: Line[]): string[] {
  if (lines.length === 0) return []

  const gaps = lines.slice(1).map((line, idx) => lines[idx].y - line.y).filter(g => g > 0)
  const typicalGap = gaps.length ? median(gaps) : 0

  const paragraphs: string[] = []
  let current = lines[0].text

  for (let idx = 1; idx < lines.length; idx++) {
    const prev = lines[idx - 1]
    const line = lines[idx]
    const gap = prev.y - line.y
    const startsNewParagraph = LIST_MARKER_RE.test(line.text)
      || (typicalGap > 0 && gap > typicalGap * 1.4)

    if (startsNewParagraph) {
      paragraphs.push(current)
      current = line.text
    } else {
      current += ' ' + line.text
    }
  }
  paragraphs.push(current)

  return paragraphs
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Turns the plain text returned by `extractTextFromPDF` (paragraphs
 * separated by blank lines) into a wrapped-in-`<p>` HTML string, so it can
 * seed the rich editor as a normal, formattable document.
 */
export function extractedTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block.trim())}</p>`)
    .join('')
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  // Point the worker to the CDN version to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const paragraphs: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    paragraphs.push(...linesToParagraphs(buildLines(textContent.items)))
  }

  return paragraphs.join('\n\n')
}
