import type { Line, Spec, Tokens } from 'comment-parser'

import { parse, tokenizers } from 'comment-parser'

import type { TextChunk } from './normalize.js'

const NAME_BEARING_TAGS = new Set([
  'alias',
  'arg',
  'argument',
  'callback',
  'event',
  'namespace',
  'param',
  'prop',
  'property',
  'template',
  'typedef',
])

const tokenizeName = tokenizers.name()
const nameTokenizer = (spec: Spec): Spec => (NAME_BEARING_TAGS.has(spec.tag) ? tokenizeName(spec) : spec)

const JSDOC_TOKENIZERS = [
  tokenizers.tag(),
  tokenizers.type('preserve'),
  nameTokenizer,
  tokenizers.description('preserve'),
]

/** Tags whose content is a reference or code rather than prose, so length limits don't apply. */
export const DEFAULT_IGNORED_JSDOC_TAGS: readonly string[] = ['example', 'see']

interface JsdocSection {
  chunks: TextChunk[]
  label: string
}

/** Splits a JSDoc block into prose sections (description, then one per tag), excluding syntax. */
export function extractJsdocSections(
  rawText: string,
  rawSourceStart: number,
  ignoredTags: ReadonlySet<string>,
): JsdocSection[] {
  const block = parse(rawText, { spacing: 'preserve', tokenizers: JSDOC_TOKENIZERS }).at(0)
  if (!block) return []

  const lineStartOffsets = buildLineStartOffsets(rawText)
  const toChunk = (line: Line): TextChunk | null => {
    if (line.tokens.description.trim() === '') return null
    const lineStart = lineStartOffsets[line.number] ?? 0
    return {
      sourceStart: rawSourceStart + lineStart + descriptionColumn(line.tokens),
      text: line.tokens.description,
    }
  }

  const descriptionLines = block.source.filter((line) => line.tokens.tag === '' && !belongsToTag(block.tags, line))
  const proseTags = block.tags.filter((tag) => !ignoredTags.has(tag.tag.toLowerCase()))
  const sections = [
    { label: 'JSDoc description', lines: descriptionLines },
    ...proseTags.map((tag) => ({ label: tagLabel(tag), lines: tag.source })),
  ]

  return sections
    .map(({ label, lines }) => ({
      chunks: lines.map(toChunk).filter((chunk): chunk is TextChunk => chunk !== null),
      label,
    }))
    .filter((section) => section.chunks.length > 0)
}

function tagLabel(tag: Spec): string {
  const name = tag.name === '' ? '' : ` "${tag.name}"`
  return `JSDoc @${tag.tag}${name} description`
}

function belongsToTag(tags: readonly Spec[], line: Line): boolean {
  return tags.some((tag) => tag.source.includes(line))
}

function descriptionColumn(tokens: Tokens): number {
  const precedingTokens = [
    tokens.start,
    tokens.delimiter,
    tokens.postDelimiter,
    tokens.tag,
    tokens.postTag,
    tokens.type,
    tokens.postType,
    tokens.name,
    tokens.postName,
  ]
  return precedingTokens.reduce((column, token) => column + token.length, 0)
}

function buildLineStartOffsets(text: string): number[] {
  const offsets = [0]
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') offsets.push(index + 1)
  }
  return offsets
}
