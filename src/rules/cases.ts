/** A rule-level test case; doubles as a documentation example. */
export interface ValidCase {
  code: string
  name: string
  options?: unknown[]
}

interface ExpectedError {
  column?: number
  data?: Record<string, string>
  endColumn?: number
  endLine?: number
  line?: number
  messageId: string
}

interface InvalidCase extends ValidCase {
  errors: ExpectedError[]
}

/** A themed group of cases from a rule's `<name>.cases.ts`, rendered as one docs section. */
export interface CaseGroup {
  description: string
  invalid: InvalidCase[]
  title: string
  valid: ValidCase[]
}
