export interface PointerReport { anyHover: boolean; anyFine: boolean; touch: boolean }

// A device is touch-only when it takes touches, none of its pointers can hover and none is fine. A machine that reports no pointer at all is not one. The size of the window is never asked.
export const isTouchOnly = (r: PointerReport): boolean => r.touch && !r.anyHover && !r.anyFine

export function touchOnly(): boolean {
  if (typeof matchMedia !== 'function') return false
  const touch = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || matchMedia('(any-pointer: coarse)').matches
  return isTouchOnly({ anyHover: matchMedia('(any-hover: hover)').matches, anyFine: matchMedia('(any-pointer: fine)').matches, touch })
}

export function lessMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const clockText = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
