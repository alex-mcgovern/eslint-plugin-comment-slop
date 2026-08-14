# eslint-plugin-comment-slop

ESLint rules that keep comments **short** and **well-written**.

Each rule judges a comment as one **logical comment** — a run of adjacent `//` lines, a block
comment, or one JSDoc prose section — so a paragraph wrapped across several lines is treated as one
unit, never nitpicked line by line.

- [Installation](#installation)
- [Configuration](#configuration)
- [Rules](#rules)
- [Development](#development)

## Installation

Requires ESLint 9+ (flat config) and Node.js 18+.

```sh
npm install --save-dev eslint-plugin-comment-slop
```

## Configuration

```js
// eslint.config.js
import commentSlop from 'eslint-plugin-comment-slop'

export default [
  {
    plugins: { 'comment-slop': commentSlop },
    rules: {
      'comment-slop/write-short': ['warn', 120],
      'comment-slop/write-good': 'warn',
    },
  },
]
```

No preset configurations are shipped at this time.

## Rules

| Rule                                         | Description                                              | 💡  | 🔧  |
| :------------------------------------------- | :------------------------------------------------------- | :-- | :-- |
| [`write-short`](./docs/rules/write-short.md) | Cap the length of each comment.                          |     |     |
| [`write-good`](./docs/rules/write-good.md)   | Flag weak prose — passive voice, weasel words, and more. |     |     |
| [`write-clear`](./docs/rules/write-clear.md) | Flag dense, hard-to-read sentences.                      |     |     |

Rule documentation is generated from the rule's own test suite, so every documented example is
verified behavior.

## Development

```sh
pnpm install
pnpm test       # vitest, including a docs-sync check
pnpm codegen    # regenerate docs/rules/*.md from the test cases
pnpm build      # dual CJS/ESM build via tsup
pnpm lint       # the plugin lints itself with its own rule
```

Each rule ships three convention-bound files: `src/rules/<name>.ts` (implementation, with a
markdown JSDoc overview on the exported rule), `src/rules/<name>.cases.ts` (test cases, which are
also the documentation examples), and generated `docs/rules/<name>.md`. To change rule behavior:
update the implementation and cases, then run `pnpm codegen` — the test suite fails if the
generated documentation drifts.

## Credits

`write-good` is a tribute to
[`eslint-plugin-write-good-comments`](https://github.com/kantord/eslint-plugin-write-good-comments)
by [Dániel Kántor](https://github.com/kantord), reworked onto this plugin's logical-comment model.
The prose analysis is powered by [`write-good`](https://github.com/btford/write-good) by Brian Ford.
