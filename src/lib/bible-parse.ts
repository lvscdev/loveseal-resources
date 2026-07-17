/**
 * Server-safe Bible reference parser.
 *
 * `processBibleRefs(html)` scans the plain-text segments of an HTML string and
 * wraps recognised "Book chapter:verse" references in a <span> with
 * data-bible-ref (api.bible passage ID) and data-bible-text (display label).
 * The activator client component reads those attributes to trigger lookups.
 *
 * Only matches chapter:verse refs (e.g. "John 3:16", "Rev 22:20-21") to keep
 * false-positive rates low.  Chapter-only refs (e.g. "John 3") are skipped
 * intentionally.
 */

/** Maps every recognisable name/abbrev to a 3-letter api.bible book code. */
const BOOKS: Record<string, string> = {
  // Pentateuch
  Genesis: 'GEN', Gen: 'GEN',
  Exodus: 'EXO', Exod: 'EXO', Exo: 'EXO',
  Leviticus: 'LEV', Lev: 'LEV',
  Numbers: 'NUM', Num: 'NUM',
  Deuteronomy: 'DEU', Deut: 'DEU', Deu: 'DEU',
  // History
  Joshua: 'JOS', Josh: 'JOS',
  Judges: 'JDG', Judg: 'JDG',
  Ruth: 'RUT',
  '1 Samuel': '1SA', '1Samuel': '1SA', '1Sam': '1SA',
  '2 Samuel': '2SA', '2Samuel': '2SA', '2Sam': '2SA',
  '1 Kings': '1KI', '1Kings': '1KI', '1Kgs': '1KI',
  '2 Kings': '2KI', '2Kings': '2KI', '2Kgs': '2KI',
  '1 Chronicles': '1CH', '1Chronicles': '1CH', '1Chr': '1CH',
  '2 Chronicles': '2CH', '2Chronicles': '2CH', '2Chr': '2CH',
  Ezra: 'EZR',
  Nehemiah: 'NEH', Neh: 'NEH',
  Esther: 'EST', Esth: 'EST',
  // Poetry & Wisdom
  Job: 'JOB',
  Psalms: 'PSA', Psalm: 'PSA', Ps: 'PSA', Pss: 'PSA',
  Proverbs: 'PRO', Prov: 'PRO', Pro: 'PRO',
  Ecclesiastes: 'ECC', Eccl: 'ECC',
  'Song of Songs': 'SNG', 'Song of Solomon': 'SNG', Song: 'SNG',
  // Major Prophets
  Isaiah: 'ISA', Isa: 'ISA',
  Jeremiah: 'JER', Jer: 'JER',
  Lamentations: 'LAM', Lam: 'LAM',
  Ezekiel: 'EZK', Ezek: 'EZK',
  Daniel: 'DAN', Dan: 'DAN',
  // Minor Prophets
  Hosea: 'HOS', Hos: 'HOS',
  Joel: 'JOL',
  Amos: 'AMO',
  Obadiah: 'OBA', Obad: 'OBA',
  Jonah: 'JON',
  Micah: 'MIC', Mic: 'MIC',
  Nahum: 'NAH', Nah: 'NAH',
  Habakkuk: 'HAB', Hab: 'HAB',
  Zephaniah: 'ZEP', Zeph: 'ZEP',
  Haggai: 'HAG', Hag: 'HAG',
  Zechariah: 'ZEC', Zech: 'ZEC',
  Malachi: 'MAL', Mal: 'MAL',
  // Gospels & Acts
  Matthew: 'MAT', Matt: 'MAT', Mt: 'MAT',
  Mark: 'MRK', Mk: 'MRK',
  Luke: 'LUK', Lk: 'LUK',
  John: 'JHN', Jn: 'JHN',
  Acts: 'ACT',
  // Pauline Epistles
  Romans: 'ROM', Rom: 'ROM',
  '1 Corinthians': '1CO', '1Corinthians': '1CO', '1Cor': '1CO',
  '2 Corinthians': '2CO', '2Corinthians': '2CO', '2Cor': '2CO',
  Galatians: 'GAL', Gal: 'GAL',
  Ephesians: 'EPH', Eph: 'EPH',
  Philippians: 'PHP', Phil: 'PHP',
  Colossians: 'COL', Col: 'COL',
  '1 Thessalonians': '1TH', '1Thessalonians': '1TH', '1Thess': '1TH',
  '2 Thessalonians': '2TH', '2Thessalonians': '2TH', '2Thess': '2TH',
  '1 Timothy': '1TI', '1Timothy': '1TI', '1Tim': '1TI',
  '2 Timothy': '2TI', '2Timothy': '2TI', '2Tim': '2TI',
  Titus: 'TIT',
  Philemon: 'PHM', Phlm: 'PHM',
  // General Epistles
  Hebrews: 'HEB', Heb: 'HEB',
  James: 'JAS', Jas: 'JAS',
  '1 Peter': '1PE', '1Peter': '1PE', '1Pet': '1PE',
  '2 Peter': '2PE', '2Peter': '2PE', '2Pet': '2PE',
  '1 John': '1JN', '1John': '1JN',
  '2 John': '2JN', '2John': '2JN',
  '3 John': '3JN', '3John': '3JN',
  Jude: 'JUD',
  Revelation: 'REV', Rev: 'REV',
}

