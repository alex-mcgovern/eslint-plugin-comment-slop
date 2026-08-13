/** A slice of comment prose plus the source index where it begins. */
export interface TextChunk {
  sourceStart: number
  text: string
}

interface NormalizedText {
  sourceSpan: [number, number] | null
  text: string
}

const WORD_PATTERN = /\S+/gu

/** Collapses chunks of comment prose into one space-separated string. */
export function buildNormalizedText(chunks: readonly TextChunk[]): NormalizedText {
  const parts: string[] = []
  let firstWordStart: number | null = null
  let lastWordEnd = 0

  for (const chunk of chunks) {
    for (const match of chunk.text.matchAll(WORD_PATTERN)) {
      const wordStart = chunk.sourceStart + match.index
      firstWordStart ??= wordStart
      lastWordEnd = wordStart + match[0].length
      parts.push(match[0])
    }
  }

  return {
    sourceSpan: firstWordStart === null ? null : [firstWordStart, lastWordEnd],
    text: parts.join(' '),
  }
}
