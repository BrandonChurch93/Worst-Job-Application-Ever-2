// The colours of the light in the machine, linear RGB. A lens and the light it throws read the same constant.
export type RGB = [number, number, number]

// Tier 3, Corporate: cold white and gold.
export const CORPORATE_COLD_WHITE: RGB = [0.78, 0.88, 1.0]
export const CORPORATE_GOLD: RGB = [1.0, 0.62, 0.24]
export const CORPORATE_GLOBE: RGB = [1.0, 0.93, 0.82]
export const CORPORATE_WINDOW: RGB = [1.0, 0.74, 0.4]
export const CORPORATE_FLASH: RGB = [0.92, 0.95, 1.0]

// Tier 2, The Office: flat fluorescent white, a little green.
export const OFFICE_FLUORESCENT: RGB = [0.86, 1.0, 0.92]
export const OFFICE_BUMPER: RGB = [1.0, 0.95, 0.84]
export const OFFICE_COFFEE: RGB = [1.0, 0.7, 0.36]
export const OFFICE_FLASH: RGB = [0.94, 1.0, 0.97]

// Tier 1, The Street: warm dusk, one red beacon and one blue.
export const STREET_DUSK: RGB = [1.0, 0.8, 0.56]
export const STREET_SODIUM: RGB = [1.0, 0.5, 0.16]
export const STREET_RED: RGB = [1.0, 0.06, 0.03]
export const STREET_BLUE: RGB = [0.05, 0.22, 1.0]
export const STREET_WINDOW: RGB = [1.0, 0.76, 0.42]
export const STREET_FLASH: RGB = [1.0, 0.93, 0.84]

// The four dot displays, and the marquee's panel at dusk.
export const DISPLAY_AMBER: RGB = [1.0, 0.5, 0.08]
export const MARQUEE_PANEL: RGB = [0.72, 0.8, 1.0]

// The soft light a tier's lamps leave everywhere on it, so that no roof is lit from nowhere and none is black.
export const FILL: Record<string, RGB> = {
  marquee: [0.5, 0.56, 0.7],
  corporate: [0.5, 0.6, 0.86],
  office: [0.72, 0.84, 0.78],
  street: [0.6, 0.56, 0.7]
}

// How bright a lens is when its lamp is on, in linear light: the middle is above the threshold of the lens glow, the rim below.
export const LENS = { on: 2.6, rim: 0.34, off: 0.0 }
// The lamp in a bumper stands at this share of the general lighting and flashes to full on a hit.
export const BUMPER = { rest: 0.5, seconds: 0.25 }

export const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]
