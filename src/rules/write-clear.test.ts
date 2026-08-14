import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'

import { caseGroups } from './write-clear.cases.js'
import { writeClear } from './write-clear.js'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester()

for (const group of caseGroups) {
  ruleTester.run(`write-clear (${group.title.toLowerCase()})`, writeClear, {
    invalid: group.invalid,
    valid: group.valid,
  })
}
