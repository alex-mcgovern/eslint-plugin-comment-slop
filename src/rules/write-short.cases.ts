import type { CaseGroup } from './cases.js'

const LONG_LINE_PROSE =
  'Completed tasks are kept for thirty days so that the user can always restore them from the archive view.'
const RUN_LINE_ONE = 'Tasks are soft-deleted first and only purged by the nightly cleanup job'
const RUN_LINE_TWO = 'so that an accidental swipe can always be undone from the trash screen'
const LONG_BLOCK_PROSE =
  'Reminders fire through the notification service rather than a local timer, so they still arrive when the app is closed.'
const LONG_SUMMARY =
  'Builds the list of tasks shown on the Today screen, including overdue items carried over from previous days.'
const LONG_PARAM_PROSE =
  'The due date in the timezone the task was created in, which may differ from the timezone of the current device.'
const LONG_JUSTIFICATION =
  'the drag handler mutates DOM nodes directly because the task list is virtualised and re-renders on every frame'
const LONG_REFERENCE_URL =
  'https://example.com/docs/tasks/recurrence-rules-and-timezone-handling-for-scheduled-reminders'

const TAG_SECTION_LINE = ` * @param dueDate - ${LONG_PARAM_PROSE}`

export const caseGroups: CaseGroup[] = [
  {
    description:
      'Comment length is judged per logical comment: a run of adjacent `//` lines, a block ' +
      'comment, or one JSDoc prose section. The prose is normalized (markers, `*` gutters, and ' +
      'repeated whitespace stripped) before counting, and the default limit is 80 characters.',
    invalid: [
      {
        code: `// ${LONG_LINE_PROSE}`,
        errors: [
          { data: { actual: String(LONG_LINE_PROSE.length), label: 'line comment', max: '80' }, messageId: 'tooLong' },
        ],
        name: 'a line comment over the limit',
      },
      {
        code: [`// ${RUN_LINE_ONE}`, `// ${RUN_LINE_TWO}`, 'moveToTrash(task)'].join('\n'),
        errors: [
          {
            column: 1,
            data: {
              actual: String(RUN_LINE_ONE.length + 1 + RUN_LINE_TWO.length),
              label: 'line comment',
              max: '80',
            },
            endColumn: `// ${RUN_LINE_TWO}`.length + 1,
            endLine: 2,
            line: 1,
            messageId: 'tooLong',
          },
        ],
        name: 'a merged run of individually-short lines, judged as one unit',
      },
      {
        code: `/*\n * ${LONG_BLOCK_PROSE}\n */`,
        errors: [
          {
            data: { actual: String(LONG_BLOCK_PROSE.length), label: 'block comment', max: '80' },
            messageId: 'tooLong',
          },
        ],
        name: 'a multi-line block comment over the limit',
      },
      {
        code: `/**\n * ${LONG_SUMMARY}\n * @param dueDate - ${LONG_PARAM_PROSE}\n */\nfunction todayList(dueDate) { return dueDate }`,
        errors: [
          {
            data: { actual: String(LONG_SUMMARY.length), label: 'JSDoc description', max: '80' },
            messageId: 'tooLong',
          },
          {
            data: {
              actual: String('- '.length + LONG_PARAM_PROSE.length),
              label: 'JSDoc @param "dueDate" description',
              max: '80',
            },
            messageId: 'tooLong',
          },
        ],
        name: 'JSDoc description and tag sections, judged independently',
      },
      {
        code: `completeTask(task) // ${LONG_LINE_PROSE}`,
        errors: [{ messageId: 'tooLong' }],
        name: 'a trailing comment over the limit',
      },
      {
        code: `/**\n * Schedules a reminder.\n${TAG_SECTION_LINE}\n */\nfunction schedule(dueDate) { return dueDate }`,
        errors: [
          {
            column: TAG_SECTION_LINE.indexOf('- ') + 1,
            endColumn: TAG_SECTION_LINE.length + 1,
            endLine: 3,
            line: 3,
            messageId: 'tooLong',
          },
        ],
        name: 'a tag section, reported exactly at its description prose',
      },
    ],
    title: 'Logical comments',
    valid: [
      { code: '// Sort overdue tasks first', name: 'a short line comment' },
      { code: '/* Recurring tasks reuse their parent id */', name: 'a short block comment' },
      { code: '/** Returns the number of overdue tasks. */', name: 'a short JSDoc description' },
      { code: 'const overdue = tasks.filter(isOverdue)', name: 'code without comments' },
      {
        code: [
          '// Subtasks inherit the due date of their parent',
          '',
          '// Reminders are scheduled when the task is saved',
        ].join('\n'),
        name: 'two runs separated by a blank line, judged separately',
      },
      {
        code: [
          '// Subtasks inherit the due date of their parent',
          'attachSubtask(parent, subtask)',
          '// Reminders are scheduled when the task is saved',
        ].join('\n'),
        name: 'two runs separated by code, judged separately',
      },
      {
        code: '//    Snoozed     tasks     reappear     at     the     start     of     the     next     day',
        name: 'normalized length is what counts, not the raw source span',
      },
      {
        code: '/** @param {ReadonlyArray<TaskWithSubtasksAndRecurrenceRules>} tasksScheduledForToday - Ok. */\nfunction render(tasksScheduledForToday) { return tasksScheduledForToday }',
        name: 'JSDoc structure (tags, types, names) does not count toward the limit',
      },
    ],
  },
  {
    description:
      'Tooling directives are exempt from length limits — a long rule list is not prose. When a ' +
      'directive carries a justification (after `--` for ESLint, after `:` for Biome, trailing ' +
      'text for `@ts-expect-error`), the justification alone is linted, under the limit of the ' +
      'comment kind that contains it.',
    invalid: [
      {
        code: `// eslint-disable-next-line no-param-reassign -- ${LONG_JUSTIFICATION}\ntask.order = index`,
        errors: [
          {
            data: { actual: String(LONG_JUSTIFICATION.length), label: 'directive justification', max: '80' },
            messageId: 'tooLong',
          },
        ],
        name: 'an eslint-disable-next-line justification over the limit',
      },
      {
        code: `/* eslint-disable no-param-reassign -- ${LONG_JUSTIFICATION} */`,
        errors: [
          {
            data: { actual: String(LONG_JUSTIFICATION.length), label: 'directive justification', max: '80' },
            messageId: 'tooLong',
          },
        ],
        name: 'a block-form eslint-disable justification over the limit',
      },
      {
        code: `// @ts-expect-error ${LONG_JUSTIFICATION}\nconst order = task.order`,
        errors: [{ messageId: 'tooLong' }],
        name: 'an @ts-expect-error trailing justification over the limit',
      },
      {
        code: `// biome-ignore lint/suspicious/noExplicitAny: ${LONG_JUSTIFICATION}\nconst order = task.order`,
        errors: [{ messageId: 'tooLong' }],
        name: 'a biome-ignore explanation over the limit',
      },
      {
        code: [
          `// ${LONG_LINE_PROSE}`,
          '// eslint-disable-next-line no-console',
          `// ${LONG_BLOCK_PROSE}`,
          'console.log(task)',
        ].join('\n'),
        errors: [{ messageId: 'tooLong' }, { messageId: 'tooLong' }],
        name: 'prose halves around a mid-run directive, judged separately',
      },
      {
        code: `task.order = index // eslint-disable-line no-param-reassign -- ${LONG_JUSTIFICATION}`,
        errors: [
          {
            data: { actual: String(LONG_JUSTIFICATION.length), label: 'directive justification', max: '80' },
            messageId: 'tooLong',
          },
        ],
        name: 'a trailing directive with a justification over the limit',
      },
    ],
    title: 'Directives and justifications',
    valid: [
      {
        code: '// eslint-disable-next-line no-console, no-alert, no-debugger, no-eval, no-implied-eval, no-extend-native\nconsole.log(task)',
        name: 'a long rule list is not a justification',
      },
      {
        code: 'console.log(task) // eslint-disable-line no-console, no-alert, no-debugger, no-eval, no-implied-eval, no-extend-native, no-empty, no-caller',
        name: 'a trailing directive without a justification',
      },
      {
        code: '// eslint-disable-next-line no-console -- surfaced in the debug panel\nconsole.log(task)',
        name: 'a short justification',
      },
      {
        code: '/* eslint no-restricted-imports: ["error", { "paths": ["tasks/legacy", "tasks/deprecated", "tasks/experimental"] }] */',
        name: 'inline rule configuration',
      },
      {
        code: '// @ts-expect-error\nconst order = task.order',
        name: 'a TypeScript pragma without a justification',
      },
      {
        code: `// prettier-ignore ${LONG_LINE_PROSE}\nconst matrix = [1, 0, 0, 1]`,
        name: 'prettier-ignore',
      },
      { code: `/* istanbul ignore next ${LONG_LINE_PROSE} */`, name: 'istanbul coverage directives' },
      { code: `/* c8 ignore start ${LONG_LINE_PROSE} */`, name: 'c8 coverage directives' },
      { code: `// v8 ignore next ${LONG_LINE_PROSE}\nconst order = task.order`, name: 'v8 coverage directives' },
      { code: `// jscpd:ignore-start ${LONG_LINE_PROSE}\nconst order = task.order`, name: 'jscpd markers' },
      {
        code: 'const panel = import(/* webpackChunkName: "task-details-panel-with-subtasks-and-attachments" */ \'./panel\')',
        name: 'webpack magic comments',
      },
      {
        code: '/// <reference types="task-scheduler-with-recurrence-and-timezone-support" />',
        name: 'triple-slash references',
      },
      {
        code: `//# sourceMappingURL=${'task-list-virtualised-drag-and-drop-with-keyboard-support.js'.repeat(2)}.map`,
        name: 'source map pragmas',
      },
      { code: `/* @vitest-environment ${LONG_LINE_PROSE} */`, name: 'test environment pragmas' },
      { code: `/* @license ${LONG_LINE_PROSE} */`, name: 'license pragmas' },
      {
        code: `// #region drag-and-drop handlers for the virtualised task list, including keyboard fallbacks\nconst dragHandlers = {}`,
        name: 'editor region markers',
      },
      { code: `#!/usr/bin/env node ${LONG_LINE_PROSE}\nconst tasks = []`, name: 'shebangs' },
    ],
  },
  {
    description:
      'JSDoc tags whose content is a reference or code rather than prose are exempt: `@see` and ' +
      '`@example` by default. The `jsdocIgnoredTags` option replaces the default set.',
    invalid: [
      {
        code: `/**\n * @see ${LONG_REFERENCE_URL}\n */`,
        errors: [
          {
            data: { actual: String(LONG_REFERENCE_URL.length), label: 'JSDoc @see description', max: '80' },
            messageId: 'tooLong',
          },
        ],
        name: 'an empty jsdocIgnoredTags list re-enables capping @see',
        options: [{ jsdocIgnoredTags: [] }],
      },
      {
        code: `/**\n * @see ${LONG_REFERENCE_URL}\n */`,
        errors: [{ messageId: 'tooLong' }],
        name: 'a custom list replaces the default set entirely',
        options: [{ jsdocIgnoredTags: ['todo'] }],
      },
    ],
    title: 'Ignored JSDoc tags',
    valid: [
      { code: `/**\n * @see ${LONG_REFERENCE_URL}\n */`, name: '@see is exempt by default' },
      {
        code: '/**\n * @example\n * addTask("Water the plants", { due: "tomorrow", repeat: "weekly" })\n * addTask("File taxes", { due: "2026-04-15", remind: "1 week before" })\n */',
        name: '@example is exempt by default',
      },
      {
        code: `/**\n * @todo ${LONG_BLOCK_PROSE}\n */`,
        name: 'custom ignored tags are exempt',
        options: [{ jsdocIgnoredTags: ['todo'] }],
      },
    ],
  },
  {
    description:
      'The option is either a single number applied to every kind, or an object with per-kind ' +
      'limits (`line`, `block`, `jsdoc`). Omitted kinds fall back to the default of 80; `false` ' +
      'disables a kind entirely.',
    invalid: [
      {
        code: '// snooze it\n/* snooze it */\n/** Snooze it. */',
        errors: [
          { data: { actual: '9', label: 'line comment', max: '8' }, messageId: 'tooLong' },
          { data: { actual: '9', label: 'block comment', max: '8' }, messageId: 'tooLong' },
          { data: { actual: '10', label: 'JSDoc description', max: '8' }, messageId: 'tooLong' },
        ],
        name: 'a numeric option applies to every kind',
        options: [8],
      },
      {
        code: '// remind the user before the due date\n/* due soon */',
        errors: [
          {
            data: { actual: String('remind the user before the due date'.length), label: 'line comment', max: '10' },
            messageId: 'tooLong',
          },
        ],
        name: 'per-kind limits apply independently',
        options: [{ block: 40, line: 10 }],
      },
      {
        code: `// ${LONG_LINE_PROSE}`,
        errors: [
          { data: { actual: String(LONG_LINE_PROSE.length), label: 'line comment', max: '80' }, messageId: 'tooLong' },
        ],
        name: 'unspecified kinds fall back to the default limit',
        options: [{ jsdoc: 200 }],
      },
      {
        code: '// eslint-disable-next-line no-console -- surfaced in the debug panel\nconsole.log(task)',
        errors: [
          {
            data: {
              actual: String('surfaced in the debug panel'.length),
              label: 'directive justification',
              max: '10',
            },
            messageId: 'tooLong',
          },
        ],
        name: 'directive justifications inherit the limit of their comment kind',
        options: [{ line: 10 }],
      },
    ],
    title: 'Options',
    valid: [
      { code: `// ${LONG_LINE_PROSE}`, name: 'false disables a kind', options: [{ line: false }] },
      {
        code: `/** ${LONG_SUMMARY} */`,
        name: 'a raised jsdoc limit tolerates long sections',
        options: [{ jsdoc: 200 }],
      },
      { code: `// ${LONG_LINE_PROSE}`, name: 'a raised numeric limit', options: [LONG_LINE_PROSE.length] },
    ],
  },
]
