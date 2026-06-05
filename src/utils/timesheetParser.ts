import type { LineItem } from '../types/invoice'

export interface ParsedRow {
  date: string // ISO YYYY-MM-DD, or '' if unparseable
  project: string
  description: string
  qty: number
  unit: LineItem['unit']
  rate: number
  // diagnostics
  rawLine: string
  errors: string[]
  warnings: string[]
}

export interface ParseResult {
  rows: ParsedRow[]
  delimiter: '\t' | '|' | ','
  hadHeader: boolean
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const toISO = (y: number, m: number, d: number): string =>
  `${y}-${pad2(m + 1)}-${pad2(d)}`

/** Parse a wide variety of date strings into ISO YYYY-MM-DD. Returns '' if it can't. */
export function parseDate(input: string, defaultYear?: number): string {
  const s = input.trim()
  if (!s) return ''

  // Already ISO
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return toISO(+iso[1], +iso[2] - 1, +iso[3])

  // DD/MM/YYYY or D/M/YY (assume DD/MM since this is an AU app)
  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (slash) {
    let y = +slash[3]
    if (y < 100) y += 2000
    return toISO(y, +slash[2] - 1, +slash[1])
  }

  // "Apr 21", "Apr 21 2026", "21 Apr", "21 Apr 2026", "Tue, Apr 21", "Tue Apr 21"
  // Strip leading weekday + comma
  const noWeekday = s.replace(/^(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*,?\s+/i, '')

  // "Apr 21 [2026]" or "Apr 21,[2026]"
  const monFirst = noWeekday.match(/^([a-z]+)\.?\s+(\d{1,2})(?:[,\s]+(\d{2,4}))?$/i)
  if (monFirst) {
    const m = MONTHS[monFirst[1].toLowerCase()]
    if (m !== undefined) {
      let y = monFirst[3] ? +monFirst[3] : (defaultYear ?? new Date().getFullYear())
      if (y < 100) y += 2000
      return toISO(y, m, +monFirst[2])
    }
  }

  // "21 Apr [2026]"
  const dayFirst = noWeekday.match(/^(\d{1,2})\s+([a-z]+)\.?(?:[,\s]+(\d{2,4}))?$/i)
  if (dayFirst) {
    const m = MONTHS[dayFirst[2].toLowerCase()]
    if (m !== undefined) {
      let y = dayFirst[3] ? +dayFirst[3] : (defaultYear ?? new Date().getFullYear())
      if (y < 100) y += 2000
      return toISO(y, m, +dayFirst[1])
    }
  }

  return ''
}

/**
 * Parse duration into decimal hours.
 *  - "1:30:00" -> 1.5
 *  - "0:30" -> 0.5
 *  - "2.5" or "2.5h" -> 2.5
 *  - "45m" -> 0.75
 * Returns NaN if unparseable.
 */
export function parseDuration(input: string): number {
  const s = input.trim().toLowerCase()
  if (!s) return NaN

  // HH:MM:SS or HH:MM
  const colon = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (colon) {
    const h = +colon[1]
    const m = +colon[2]
    const sec = colon[3] ? +colon[3] : 0
    return Math.round((h + m / 60 + sec / 3600) * 10000) / 10000
  }

  // "1h 30m", "90m", "2h"
  const hm = s.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?\s*$/)
  if (hm && (hm[1] || hm[2])) {
    const h = hm[1] ? +hm[1] : 0
    const m = hm[2] ? +hm[2] : 0
    return Math.round((h + m / 60) * 10000) / 10000
  }

  // Plain decimal
  const num = +s.replace(/[^\d.\-]/g, '')
  if (!Number.isNaN(num) && Number.isFinite(num)) return num

  return NaN
}

/** Detect the most likely delimiter on a sample of lines. */
function detectDelimiter(lines: string[]): '\t' | '|' | ',' {
  const counts = { '\t': 0, '|': 0, ',': 0 }
  for (const line of lines) {
    counts['\t'] += (line.match(/\t/g) || []).length
    counts['|'] += (line.match(/\|/g) || []).length
    counts[','] += (line.match(/,/g) || []).length
  }
  if (counts['\t'] >= counts['|'] && counts['\t'] >= counts[',']) return '\t'
  if (counts['|'] >= counts[',']) return '|'
  return ','
}

const HEADER_KEYS = ['date', 'project', 'description', 'desc', 'duration', 'hours', 'qty', 'rate']

/**
 * Parse the textarea content. Expected columns (any delimiter):
 *   date | project | description | duration | rate
 * `rate` is optional — uses defaultRate if omitted.
 */
export function parseTimesheet(
  text: string,
  defaultRate: number,
  defaultYear?: number
): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return { rows: [], delimiter: '\t', hadHeader: false }
  }

  const delimiter = detectDelimiter(lines)

  // Header detection: first line contains 2+ recognized header keys
  const firstCells = lines[0].split(delimiter).map((c) => c.trim().toLowerCase())
  const hadHeader = firstCells.filter((c) => HEADER_KEYS.includes(c)).length >= 2

  const dataLines = hadHeader ? lines.slice(1) : lines

  const rows: ParsedRow[] = dataLines.map((line) => {
    const cells = line.split(delimiter).map((c) => c.trim())
    const errors: string[] = []
    const warnings: string[] = []

    const [rawDate = '', project = '', description = '', rawDur = '', rawRate = ''] = cells
    if (cells.length < 4) {
      errors.push(`Expected at least 4 columns (date, project, description, duration); got ${cells.length}`)
    }

    const date = parseDate(rawDate, defaultYear)
    if (rawDate && !date) errors.push(`Couldn't parse date "${rawDate}"`)

    const qty = parseDuration(rawDur)
    if (rawDur && Number.isNaN(qty)) errors.push(`Couldn't parse duration "${rawDur}"`)

    let rate = defaultRate
    if (rawRate) {
      const r = +rawRate.replace(/[^\d.\-]/g, '')
      if (!Number.isNaN(r) && Number.isFinite(r)) rate = r
      else warnings.push(`Couldn't parse rate "${rawRate}", using default ${defaultRate}`)
    }

    return {
      date,
      project,
      description,
      qty: Number.isNaN(qty) ? 0 : Math.round(qty * 100) / 100,
      unit: 'hrs' as const,
      rate,
      rawLine: line,
      errors,
      warnings,
    }
  })

  return { rows, delimiter, hadHeader }
}
