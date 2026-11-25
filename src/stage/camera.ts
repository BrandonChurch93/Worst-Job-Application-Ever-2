import { config } from '../config'
import type { CameraPose } from './types'

type V3 = [number, number, number]

export const homeDistance = (fov: number = config.cameras.home.fovDeg): number => 540 / Math.tan((fov * Math.PI) / 360)
export const homePose = (scroll = 0, floor = 0): CameraPose => ({ eye: [0, -scroll, floor + homeDistance()], target: [0, -scroll, floor], fov: config.cameras.home.fovDeg })
export const toWorld = (x: number, y: number, z = 0): V3 => [x - 960, 540 - y, z]

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

export function basis(pose: CameraPose): { right: V3; up: V3; forward: V3 } {
  const forward = unit(sub(pose.target, pose.eye))
  let up: V3 = pose.up ?? [0, 1, 0]
  if (Math.abs(dot(forward, unit(up))) > 0.9999) up = [0, 0, 1]
  const right = unit(cross(forward, up))
  return { right, up: cross(right, forward), forward }
}

export function project(pose: CameraPose, p: V3, width = 1920, height = 1080): { x: number; y: number; depth: number; pxPerUnit: number } {
  const b = basis(pose)
  const d = sub(p, pose.eye)
  const depth = dot(d, b.forward)
  const t = Math.tan((pose.fov * Math.PI) / 360)
  const nx = dot(d, b.right) / (depth * t * (width / height))
  const ny = dot(d, b.up) / (depth * t)
  return { x: (nx * 0.5 + 0.5) * width, y: (0.5 - ny * 0.5) * height, depth, pxPerUnit: height / 2 / (t * depth) }
}

export const projectPage = (pose: CameraPose, x: number, y: number, z = 0, width = 1920, height = 1080) => project(pose, toWorld(x, y, z), width, height)

export function mixPose(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const m = (p: number, q: number) => p + (q - p) * t
  const v = (p: V3, q: V3): V3 => [m(p[0], q[0]), m(p[1], q[1]), m(p[2], q[2])]
  const out: CameraPose = { eye: v(a.eye, b.eye), target: v(a.target, b.target), fov: m(a.fov, b.fov) }
  if (a.up || b.up) out.up = unit(v(a.up ?? [0, 1, 0], b.up ?? [0, 1, 0]))
  if (a.focus !== undefined && b.focus !== undefined) out.focus = m(a.focus, b.focus)
  if (a.aperture !== undefined && b.aperture !== undefined) out.aperture = m(a.aperture, b.aperture)
  return out
}

export const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

export function frame(box: { x: number; y: number; w: number; h: number }, fill = 1, floor = 0, fov: number = config.cameras.home.fovDeg): CameraPose {
  const need = Math.max(box.h, (box.w * 9) / 16) / fill
  const distance = need / 2 / Math.tan((fov * Math.PI) / 360)
  const c = toWorld(box.x + box.w / 2, box.y + box.h / 2, floor)
  return { eye: [c[0], c[1], floor + distance], target: c, fov }
}
