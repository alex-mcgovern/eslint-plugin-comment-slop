import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildRuleDoc } from '../../scripts/gen-rule-docs.js'
import plugin from '../index.js'

describe('rule documentation', () => {
  it.each(Object.keys(plugin.rules))(
    'docs/rules/%s.md is in sync with the rule (run `pnpm codegen` after changes)',
    async (ruleName) => {
      const docPath = join(import.meta.dirname, '..', '..', 'docs', 'rules', `${ruleName}.md`)
      expect(readFileSync(docPath, 'utf8')).toBe(await buildRuleDoc(ruleName))
    },
  )
})
