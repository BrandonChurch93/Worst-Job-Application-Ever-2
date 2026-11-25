// The measures that read a picture: M1, M2, M3 and M8. Each needs a diagnostic view; where the build has none yet, the measure says so.
import { notYet } from './measure-core.mjs'

const NEEDS = { M1: ['ids'], M2: ['texels'], M3: [], M8: ['coverage'] }

export async function openPictures({ views }) {
  return {
    async measure(id) {
      const missing = NEEDS[id].filter((v) => !views.includes(v))
      if (missing.length) return notYet(id, `the build has no \`${missing.join('`, `')}\` view yet`)
      return notYet(id, 'the reading of pictures is not built yet')
    },
    async close() {}
  }
}
