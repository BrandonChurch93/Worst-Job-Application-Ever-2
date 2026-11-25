// The settings of the picture that the config does not hold: the light, the tone curve, the grade, the glow, the grain.
// Proposed by the look lock in Phase 3 against the approved page look and the key `step1-fire`.
export const look = {
  background: [0.012, 0.012, 0.014] as [number, number, number],
  key: {
    // Toward the light, from the page: upper left, toward the viewer. It sets where the shadows fall.
    direction: [-0.52, 0.5, 0.69] as [number, number, number],
    // Half the angle the light's area takes up, seen from the page, in radians. It sets how fast a shadow softens with height.
    radius: 0.2,
    intensity: 3.1,
    colour: [1.0, 0.965, 0.92] as [number, number, number],
    // Where the light stands over the middle of the view, in page pixels: x right, y up the page, z toward the viewer.
    // It sets how the light falls off across the page, lighter at the upper left.
    at: [-1100, 900, 3500] as [number, number, number],
    shadowMapPx: 4096,
    // How far a surface is moved toward the light before its shadow is looked up, in page pixels.
    biasPx: 0.1,
    normalBiasPx: 0.2
  },
  dome: {
    intensity: 1.05,
    colour: [1.0, 0.975, 0.945] as [number, number, number],
    shadowMapPx: 2048,
    biasPx: 0.2,
    normalBiasPx: 0.45
  },
  // The lights the parts give off: how many are true lights in one frame, how many of those throw a shadow.
  emitters: {
    pool: 6,
    shadows: 2,
    shadowMapPx: 512,
    // How wide the body of an emitter is taken to be for its shadow's softness, in page pixels.
    sizePx: 5
  },
  // How much of the studio's light a surface takes as plain diffuse light with no shadow in it.
  envDiffuse: 0.08,
  // The key's own sharp highlight. The studio's reflection gives highlights their shape, so this stays low.
  keySpecular: 0.0,
  envIntensity: 1.0,
  exposure: 1.0,
  knee: 0.74,
  saturation: 1.0,
  grain: 0.011,
  // Light too bright for the picture, spread by the lens. Only what is brighter than `threshold` in linear light
  // after exposure spreads, so the page never glows. Sizes are shares of the picture's height.
  glow: {
    threshold: 1.5,
    knee: 0.6,
    strength: 0.5,
    // How much of the glow each wider ring of the spread carries, from the tightest to the widest.
    rings: [1.0, 0.8, 0.55, 0.35, 0.2, 0.1] as number[]
  }
}
