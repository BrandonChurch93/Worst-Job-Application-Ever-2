// The Phase 0 physics test scene: ten seconds of a small pinball-like plane at the sim rate.
// Every number fed to the library is a literal or the result of + - * / on literals,
// so the input is the same on every machine. No trigonometry here.
// Runs unchanged in Node and in the browser.
export async function runPhysicsTest(RAPIER, { seconds = 10, hz = 240, trace = false } = {}) {
  await RAPIER.init()
  const world = new RAPIER.World({ x: 0.0, y: 1.1 })
  world.timestep = 1 / hz
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
  const seg = (ax, ay, bx, by, rest) => {
    world.createCollider(RAPIER.ColliderDesc.segment({ x: ax, y: ay }, { x: bx, y: by }).setRestitution(rest).setFriction(0.2), fixed)
  }
  // The cabinet: 0.5 wide, 1.0 tall, with a drain gap that is closed for the test.
  seg(0, 0, 0.5, 0, 0.4)
  seg(0.5, 0, 0.5, 1, 0.4)
  seg(0.5, 1, 0, 1, 0.4)
  seg(0, 1, 0, 0, 0.4)
  // Guides and slings.
  seg(0.0, 0.62, 0.16, 0.86, 0.5)
  seg(0.5, 0.62, 0.34, 0.86, 0.5)
  seg(0.08, 0.3, 0.14, 0.42, 0.9)
  seg(0.42, 0.3, 0.36, 0.42, 0.9)
  // Three pop bumpers.
  for (const [x, y] of [[0.17, 0.22], [0.33, 0.22], [0.25, 0.34]]) {
    world.createCollider(RAPIER.ColliderDesc.ball(0.03).setTranslation(x, y).setRestitution(1.0).setFriction(0.05), fixed)
  }
  // A flipper: a kinematic bar swung on a schedule. Its angle is plain arithmetic on the step.
  const flipper = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0.17, 0.88))
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.035, 0.006).setTranslation(0.035, 0).setRestitution(0.6).setFriction(0.3), flipper)
  // Six balls with fixed starts.
  const starts = [
    [0.07, 0.05, 0.31, 0.0], [0.19, 0.08, -0.22, 0.1], [0.27, 0.06, 0.05, 0.3],
    [0.36, 0.09, -0.4, 0.0], [0.44, 0.05, 0.12, 0.2], [0.25, 0.12, 0.0, -0.1]
  ]
  const balls = starts.map(([x, y, vx, vy]) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y).setLinvel(vx, vy).setCcdEnabled(true))
    world.createCollider(RAPIER.ColliderDesc.ball(0.0135).setRestitution(0.55).setFriction(0.15).setDensity(7800), body)
    return body
  })
  const steps = seconds * hz
  const every = 60
  const state = new Float64Array((steps / every) * balls.length * 6)
  const path = trace ? balls.map(() => []) : null
  let cursor = 0
  for (let step = 0; step < steps; step++) {
    // The flipper is up for 30 steps out of every 240.
    const phase = step % 240
    const up = phase < 30 ? phase / 30 : phase < 60 ? (60 - phase) / 30 : 0
    flipper.setNextKinematicRotation(-0.5 * up + 0.35)
    // A nudge on a fixed schedule, as the director will give.
    if (step % 400 === 399) {
      const b = balls[((step / 400) | 0) % balls.length]
      b.applyImpulse({ x: 0.0004, y: -0.0011 }, true)
    }
    world.step()
    if (path) balls.forEach((b, i) => { const t = b.translation(); path[i].push(t.x, t.y) })
    // The state of every ball goes into the record four times a second, so the hash covers the whole path and not only where the balls came to rest.
    if (step % every === every - 1) {
      for (const b of balls) {
        const t = b.translation()
        const v = b.linvel()
        state.set([t.x, t.y, b.rotation(), v.x, v.y, b.angvel()], cursor)
        cursor += 6
      }
    }
  }
  const bytes = new Uint8Array(state.buffer)
  let stateHex = ''
  for (const v of bytes) stateHex += v.toString(16).padStart(2, '0')
  const snapshot = world.takeSnapshot()
  let snapshotHex = ''
  for (const v of snapshot) snapshotHex += v.toString(16).padStart(2, '0')
  const first = [state[cursor - 36], state[cursor - 35], state[cursor - 34]]
  world.free()
  return { steps, hz, balls: balls.length, stateHex, snapshotBytes: snapshot.length, snapshotHex, first, path, version: RAPIER.version() }
}
