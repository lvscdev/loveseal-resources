import type { Locale } from '@/types'

const MS_LOCALE_MAP: Record<Locale, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  pt: 'pt',   
  ar: 'ar',
}

interface TranslateOptions {
  sourceLocale?: Locale
  isHtml?: boolean
}

interface MsTranslation {
  text: string
  to:   string
}

interface MsResponseItem {
  detectedLanguage?: { language: string; score: number }
  translations:      MsTranslation[]
}

const ENDPOINT_BASE = 'https://api.cognitive.microsofttranslator.com/translate'

function getCreds(): { key: string; region: string } {
  const key    = process.env.MS_TRANSLATOR_KEY
  const region = process.env.MS_TRANSLATOR_REGION
  if (!key)    throw new Error('MS_TRANSLATOR_KEY is not set')
  if (!region) throw new Error('MS_TRANSLATOR_REGION is not set')
  return { key, region }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/* Retry a fetch call up to `attempts` times, backing off on 429. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let delay = 1000
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, init)
    if (res.status !== 429) return res
    if (i < attempts - 1) await sleep(delay)
    delay *= 2
  }
  // Last attempt — return whatever we get
  return fetch(url, init)
}

/**
 * Translate a single string into the target locale.
 * Returns '' for empty/whitespace input. Throws on API error.
 */
export async function translateText(
  text:         string,
  targetLocale: Locale,
  options:      TranslateOptions = {},
): Promise<string> {
  if (!text || !text.trim()) return ''

  const { key, region } = getCreds()
  const isHtml = options.isHtml ?? /<[a-z][\s\S]*>/i.test(text)

  const params = new URLSearchParams({
    'api-version': '3.0',
    to:            MS_LOCALE_MAP[targetLocale],
    textType:      isHtml ? 'html' : 'plain',
  })
  if (options.sourceLocale) {
    params.append('from', MS_LOCALE_MAP[options.sourceLocale])
  }

  const url = `${ENDPOINT_BASE}?${params.toString()}`

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key':    key,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type':                 'application/json',
    },
    body: JSON.stringify([{ text }]),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Microsoft Translator error ${res.status}: ${errBody}`)
  }

  const data = (await res.json()) as MsResponseItem[]
  return data[0]?.translations[0]?.text ?? ''
}

/**
 * Translate an array of strings (e.g. summary_points).
 * Sends them all in a single API call to save quota.
 *
 * Microsoft limits: 100 strings or 50,000 chars total per request.
 * Our typical use (summary_points ≤ 10 items) is well within those.
 */
export async function translateArray(
  texts:        string[],
  targetLocale: Locale,
  options:      TranslateOptions = {},
): Promise<string[]> {
  if (!texts.length) return []

  const { key, region } = getCreds()

  // Filter empties but remember positions for reassembly
  const nonEmpty: { idx: number; text: string }[] = []
  texts.forEach((t, idx) => {
    if (t && t.trim()) nonEmpty.push({ idx, text: t })
  })
  if (nonEmpty.length === 0) return texts.map(() => '')

  const params = new URLSearchParams({
    'api-version': '3.0',
    to:            MS_LOCALE_MAP[targetLocale],
    textType:      'plain',
  })
  if (options.sourceLocale) {
    params.append('from', MS_LOCALE_MAP[options.sourceLocale])
  }

  const url = `${ENDPOINT_BASE}?${params.toString()}`

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key':    key,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type':                 'application/json',
    },
    body: JSON.stringify(nonEmpty.map(x => ({ text: x.text }))),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Microsoft Translator error ${res.status}: ${errBody}`)
  }

  const data = (await res.json()) as MsResponseItem[]
  const translations = data.map(d => d.translations[0]?.text ?? '')

  // Reassemble in original order with empties preserved
  const result = [...texts]
  nonEmpty.forEach((entry, i) => {
    result[entry.idx] = translations[i] ?? entry.text
  })
  return result
}