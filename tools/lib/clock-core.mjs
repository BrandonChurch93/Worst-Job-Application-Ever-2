const H = 3600

export function newState() {
  return { version: 1, lastMark: null, epochs: [], reviewApproved: false, reviewRounds: {}, extensions: {}, sticky: { half: {}, boxEnd: {} }, lastStatusAt: null, ticks: 0, phaseSeconds: {}, lastPrint: [] }
}

function ensureEpoch(state, cfg) {
  if (state.epochs.length === 0) {
    state.epochs.push({ kind: 'build', label: 'build', allowedHours: cfg.budget.runHours, boxes: { ...cfg.budget.phaseHours }, seconds: 0, phaseSeconds: {} })
  }
  return state.epochs[state.epochs.length - 1]
}

export function elapsed(state, now, boot) {
  if (!state.lastMark) return 0
  if (state.lastMark.boot !== boot) return 0
  return Math.max(0, (now - state.lastMark.at) / 1000)
}

function mark(state, now, boot) {
  state.lastMark = { at: now, boot }
}

const fmt = (h) => h.toFixed(2)
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z')

function statusLines(state, cfg, now, flag) {
  if (flag || state.lastStatusAt === null) {
    if (flag) state.lastStatusAt = now
    else if (state.lastStatusAt === null) state.lastStatusAt = state.firstMarkAt ?? now
  }
  const minutes = Math.floor((now - state.lastStatusAt) / 60000)
  const lines = [`minutes since the last status: ${minutes}`]
  if (minutes > cfg.budget.statusMaxGapMinutes) lines.push('status overdue')
  return lines
}

export function start(state, cfg, now, boot) {
  ensureEpoch(state, cfg)
  mark(state, now, boot)
  if (state.firstMarkAt === undefined) state.firstMarkAt = now
  const lines = [`clock: task start at ${iso(now)}`, 'no time added']
  state.lastPrint = lines
  return lines
}

export function totals(state, cfg) {
  const build = state.epochs.filter((e) => e.kind === 'build')
  const after = state.epochs.filter((e) => e.kind === 'after')
  const sum = (a) => a.reduce((s, e) => s + e.seconds, 0) / H
  const allowed = (a) => a.reduce((s, e) => s + e.allowedHours, 0)
  const rounds = Object.values(state.reviewRounds).reduce((s, r) => s + r.seconds, 0) / H
  const ext = Object.values(state.extensions).reduce((s, r) => s + r.seconds, 0) / H
  return { beforeReviewUsed: sum(build), beforeReviewAllowed: allowed(build) || cfg.budget.runHours, afterReviewUsed: sum(after), afterReviewAllowed: allowed(after) || cfg.budget.afterReviewHours, reviewRoundsUsed: rounds, extensionsUsed: ext }
}

export function tickPhase(state, cfg, n, now, boot, opts = {}) {
  const epoch = ensureEpoch(state, cfg)
  const add = elapsed(state, now, boot)
  const key = String(n)
  epoch.seconds += add
  epoch.phaseSeconds[key] = (epoch.phaseSeconds[key] ?? 0) + add
  state.phaseSeconds[key] = (state.phaseSeconds[key] ?? 0) + add
  mark(state, now, boot)
  if (state.firstMarkAt === undefined) state.firstMarkAt = now
  state.ticks++
  const used = epoch.seconds / H
  const allowed = epoch.allowedHours
  const phaseUsed = epoch.phaseSeconds[key] / H
  const box = epoch.boxes[key] ?? 0
  let sumBoxes = 0
  for (const [k, v] of Object.entries(epoch.boxes)) if (Number(k) <= Number(n)) sumBoxes += v
  const reserve = n === 5 || n === 6 || key === '5' || key === '6' ? (cfg.budget.reserveHours[key] ?? 0) : 0
  const extra = used < sumBoxes && !(reserve > 0 && allowed - used < reserve)
  const effBox = Math.max(0, box - reserve)
  if (phaseUsed >= effBox / 2) state.sticky.half[key] = true
  if (phaseUsed >= effBox) state.sticky.boxEnd[key] = true
  const due = used >= allowed
  const t = totals(state, cfg)
  const lines = [
    `clock: phase ${key}, tick ${state.ticks} at ${iso(now)}, allowance: ${epoch.label}`,
    `time used in this phase: ${fmt(phaseUsed)} h of its box of ${fmt(box)} h${reserve > 0 ? `, of which ${fmt(reserve)} h is the reserve` : ''}`,
    `time used under the allowance in force: ${fmt(used)} h of ${fmt(allowed)} h allowed`,
    `time used: ${fmt(state.reviewApproved ? t.afterReviewUsed : t.beforeReviewUsed)} of ${fmt(state.reviewApproved ? t.afterReviewAllowed : t.beforeReviewAllowed)} hours ${state.reviewApproved ? 'after the review' : 'before the review'}`,
    `extra rounds: ${extra ? 'yes' : 'no'}`,
    `half point: ${state.sticky.half[key] ? 'reached' : 'not reached'}`,
    `box end: ${state.sticky.boxEnd[key] ? 'reached' : 'not reached'}`,
    `budget report: ${due ? 'due' : 'not due'}`,
    ...statusLines(state, cfg, now, opts.status),
  ]
  state.lastPrint = lines
  return lines
}

