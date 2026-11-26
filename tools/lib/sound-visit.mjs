// npm run sound -- --visit keen: one bot plays the whole live site through the stage and the site's own sound engine, without a browser.
// The engine runs on a sound clock that is the stage's time, and is fed as src/main.ts feeds it: every event, every gag reached, the page's volume, the idle call.
// What comes out is the engine's own log of the narrator, every loop it started and stopped, and the volume it was set to.
import fs from 'node:fs'
import path from 'node:path'
import { at, writeJson } from './paths.mjs'

class Param {
  value = 1
  setValueAtTime(v) { this.value = v }
  linearRampToValueAtTime(v) { this.value = v }
  cancelScheduledValues() {}
}
class Node { connect() {} disconnect() {} }
class Gain extends Node { gain = new Param() }
class Panner extends Node { pan = new Param() }

function fakeContext(heard) {
  return class {
    currentTime = 0
    state = 'suspended'
    destination = new Node()
    resume() { this.state = 'running'; return Promise.resolve() }
    suspend() { this.state = 'suspended'; return Promise.resolve() }
    close() { return Promise.resolve() }
    gains = []
    createGain() { const g = new Gain(); this.gains.push(g); return g }
    createStereoPanner() { return new Panner() }
    createBufferSource() {
      const ctx = this
      const row = { id: '', loop: false, asked: 0, start: 0, stop: null }
      return {
        playbackRate: new Param(), onended: null, connect() {}, disconnect() {},
        set buffer(b) { row.id = b.id },
        get buffer() { return { id: row.id } },
        set loop(v) { row.loop = v },
        get loop() { return row.loop },
        start(t) { row.asked = ctx.currentTime; row.start = t ?? ctx.currentTime; heard.push(row) },
        stop(t) { row.stop = t ?? ctx.currentTime }
      }
    }
    decodeAudioData(bytes, ok) {
      const b = new Uint8Array(bytes)
      let n = 0
      while (n < b.length && b[n] !== 0) n++
      const id = new TextDecoder().decode(b.subarray(0, n))
      const buffer = { id, numberOfChannels: 1, duration: 0 }
      if (ok) ok(buffer)
      return Promise.resolve(buffer)
    }
  }
}

// The site's sound files stand in as their own names: the engine loads and places them as it does the real ones, and nothing is decoded.
function fakeFetch(index) {
  const enc = new TextEncoder()
  const named = (id, bytes) => {
    const out = new Uint8Array(Math.max(bytes, id.length + 1))
    out.set(enc.encode(id))
    return out
  }
  const files = new Map()
  if (index.pack) {
    const pack = new Uint8Array(index.pack.bytes)
    for (const s of index.sfx) pack.set(enc.encode(s.id).subarray(0, s.bytes - 1), s.at)
    files.set(index.pack.file, pack)
  }
  for (const f of [...index.loops, ...index.lines]) files.set(f.file, named(f.id, 64))
  return async (url) => {
    const bytes = files.get(String(url).split('/').pop())
    if (!bytes) return { ok: false, status: 404 }
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  }
}

export async function visit(load, c, bot, seed = c.seed) {
  const index = JSON.parse(fs.readFileSync(at('public', 'audio', 'index.json'), 'utf8'))
  const heard = []
  const made = []
  const Fake = fakeContext(heard)
  const Ctx = class extends Fake { constructor() { super(); made.push(this) } }
  const before = { window: globalThis.window, fetch: globalThis.fetch }
  globalThis.window = { AudioContext: Ctx, setTimeout, clearTimeout }
  globalThis.fetch = fakeFetch(index)
  try {
    const { makeSound } = await load('/src/audio/index.ts')
    const { Stage, liveFlow } = await load('/src/stage/stage.ts')
    const { BotDriver } = await load('/src/stage/bots.ts')
    const { pages } = await load('/src/pages/index.ts')
    const { stepHz } = await load('/src/config.ts')
    const sound = makeSound({ base: './audio/', index })
    await sound.unlock()
    const ctx = made[0]
    globalThis.window = before.window
    const inner = new BotDriver(bot, seed)
    let lastInput = 0
    let was = ''
    const driver = {
      name: inner.name,
      input(view) {
        const p = inner.input(view)
        const key = JSON.stringify(p)
        if (key !== was) {
          was = key
          lastInput = view.time
        }
        return p
      }
    }
    const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver, seed })
    const limit = Math.round(c.live.botMaxSeconds * stepHz)
    const volumes = []
    const steps = []
    const turns = []
    const events = {}
    let sent = 0
    let gags = 0
    let volume = -1
    let entry = -1
    while (!stage.finished && stage.step < limit) {
      stage.advance(Math.round(stepHz / 60))
      ctx.currentTime = stage.time
      if (stage.entryIndex !== entry) {
        entry = stage.entryIndex
        turns.push({ at: Number(stage.time.toFixed(2)), page: stage.page.id })
      }
      for (; sent < stage.events.length; sent++) {
        const e = stage.events[sent]
        events[e.name] = (events[e.name] ?? 0) + 1
        sound.event(e, 'live')
      }
      const reached = stage.gagsReached
      for (; gags < reached.length; gags++) sound.beat(reached[gags], 'live')
      const v = stage.page.volume?.() ?? 1
      if (v !== volume) {
        volume = v
        sound.setVolume(v)
        steps.push({ at: Number(stage.time.toFixed(2)), page: stage.page.id, volume: Number(v.toFixed(3)), output: Number(ctx.gains[0].gain.value.toFixed(3)) })
        const last = volumes[volumes.length - 1]
        const row = { at: Number(stage.time.toFixed(2)), page: stage.page.id, volume: Number(v.toFixed(3)) }
        if (last && last.page === row.page && row.at - last.at < 0.5 && volumes.length > 1 && volumes[volumes.length - 2].page === row.page && row.at - volumes[volumes.length - 2].at < 0.5) volumes[volumes.length - 1] = row
        else volumes.push(row)
      }
      sound.quiet(stage.time - lastInput)
    }
    const pageAt = (t) => turns.filter((x) => x.at <= t + 1e-9).pop()?.page ?? turns[0]?.page ?? ''
    const log = sound.log().map((e) => ({ ...e, page: pageAt(e.at) }))
    const loops = heard.filter((h) => h.loop || h.id === 'hold-music').map((h) => ({ id: h.id, page: pageAt(h.asked), start: Number(h.start.toFixed(2)), stop: h.stop === null ? null : Number(h.stop.toFixed(2)) }))
    return {
      bot, seed, finished: stage.finished, seconds: Number(stage.time.toFixed(2)), skips: events.skip ?? 0, turns, gags: stage.gagsReached,
      sounds: heard.length, lines: heard.filter((h) => h.id.startsWith('line.')).length, log, loops, volumes, volumeSteps: steps, events
    }
  } finally {
    globalThis.window = before.window
    globalThis.fetch = before.fetch
  }
}

