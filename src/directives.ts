import type { TextChunk } from './normalize.js'

type CommentContainer = 'block' | 'line'

type JustificationStyle = 'after-colon' | 'after-double-dash' | 'none' | 'trailing'

interface DirectiveDefinition {
  containers: readonly CommentContainer[]
  justification: JustificationStyle
  pattern: RegExp
}

interface DirectiveMatch {
  justification: TextChunk | null
}

const DIRECTIVE_DEFINITIONS: readonly DirectiveDefinition[] = [
  {
    containers: ['block', 'line'],
    justification: 'after-double-dash',
    pattern: /^\s*eslint-(?:disable|enable)(?:-(?:next-)?line)?(?=[\s,]|$)/u,
  },
  { containers: ['block'], justification: 'none', pattern: /^\s*(?:eslint-env|globals?|exported)(?=\s|$)/u },
  { containers: ['block'], justification: 'none', pattern: /^\s*eslint\s/u },
  { containers: ['block', 'line'], justification: 'trailing', pattern: /^\s*@ts-(?:ignore|expect-error)(?=\s|$)/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^\s*@ts-(?:nocheck|check)(?=\s|$)/u },
  { containers: ['block', 'line'], justification: 'after-colon', pattern: /^\s*biome-ignore\s+[^\s:]+/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^\s*prettier-ignore(?:-(?:start|end))?(?=\s|$)/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^\s*istanbul\s+ignore\s+\S+/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^\s*[cv]8\s+ignore\s+\S+/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^\s*jscpd:ignore-(?:start|end)/u },
  { containers: ['block'], justification: 'none', pattern: /^\s*webpack[A-Z]\w*\s*:/u },
  { containers: ['line'], justification: 'none', pattern: /^\/\s*<(?:reference|amd-)/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^[#@]\s*source(?:Mapping)?URL=/u },
  { containers: ['block'], justification: 'none', pattern: /^\s*@(?:vitest|jest)-environment(?=\s|$)/u },
  { containers: ['block', 'line'], justification: 'none', pattern: /^\s*@(?:license|preserve|copyright)(?=\s|$)/u },
  { containers: ['line'], justification: 'none', pattern: /^\s*#(?:end)?region\b/u },
]

const DOUBLE_DASH_SEPARATOR = /\s--(?:\s|$)/u

const JUSTIFICATION_START_FINDERS = {
  'after-colon': (value: string, directiveEnd: number): number | null => {
    const colonIndex = value.indexOf(':', directiveEnd)
    return colonIndex === -1 ? null : colonIndex + 1
  },
  'after-double-dash': (value: string, directiveEnd: number): number | null => {
    const separator = DOUBLE_DASH_SEPARATOR.exec(value.slice(directiveEnd))
    return separator ? directiveEnd + separator.index + separator[0].length : null
  },
  none: (): number | null => null,
  trailing: (_value: string, directiveEnd: number): number | null => directiveEnd,
} satisfies Record<JustificationStyle, (value: string, directiveEnd: number) => number | null>

/** Detects a tooling directive and returns its justification, to lint as prose. */
export function matchDirective(
  value: string,
  valueSourceStart: number,
  container: CommentContainer,
): DirectiveMatch | null {
  for (const definition of DIRECTIVE_DEFINITIONS) {
    if (!definition.containers.includes(container)) continue
    const match = definition.pattern.exec(value)
    if (!match) continue
    return { justification: extractJustification(definition.justification, value, match[0].length, valueSourceStart) }
  }
  return null
}

function extractJustification(
  style: JustificationStyle,
  value: string,
  directiveEnd: number,
  valueSourceStart: number,
): TextChunk | null {
  const start = JUSTIFICATION_START_FINDERS[style](value, directiveEnd)
  if (start === null) return null
  const text = value.slice(start)
  if (text.trim() === '') return null
  return { sourceStart: valueSourceStart + start, text }
}
