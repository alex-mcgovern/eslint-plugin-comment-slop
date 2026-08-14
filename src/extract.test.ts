import type { Rule } from 'eslint'

import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'

import type { LogicalComment } from './extract.js'

import { extractLogicalComments } from './extract.js'

function extract(code: string): LogicalComment[] {
  let extracted: LogicalComment[] = []
  const capture: Rule.RuleModule = {
    create: (context) => ({
      'Program:exit'() {
        extracted = extractLogicalComments(context.sourceCode)
      },
    }),
  }
  const linter = new Linter()
  const messages = linter.verify(code, {
    linterOptions: { reportUnusedDisableDirectives: false },
    plugins: { capture: { rules: { capture } } },
    rules: { 'capture/capture': 'error' },
  })
  expect(messages.filter((message) => message.fatal || message.ruleId === 'capture/capture')).toEqual([])
  return extracted
}

describe('line comment merging', () => {
  it('merges adjacent own-line comments into one logical comment', () => {
    const comments = extract('// first part\n// second part\nconst a = 1\n')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toMatchObject({ kind: 'line', text: 'first part second part' })
  })

  it('spans the merged range from the first marker to the last comment end', () => {
    const comments = extract('// aa\n// bb\n')
    expect(comments[0].range).toEqual([0, 11])
  })

  it('breaks a run on a blank line', () => {
    const comments = extract('// one\n\n// two\n')
    expect(comments.map((comment) => comment.text)).toEqual(['one', 'two'])
  })

  it('breaks a run on interleaved code', () => {
    const comments = extract('// one\nconst a = 1\n// two\n')
    expect(comments.map((comment) => comment.text)).toEqual(['one', 'two'])
  })

  it('keeps a trailing comment separate from a following own-line comment', () => {
    const comments = extract('const a = 1 // trailing\n// own line\n')
    expect(comments.map((comment) => comment.text)).toEqual(['trailing', 'own line'])
  })

  it('keeps two consecutive trailing comments separate', () => {
    const comments = extract('const a = 1 // first\nconst b = 2 // second\n')
    expect(comments.map((comment) => comment.text)).toEqual(['first', 'second'])
  })

  it('merges comments with differing indentation', () => {
    const comments = extract('  // one\n    // two\n')
    expect(comments.map((comment) => comment.text)).toEqual(['one two'])
  })

  it('handles a comment as the only content of a file', () => {
    expect(extract('// lonely')[0].text).toBe('lonely')
  })
})

describe('normalization', () => {
  it('collapses interior whitespace runs to single spaces', () => {
    expect(extract('//   spaced    out   words\n')[0].text).toBe('spaced out words')
  })

  it('anchors a justification range to its words, accounting for markers', () => {
    const code = '// @ts-expect-error   spaced   reason\nconst a = 1\n'
    const [comment] = extract(code)
    const [start, end] = comment.range
    expect(code.slice(start, end)).toBe('spaced   reason')
    expect(comment.text).toBe('spaced reason')
  })

  it('produces no logical comment for an empty comment', () => {
    expect(extract('//\n//   \nconst a = 1\n')).toEqual([])
  })
})

describe('block comments', () => {
  it('treats a multi-line block comment as one logical comment', () => {
    const comments = extract('/* one\n   two\n   three */\nconst a = 1\n')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toMatchObject({ kind: 'block', text: 'one two three' })
  })

  it('strips star gutters from continuation lines', () => {
    const comments = extract('/*\n * one\n * two\n */\n')
    expect(comments[0].text).toBe('one two')
  })

  it('keeps markdown bold at line start intact', () => {
    const comments = extract('/*\n **bold** text\n */\n')
    expect(comments[0].text).toBe('**bold** text')
  })

  it('reports the full comment span as its range', () => {
    const code = '/* abc */'
    expect(extract(code)[0].range).toEqual([0, code.length])
  })
})

describe('jsdoc comments', () => {
  it('splits summary and tags into separate sections', () => {
    const comments = extract(
      ['/**', ' * The summary text.', ' * @param foo - The foo param.', ' * @returns The result.', ' */'].join('\n') +
        '\nfunction f(foo) { return foo }\n',
    )
    expect(comments.map((comment) => [comment.kind, comment.text])).toEqual([
      ['jsdoc', 'The summary text.'],
      ['jsdoc', '- The foo param.'],
      ['jsdoc', 'The result.'],
    ])
  })

  it('excludes tag names, type braces, and param names from the text', () => {
    const [comment] = extract('/** @param {SomeExtremelyLongGenericType<A, B>} someVeryLongParameterName - Hi. */\n')
    expect(comment.text).toBe('- Hi.')
  })

  it('joins multi-line tag descriptions into one section', () => {
    const comments = extract(['/**', ' * @returns A value that', ' * spans two lines.', ' */'].join('\n') + '\n')
    expect(comments.map((comment) => comment.text)).toEqual(['A value that spans two lines.'])
  })

  it('produces nothing for an empty jsdoc block', () => {
    expect(extract('/** */\n')).toEqual([])
  })

  it('handles a single-line jsdoc', () => {
    expect(extract('/** Single line summary. */\n')[0]).toMatchObject({ kind: 'jsdoc', text: 'Single line summary.' })
  })

  it('emits no section for @see, whose content is a reference', () => {
    const comments = extract('/**\n * Summary.\n * @see https://example.com/a/very/long/reference/path\n */\n')
    expect(comments.map((comment) => comment.text)).toEqual(['Summary.'])
  })

  it('emits no section for @example, whose content is code', () => {
    const comments = extract('/**\n * Summary.\n * @example\n * const x = doSomething(1, 2, 3)\n */\n')
    expect(comments.map((comment) => comment.text)).toEqual(['Summary.'])
  })

  it('matches ignored tags case-insensitively', () => {
    expect(extract('/** @SEE https://example.com */\n')).toEqual([])
  })

  it('labels sections with JSDoc terminology, including tag names', () => {
    const comments = extract(
      '/**\n * Summary.\n * @param foo - Hi.\n * @returns Bye.\n */\nfunction f(foo) { return foo }\n',
    )
    expect(comments.map((comment) => comment.label)).toEqual([
      'JSDoc description',
      'JSDoc @param "foo" description',
      'JSDoc @returns description',
    ])
  })

  it('anchors a tag section range to its description prose', () => {
    const code = '/**\n * Ok.\n * @param foo - The prose here.\n */\nfunction f(foo) { return foo }\n'
    const section = extract(code).find((comment) => comment.label.includes('@param'))
    if (!section) throw new Error('expected a @param section')
    expect(code.slice(section.range[0], section.range[1])).toBe('- The prose here.')
  })

  it('extracts the justification from a trailing directive comment', () => {
    const comments = extract('const a = 1 // eslint-disable-line no-console -- trailing reason\n')
    expect(comments).toEqual([
      expect.objectContaining({ kind: 'line', label: 'directive justification', text: 'trailing reason' }),
    ])
  })

  it('anchors section ranges to the section prose, not the whole block', () => {
    const code = '/**\n * Summary here.\n */\n'
    const [comment] = extract(code)
    const [start, end] = comment.range
    expect(code.slice(start, end)).toBe('Summary here.')
  })
})

