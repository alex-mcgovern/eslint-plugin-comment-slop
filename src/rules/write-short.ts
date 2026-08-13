import type { Rule } from 'eslint'

import type { LogicalCommentKind } from '../extract.js'

import { extractLogicalComments } from '../extract.js'

const DEFAULT_MAX_LENGTH = 80

type ResolvedLimits = Record<LogicalCommentKind, number | false>

const LIMIT_SCHEMA = { anyOf: [{ minimum: 1, type: 'integer' }, { enum: [false] }] }

/* eslint-disable comment-slop/write-short -- this block is the rule's documentation, extracted by codegen */
/**
 * Enforces a maximum length on each **logical comment**'s normalized prose.
 *
 * A logical comment is:
 *
 * - a run of `//` comments on adjacent lines (blank lines, code, and directives break the run);
 * - a `/* ... *\/` block comment;
 * - one prose section of a JSDoc block — the description, or one tag's description. Tag names,
 *   `{type}` annotations, and parameter names never count.
 *
 * Normalization strips comment markers, `*` gutters, and repeated whitespace, and collapses line
 * breaks to single spaces — so the limit measures prose, not formatting, and a paragraph split
 * across many short lines is still judged as one unit.
 *
 * Tooling directives (`eslint-disable*`, `@ts-expect-error`, `biome-ignore`, `prettier-ignore`,
 * coverage and bundler pragmas, and similar) are exempt. A directive's justification is linted as
 * ordinary prose under the containing comment's kind.
 *
 * There is no autofix: shortening prose is a writing decision, not a mechanical one.
 *
 * ## Options
 *
 * Either a single number, applied to every comment kind:
 *
 * ```js
 * 'comment-slop/write-short': ['warn', 120]
 * ```
 *
 * Or an object with per-kind limits; omitted kinds default to `80`, and `false` disables a kind:
 *
 * ```js
 * 'comment-slop/write-short': ['warn', { line: 80, block: 120, jsdoc: false }]
 * ```
 *
 * | Option | Type | Default | Description |
 * | :-- | :-- | :-- | :-- |
 * | `line` | `number \| false` | `80` | Limit for `//` comments, including merged runs of adjacent lines. |
 * | `block` | `number \| false` | `80` | Limit for `/* ... *\/` comments that are not JSDoc. |
 * | `jsdoc` | `number \| false` | `80` | Limit for each prose section of a `/** ... *\/` block. |
 * | `jsdocIgnoredTags` | `string[]` | `['example', 'see']` | JSDoc tags whose sections are never checked. Replaces the default set. |
 */
/* eslint-enable comment-slop/write-short */
export const writeShort: Rule.RuleModule = {
  create(context) {
    const limits = resolveLimits(context.options[0])
    const extractOptions = { jsdocIgnoredTags: readIgnoredTags(context.options[0]) }

    return {
      'Program:exit'() {
        for (const comment of extractLogicalComments(context.sourceCode, extractOptions)) {
          const max = limits[comment.kind]
          if (max === false || comment.text.length <= max) continue
          context.report({
            data: { actual: String(comment.text.length), label: comment.label, max: String(max) },
            loc: {
              end: context.sourceCode.getLocFromIndex(comment.range[1]),
              start: context.sourceCode.getLocFromIndex(comment.range[0]),
            },
            messageId: 'tooLong',
          })
        }
      },
    }
  },
  meta: {
    defaultOptions: [DEFAULT_MAX_LENGTH],
    docs: {
      description: 'Enforce a maximum length on logical comments (merged line runs, blocks, JSDoc sections).',
    },
    messages: {
      tooLong: '{{label}} is {{actual}} characters (max {{max}}).',
    },
    schema: [
      {
        anyOf: [
          { minimum: 1, type: 'integer' },
          {
            additionalProperties: false,
            properties: {
              block: LIMIT_SCHEMA,
              jsdoc: LIMIT_SCHEMA,
              jsdocIgnoredTags: { items: { type: 'string' }, type: 'array' },
              line: LIMIT_SCHEMA,
            },
            type: 'object',
          },
        ],
        description: 'A single character limit for every comment kind, or per-kind limits.',
      },
    ],
    type: 'suggestion',
  },
}

function resolveLimits(option: unknown): ResolvedLimits {
  if (typeof option === 'number') return { block: option, jsdoc: option, line: option }
  return {
    block: readLimit(option, 'block'),
    jsdoc: readLimit(option, 'jsdoc'),
    line: readLimit(option, 'line'),
  }
}

function readIgnoredTags(option: unknown): readonly string[] | undefined {
  if (typeof option !== 'object' || option === null) return undefined
  const value: unknown = Reflect.get(option, 'jsdocIgnoredTags')
  if (!Array.isArray(value)) return undefined
  return value.filter((tag): tag is string => typeof tag === 'string')
}

function readLimit(option: unknown, kind: LogicalCommentKind): number | false {
  if (typeof option !== 'object' || option === null) return DEFAULT_MAX_LENGTH
  const value: unknown = Reflect.get(option, kind)
  if (typeof value === 'number' || value === false) return value
  return DEFAULT_MAX_LENGTH
}
