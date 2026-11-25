import { describe, expect, it } from 'vitest'
import { LightRig } from '../src/core/renderer'
import { look } from '../src/post/look'
import { quality } from '../src/core/quality'

const shadowed = (rig: LightRig) => rig.lamps.filter((l) => l.castShadow).length

describe('the levels of the light', () => {
  it('gives a computed picture everything', () => {
    const rig = new LightRig()
    rig.setLevel(null)
    expect(rig.key.shadow.mapSize.x).toBe(look.key.shadowMapPx)
    expect(rig.dome.shadow.mapSize.x).toBe(look.dome.shadowMapPx)
    expect(rig.dome.castShadow).toBe(true)
    expect(shadowed(rig)).toBe(look.emitters.shadows)
  })

  it('draws fewer shadow passes at each lower level and only the key at low', () => {
    const rig = new LightRig()
    rig.setLevel('high')
    expect(rig.key.shadow.mapSize.x).toBe(quality('high').shadowMapPx)
    expect(rig.dome.castShadow).toBe(true)
    const high = shadowed(rig)
    rig.setLevel('medium')
    expect(rig.key.shadow.mapSize.x).toBe(quality('medium').shadowMapPx)
    expect(rig.dome.castShadow).toBe(true)
    const medium = shadowed(rig)
    expect(medium).toBeLessThan(high)
    rig.setLevel('low')
    expect(rig.key.shadow.mapSize.x).toBe(quality('low').shadowMapPx)
    expect(rig.key.castShadow).toBe(true)
    expect(rig.dome.castShadow).toBe(false)
    expect(shadowed(rig)).toBe(0)
  })

  it('keeps setQuality working and lets a level follow it', () => {
    const rig = new LightRig()
    rig.setLevel('low')
    rig.setQuality(4096, 2048)
    expect(rig.key.shadow.mapSize.x).toBe(4096)
    expect(rig.dome.castShadow).toBe(true)
    rig.setLevel('low')
    expect(rig.key.shadow.mapSize.x).toBe(quality('low').shadowMapPx)
    expect(rig.dome.castShadow).toBe(false)
  })
})
