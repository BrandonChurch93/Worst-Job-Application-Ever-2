import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage } from '../src/stage/stage'
import { waitsFor } from '../src/audio/cues'
import { word, WORDS } from '../src/ui/words'

const at = (...p: string[]) => path.join(process.cwd(), ...p)
const read = (...p: string[]) => readFileSync(at(...p), 'utf8')

// Step 2 of the live site played by a bot, with the narrator owing its line until `until` seconds of the page. Returns when the page turned, in seconds of the page, or null.
const play = (bot: 'keen' | 'clumsy' | 'skipper', until: number): { turned: number | null; asked: string[] } => {
  const asked: string[] = []
  const s = new Stage({ mode: 'live', flow: liveFlow().slice(2), pages, driver: new BotDriver(bot, config.seed), waits: (page) => { asked.push(page); return s.pageTime < until } })
  for (let i = 0; i < 90 * stepHz; i++) {
    s.advance(1)
    if (s.page.id !== 'step2' || s.turning) return { turned: s.time, asked }
  }
  return { turned: null, asked }
}

describe('change note 004, item 3: the pause of the narrator on the live site', () => {
  it('is 0.3 s between two lines', () => {
    expect(config.audio.liveNarratorMinGapSeconds).toBe(0.3)
  })

  it('names the line each page waits for: step 2 waits for the second part of line 4', () => {
    expect(waitsFor).toEqual({ step2: 'step2.crank.1' })
  })
})

describe('change note 004, item 3: Continue on step 2 waits for the narrator', () => {
  const free = play('keen', 0)

  it('with nothing owed the bot leaves the page as before', () => {
    expect(free.turned).not.toBeNull()
    expect(new Set(free.asked)).toEqual(new Set(['step2']))
  })

  it('is not pressed while the line is owed and is pressed after it', () => {
    const until = free.turned! + 4
    const held = play('keen', until)
    expect(held.turned).not.toBeNull()
    expect(held.turned!).toBeGreaterThanOrEqual(until)
    expect(held.turned!).toBeLessThan(until + config.live.skipLinkAfterSeconds + 2)
  })

  it('does not hold the skip link', () => {
    const skip = play('skipper', 0).turned!
    expect(play('skipper', 600).turned).toBe(skip)
  })

  it('is never asked for in the film', () => {
    let asked = 0
    const s = new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2'), waits: () => { asked++; return true } })
    for (let i = 0; i < 20 * 60; i++) s.frameAt((i + 1) / 60)
    expect(asked).toBe(0)
  })
})

describe('change note 004, item 6: the words of the sound bar', () => {
  it('are drafts, read from content/copy-drafts.json and typed nowhere else', () => {
    const drafts = JSON.parse(read('content', 'copy-drafts.json'))
    expect(drafts.words.live.soundBar).toEqual({ words: 'This application uses sound to enhance your candidate experience.', accept: 'Accept' })
    expect(WORDS.soundBar).toBe('copy:drafts.live.soundBar.words')
    expect(WORDS.soundAccept).toBe('copy:drafts.live.soundBar.accept')
    expect(word('soundBar')).toBe(drafts.words.live.soundBar.words)
    expect(word('soundAccept')).toBe(drafts.words.live.soundBar.accept)
    expect(JSON.stringify(JSON.parse(read('content', 'copy.json')))).not.toContain('candidate experience')
    for (const f of ['interface.ts', 'touch.ts', 'words.ts', 'api.ts']) expect(read('src', 'ui', f), f).not.toMatch(/candidate experience|'Accept'|"Accept"/)
  })
})

describe('change note 004, item 13: no link to the portfolio', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(path.join(dir, f)).isDirectory() ? walk(path.join(dir, f)) : [path.join(dir, f)]))

  it('the key stays in the kit, empty', () => {
    expect(config.links.portfolioWork).toBe('')
  })

  it('no file of the interface reads the key or holds an element for it', () => {
    for (const f of walk(at('src', 'ui')).filter((f) => /\.(ts|css|html)$/.test(f))) expect(readFileSync(f, 'utf8'), f).not.toMatch(/portfolioWork|portfolioAddress|touchLink|touchOnly\.link/)
    expect(Object.values(WORDS)).not.toContain('copy:live.touchOnly.link')
  })

  it("the phone notice has one link, with the locked words, to the film's review page", () => {
    const src = read('src', 'ui', 'touch.ts')
    expect(src.match(/createElement\('a'\)|el\('a'/g)?.length ?? 0).toBe(1)
    expect(src).toContain("word('watchFilm')")
    expect(src).toContain('https://www.perplexity.ai/computer/a/the-worst-job-application-ever-11C.YCwbSEaDnRs_ar70Dw')
    expect(copy.live.watchFilm).toBe('Watch the film instead')
  })

  it.skipIf(!existsSync(at('dist', 'index.html')))('the built site holds no portfolio address and no element for one', () => {
    const files = walk(at('dist')).filter((f) => /\.(html|js|css|json)$/.test(f))
    expect(files.length).toBeGreaterThan(1)
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      expect(text, f).not.toMatch(/https?:\/\/[^"'\s]*portfolio/i)
      expect(text, f).not.toMatch(/portfolioAddress|touchLink|touchOnly\.link|data-portfolio/i)
      const reads = text.match(/\.portfolioWork\b/g) ?? []
      expect(reads, f).toEqual([])
    }
  })
})
