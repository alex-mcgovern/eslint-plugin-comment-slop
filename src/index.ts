import { name, version } from '../package.json'
import { writeClear } from './rules/write-clear.js'
import { writeGood } from './rules/write-good.js'
import { writeShort } from './rules/write-short.js'

/** ESLint plugin against comment slop: caps comment length and checks the prose. */
const plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    'write-clear': writeClear,
    'write-good': writeGood,
    'write-short': writeShort,
  },
}

export default plugin
