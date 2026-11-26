import * as THREE from 'three'
import { assetUrl, fetchBytes, filesOf, type AssetSet } from './assets'

// The pictures the pages are built from, and when each is fetched, put on the graphics card and let go.
// A still, a film frame and a stepped run load a page whole before the first frame and keep it. The live site loads a page while the visitor is on the one before it, puts one picture on the card between two frames, lets its decoded source go, and lets a page go when it has been left.

export type PictureState = 'idle' | 'loading' | 'loaded' | 'failed' | 'absent'

export interface Asked {
  file: string
  // False while the file is not in the asset set in use, not loaded, or, on the live site, not on the card yet. A maker answers null until its pictures are ready.
  ready(): boolean
  texture(): THREE.Texture
}

interface Entry { page: string; folder: string; file: string; colour: boolean; repeat: boolean; state: PictureState; texture: THREE.Texture | null; onCard: boolean; source: boolean; bytes: number; pixels: number; run: number }

export interface LoadedPage { files: number; loaded: number; failed: number; onCard: number; sources: number; fetchedMb: number; cardMb: number; ready: boolean }
// `card` is everything the renderer holds on the graphics card now, whoever made it: geometries and textures.
export interface LoadState { staged: boolean; show: string; pages: Record<string, LoadedPage>; waiting: string[]; card: { geometries: number; textures: number } | null; longestUploadMs: number; longestDecodeMs: number }
export interface Card { initTexture(t: THREE.Texture): void; info?: { memory: { geometries: number; textures: number } } }

const entries = new Map<string, Entry>()
const gates = new Map<string, { page: string; ready: () => boolean }>()
const started = new Map<string, Promise<void>>()
// A page with pictures that starts to load this many pages early. The pinball machine is the largest: it starts during step 1.
const EARLY: Record<string, number> = { step3: 2 }

let staged = false
let card: Card | null = null
let clock: (() => number) | null = null
let shown = ''
let longestUpload = 0
let longestDecode = 0
let queue: Promise<void> = Promise.resolve()

// Call it at the top of a file, never inside `make`. Colour pictures are read as sRGB, data pictures as they are.
export function picture(page: string, folder: string, file: string, o: { colour: boolean; repeat?: boolean }): Asked {
  let e = entries.get(file)
  if (!e) {
    e = { page, folder, file, colour: o.colour, repeat: o.repeat ?? false, state: 'idle', texture: null, onCard: false, source: false, bytes: 0, pixels: 0, run: 0 }
    entries.set(file, e)
  } else if (e.colour !== o.colour || e.repeat !== (o.repeat ?? false)) throw new Error(`The picture "${file}" is asked for in two ways`)
  const entry = e
  return {
    file,
    ready: () => isReady(entry),
    texture() {
      if (!entry.texture) throw new Error(`The picture "${file}" is not loaded: answer null from key() while ready() is false`)
      return entry.texture
    }
  }
}

const isReady = (e: Entry): boolean => e.texture !== null && (!staged || e.onCard)

export const picturesOf = (page: string): string[] => [...entries.values()].filter((e) => e.page === page).map((e) => e.file).sort()

// A part that is built from pictures says so here, with the answer of its `ready`.
export function gate(part: string, page: string, ready: () => boolean): void {
  gates.set(part, { page, ready })
}

export const gated = (part: string): boolean => gates.has(part)

// True while a part is not drawn only because its pictures are still on their way. A part whose pictures were never asked for, failed, or are not in the asset set does not wait: it is missing, and is said so.
export function waitsFor(part: string): boolean {
  const g = gates.get(part)
  return g !== undefined && !g.ready() && started.has(g.page) && !settled(g.page)
}

const mine = (page: string): Entry[] => [...entries.values()].filter((e) => e.page === page)

function settled(page: string): boolean {
  return mine(page).every((e) => e.state === 'failed' || e.state === 'absent' || (e.state === 'loaded' && isReady(e)))
}

// True when nothing more of a page is on its way: every picture it has in the asset set is ready, or has failed. A page with no pictures is always ready.
export function pageReady(page: string): boolean {
  const list = mine(page)
  return list.length === 0 || (started.has(page) && settled(page))
}

function textureOf(e: Entry, bitmap: ImageBitmap): THREE.Texture {
  const t = new THREE.Texture(bitmap)
  t.colorSpace = e.colour ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.wrapS = t.wrapT = e.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.anisotropy = 8
  t.name = e.file
  t.needsUpdate = true
  return t
}

const nextFrame = (): Promise<void> => new Promise((done) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => done()) : setTimeout(done, 0)))
const since = (t: number): number => (clock ? (clock() - t) * 1000 : 0)

