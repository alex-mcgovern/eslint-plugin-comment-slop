import type { CaseGroup } from './cases.js'

export const caseGroups: CaseGroup[] = [
  {
    description:
      'Dense, jargon-packed sentences — the house style of a rushed AI comment — score as hard to ' +
      'read across the seven formulas. The rule points at the offending sentence.',
    invalid: [
      {
        code: '// The utilization of a load-bearing abstraction facilitates comprehensive orchestration of downstream dependency resolution.',
        errors: [{ column: 4, data: { age: '18' }, endColumn: 126, endLine: 1, line: 1, messageId: 'hardToRead' }],
        name: 'a dense, jargon-packed sentence',
      },
    ],
    title: 'Dense prose',
    valid: [{ code: '// Reuses the cached result instead of recomputing it.', name: 'the plain rewrite' }],
  },
  {
    description:
      'Short notes are left alone: by default the rule skips sentences under five words, so a terse ' +
      'comment with one long word does not trip it. Lower `minWords` to check them too.',
    invalid: [
      {
        code: '// Instantiate the orchestrator.',
        errors: [{ data: { age: '18' }, messageId: 'hardToRead' }],
        name: 'a short sentence, once minWords is lowered',
        options: [{ minWords: 1 }],
      },
    ],
    title: 'Short sentences',
    valid: [{ code: '// Instantiate the orchestrator.', name: 'a short sentence is skipped by default' }],
  },
  {
    description:
      'Raise `age` to allow denser prose. A sentence flagged at the default reading age passes at a ' + 'higher one.',
    invalid: [
      {
        code: '// Subsequent invocations reuse the memoized computation rather than recomputing the derived aggregate.',
        errors: [{ data: { age: '18' }, messageId: 'hardToRead' }],
        name: 'flagged at the default reading age',
      },
    ],
    title: 'Configurable reading level',
    valid: [
      {
        code: '// Subsequent invocations reuse the memoized computation rather than recomputing the derived aggregate.',
        name: 'the same sentence passes at a higher age',
        options: [{ age: 30 }],
      },
    ],
  },
]
