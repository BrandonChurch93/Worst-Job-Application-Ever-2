// What the look reads each step, filled by the fight. Types only.
// Places and sizes are page px on the 1920 by 1080 page. Angles are radians, 0 along +x, growing clockwise on the page (y runs down).
// Every field that ends in At is a time on the same clock as BossView.time, or null while the thing has not happened yet.

export type ViewPhase = 'form' | 'turret' | 'fight' | 'beaten' | 'submitted'

export interface ViewPoint { x: number; y: number }

export interface ViewBox { x0: number; y0: number; x1: number; y1: number }

export interface ViewShield {
  glancedAt: number | null
  half: number
}

export interface ViewGun {
  aim: number
  tell: number
  firedAt: number | null
}

export interface ViewBig {
  tell: number
  aim: number
  firedAt: number | null
  x0: number
  y0: number
  x1: number
  y1: number
  width: number
}

export interface ViewWeak {
  x: number
  y: number
  shownAt: number | null
}

export interface ViewBoss {
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  walked: number
  form: number
  turret: number
  locked: boolean
  // The time at which `locked` became true, or null before it.
  lockedAt?: number | null
  health: number
  stage: 0 | 1 | 2
  shield: ViewShield
  guns: [ViewGun, ViewGun]
  big: ViewBig | null
  weak: ViewWeak | null
  healedAt: number | null
  hitAt: number | null
  beaten: number
  // 0 until the finishing blast is fired, to 1 over the blast: at 1 the body is gone and only the button lies on the ground. Absent before the finish exists.
  gone?: number
}

export interface ViewBullet {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  from: 'gun' | 'corner'
}

export interface ViewDart {
  id: number
  x: number
  y: number
  vx: number
  vy: number
}

export type ViewHitKind = 'glance' | 'round' | 'solid' | 'arrow'

export interface ViewHit {
  id: number
  at: number
  x: number
  y: number
  kind: ViewHitKind
}

export interface ViewCorner {
  id: 0 | 1 | 2 | 3
  x: number
  y: number
  aim: number
  tell: number
  firedAt: number | null
}

export interface ViewArrow {
  x: number
  y: number
  flat: number
  flatAt: number | null
  // 0 to 1: the gold that builds round the arrow from `power-up`.
  power?: number
  // 0 to 1: how far the arrow's arms are out for the finishing blast.
  arms?: number
  // 0 to 1: how far the finishing blast is charged.
  charge?: number
}

// The finishing blast, from the arrow to the fallen boss, while it stands. `power` is 0 to 1: how full the charge was when it was let go.
export interface ViewFinish {
  x0: number
  y0: number
  x1: number
  y1: number
  power: number
  firedAt: number
}

export interface ViewBreak {
  id: number
  at: number
  x0: number
  y0: number
  x1: number
  y1: number
  width: number
}

export interface BossView {
  time: number
  phase: ViewPhase
  boss: ViewBoss
  bullets: ViewBullet[]
  darts: ViewDart[]
  hits: ViewHit[]
  corners: [ViewCorner, ViewCorner, ViewCorner, ViewCorner]
  arrow: ViewArrow
  breaks: ViewBreak[]
  finish?: ViewFinish | null
}

export interface ViewSolid {
  id: string
  kind: 'pillar' | 'pane'
  box: ViewBox
}

export interface ViewSolids {
  standing: ViewSolid[]
  slab: ViewPoint[]
}

export type SolidsOf = (view: BossView) => ViewSolids
