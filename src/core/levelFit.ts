// The height in CSS pixels of the film's bar. While the mode is film the picture is shown that much shorter (`.fitted` in src/ui/interface.module.css).
export const FILM_BAR_PX = 56
// The narrowest and the widest drawing buffer of the live picture, in pixels.
export const BUFFER_PX = { min: 320, max: 1920 }

export interface Fit { cssWidth: number; cssHeight: number; width: number; height: number }

// The size the live picture is shown at in a window, 16 to 9, and the size of the buffer it is drawn in at one pixel ratio.
export function fitPicture(windowWidth: number, windowHeight: number, pixelRatio: number, ratioCap: number, film: boolean): Fit {
  const ratio = Math.min(pixelRatio || 1, ratioCap)
  const room = Math.max(0, windowHeight - (film ? FILM_BAR_PX : 0))
  const cssWidth = Math.min(windowWidth, (room * 16) / 9)
  const cssHeight = (cssWidth * 9) / 16
  const width = Math.max(BUFFER_PX.min, Math.min(BUFFER_PX.max, Math.round(cssWidth * ratio)))
  return { cssWidth, cssHeight, width, height: Math.round((width * 9) / 16) }
}