async function decode(e: Entry, bytes: ArrayBuffer, run: number): Promise<ImageBitmap | null> {
  const t0 = clock?.() ?? 0
  const bitmap = await createImageBitmap(new Blob([bytes]), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
  longestDecode = Math.max(longestDecode, since(t0))
  if (e.run !== run) {
    bitmap.close()
    return null
  }
  e.pixels = bitmap.width * bitmap.height
  e.texture = textureOf(e, bitmap)
  e.source = true
  e.state = 'loaded'
  return bitmap
}

// On the live site one picture at a time is decoded and put on the card, each between two frames, so no frame carries more than one.
function stage(e: Entry, bytes: ArrayBuffer, run: number): Promise<void> {
  if (!staged || !card) return decode(e, bytes, run).then(() => undefined)
  const to = card
  const step = queue.then(async () => {
    if (e.run !== run) return
    const bitmap = await decode(e, bytes, run)
    if (!bitmap) return
    await nextFrame()
    if (e.run !== run || !e.texture) return
    const t1 = clock?.() ?? 0
    to.initTexture(e.texture)
    longestUpload = Math.max(longestUpload, since(t1))
    e.onCard = true
    bitmap.close()
    e.source = false
    await nextFrame()
  })
  queue = step.catch(() => undefined)
  return step
}

// Loads every picture of a page that is in the asset set. A capture awaits it before its first frame.
export function loadPage(page: string, set: AssetSet): Promise<void> {
  const going = started.get(page)
  if (going) return going
  const list = mine(page)
  const have = new Map<string, number>()
  for (const folder of new Set(list.map((e) => e.folder))) for (const f of filesOf(folder, set)) have.set(f.file, f.bytes)
  const all = Promise.all(
    list.map(async (e) => {
      if (e.state !== 'idle' && e.state !== 'absent') return
      if (!have.has(e.file)) {
        e.state = 'absent'
        return
      }
      const run = ++e.run
      e.state = 'loading'
      try {
        const bytes = await fetchBytes(assetUrl(e.folder, e.file, set))
        e.bytes = bytes.byteLength
        await stage(e, bytes, run)
      } catch (error) {
        if (e.run === run) e.state = 'failed'
        throw error
      }
    })
  ).then(() => undefined)
  started.set(page, all)
  return all
}

// Lets a page that has been left go: its pictures leave the card, and are fetched again from the browser's cache if the page is shown again.
export function releasePage(page: string): void {
  if (!staged || !started.has(page)) return
  started.delete(page)
  for (const e of mine(page)) {
    e.run++
    e.texture?.dispose()
    const bitmap = e.texture?.image as ImageBitmap | undefined
    if (e.source) bitmap?.close?.()
    e.texture = null
    e.onCard = false
    e.source = false
    e.state = 'idle'
  }
}

// The live site calls it once, before its first frame: from then on a picture is ready when it is on the card.
export function stageLoading(to: Card, wall: () => number): void {
  staged = true
  card = to
  clock = wall
}

// The pages whose pictures belong in memory while one page of a flow is on show: its own, the next one's, and those of a page that starts early.
export function wanted(flow: readonly string[], page: string): string[] {
  const at = flow.indexOf(page)
  if (at < 0) return [page]
  return flow.filter((id, i) => i >= at && i - at <= Math.max(1, EARLY[id] ?? 1))
}

// Called for every frame of the live site with the page on show: starts what is wanted and lets go what is left.
export function showPage(flow: readonly string[], page: string, set: AssetSet): void {
  if (!staged || page === shown) return
  shown = page
  const keep = new Set(wanted(flow, page))
  for (const id of [...started.keys()]) if (!keep.has(id)) releasePage(id)
  for (const id of keep) if (mine(id).length > 0) loadPage(id, set).catch((e: unknown) => console.error(e))
}

const mb = (bytes: number): number => Math.round((bytes / 1048576) * 1000) / 1000

// What is loaded and what is on the card, page by page. A picture on the card is counted with its mipmaps.
export function loadState(): LoadState {
  const pages: Record<string, LoadedPage> = {}
  for (const e of entries.values()) {
    const p = (pages[e.page] ??= { files: 0, loaded: 0, failed: 0, onCard: 0, sources: 0, fetchedMb: 0, cardMb: 0, ready: pageReady(e.page) })
    p.files++
    if (e.state === 'loaded') p.loaded++
    if (e.state === 'failed') p.failed++
    if (e.onCard) p.onCard++
    if (e.source) p.sources++
    p.fetchedMb = mb(p.fetchedMb * 1048576 + (e.state === 'loaded' ? e.bytes : 0))
    p.cardMb = mb(p.cardMb * 1048576 + (e.onCard ? (e.pixels * 4 * 4) / 3 : 0))
  }
  const held = card?.info?.memory
  return { staged, show: shown, pages, waiting: [...gates.keys()].filter(waitsFor).sort(), card: held ? { geometries: held.geometries, textures: held.textures } : null, longestUploadMs: Math.round(longestUpload * 10) / 10, longestDecodeMs: Math.round(longestDecode * 10) / 10 }
}

// For tests only: back to nothing loaded and nothing staged.
export function resetLoading(): void {
  for (const e of entries.values()) {
    e.run++
    e.texture = null
    e.onCard = false
    e.source = false
    e.state = 'idle'
  }
  started.clear()
  staged = false
  card = null
  clock = null
  shown = ''
  longestUpload = 0
  longestDecode = 0
  queue = Promise.resolve()
}
