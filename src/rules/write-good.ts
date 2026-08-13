import type { Rule } from 'eslint'

import writeGoodLib from 'write-good'

import { extractLogicalComments } from '../extract.js'
import { sourceRangeForSpan } from '../normalize.js'

type WriteGoodOptions = NonNullable<Parameters<typeof writeGoodLib>[1]>

const CHECK_NAMES = [
  'adverb',
  'cliches',
  'eprime',
  'illusion',
  'passive',
  'so',
  'thereIs',
  'tooWordy',
  'weasel',
] as const

/* eslint-disable comment-slop/write-short -- this block is the rule's documentation, extracted by codegen */
/**
 * Flags weak or unclear prose in comments — passive voice, weasel words, wordy phrases, lexical
 * illusions, and more — by running each comment through
 * [write-good](https://github.com/btford/write-good).
 *
 * Credit to [`eslint-plugin-write-good-comments`](https://github.com/kantord/eslint-plugin-write-good-comments)
 * by Dániel Kántor, for the inspiration for this rule.
 *
 * The rule checks each comment as one unit — a run of adjacent `//` lines, a block, or a JSDoc
 * section — so it catches a sentence wrapped across lines, and points at the exact offending word.
 *
 * Tooling directives (`eslint-disable*`, `@ts-expect-error`, and the rest) stay exempt, but the rule
 * checks a directive's justification as ordinary prose and skips JSDoc `@example` and `@see` sections.
 *
 * The rule provides no autofix: rewriting prose is a writing decision, not a mechanical one.
 *
 * ## Options
 *
 * A single options object toggles individual [write-good checks](https://github.com/btford/write-good#checks)
 * and exempts words. Every check except `eprime` stays on by default.
 *
 * @example
 * ```js
 * 'comment-slop/write-good': ['warn', { passive: false, whitelist: ['only'] }]
 * ```
 *
 * | Option | Type | Default | Description |
 * | :-- | :-- | :-- | :-- |
 * | `passive` | `boolean` | `true` | Flag passive voice. |
 * | `illusion` | `boolean` | `true` | Flag lexical illusions (a repeated word). |
 * | `so` | `boolean` | `true` | Flag `so` at the start of a sentence. |
 * | `thereIs` | `boolean` | `true` | Flag `there is` / `there are` at the start of a sentence. |
 * | `weasel` | `boolean` | `true` | Flag weasel words. |
 * | `adverb` | `boolean` | `true` | Flag adverbs that can weaken meaning. |
 * | `tooWordy` | `boolean` | `true` | Flag wordy phrases. |
 * | `cliches` | `boolean` | `true` | Flag common clichés. |
 * | `eprime` | `boolean` | `false` | Flag "to be" verbs (E-Prime). |
 * | `whitelist` | `string[]` | `[]` | Words to exempt from every check. |
 */
/* eslint-enable comment-slop/write-short */
export const writeGood: Rule.RuleModule = {
  create(context) {
    const options = readOptions(context.options[0])

    return {
      'Program:exit'() {
        for (const comment of extractLogicalComments(context.sourceCode)) {
          for (const problem of writeGoodLib(comment.text, options)) {
            const [start, end] =
              sourceRangeForSpan(comment.words, problem.index, problem.index + problem.offset) ?? comment.range
            context.report({
              data: { reason: problem.reason },
              loc: {
                end: context.sourceCode.getLocFromIndex(end),
                start: context.sourceCode.getLocFromIndex(start),
              },
              messageId: 'prose',
            })
          }
        }
      },
    }
  },
  meta: {
    defaultOptions: [{}],
    docs: {
      description: 'Enforce good writing style in comments (passive voice, weasel words, wordy phrases, and more).',
    },
    messages: {
      prose: '{{reason}}.',
    },
    schema: [
      {
        additionalProperties: false,
        description: 'Toggles individual write-good checks and exempts words.',
        properties: {
          adverb: { description: 'Flag adverbs that can weaken meaning.', type: 'boolean' },
          cliches: { description: 'Flag common clichés.', type: 'boolean' },
          eprime: { description: 'Flag "to be" verbs (E-Prime); off by default.', type: 'boolean' },
          illusion: { description: 'Flag lexical illusions (a repeated word).', type: 'boolean' },
          passive: { description: 'Flag passive voice.', type: 'boolean' },
          so: { description: 'Flag "so" at the start of a sentence.', type: 'boolean' },
          thereIs: { description: 'Flag "there is" / "there are" at the start of a sentence.', type: 'boolean' },
          tooWordy: { description: 'Flag wordy phrases.', type: 'boolean' },
          weasel: { description: 'Flag weasel words.', type: 'boolean' },
          whitelist: { description: 'Words to exempt from every check.', items: { type: 'string' }, type: 'array' },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
}

function readOptions(raw: unknown): WriteGoodOptions {
  if (typeof raw !== 'object' || raw === null) return {}

  const options: WriteGoodOptions = {}
  for (const name of CHECK_NAMES) {
    const value: unknown = Reflect.get(raw, name)
    if (typeof value === 'boolean') options[name] = value
  }

  const whitelist: unknown = Reflect.get(raw, 'whitelist')
  if (Array.isArray(whitelist)) options.whitelist = whitelist.filter((word): word is string => typeof word === 'string')

  return options
}
