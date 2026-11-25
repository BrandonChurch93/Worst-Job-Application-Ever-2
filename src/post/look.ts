// The settings of the picture that the config does not hold: the light, the tone curve, the grade, the grain.
// Provisional until the look lock in Phase 3 writes them down.
export const look = {
  background: [0.012, 0.012, 0.014] as [number, number, number],
  key: {
    // Toward the light, from the page: upper left, toward the viewer.
    direction: [-0.52, 0.5, 0.69] as [number, number, number],
    // Half the angle the light's area takes up, seen from the page, in radians.
    radius: 0.11,
    intensity: 3.1,
    colour: [1.0, 0.965, 0.92] as [number, number, number],
    shadowMapPx: 4096,
    shadowRadius: 1.4
  },
  dome: {
    intensity: 1.05,
    colour: [0.93, 0.96, 1.0] as [number, number, number],
    shadowMapPx: 2048,
    shadowRadius: 2
  },
  // How much of the studio's light a surface takes as plain diffuse light with no shadow in it.
  envDiffuse: 0.08,
  // The key's own sharp highlight. The studio's reflection gives highlights their shape, so this stays low.
  keySpecular: 0.0,
  envIntensity: 1.0,
  exposure: 1.0,
  knee: 0.74,
  saturation: 1.0,
  grain: 0.011
}
