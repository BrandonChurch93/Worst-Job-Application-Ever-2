// The only place the wall clock is read. The live site uses it for input and for pacing.
// No computed picture depends on it.
export const wallSeconds = (): number => performance.now() / 1000
