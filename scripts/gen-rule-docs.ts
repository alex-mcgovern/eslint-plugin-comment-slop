import { Linter } from 'eslint'
import Handlebars from 'handlebars'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { format, resolveConfig } from 'prettier'

import type { CaseGroup, ValidCase } from '../src/rules/cases.js'

import plugin from '../src/index.js'

const PACKAGE_ROOT = join(import.meta.dirname, '..')
const TEMPLATE_PATH = join(import.meta.dirname, 'gen-rule-docs.hbs')
const PLUGIN_PREFIX = plugin.meta.name.replace(/^eslint-plugin-/u, '')

const linter = new Linter()

function docPath(ruleName: string): string {
  return join(PACKAGE_ROOT, 'docs', 'rules', `${ruleName}.md`)
}

function extractRuleOverview(ruleName: string): string {
  const sourcePath = join(PACKAGE_ROOT, 'src', 'rules', `${ruleName}.ts`)
  const exportName = ruleName.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase())
  const beforeExport = readFileSync(sourcePath, 'utf8').split(`export const ${exportName}`)[0]
  const docBlock = beforeExport.match(/\/\*\*[\s\S]*?\*\//gu)?.at(-1)
  if (!docBlock) throw new Error(`No JSDoc block found above ${exportName} in ${sourcePath}`)
  return docBlock
    .replace(/^\/\*\*\n?/u, '')
    .replace(/\n?\s*\*\/$/u, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\* ?/u, ''))
    .filter((line) => line.trim() !== '@example')
    .join('\n')
    .replaceAll('*\\/', '*/')
    .trim()
}

function isCasesModule(candidate: unknown): candidate is { caseGroups: CaseGroup[] } {
  return typeof candidate === 'object' && candidate !== null && Array.isArray(Reflect.get(candidate, 'caseGroups'))
}

async function loadCaseGroups(ruleName: string): Promise<CaseGroup[]> {
  const casesPath = join(PACKAGE_ROOT, 'src', 'rules', `${ruleName}.cases.ts`)
  const casesModule: unknown = await import(pathToFileURL(casesPath).href)
  if (!isCasesModule(casesModule)) throw new Error(`${casesPath} must export a caseGroups array`)
  return casesModule.caseGroups
}

function ruleConfig(example: ValidCase): Linter.RuleEntry {
  return ['error', ...(example.options ?? [])]
}

function lintMessages(ruleName: string, example: ValidCase): string[] {
  const ruleId = `${PLUGIN_PREFIX}/${ruleName}`
  const messages = linter.verify(example.code, {
    linterOptions: { reportUnusedDisableDirectives: false },
    plugins: { [PLUGIN_PREFIX]: plugin },
    rules: { [ruleId]: ruleConfig(example) },
  })
  return messages.filter((message) => message.ruleId === ruleId).map((message) => message.message)
}

function toTemplateExample(ruleName: string, example: ValidCase): { code: string; config: string; messages: string[] } {
  return {
    code: example.code,
    config: JSON.stringify(ruleConfig(example)),
    messages: lintMessages(ruleName, example),
  }
}

/** Renders one rule's `docs/rules/<name>.md` from its JSDoc and cases. */
export async function buildRuleDoc(ruleName: string): Promise<string> {
  const template = Handlebars.compile(readFileSync(TEMPLATE_PATH, 'utf8'))
  const rendered = template({
    groups: (await loadCaseGroups(ruleName)).map((group) => ({
      description: group.description,
      invalid: group.invalid.map((example) => toTemplateExample(ruleName, example)),
      title: group.title,
      valid: group.valid.map((example) => toTemplateExample(ruleName, example)),
    })),
    overview: extractRuleOverview(ruleName),
    pluginPrefix: PLUGIN_PREFIX,
    ruleName,
  })
  const prettierConfig = await resolveConfig(docPath(ruleName))
  return format(rendered, { ...prettierConfig, filepath: docPath(ruleName) })
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  for (const ruleName of Object.keys(plugin.rules)) {
    writeFileSync(docPath(ruleName), await buildRuleDoc(ruleName))
    console.log(`wrote ${docPath(ruleName)}`)
  }
}