export function visitText(r) {
  const out = []
  const spoken = r.log.filter((e) => e.what === 'spoken')
  const back = r.log.filter((e) => e.what === 'taken back' || e.what === 'cut')
  const gone = new Set(back.filter((e) => e.what === 'taken back').map((e) => `${e.line}@${e.start}`))
  out.push(`${r.bot}, seed ${r.seed}: ${r.finished ? 'finished' : 'not finished'} in ${r.seconds} s, ${r.skips} skips, ${r.sounds} sounds started, ${spoken.length} lines booked, ${back.length} taken back or cut, ${r.log.filter((e) => e.what === 'dropped').length} dropped`)
  out.push(`pages: ${r.turns.map((t) => `${t.page} ${t.at}`).join(', ')}`)
  out.push('')
  out.push('| at s | page | line | trigger | starts s | seconds | heard |')
  out.push('| --- | --- | --- | --- | --- | --- | --- |')
  for (const e of spoken) out.push(`| ${e.at.toFixed(2)} | ${e.page} | ${e.line} | ${e.trigger} | ${e.start.toFixed(2)} | ${e.seconds} | ${gone.has(`${e.line}@${e.start}`) ? 'no, taken back' : 'yes'} |`)
  out.push('')
  out.push('| at s | page | line | what | trigger | why |')
  out.push('| --- | --- | --- | --- | --- | --- |')
  const groups = new Map()
  for (const e of r.log.filter((x) => x.what !== 'spoken')) {
    const why = (e.why ?? '').replace(/\d+\.\d+ s after its trigger/, 'N s after its trigger')
    const key = `${e.page}|${e.line}|${e.what}|${e.trigger}|${why}`
    const g = groups.get(key) ?? { first: e, n: 0, last: e.at }
    g.n++
    g.last = e.at
    groups.set(key, g)
  }
  for (const g of groups.values()) out.push(`| ${g.first.at.toFixed(2)}${g.n > 1 ? ` to ${g.last.toFixed(2)}, ${g.n} times` : ''} | ${g.first.page} | ${g.first.line} | ${g.first.what} | ${g.first.trigger} | ${g.first.why ?? ''} |`)
  out.push('')
  out.push(`loops and music: ${r.loops.map((l) => `${l.id} on ${l.page} from ${l.start} to ${l.stop ?? 'the end of the visit'}`).join('; ')}`)
  out.push(`volume: ${r.volumes.length ? r.volumes.map((v) => `${v.volume} at ${v.at} (${v.page})`).join(', ') : 'never changed from 1'}`)
  return out.join('\n')
}

export async function visitRun(load, c, a) {
  const bot = a.visit === true ? 'keen' : String(a.visit)
  if (!c.live.bots.includes(bot)) throw new Error(`no bot called ${bot}: ${c.live.bots.join(', ')}`)
  const r = await visit(load, c, bot, a.seed !== undefined ? Number(a.seed) : c.seed)
  const file = at('out', 'work', 'audio', `visit-${bot}.json`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  writeJson(file, r)
  console.log(visitText(r))
  return r
}
