import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { sheetScale } from '../layout'

const near = (v: number): number => Math.round(v * 1000) / 1000
const plain = (s: Shape, k: number): Shape => ({ ...s, x: s.x + s.w / 2 - s.w / k / 2, y: s.y + s.h / 2 - s.h / k / 2, w: near(s.w / k), h: near(s.h / k), z1: s.z0 + (s.z1 - s.z0) / k })

// A machine on the sheet is the page's machine, built once at its own size and shown larger or smaller.
export function scaled(maker: PartMaker): PartMaker {
  return {
    key(s, ctx) {
      const k = sheetScale(s.id)
      if (k === 1) return maker.key(s, ctx)
      return maker.key(plain(s, k), ctx)
    },
    make(s, ctx) {
      const k = sheetScale(s.id)
      if (k === 1) return maker.make(s, ctx)
      const inner = maker.make(plain(s, k), ctx)
      const mid = new THREE.Group()
      mid.scale.setScalar(k)
      mid.add(inner)
      const outer = new THREE.Group()
      outer.add(mid)
      outer.userData.inner = inner
      outer.userData.times = k
      return outer
    },
    pose(o, s, ctx) {
      const inner = o.userData.inner as THREE.Object3D | undefined
      if (!inner) maker.pose?.(o, s, ctx)
      else maker.pose?.(inner, plain(s, o.userData.times as number), ctx)
    },
    drop(o) {
      maker.drop?.((o.userData.inner as THREE.Object3D | undefined) ?? o)
    }
  }
}
