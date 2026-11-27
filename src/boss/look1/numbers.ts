// Sizes of look 1 in the units of the target sheets (px of the 1920 wide pictures): forward along +x, z up from the ground, the hull's centre over the origin.
// MEASURED in references/approved-002/boss-turret-inside.png and boss-turret-out.png; heights read from the side view of round 8.

export const HULL = { hx: 295, hy: 127, c: 44, top: 170, tall: 26, belly: 92 }
export const BTN = { w: 462, h: 150, r: 64, tall: 24, z: 172 }
export const PAGE_BTN = { w: 288, h: 72 }
export const WING = { inner: 175, outer: 130, reach: 151, top: 150 }
export const GUN = { x: 7, y: 206, z: 162, axis: 52, reach: 196, baseR: 62 }
export const HATCH = { cx: -385, hx: 108, hy: 128, c: 50, top: 166, slide: 205 }
export const SHIELD = { mid: 388, half: 194, r: 514, thick: 25, z0: 92, z1: 222 }
export const HIPS: [number, number][] = [[205, 152], [205, -152], [-205, 152], [-205, -152]]
export const FEET: [number, number][] = [[412, 366], [412, -366], [-416, 370], [-416, -370]]
export const LEG = { a: 190, b: 200, hipZ: 138, ankle: 34, lean: -0.42 }
export const CANNON = { pivotX: -521, bayX: -385, z: 268, breech: [89, 391] as const, ribs: [391, 631] as const, sleeve: [631, 707] as const, barrel: [707, 1111] as const, brake: [1111, 1237] as const, r: { breech: 79, ribs: 71, core: 56, sleeve: 38, barrel: 22, brake: 35 } }

