/** A slice of comment prose plus the source index where it begins. */
export interface TextChunk {
  sourceStart: number
  text: string
}

/** One word of the normalized text, mapping its position back to the source. */
export interface WordSpan {
  length: number
  sourceStart: number
  textStart: number
}

interface NormalizedText {
  sourceSpan: [number, number] | null
  text: string
  words: WordSpan[]
}

const WORD_PATTERN = /\S+/gu

const FENCED_CODE = /```[\s\S]*?```/gu
const INLINE_CODE = /`[^`]*`/gu
const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]*)\)/gu
const BARE_URL = /\bhttps?:\/\/[^\s)]+/gu

/** Joins comment prose chunks into one string, tracking each word's origin. */
export function buildNormalizedText(chunks: readonly TextChunk[]): NormalizedText {
  const parts: string[] = []
  const words: WordSpan[] = []
  let textStart = 0

  for (const chunk of chunks) {
    for (const match of chunk.text.matchAll(WORD_PATTERN)) {
      const word = match[0]
      words.push({ length: word.length, sourceStart: chunk.sourceStart + match.index, textStart })
      parts.push(word)
      textStart += word.length + 1
    }
  }

  const first = words.at(0)
  const last = words.at(-1)
  return {
    sourceSpan: first && last ? [first.sourceStart, last.sourceStart + last.length] : null,
    text: parts.join(' '),
    words,
  }
}

/** Maps a normalized `[start, end)` span to a source range, or null if none. */
export function sourceRangeForSpan(words: readonly WordSpan[], start: number, end: number): [number, number] | null {
  let sourceStart: number | null = null
  let sourceEnd = 0

  for (const word of words) {
    const overlapStart = Math.max(start, word.textStart)
    const overlapEnd = Math.min(end, word.textStart + word.length)
    if (overlapStart >= overlapEnd) continue
    sourceStart ??= word.sourceStart + (overlapStart - word.textStart)
    sourceEnd = word.sourceStart + (overlapEnd - word.textStart)
  }

  return sourceStart === null ? null : [sourceStart, sourceEnd]
}

/** Blanks code, links, and URLs (same length) so prose rules skip markup. */
export function toProse(text: string): string {
  return text
    .replace(FENCED_CODE, (match) => ' '.repeat(match.length))
    .replace(INLINE_CODE, (match) => ' '.repeat(match.length))
    .replace(MARKDOWN_LINK, (_match: string, label: string, url: string) => ` ${label} ${' '.repeat(url.length + 2)}`)
    .replace(BARE_URL, (match) => ' '.repeat(match.length))
}
