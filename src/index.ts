import { name, version } from '../package.json'
import { writeShort } from './rules/write-short.js'

/** ESLint plugin against comment slop: caps the length of each logical comment. */
const plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    'write-short': writeShort,
  },
}

export default plugin
