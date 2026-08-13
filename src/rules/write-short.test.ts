import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'

import { caseGroups } from './write-short.cases.js'
import { writeShort } from './write-short.js'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester()

for (const group of caseGroups) {
  ruleTester.run(`write-short (${group.title.toLowerCase()})`, writeShort, {
    invalid: group.invalid,
    valid: group.valid,
  })
}
