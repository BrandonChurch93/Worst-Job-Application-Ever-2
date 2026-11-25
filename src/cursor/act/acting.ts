import type { LookMaker } from '../contract'
import { reactionPose } from './feel'

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

// How it feels and what just happened, as the numbers the body and its effects are asked to look like.
// The posture itself, stretch, lean and the tail's lag, is already in the pose: the sim's springs made it.
export const actingLook: LookMaker | null = (pose, look) => {
  const f = pose.feel
  const b = look.body
  const e = look.effects
  const react = pose.reaction ? reactionPose(pose.reaction, pose.reactionAt, 1) : null
  b.bend = clamp(pose.bend, -1, 1)
  b.puff = clamp(f.puff + (react ? react.puff : 0), 0, 1)
  b.tremble = clamp(f.tremble + (pose.reaction === 'flinch' ? 0.35 * (1 - pose.reactionAt) : 0), 0, 1)
  b.pale = clamp(f.pale, 0, 1)
  b.heat = clamp(f.heat * (0.92 + 0.08 * Math.sin(look.body.time * 7.3)), 0, 1)
  b.melt = clamp(f.melt, 0, 1)
  b.gulp = pose.gulp
  e.sweat = clamp(f.sweat, 0, 1)
  e.steam = clamp(f.steam, 0, 1)
  if (pose.reaction === 'dustOff') e.dust = clamp(pose.reactionAt, 0, 1)
}
