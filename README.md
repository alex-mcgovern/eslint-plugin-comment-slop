# eslint-plugin-comment-slop

ESLint rules against comment slop.

Comment length is evaluated per **logical comment** — a run of adjacent `//` lines, a block
comment, or one JSDoc prose section — never line by line. A paragraph wrapped across ten short
lines is judged as the single unit it really is.

- [Installation](#installation)
- [Configuration](#configuration)
- [Rules](#rules)
- [Design](#design)
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
    },
  },
]
```

No preset configurations are shipped at this time.

## Rules

| Rule                                         | Description                                   | 💡  | 🔧  |
| :------------------------------------------- | :-------------------------------------------- | :-- | :-- |
| [`write-short`](./docs/rules/write-short.md) | Enforce a maximum length per logical comment. |     |     |

Rule documentation is generated from the rule's own test suite, so every documented example is
verified behavior.

## Design

Three principles shape the rules:

1. **Logical comments, not lines.** Consecutive own-line `//` comments merge into one unit;
   blank lines, code, and directives break the run. Length is measured on normalized prose
   (markers, `*` gutters, and repeated whitespace stripped), so reformatting a comment never
   changes its measured length.
2. **JSDoc is structured prose.** Each section — the description, and each tag's description —
   is judged independently. Tag names, `{type}` annotations, and parameter names never count.
   Reference-bearing tags (`@see`, `@example` by default) are exempt.
3. **Directives are not prose.** `eslint-disable*`, `@ts-expect-error`, `biome-ignore`,
   `prettier-ignore`, coverage and bundler pragmas, and similar are never length-checked. Their
   human-written justifications are.

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
