import type { CaseGroup } from './cases.js'

export const caseGroups: CaseGroup[] = [
  {
    description:
      'Passive voice hides who does the action. write-good flags it, and the report points at the exact phrase.',
    invalid: [
      {
        code: '// files are handled by loadContent()',
        errors: [{ data: { reason: '"are handled" may be passive voice' }, messageId: 'prose' }],
        name: 'passive voice in a line comment',
      },
    ],
    title: 'Passive voice',
    valid: [{ code: '// loadContent handles the files', name: 'the active-voice rewrite' }],
  },
  {
    description:
      'Weasel words — vague qualifiers like "several" — read as filler. The report highlights just the offending word.',
    invalid: [
      {
        code: '// There are several tasks that run nightly',
        errors: [
          {
            column: 14,
            data: { reason: '"several" is a weasel word' },
            endColumn: 21,
            endLine: 1,
            line: 1,
            messageId: 'prose',
          },
        ],
        name: 'a weasel word, reported at its exact location',
      },
    ],
    title: 'Weasel words',
    valid: [{ code: '// Clears the cache on every write', name: 'a concrete statement' }],
  },
  {
    description: 'Wordy expressions bury the point. write-good flags them so a shorter phrasing can take their place.',
    invalid: [
      {
        code: '// by virtue of the fact that the token is missing',
        errors: [{ data: { reason: '"by virtue of the fact that" is wordy or unneeded' }, messageId: 'prose' }],
        name: 'a wordy expression',
      },
    ],
    title: 'Wordy phrases',
    valid: [{ code: '// because the token is missing', name: 'the concise rewrite' }],
  },
  {
    description:
      'Lexical illusions — a word accidentally repeated — slip past re-reads. write-good catches the duplicate.',
    invalid: [
      {
        code: '// the the plugin system loads first',
        errors: [{ data: { reason: '"the" is repeated' }, messageId: 'prose' }],
        name: 'a repeated word',
      },
    ],
    title: 'Lexical illusions',
    valid: [{ code: '// the plugin system loads first', name: 'no repetition' }],
  },
  {
    description: 'Intensifying adverbs like "really" weaken the words they modify. write-good flags them.',
    invalid: [
      {
        code: '// the cache is really large',
        errors: [{ data: { reason: '"really" can weaken meaning' }, messageId: 'prose' }],
        name: 'an adverb that weakens meaning',
      },
    ],
    title: 'Weak adverbs',
    valid: [{ code: '// The due date for the task', name: 'a plain description' }],
  },
  {
    description:
      'Prose is analyzed per logical comment, so a sentence split across adjacent `//` lines is judged as one unit. ' +
      'Tooling directives are exempt, but their justifications are checked as prose.',
    invalid: [
      {
        code: ['// files are', '// handled by loadContent'].join('\n'),
        errors: [{ data: { reason: '"are handled" may be passive voice' }, messageId: 'prose' }],
        name: 'passive voice spanning a merged line run',
      },
      {
        code: '// eslint-disable-next-line no-eval -- files are handled here',
        errors: [{ data: { reason: '"are handled" may be passive voice' }, messageId: 'prose' }],
        name: 'the directive keyword is exempt, but its justification is checked',
      },
    ],
    title: 'Logical comments',
    valid: [{ code: '// eslint-disable-next-line no-eval', name: 'a bare directive is not prose' }],
  },
  {
    description:
      'Each [write-good check](https://github.com/btford/write-good#checks) can be turned off, and `whitelist` exempts individual words.',
    invalid: [
      {
        code: '// the only cache',
        errors: [{ data: { reason: '"only" can weaken meaning' }, messageId: 'prose' }],
        name: '"only" is flagged by default',
      },
    ],
    title: 'Configuring checks',
    valid: [
      {
        code: '// files are handled by loadContent()',
        name: 'passive voice, with the passive check disabled',
        options: [{ passive: false }],
      },
      { code: '// the only cache', name: '"only" exempted via whitelist', options: [{ whitelist: ['only'] }] },
    ],
  },
  {
    description: 'Words inside inline code, code fences, and URLs are not prose, so write-good leaves them alone.',
    invalid: [],
    title: 'Code and links',
    valid: [
      { code: '// pass `only` to disable the check', name: 'a flagged word inside inline code is ignored' },
      { code: '// see https://example.com/several/things', name: 'a flagged word inside a URL is ignored' },
    ],
  },
]
