import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repo = process.cwd()
const cfg: any = JSON.parse(fs.readFileSync(path.join(repo, 'config', 'showcase.json'), 'utf8'))
const narration: any = JSON.parse(fs.readFileSync(path.join(repo, 'content', 'narration.json'), 'utf8'))
const files = cfg.export.files
const PARTS = ['Latest', 'Open it', 'Sound board', 'Films', 'The card', 'Comparisons', 'Motion']
const NOTHING = 'Nothing here yet.'
const made: string[] = []

function workspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-page-'))
  made.push(dir)
  for (const f of ['tools/review.mjs', 'tools/lib/paths.mjs', 'tools/lib/progress.mjs', 'config/showcase.json', 'content/narration.json', 'content/copy.json', 'kit/PROGRESS.md']) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true })
    fs.copyFileSync(path.join(repo, f), path.join(dir, f))
  }
  return dir
}
function put(dir: string, rel: string, content: string | number) {
  const p = path.join(dir, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, typeof content === 'number' ? Buffer.alloc(content, 1) : content)
}
const run = (dir: string, ...more: string[]) => execFileSync(process.execPath, ['tools/review.mjs', ...more], { cwd: dir, encoding: 'utf8' })
const page = (dir: string) => fs.readFileSync(path.join(dir, 'dist', 'review.html'), 'utf8')
const has = (dir: string, rel: string) => fs.existsSync(path.join(dir, 'dist', 'review', rel))
const headings = (html: string) => [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1])
const part = (html: string, id: string) => html.slice(html.indexOf(`<section id="${id}">`), html.indexOf('</section>', html.indexOf(`<section id="${id}">`)))
const KB = 1024

function filled(): string {
  const dir = workspace()
  put(dir, 'out/stills/status/01-first-look.jpg', 3 * KB)
  put(dir, 'out/stills/status/STATUS.md', ['# Status pictures', '', 'Time: 2026-11-25T06:17Z. Phase 3, status 12.', '', '1. `01-first-look.jpg`: The page at rest, with <angle> marks & an ampersand.', ''].join('\n'))
  put(dir, 'out/roughcut.mp4', 40 * KB)
  put(dir, `out/work/${files.reviewCut}`, 60 * KB)
  put(dir, `out/${files.reviewCut}`, 10 * KB)
  put(dir, `out/${files.previewA}`, 30 * KB)
  put(dir, `out/${files.previewB}`, 35 * KB)
  put(dir, `out/work/film-b-${cfg.formats.hd.id}-draft.mp4`, 200 * KB)
  put(dir, `out/work/film-b-${cfg.formats.hd.id}-review.mp4`, 500 * KB)
  put(dir, `out/work/film-a-${cfg.formats.hd.id}-review.mp4`, 300 * KB)
  put(dir, `out/work/film-b-${cfg.formats.preview.id}-draft.mp4`, 20 * KB)
  const old = new Date(Date.now() - 3600_000)
  fs.utimesSync(path.join(dir, `out/work/film-b-${cfg.formats.hd.id}-draft.mp4`), old, old)
  put(dir, `out/work/loop/${files.cardLoop}`, 25 * KB)
  put(dir, `deliver/${files.cardLoop}`, 26 * KB)
  put(dir, `out/work/loop/${files.cardLoopWeb}`, 12 * KB)
  put(dir, `out/work/loop/${files.cardStill}`, 5 * KB)
  put(dir, `out/stills/compare-${cfg.keys[0].id}.jpg`, 4 * KB)
  put(dir, 'out/stills/sheet-step1-hit.jpg', 4 * KB)
  put(dir, 'out/stills/rest-step1.jpg', 4 * KB)
  put(dir, 'audio/mix/review.wav', 50 * KB)
  const firstBeat = cfg.film.beats.find((b: any) => narration.film[b.id].length > 0)
  put(dir, 'audio/kept/line-one.wav', 6 * KB)
  put(dir, 'audio/kept/line-one.json', JSON.stringify({ kind: 'line', id: 'line-one', beat: firstBeat.id, index: 0, text: narration.film[firstBeat.id][0].text, seconds: 2.31 }))
  const group = Object.keys(narration.liveOnly).find((k) => k !== 'about')!
  put(dir, 'audio/kept/live-one.mp3', 6 * KB)
  put(dir, 'audio/kept/live-one.json', JSON.stringify({ kind: 'live-line', id: 'live-one', group, index: 0, text: narration.liveOnly[group][0], seconds: 1.2 }))
  const cue = cfg.audio.sfx.find((s: any) => s.variants > 1)
  put(dir, 'audio/kept/cue-1.wav', 2 * KB)
  put(dir, 'audio/kept/cue-1.json', JSON.stringify({ kind: 'cue', id: 'cue-1', cue: cue.id, variant: 1, describes: 'A soft <tap> on card', seconds: 0.15 }))
  put(dir, 'audio/kept/cue-2.wav', 2 * KB)
  put(dir, 'audio/kept/cue-2.json', JSON.stringify({ kind: 'cue', id: 'cue-2', cue: cue.id, variant: 2, describes: 'A soft <tap> on card', seconds: 0.16 }))
  put(dir, 'dist/index.html', '<p>the site</p>')
  put(dir, 'dist/assets/app.js', 'export {}')
  put(dir, 'dist/review/stale.txt', 'left from the last run')
  return dir
}