export function approveReview(state, cfg, now, boot) {
  ensureEpoch(state, cfg)
  if (state.reviewApproved) {
    const lines = ['clock: the review was already recorded as approved', 'nothing changed']
    state.lastPrint = lines
    return lines
  }
  state.reviewApproved = true
  state.epochs.push({ kind: 'after', label: 'after the review', allowedHours: cfg.budget.afterReviewHours, boxes: { 6: cfg.budget.afterReviewHours }, seconds: 0, phaseSeconds: {} })
  mark(state, now, boot)
  const lines = [`clock: review approved at ${iso(now)}`, `the allowance in force is now ${fmt(cfg.budget.afterReviewHours)} h after the review, counted from zero`, `phase 6 has all of it as its box`]
  state.lastPrint = lines
  return lines
}

export function continueBuild(state, cfg, n, donePhases, now, boot) {
  ensureEpoch(state, cfg)
  if (state.epochs.some((e) => e.continuation === Number(n))) {
    const lines = [`clock: continuation ${n} was already recorded`, 'nothing changed']
    state.lastPrint = lines
    return lines
  }
  const hours = cfg.budget.continueHours
  let boxes = {}
  if (state.reviewApproved) boxes = { 6: hours }
  else {
    const open = Object.keys(cfg.budget.phaseHours).filter((k) => !donePhases.includes(Number(k)))
    const total = open.reduce((s, k) => s + cfg.budget.phaseHours[k], 0)
    for (const k of open) boxes[k] = total > 0 ? (hours * cfg.budget.phaseHours[k]) / total : 0
  }
  state.epochs.push({ kind: state.reviewApproved ? 'after' : 'build', label: `continuation ${n}`, continuation: Number(n), allowedHours: hours, boxes, seconds: 0, phaseSeconds: {} })
  mark(state, now, boot)
  const lines = [`clock: continuation ${n} at ${iso(now)}`, `${fmt(hours)} h added`, 'new boxes: ' + Object.entries(boxes).map(([k, v]) => `phase ${k} ${fmt(v)} h`).join(', ')]
  state.lastPrint = lines
  return lines
}

function tickApart(state, cfg, bucket, n, hours, name, now, boot, opts) {
  ensureEpoch(state, cfg)
  const key = String(n)
  const first = !bucket[key]
  if (first) bucket[key] = { seconds: 0, openedAt: now, allowedHours: hours }
  const add = first ? 0 : elapsed(state, now, boot)
  bucket[key].seconds += add
  mark(state, now, boot)
  state.ticks++
  const used = bucket[key].seconds / H
  const lines = [`clock: ${name} ${key}, tick ${state.ticks} at ${iso(now)}`, `time used in this ${name}: ${fmt(used)} h of ${fmt(bucket[key].allowedHours)} h allowed`, `extra rounds: ${used < bucket[key].allowedHours ? 'yes' : 'no'}`, ...statusLines(state, cfg, now, opts?.status)]
  state.lastPrint = lines
  return lines
}

export function tickReviewRound(state, cfg, n, now, boot, opts) {
  return tickApart(state, cfg, state.reviewRounds, n, cfg.budget.reviewRoundHours, 'review round', now, boot, opts)
}

export function tickExtension(state, cfg, n, now, boot, opts) {
  return tickApart(state, cfg, state.extensions, n, cfg.budget.extendHours, 'extension', now, boot, opts)
}

export function markStatus(state, now) {
  state.lastStatusAt = now
}
