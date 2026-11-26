// The colours of the light in the machine, linear RGB. A lens and the light it throws read the same constant.
export type RGB = [number, number, number]

// Tier 3, Corporate: white and gold. The lamps are the warm white of the approved image, the cold is in the fill and the flash.
export const CORPORATE_WHITE: RGB = [1.0, 0.94, 0.84]
export const CORPORATE_GOLD: RGB = [1.0, 0.62, 0.24]
export const CORPORATE_GLOBE: RGB = [1.0, 0.93, 0.82]
export const CORPORATE_WINDOW: RGB = [1.0, 0.83, 0.6]
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

// How much of a far lamp's light the print of a floor gives back, seen from straight above and seen along the floor. The night tiers are dark lacquer between their pools; the Office is a lit room.
export const DEEP: Record<string, [number, number]> = {
  corporate: [0.8, 0.2],
  office: [1, 0.7],
  street: [0.75, 0.2]
}

// How bright a lens is when its lamp is on, in linear light: the middle is above the threshold of the lens glow, the rim below.
export const LENS = { on: 4.2, window: 1.3, rim: 0.42, off: 0.0 }
// The lamp in a bumper stands at this share of the general lighting and flashes to full on a hit.
export const BUMPER = { rest: 0.5, seconds: 0.25 }

// What a flash of a whole tier does to the picture. The page can raise the flash five times in one second while steel balls are in play (measured in `tests/table-lights-strobe.test.ts`), so a flash is kept shallow: the lamps flare and the pools round them brighten, and the floor between them changes by less than a tenth of the brightest white over most of any part of the picture.
export const FLASH = { flat: 0.05, lamps: 0.3, fill: 0.01, room: 0.15, lens: 0.4 }

export const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]