// Sort by descending length so longer variants ("Song of Songs") are tried
// before shorter ones ("Song") in the regex alternation.
const BOOK_PATTERN = Object.keys(BOOKS)
  .sort((a, b) => b.length - a.length)
  .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

// Matches: BookName chapter:verse[-endVerse]
// e.g.  John 3:16   |  Rev 22:20-21  |  1 Cor 13:4-7
const BIBLE_REF_RE = new RegExp(
  `\\b(${BOOK_PATTERN})\\.?\\s+(\\d+):(\\d+)(?:[\\u2013\\u2014-](\\d+))?`,
  'g',
)

/** Convert a regex match to an api.bible passage ID. */
function toPassageId(bookRaw: string, ch: string, v: string, endV?: string): string | null {
  const code = BOOKS[bookRaw]
  if (!code) return null
  if (!endV) return `${code}.${ch}.${v}`
  return `${code}.${ch}.${v}-${code}.${ch}.${endV}`
}

// Tags whose text content should NOT be wrapped (links, code, etc.)
const SKIP_TAGS = new Set(['a', 'code', 'pre', 'script', 'style', 'span'])

/**
 * Walk the HTML string, processing only plain-text nodes that aren't inside
 * SKIP_TAGS, and wrap detected Bible references with an interactive span.
 */
export function processBibleRefs(html: string): string {
  // Split by HTML tags, preserving them as separate parts
  const parts = html.split(/(<[^>]*>)/g)
  const stack: string[] = []
  const out: string[] = []

  for (const part of parts) {
    if (part.startsWith('<')) {
      const close   = part.startsWith('</')
      const tagName = (part.match(/^<\/?([a-z][a-z0-9]*)/i)?.[1] ?? '').toLowerCase()
      if (SKIP_TAGS.has(tagName)) {
        if (close) {
          const i = stack.lastIndexOf(tagName)
          if (i !== -1) stack.splice(i, 1)
        } else if (!part.endsWith('/>')) {
          stack.push(tagName)
        }
      }
      out.push(part)
      continue
    }

    // Text node
    if (stack.length > 0 || !part.trim()) {
      out.push(part)
      continue
    }

    // Replace recognised Bible references
    out.push(
      part.replace(BIBLE_REF_RE, (match, book, ch, v, endV) => {
        const passageId = toPassageId(book, ch, v, endV)
        if (!passageId) return match
        const encoded = encodeURIComponent(match)
        return `<span class="bible-ref" tabindex="0" role="button" aria-label="Bible verse: ${match}" data-bible-ref="${passageId}" data-bible-text="${encoded}">${match}</span>`
      }),
    )
  }

  return out.join('')
}
