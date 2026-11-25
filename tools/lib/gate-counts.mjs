// The count by part as a table of text. counts: what window.showcase.countParts(spec) gives.
export function countsTable(counts, { limit = null, what = '' } = {}) {
  const shadows = counts.shadows
  const through = counts.rows.some((r) => r.through > 0)
  const head = ['part', 'made', 'meshes', 'colour', ...(through ? ['through'] : []), ...shadows.map((s) => `shadow ${s}`), 'calls', 'triangles']
  const names = (r) => (r.names.length > 3 ? `${r.names.slice(0, 3).join(', ')} and ${r.names.length - 3} more` : r.names.join(', '))
  const line = (r) => [r.part === r.names.join(', ') ? r.part : `${r.part} (${names(r)})`, r.made, r.meshes, r.colour, ...(through ? [r.through] : []), ...shadows.map((s) => r.shadow[s] ?? 0), r.calls, r.triangles]
  const sum = (f) => counts.rows.reduce((n, r) => n + f(r), 0)
  const rows = counts.rows.map(line)
  const total = ['sum of the rows', '', sum((r) => r.meshes), sum((r) => r.colour), ...(through ? [sum((r) => r.through)] : []), ...shadows.map((s) => sum((r) => r.shadow[s] ?? 0)), counts.total.calls, counts.total.triangles]
  const told = ['info().counts', '', '', '', ...(through ? [''] : []), ...shadows.map(() => ''), counts.renderer.drawCalls, counts.renderer.triangles]
  const other = ['not a mesh of the scene', '', '', '', ...(through ? [''] : []), ...shadows.map(() => ''), counts.other.calls, counts.other.triangles]
  const all = [head, ...rows, total, other, told].map((r) => r.map(String))
  const width = head.map((_, i) => Math.max(...all.map((r) => r[i].length)))
  const text = (r) => r.map((c, i) => (i < 2 ? c.padEnd(width[i]) : c.padStart(width[i]))).join('  ').trimEnd()
  const rule = width.map((w) => '-'.repeat(w)).join('  ')
  const lines = [text(all[0]), rule, ...all.slice(1, 1 + rows.length).map(text), rule, ...all.slice(1 + rows.length).map(text)]
  const verdict = limit === null ? [] : [`${counts.renderer.drawCalls} draw calls against a limit of ${limit}: ${counts.renderer.drawCalls <= limit ? 'inside' : `${counts.renderer.drawCalls - limit} over`}`]
  return [...(what ? [what] : []), ...lines, ...verdict].join('\n')
}

// The two counts agree when the rows and what is not a mesh of the scene make up what the renderer counted, and what is not of the scene is the engine's own few calls.
export function countsAgree(counts, { most = 4 } = {}) {
  return counts.other.calls >= 0 && counts.other.calls <= most && counts.other.triangles >= 0 && counts.other.triangles <= most * 2
}
