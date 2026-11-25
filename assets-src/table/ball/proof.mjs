// node assets-src/table/ball/proof.mjs [--grade bend|true] [--sweat 0..1] [--open 0..1] [--tier draft|review] [--format hd] [--tag name] key:<id> sheet:<id> ...
// Renders stills of the clear ball with its grade, its sweat and its opening held at a number, in out/work/ball/, and prints the seconds and the counts of each.
import path from 'node:path'
import { at } from '../../../tools/lib/paths.mjs'
import { openSession, still } from '../../../tools/lib/capture.mjs'

const argv = process.argv.slice(2)
const flag = (name, d) => (argv.includes(`--${name}`) ? argv[argv.indexOf(`--${name}`) + 1] : d)
const num = (name) => (argv.includes(`--${name}`) ? Number(flag(name)) : null)
const jobs = argv.filter((a) => /^(key|sheet):/.test(a))
const grade = flag('grade', 'bend')
const tier = flag('tier', 'draft')
const tag = flag('tag', grade)
const session = await openSession({ format: flag('format', 'hd'), assets: 'full' })
try {
  await session.page.evaluate(
    ([g, sweat, open]) => {
      window.dispatchEvent(new CustomEvent('wjb-grade', { detail: g }))
      window.dispatchEvent(new CustomEvent('wjb-sweat', { detail: sweat }))
      window.dispatchEvent(new CustomEvent('wjb-open', { detail: open }))
    },
    [grade, num('sweat'), num('open')]
  )
  for (const job of jobs) {
    const [kind, id] = job.split(':')
    const out = await still(session, { [kind]: id, tier, out: `${kind}-${id}-${tag}` }, { force: true, dir: 'ball' })
    const c = out.record.counts
    console.log(`${job} grade ${grade} tier ${tier}: ${out.record.seconds} s, ${c ? JSON.stringify(c) : 'no counts'}, ${path.relative(at(), out.file)}`)
  }
} finally {
  await session.close()
}