afterAll(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true })
})

describe('the review page with nothing made yet', () => {
  let dir = ''
  let html = ''
  let said = ''
  beforeAll(() => {
    dir = workspace()
    said = run(dir)
    html = page(dir)
  })

  it('is written without failing, and makes dist/ and dist/review/', () => {
    expect(fs.existsSync(path.join(dir, 'dist', 'review.html'))).toBe(true)
    expect(fs.readdirSync(path.join(dir, 'dist', 'review'))).toEqual([])
  })

  it('has the seven parts in order', () => {
    expect(headings(html)).toEqual(PARTS)
  })

  it('says so in plain words in every part that is empty', () => {
    for (const id of ['latest', 'films', 'card', 'comparisons', 'motion']) expect(part(html, id)).toContain(NOTHING)
  })

  it('links to the site, each step, film mode, the loop and the probe', () => {
    const open = part(html, 'open')
    const wanted = ['./index.html', ...[1, 2, 3, 4, 5].map((n) => `./index.html?step=${n}`), './index.html?mode=film', './index.html?mode=loop', './index.html?mode=probe']
    for (const to of wanted) expect(open).toContain(`href="${to}"`)
  })

  it('lists every line of the film and every cue as not made yet', () => {
    const sound = part(html, 'sound')
    const lines = Object.values(narration.film as Record<string, unknown[]>).reduce((s, l) => s + l.length, 0)
    const live = Object.entries(narration.liveOnly as Record<string, unknown>).filter(([k, v]) => k !== 'about' && Array.isArray(v)).reduce((s, [, v]) => s + (v as unknown[]).length, 0)
    expect(sound.split('not made yet').length - 1).toBe(lines + live + cfg.audio.sfx.length + 1)
    for (const s of cfg.audio.sfx) expect(sound).toContain(`<span class="tag">${s.id}</span>`)
    expect(sound).not.toContain('<audio')
  })

  it('carries the name, the date, the phase and the time used', () => {
    const progress = fs.readFileSync(path.join(repo, 'kit', 'PROGRESS.md'), 'utf8')
    const phase = progress.match(/^- Phase: (.*)$/m)![1]!
    const used = progress.split('\n').find((l) => l.startsWith('time used:'))!
    expect(html).toContain(`<h1>${cfg.name}</h1>`)
    expect(html).toContain(`<b>Phase</b> ${phase}`)
    expect(html).toContain(used)
    expect(html).toMatch(/<b>Date<\/b> \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC/)
  })

  it('is plain HTML that asks the network for nothing', () => {
    expect(html).not.toMatch(/https?:\/\//)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<link')
    expect(html).not.toContain('@import')
    expect(html).not.toContain('url(')
  })

  it('prints the size of the folder and of the page', () => {
    expect(said).toContain('dist/review/')
    expect(said).toContain('dist/review.html')
  })

  it('still builds when the notes, the narration and the copy are gone', () => {
    const bare = workspace()
    fs.rmSync(path.join(bare, 'kit', 'PROGRESS.md'))
    fs.rmSync(path.join(bare, 'content', 'narration.json'))
    fs.rmSync(path.join(bare, 'content', 'copy.json'))
    run(bare)
    expect(headings(page(bare))).toEqual(PARTS)
  })
})

describe('the review page with things to show', () => {
  let dir = ''
  let html = ''
  beforeAll(() => {
    dir = filled()
    run(dir)
    html = page(dir)
  })

  it('has the seven parts in order and no empty part', () => {
    expect(headings(html)).toEqual(PARTS)
    expect(html).not.toContain(NOTHING)
  })

  it('empties dist/review/ first and leaves the rest of dist/ alone', () => {
    expect(has(dir, 'stale.txt')).toBe(false)
    expect(fs.readFileSync(path.join(dir, 'dist', 'index.html'), 'utf8')).toBe('<p>the site</p>')
    expect(fs.existsSync(path.join(dir, 'dist', 'assets', 'app.js'))).toBe(true)
  })

  it('shows the newest status pictures with their captions and the time', () => {
    const latest = part(html, 'latest')
    expect(latest).toContain('2026-11-25T06:17Z')
    expect(latest).toContain('The page at rest, with &lt;angle&gt; marks &amp; an ampersand.')
    expect(latest).toContain('src="review/status/01-first-look.jpg"')
    expect(has(dir, 'status/01-first-look.jpg')).toBe(true)
  })

  it('escapes every string it is given', () => {
    expect(html).not.toContain('<angle>')
    expect(html).not.toContain('<tap>')
    expect(html).toContain('A soft &lt;tap&gt; on card')
  })

  it('puts the review cut first on the sound board, taken from out/work/ before out/', () => {
    const sound = part(html, 'sound')
    expect(sound.indexOf(`src="review/films/${files.reviewCut}"`)).toBeGreaterThan(0)
    expect(sound.indexOf(`src="review/films/${files.reviewCut}"`)).toBeLessThan(sound.indexOf('The narrator'))
    expect(fs.statSync(path.join(dir, 'dist', 'review', 'films', files.reviewCut)).size).toBe(60 * KB)
    expect(sound).toContain('src="review/sound/review.wav"')
  })

  it('lists the narrator in film order, then the live-only lines, then the cues', () => {
    const sound = part(html, 'sound')
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const order: string[] = []
    for (const u of cfg.film.units) {
      for (const b of cfg.film.beats.filter((x: any) => x.unit === u.id).sort((x: any, y: any) => x.from - y.from)) {
        for (const l of narration.film[b.id].slice().sort((x: any, y: any) => x.at - y.at)) order.push(`<span class="tag">${b.id}</span>`, `<div class="words">${esc(l.text)}`)
      }
    }
    let at = sound.indexOf('The narrator')
    for (const piece of order) {
      const next = sound.indexOf(piece, at)
      expect(next, piece).toBeGreaterThanOrEqual(at)
      at = next
    }
    const live = sound.indexOf('Live-only lines')
    const cues = sound.indexOf('<h3>Cues</h3>')
    expect(live).toBeGreaterThan(at)
    expect(cues).toBeGreaterThan(live)
    for (const [group, lines] of Object.entries(narration.liveOnly as Record<string, unknown>)) {
      if (group === 'about') continue
      for (const text of lines as string[]) {
        const found = sound.indexOf(`<div class="words">${esc(text)}`, live)
        expect(found, text).toBeGreaterThan(live)
        expect(found).toBeLessThan(cues)
      }
    }
    expect(sound).not.toContain(esc(narration.liveOnly.about))
  })

  it('gives a kept line its player and its length, and a kept cue each of its variants', () => {
    const sound = part(html, 'sound')
    expect(sound).toContain('<audio controls preload="none" src="review/sound/kept/line-one.wav"></audio>')
    expect(sound).toContain('2.31 s')
    expect(sound).toContain('src="review/sound/kept/live-one.mp3"')
    expect(sound).toContain('variant 1')
    expect(sound).toContain('src="review/sound/kept/cue-1.wav"')
    expect(sound).toContain('variant 2')
    expect(sound).toContain('src="review/sound/kept/cue-2.wav"')
    for (const f of ['line-one.wav', 'live-one.mp3', 'cue-1.wav', 'cue-2.wav']) expect(has(dir, `sound/kept/${f}`)).toBe(true)
  })

  it('shows the rough cut, the preview films and only the newest film of each kind at formats.hd', () => {
    const films = part(html, 'films')
    const hd = cfg.formats.hd.id
    for (const f of ['roughcut.mp4', files.previewA, files.previewB, `film-b-${hd}-review.mp4`, `film-a-${hd}-review.mp4`]) {
      expect(films).toContain(`src="review/films/${f}"`)
      expect(has(dir, `films/${f}`)).toBe(true)
    }
    expect(has(dir, `films/film-b-${hd}-draft.mp4`)).toBe(false)
    expect(has(dir, `films/film-b-${cfg.formats.preview.id}-draft.mp4`)).toBe(false)
  })

  it('shows the card loop, its web copy and the card still, from deliver/ before out/work/loop/', () => {
    const card = part(html, 'card')
    for (const f of [files.cardLoop, files.cardLoopWeb, files.cardStill]) expect(card).toContain(`src="review/card/${f}"`)
    expect(fs.statSync(path.join(dir, 'dist', 'review', 'card', files.cardLoop)).size).toBe(26 * KB)
  })

  it('puts comparison images and kept stills under Comparisons and sheets under Motion', () => {
    const comparisons = part(html, 'comparisons')
    const compare = comparisons.indexOf(`src="review/stills/compare-${cfg.keys[0].id}.jpg"`)
    const kept = comparisons.indexOf('src="review/stills/rest-step1.jpg"')
    expect(compare).toBeGreaterThan(0)
    expect(kept).toBeGreaterThan(comparisons.indexOf('<h3>'))
    expect(comparisons.indexOf('<h3>')).toBeGreaterThan(compare)
    expect(comparisons).not.toContain('sheet-step1-hit.jpg')
    expect(part(html, 'motion')).toContain('src="review/stills/sheet-step1-hit.jpg"')
    expect(html).not.toContain('review/stills/status')
  })

  it('plays every video and sound in the page from a relative address under review/', () => {
    const videos = [...html.matchAll(/<video[^>]*>/g)].map((m) => m[0])
    const audios = [...html.matchAll(/<audio[^>]*>/g)].map((m) => m[0])
    expect(videos.length).toBe(8)
    expect(audios.length).toBe(5)
    for (const v of videos) expect(v).toMatch(/^<video controls preload="metadata" playsinline( loop)? src="review\/[^"]+">$/)
    for (const s of audios) expect(s).toMatch(/^<audio controls preload="none" src="review\/[^"]+">$/)
    for (const m of html.matchAll(/ src="([^"]+)"/g)) expect(fs.existsSync(path.join(dir, 'dist', decodeURIComponent(m[1]!)))).toBe(true)
  })
})

describe('--max-mb', () => {
  it('leaves out the largest videos first until the folder fits, and says so at the top', () => {
    const dir = filled()
    const said = run(dir, '--max-mb', '0.4')
    const html = page(dir)
    const hd = cfg.formats.hd.id
    expect(has(dir, `films/film-b-${hd}-review.mp4`)).toBe(false)
    expect(has(dir, `films/film-a-${hd}-review.mp4`)).toBe(false)
    expect(has(dir, `films/${files.reviewCut}`)).toBe(true)
    expect(has(dir, 'films/roughcut.mp4')).toBe(true)
    const notice = html.indexOf('class="notice"')
    expect(notice).toBeGreaterThan(0)
    expect(notice).toBeLessThan(html.indexOf('<section'))
    const top = html.slice(notice, html.indexOf('<section'))
    expect(top).toContain(`film-b-${hd}-review.mp4`)
    expect(top).toContain(`film-a-${hd}-review.mp4`)
    expect(top).not.toContain('roughcut.mp4')
    expect(html).not.toContain(`src="review/films/film-b-${hd}-review.mp4"`)
    expect(said).toContain(`left out out/work/film-b-${hd}-review.mp4`)
    expect(headings(html)).toEqual(PARTS)
    let bytes = 0
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name))
        else bytes += fs.statSync(path.join(d, e.name)).size
      }
    }
    walk(path.join(dir, 'dist', 'review'))
    expect(bytes).toBeLessThanOrEqual(0.4 * 1024 * 1024)
  })

  it('leaves nothing out when the folder already fits', () => {
    const dir = filled()
    run(dir, '--max-mb', '500')
    const html = page(dir)
    expect(html).not.toContain('class="notice"')
    expect(has(dir, `films/film-b-${cfg.formats.hd.id}-review.mp4`)).toBe(true)
  })
})
