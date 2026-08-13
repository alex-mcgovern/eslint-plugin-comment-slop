import { name, version } from '../package.json'
import { writeGood } from './rules/write-good.js'
import { writeShort } from './rules/write-short.js'

/** ESLint plugin against comment slop: caps the length of each logical comment and checks its prose. */
const plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    'write-good': writeGood,
    'write-short': writeShort,
  },
}

export default plugin
