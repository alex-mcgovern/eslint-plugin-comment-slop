import type { Rule } from 'eslint'

import { retext } from 'retext'
import retextReadability from 'retext-readability'

import { extractLogicalComments } from '../extract.js'
import { sourceRangeForSpan, toProse } from '../normalize.js'

interface ReadabilitySettings {
  age?: number
  minWords?: number
  threshold?: number
}

const DEFAULT_AGE = 18

/* eslint-disable comment-slop/write-short -- this block is the rule's documentation, extracted by codegen */
/**
 * Flags comment sentences that are hard to read, using
 * [retext-readability](https://github.com/retextjs/retext-readability).
 *
 * The rule scores each sentence with seven readability formulas. When enough of them agree that a
 * sentence is too dense for the target reading age, it reports the sentence. Dense, jargon-packed
 * prose — the house style of a rushed AI comment — is what this catches.
 *
 * It reuses the same logical comments as the other rules and points at the sentence in the source.
 * It provides no autofix: clearer wording is a writing decision, not a mechanical one.
 *
 * ## Options
 *
 * A single options object tunes the target reading level.
 *
 * @example
 * ```js
 * 'comment-slop/write-clear': ['warn', { age: 22 }]
 * ```
 *
 * | Option | Type | Default | Description |
 * | :-- | :-- | :-- | :-- |
 * | `age` | `number` | `18` | Target reading age. Raise it to tolerate denser prose. |
 * | `minWords` | `number` | `5` | Skip sentences shorter than this. |
 * | `threshold` | `number` | `4/7` | Share of the seven formulas that must agree before flagging. |
 */
/* eslint-enable comment-slop/write-short */
export const writeClear: Rule.RuleModule = {
  create(context) {
    const settings = readOptions(context.options[0])
    const age = settings.age ?? DEFAULT_AGE
    const processor = retext().use(retextReadability, { ...settings, age })

    return {
      'Program:exit'() {
        for (const comment of extractLogicalComments(context.sourceCode)) {
          for (const message of processor.processSync(toProse(comment.text)).messages) {
            const place = message.place
            const mapped =
              place &&
              'start' in place &&
              typeof place.start.offset === 'number' &&
              typeof place.end.offset === 'number'
                ? sourceRangeForSpan(comment.words, place.start.offset, place.end.offset)
                : null
            const [start, end] = mapped ?? comment.range
            context.report({
              data: { age: String(age) },
              loc: {
                end: context.sourceCode.getLocFromIndex(end),
                start: context.sourceCode.getLocFromIndex(start),
              },
              messageId: 'hardToRead',
            })
          }
        }
      },
    }
  },
  meta: {
    defaultOptions: [{}],
    docs: {
      description: 'Flag comment sentences that are hard to read (dense, jargon-packed prose).',
    },
    messages: {
      hardToRead: 'Hard to read for a target age of {{age}} — simplify the sentence.',
    },
    schema: [
      {
        additionalProperties: false,
        description: 'Tunes the target reading level for comment prose.',
        properties: {
          age: { description: 'Target reading age; raise it to tolerate denser prose.', minimum: 1, type: 'integer' },
          minWords: { description: 'Skip sentences shorter than this many words.', minimum: 1, type: 'integer' },
          threshold: {
            description: 'Share of the seven formulas that must agree before flagging (0–1).',
            maximum: 1,
            minimum: 0,
            type: 'number',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
}

function readOptions(raw: unknown): ReadabilitySettings {
  if (typeof raw !== 'object' || raw === null) return {}

  const settings: ReadabilitySettings = {}
  const age: unknown = Reflect.get(raw, 'age')
  if (typeof age === 'number') settings.age = age
  const minWords: unknown = Reflect.get(raw, 'minWords')
  if (typeof minWords === 'number') settings.minWords = minWords
  const threshold: unknown = Reflect.get(raw, 'threshold')
  if (typeof threshold === 'number') settings.threshold = threshold

  return settings
}
