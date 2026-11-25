// The Phase 0 spike: a ceramic slab with one glass field, one orange button in a socket, type and a plain arrow.
// It exists to measure with. Every part of it is a stand-in, and it says so.
import * as THREE from 'three'
import { config, stepHz } from '../config'
import type { Bounds } from '../core/renderer'
import type { Emit, LayoutPart, PageRuntime, Pointer } from '../stage/stage'
import type { Materials } from '../shell/materials'
import { circle, merge, plateProfile, pocketProfile, roundedRect, ringPath, slab, sweep, translate } from '../shell/solids'
import { TypeRegister } from '../shell/type'

const STAND_IN = 'spike-scene'
const heights = config.scale.heights
const sizes = config.scale.sizes
const grid = config.scale.grid

const world = (px: number, py: number): [number, number] => [px - 960, 540 - py]

export function makeSpike(unit: string, materials: Materials): PageRuntime {
  const scene = new THREE.Scene()
  const register = new TypeRegister()
  const parts: LayoutPart[] = []

  const field = { x: grid.contentLeft, y: 372, w: 760, h: sizes.field }
  const button = { x: grid.contentLeft, y: 520, w: 264, h: sizes.button }
  const rail = { x: 960 - grid.progressPitch * 2, y: 96, pitch: grid.progressPitch, d: sizes.progressButton }

  const fieldOutline = roundedRect(field.w, field.h, 14)
  const socketOutline = roundedRect(button.w + 10, button.h + 10, (button.h + 10) / 2, 14)
  const buttonOutline = roundedRect(button.w, button.h, button.h / 2, 14)
  const [fx, fy] = world(field.x + field.w / 2, field.y + field.h / 2)
  const [bx, by] = world(button.x + button.w / 2, button.y + button.h / 2)

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, cast = true, receive = true): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    mesh.userData.standIn = STAND_IN
    scene.add(mesh)
    return mesh
  }

  const holes = [
    { outline: fieldOutline, cx: fx, cy: fy, lip: 1.2 },
    { outline: socketOutline, cx: bx, cy: by, lip: 1.2 }
  ]
  const railOutline = roundedRect(rail.pitch * 4 + rail.d + 28, rail.d + 28, (rail.d + 28) / 2, 14)
  const [rx, ry] = world(960, rail.y)
  holes.push({ outline: railOutline, cx: rx, cy: ry, lip: 1 })
  add(slab(1920, 1080, heights.slab, holes), materials.ceramic)
  add(translate(sweep(fieldOutline, pocketProfile(-heights.field, 1.2)), fx, fy), materials.pocket)
  add(translate(sweep(socketOutline, pocketProfile(-heights.buttonSocket, 1.2)), bx, by), materials.gap)
  add(translate(sweep(railOutline, pocketProfile(-heights.progressRail, 1)), rx, ry), materials.pocket)

  // The glass lies in its pocket with an aluminium band round it.
  const glassOutline = roundedRect(field.w - 5, field.h - 5, 11.5)
  const glass = add(translate(sweep(glassOutline, plateProfile(-0.6, 1.6, heights.field + 0.6)), fx, fy), materials.glass, false, true)
  glass.renderOrder = 2
  const band = new THREE.Shape()
  const outer = ringPath(fieldOutline, 0.2, fx, fy)
  band.curves = outer.curves
  band.holes.push(ringPath(fieldOutline, 2.6, fx, fy))
  const bandGeo = new THREE.ShapeGeometry(band)
  bandGeo.translate(0, 0, -0.35)
  add(bandGeo, materials.aluminium, false, true)

  const press = add(sweep(buttonOutline, plateProfile(heights.button, 7, heights.buttonSocket, 8)), materials.orange)
  press.position.set(bx, by, 0)

  const dots: THREE.Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const current = i === 0
    const top = current ? heights.progressButtonCurrent : heights.progressButton
    const [dx, dy] = world(rail.x + rail.pitch * i, rail.y)
    const dot = add(translate(sweep(circle(rail.d / 2, 56), plateProfile(top, 3, heights.progressRail, 5)), dx, dy), current ? materials.orange : materials.aluminium)
    dots.push(dot)
    parts.push({ id: `progress-${i + 1}`, kind: current ? 'progressButtonCurrent' : 'progressButton', planned: [rail.x + rail.pitch * i - rail.d / 2, rail.y - rail.d / 2, rail.d, rail.d], drawn: [rail.x + rail.pitch * i - rail.d / 2, rail.y - rail.d / 2, rail.d, rail.d], plannedHeight: top, height: top, mechanism: false })
  }

  const heading = register.set({ key: 'copy:step1.heading', font: 'inter-display-600', px: 60, x: grid.contentLeft, y: 250 }, materials.ink)
  const label = register.set({ key: 'copy:step1.fields.firstName.label', font: 'inter-500', px: 22, x: grid.contentLeft, y: 352 }, materials.ink)
  const helper = register.set({ key: 'copy:step1.fields.firstName.helper', font: 'inter-400', px: 18, x: grid.contentLeft, y: 372 + sizes.field + 30 }, materials.ink)
  const go = register.set({ key: 'copy:step1.continue', font: 'inter-600', px: 26, x: button.x + button.w / 2, y: button.y + button.h / 2 + 9, align: 'centre', z: heights.button + 0.08 }, materials.inkOnOrange)
  for (const run of [heading, label, helper]) {
    run.mesh.userData.standIn = STAND_IN
    scene.add(run.mesh)
  }
  go.mesh.userData.standIn = STAND_IN
  go.mesh.position.x -= bx
  go.mesh.position.y -= by
  press.add(go.mesh)

  parts.push({ id: 'field-firstName', kind: 'field', planned: [field.x, field.y, field.w, field.h], drawn: [field.x, field.y, field.w, field.h], plannedHeight: heights.field, height: heights.field, mechanism: false })
  parts.push({ id: 'button-continue', kind: 'button', planned: [button.x, button.y, button.w, button.h], drawn: [button.x, button.y, button.w, button.h], plannedHeight: heights.button, height: heights.button, mechanism: false })

  // A plain arrow: a white body with a dark edge under it, tip at its own origin.
  const k = config.cursor.heightPxAt1080 / 19
  const outlinePts: [number, number][] = [[0, 0], [0, 16.2], [3.9, 12.6], [6.9, 19], [9.6, 17.8], [6.7, 11.6], [11.8, 11.6]]
  const arrowShape = (grow: number) => {
    const cx = 4.2
    const cy = 9.5
    const s = new THREE.Shape()
    outlinePts.forEach(([x, y], i) => {
      const px = (cx + (x - cx) * grow) * k
      const py = -(cy + (y - cy) * grow) * k
      if (i === 0) s.moveTo(px, py)
      else s.lineTo(px, py)
    })
    s.closePath()
    return s
  }
  const arrow = new THREE.Group()
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(arrowShape(1), { depth: 3.4, bevelEnabled: true, bevelThickness: 1.3, bevelSize: 1.3, bevelSegments: 4, curveSegments: 1 }), materials.enamel)
  body.position.z = 2.6
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(arrowShape(1.16), { depth: 1.6, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 3, curveSegments: 1 }), materials.edge)
  rim.position.z = 1
  for (const m of [body, rim]) {
    m.castShadow = true
    m.receiveShadow = true
    m.userData.standIn = STAND_IN
    arrow.add(m)
  }
  scene.add(arrow)

  const start: Pointer = { x: 1180, y: 700, down: false }
  // The stepped state: where the arrow is, how fast it moves, how far the button is down, and the same one step earlier.
  const now = { x: start.x, y: start.y, vx: 0, vy: 0, press: 0, pressV: 0, held: 0 }
  const before = { ...now }
  const dt = 1 / stepHz
  const overButton = (p: Pointer) => p.x >= button.x && p.x <= button.x + button.w && p.y >= button.y && p.y <= button.y + button.h

  const bounds: Bounds = { minX: -980, maxX: 980, minY: -560, maxY: 560, minZ: -heights.slab - 4, maxZ: 60 }

  const page: PageRuntime = {
    id: unit,
    scene,
    bounds,
    seconds: 4,
    reset() {
      Object.assign(now, { x: start.x, y: start.y, vx: 0, vy: 0, press: 0, pressV: 0, held: 0 })
      Object.assign(before, now)
    },
    step(input, _step, emit: Emit) {
      Object.assign(before, now)
      const stiff = 420
      const damp = 30
      now.vx += (stiff * (input.x - now.x) - damp * now.vx) * dt
      now.vy += (stiff * (input.y - now.y) - damp * now.vy) * dt
      now.x += now.vx * dt
      now.y += now.vy * dt
      const want = input.down && overButton(input) ? 1 : 0
      if (want === 1 && now.held === 0) emit('button-press', button.x + button.w / 2, button.y + button.h / 2, false)
      now.held = want
      now.pressV += (900 * (want - now.press) - 44 * now.pressV) * dt
      now.press += now.pressV * dt
    },
    pose(alpha) {
      const x = before.x + (now.x - before.x) * alpha
      const y = before.y + (now.y - before.y) * alpha
      const p = before.press + (now.press - before.press) * alpha
      arrow.position.set(x - 960, 540 - y, heights.cursorHover)
      press.position.z = -heights.keyTravel * 0.55 * p
    },
    save() {
      return [now.x, now.y, now.vx, now.vy, now.press, now.pressV, now.held, before.x, before.y, before.vx, before.vy, before.press, before.pressV, before.held]
    },
    load(s) {
      const keys = ['x', 'y', 'vx', 'vy', 'press', 'pressV', 'held'] as const
      keys.forEach((key, i) => {
        now[key] = s[i]!
        before[key] = s[i + 7]!
      })
    },
    script(time) {
      const t = ((time % 4) + 4) % 4
      const ease = (a: number, b: number) => {
        const u = Math.min(1, Math.max(0, (t - a) / (b - a)))
        return u * u * (3 - 2 * u)
      }
      const to = { x: button.x + button.w * 0.62, y: button.y + button.h * 0.55 }
      const away = { x: 1320, y: 420 }
      const a = ease(0.3, 1.3)
      const b = ease(2.2, 3.4)
      return { x: start.x + (to.x - start.x) * a + (away.x - to.x) * b, y: start.y + (to.y - start.y) * a + (away.y - to.y) * b, down: t >= 1.5 && t < 1.9 }
    },
    cursor() {
      return { x: arrow.position.x + 960, y: 540 - arrow.position.y, z: arrow.position.z, scale: 1, acting: 'plain', damage: [], arms: false, onPage: true, inBall: false }
    },
    layout: () => parts,
    type: () => register.runs,
    standIns: () => [{ name: STAND_IN, unit }],
    textureBytes: () => materials.textures.reduce((sum, t) => sum + (t.image as { width: number; height: number }).width * (t.image as { width: number; height: number }).height * 4 * 1.34, 0)
  }
  page.reset()
  page.pose(1)
  void merge
  void dots
  return page
}
