import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'

import { caseGroups } from './write-good.cases.js'
import { writeGood } from './write-good.js'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester()

for (const group of caseGroups) {
  ruleTester.run(`write-good (${group.title.toLowerCase()})`, writeGood, {
    invalid: group.invalid,
    valid: group.valid,
  })
}