describe('directives', () => {
  it.each([
    'eslint-disable no-console',
    'eslint-disable-next-line no-console, no-alert',
    'eslint-disable-line no-console',
    '@ts-nocheck this text is part of the directive',
    'prettier-ignore',
    'istanbul ignore next',
    'c8 ignore start',
    'v8 ignore next',
    'jscpd:ignore-start',
    '#region a very long region name that would exceed any sane comment limit ......',
  ])('exempts line directive "%s" entirely', (directive) => {
    expect(extract(`// ${directive}\nconst a = 1\n`)).toEqual([])
  })

  it.each([
    'eslint-disable no-console',
    'eslint-enable no-console',
    'eslint no-console: "error"',
    'eslint-env node',
    'global foo',
    'globals foo, bar',
    'exported foo',
    'istanbul ignore if',
    // Split so vitest's raw-file scanner ignores these as environment docblocks.
    '@vitest' + '-environment jsdom',
    '@jest' + '-environment node',
    'webpackChunkName: "chunk"',
    '@license MIT some very long license text that goes on and on and on and on and on',
  ])('exempts block directive "%s" entirely', (directive) => {
    expect(extract(`/* ${directive} */\nconst a = 1\n`)).toEqual([])
  })

  it('exempts triple-slash references and source map pragmas', () => {
    expect(extract('/// <reference types="node" />\n//# sourceMappingURL=index.js.map\n')).toEqual([])
  })

  it('extracts an eslint justification after the -- separator', () => {
    const comments = extract('// eslint-disable-next-line no-console -- console needed here\nconsole.log(1)\n')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toMatchObject({ kind: 'line', text: 'console needed here' })
  })

  it('anchors the justification range to the justification text only', () => {
    const code = '// eslint-disable-next-line no-console -- the reason\nconsole.log(1)\n'
    const [comment] = extract(code)
    const [start, end] = comment.range
    expect(code.slice(start, end)).toBe('the reason')
  })

  it('extracts justifications from block-form eslint directives', () => {
    const comments = extract('/* eslint-disable no-console -- block reason */\n')
    expect(comments).toEqual([expect.objectContaining({ kind: 'block', text: 'block reason' })])
  })

  it('treats trailing text on @ts-expect-error as the justification', () => {
    const comments = extract('// @ts-expect-error legacy shim has no types\nconst a = 1\n')
    expect(comments).toEqual([expect.objectContaining({ kind: 'line', text: 'legacy shim has no types' })])
  })

  it('extracts the biome-ignore explanation after the colon', () => {
    const comments = extract('// biome-ignore lint/suspicious/noExplicitAny: third-party payload\nconst a = 1\n')
    expect(comments).toEqual([expect.objectContaining({ kind: 'line', text: 'third-party payload' })])
  })

  it('yields nothing for a bare eslint-disable with a dangling separator', () => {
    expect(extract('// eslint-disable-next-line no-console --\nconsole.log(1)\n')).toEqual([])
  })

  it('does not treat prose starting with directive-like words as directives', () => {
    const comments = extract('// eslint is a great tool\n/* globalThis is documented here */\n')
    expect(comments.map((comment) => comment.text)).toEqual(['eslint is a great tool', 'globalThis is documented here'])
  })

  it('splits a run when a directive sits in the middle', () => {
    const comments = extract('// before one\n// eslint-disable-next-line no-console\n// after one\nconsole.log(1)\n')
    expect(comments.map((comment) => comment.text)).toEqual(['before one', 'after one'])
  })
})

describe('file-level edge cases', () => {
  it('ignores a shebang', () => {
    expect(extract('#!/usr/bin/env node\nconst a = 1\n')).toEqual([])
  })

  it('handles an empty file', () => {
    expect(extract('')).toEqual([])
  })

  it('handles a comment at end of file without a trailing newline', () => {
    expect(extract('const a = 1\n// the end')[0].text).toBe('the end')
  })
})
