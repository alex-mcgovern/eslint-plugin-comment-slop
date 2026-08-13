import type { SourceCode } from 'eslint'

import type { TextChunk } from './normalize.js'

import { matchDirective } from './directives.js'
import { DEFAULT_IGNORED_JSDOC_TAGS, extractJsdocSections } from './jsdoc.js'
import { buildNormalizedText } from './normalize.js'

/** The kinds of logical comment the rules can be configured against. */
export type LogicalCommentKind = 'block' | 'jsdoc' | 'line'

interface ExtractOptions {
  jsdocIgnoredTags?: readonly string[]
}

/** A unit of comment prose: merged `//` runs, blocks, JSDoc sections, justifications. */
export interface LogicalComment {
  kind: LogicalCommentKind
  label: string
  range: [number, number]
  text: string
}

type SourceComment = ReturnType<SourceCode['getAllComments']>[number]

const LINE_MARKER_LENGTH = '//'.length
const BLOCK_MARKER_LENGTH = '/*'.length
const BLOCK_GUTTER = /^\s*\*(?=\s|$)/u

/**
 * Extracts every logical comment from a file, applying merging, normalization, directive
 * carve-outs, and JSDoc sectioning.
 */
export function extractLogicalComments(sourceCode: SourceCode, options: ExtractOptions = {}): LogicalComment[] {
  const ignoredJsdocTags = new Set(
    (options.jsdocIgnoredTags ?? DEFAULT_IGNORED_JSDOC_TAGS).map((tag) => tag.toLowerCase()),
  )
  const logicalComments: LogicalComment[] = []
  let openRun: SourceComment[] = []

  const append = (logical: LogicalComment | null): void => {
    if (logical) logicalComments.push(logical)
  }
  const flushRun = (): void => {
    if (openRun.length > 0) append(buildFromLineRun(openRun))
    openRun = []
  }

  for (const comment of sourceCode.getAllComments()) {
    // The types say Line | Block, but shebangs surface here too (as Shebang/Hashbang).
    const commentType: string = comment.type
    if (commentType === 'Block') {
      flushRun()
      for (const logical of buildFromBlockComment(comment, ignoredJsdocTags)) append(logical)
      continue
    }
    if (commentType !== 'Line') {
      flushRun()
      continue
    }

    const directive = matchDirective(comment.value, requireRange(comment)[0] + LINE_MARKER_LENGTH, 'line')
    if (directive) {
      flushRun()
      if (directive.justification) {
        append(buildLogicalComment([directive.justification], 'line', 'directive justification'))
      }
      continue
    }

    if (!continuesRun(sourceCode, openRun, comment)) flushRun()
    openRun.push(comment)
  }
  flushRun()

  return logicalComments
}

function continuesRun(sourceCode: SourceCode, openRun: readonly SourceComment[], comment: SourceComment): boolean {
  if (!isOwnLine(sourceCode, comment)) return false
  const previous = openRun.at(-1)
  if (!previous || !isOwnLine(sourceCode, previous)) return false
  const previousEndLine = sourceCode.getLocFromIndex(requireRange(previous)[1]).line
  return sourceCode.getLocFromIndex(requireRange(comment)[0]).line === previousEndLine + 1
}

function isOwnLine(sourceCode: SourceCode, comment: SourceComment): boolean {
  const start = sourceCode.getLocFromIndex(requireRange(comment)[0])
  return sourceCode.lines[start.line - 1].slice(0, start.column).trim() === ''
}

function buildFromLineRun(run: readonly SourceComment[]): LogicalComment | null {
  const chunks = run.map((comment) => ({
    sourceStart: requireRange(comment)[0] + LINE_MARKER_LENGTH,
    text: comment.value,
  }))
  return buildLogicalComment(chunks, 'line', 'line comment', [
    requireRange(run[0])[0],
    requireRange(run[run.length - 1])[1],
  ])
}

function buildFromBlockComment(
  comment: SourceComment,
  ignoredJsdocTags: ReadonlySet<string>,
): (LogicalComment | null)[] {
  const [rangeStart, rangeEnd] = requireRange(comment)
  const contentStart = rangeStart + BLOCK_MARKER_LENGTH

  const directive = matchDirective(comment.value, contentStart, 'block')
  if (directive) {
    return directive.justification
      ? [buildLogicalComment([directive.justification], 'block', 'directive justification')]
      : []
  }

  if (comment.value.startsWith('*')) {
    return extractJsdocSections(`/*${comment.value}*/`, rangeStart, ignoredJsdocTags).map((section) =>
      buildLogicalComment(section.chunks, 'jsdoc', section.label),
    )
  }

  return [
    buildLogicalComment(blockProseChunks(comment.value, contentStart), 'block', 'block comment', [
      rangeStart,
      rangeEnd,
    ]),
  ]
}

function blockProseChunks(value: string, contentStart: number): TextChunk[] {
  const chunks: TextChunk[] = []
  let lineStart = 0

  for (const line of value.split('\n')) {
    const gutter = BLOCK_GUTTER.exec(line)
    const gutterLength = gutter ? gutter[0].length : 0
    chunks.push({ sourceStart: contentStart + lineStart + gutterLength, text: line.slice(gutterLength) })
    lineStart += line.length + 1
  }

  return chunks
}

function buildLogicalComment(
  chunks: readonly TextChunk[],
  kind: LogicalCommentKind,
  label: string,
  explicitRange?: [number, number],
): LogicalComment | null {
  const { sourceSpan, text } = buildNormalizedText(chunks)
  if (!sourceSpan) return null
  return { kind, label, range: explicitRange ?? sourceSpan, text }
}

function requireRange(comment: SourceComment): [number, number] {
  if (!comment.range) throw new Error('ESLint comments always carry ranges')
  return comment.range
}
