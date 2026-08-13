/** A slice of comment prose plus the source index where it begins. */
export interface TextChunk {
  sourceStart: number
  text: string
}

/** One word of the normalized text, tying its position there back to its source index. */
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

/** Collapses chunks of comment prose into one space-separated string, tracking each word's origin. */
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

/** Maps a normalized-text `[start, end)` span back to its source range, or null if it covers no word. */
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
