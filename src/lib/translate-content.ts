import { createAdminClient } from '@/lib/supabase/admin'
import { translateText, translateArray } from '@/lib/translate-api'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/types'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

interface SourceContent {
  id:             string
  language:       Locale
  title:          string
  theme:          string | null
  series:         string | null
  speaker:        string | null
  body_html:      string | null
  extracted_text: string | null
  summary_points: string[] | null
  scripture_refs: string[]
}

interface TranslatedFields {
  title:          string
  theme:          string | null
  series:         string | null
  speaker:        string | null
  body_html:      string | null
  extracted_text: string | null
  summary_points: string[] | null
  scripture_refs: string[]
}

/**
 * Translate the given content row into every supported locale except its source.
 * Upserts one row into content_translations per target locale.
 *
 * Best-effort: a failure on one locale doesn't stop the others.
 * Returns which locales succeeded and which failed (with messages).
 */
export async function translateContentToAllLocales(
  source: SourceContent,
): Promise<{
  ok:     Locale[]
  errors: { locale: Locale; message: string }[]
}> {
  const supabase = createAdminClient()
  const targets  = routing.locales.filter(l => l !== source.language) as Locale[]

  const ok:     Locale[] = []
  const errors: { locale: Locale; message: string }[] = []

  /* Run sequentially. Microsoft can absolutely handle parallel requests on the
     free tier, but sequential keeps the failure mode easier to reason about and
     gives us predictable rate-limit behaviour if quota ever gets tight. */
  for (const [i, target] of targets.entries()) {
    // Brief pause between locales so parallel field calls from the previous
    // locale have cleared Microsoft Translator's per-second quota window.
    if (i > 0) await sleep(800)
    try {
      const translated = await translateOne(source, target)

      const { error } = await (supabase
        .from('content_translations')
        .upsert(
          {
            content_id:            source.id,
            locale:                target,
            title:                 translated.title,
            theme:                 translated.theme,
            series:                translated.series,
            speaker:               translated.speaker,
            body_html:             translated.body_html,
            extracted_text:        translated.extracted_text,
            summary_points:        translated.summary_points,
            scripture_refs:        translated.scripture_refs,
            is_machine_translated: true,
            translated_at:         new Date().toISOString(),
          } as never,
          { onConflict: 'content_id,locale' }
        ))

      if (error) {
        errors.push({ locale: target, message: error.message })
      } else {
        ok.push(target)
      }
    } catch (err) {
      errors.push({
        locale:  target,
        message: err instanceof Error ? err.message : 'Translation failed',
      })
    }
  }

  return { ok, errors }
}

/* Translate one content row into a single target locale. Doesn't write to DB. */
async function translateOne(
  source: SourceContent,
  target: Locale,
): Promise<TranslatedFields> {
  const opts = { sourceLocale: source.language }

  const [title, theme, series, body_html, extracted_text, summary_points] = await Promise.all([
    translateText(source.title, target, opts),
    source.theme  ? translateText(source.theme,  target, opts) : Promise.resolve(null),
    source.series ? translateText(source.series, target, opts) : Promise.resolve(null),
    source.body_html
      ? translateText(source.body_html, target, { ...opts, isHtml: true })
      : Promise.resolve(null),
    source.extracted_text
      ? translateText(source.extracted_text, target, opts)
      : Promise.resolve(null),
    source.summary_points && source.summary_points.length > 0
      ? translateArray(source.summary_points, target, opts)
      : Promise.resolve(null),
  ])

  return {
    title:          title || source.title,   // fall back to source if MS returns empty
    theme,
    series,
    speaker:        source.speaker,           // proper noun — don't translate
    body_html,
    extracted_text,
    summary_points,
    scripture_refs: source.scripture_refs,    // verse refs — don't translate
  }
}