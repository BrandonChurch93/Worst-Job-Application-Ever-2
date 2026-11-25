import fs from 'node:fs'
import { at } from './paths.mjs'

const file = at('kit', 'PROGRESS.md')
const read = () => fs.readFileSync(file, 'utf8')
const write = (t) => fs.writeFileSync(file, t)

function bounds(text, section) {
  const head = `## ${section}\n`
  const i = text.indexOf('\n' + head)
  if (i < 0) throw new Error(`progress: no section ${section}`)
  const start = i + 1 + head.length
  let end = text.indexOf('\n## ', start)
  if (end < 0) end = text.length
  return [start, end]
}

function split(body) {
  const blocks = body.replace(/^\n+|\n+$/g, '').split(/\n\n+/)
  const first = blocks[0] ?? ''
  const prose = first && !/^(- |\| |```|none$|\d+\. )/.test(first)
  return { intro: prose ? first : '', rest: prose ? blocks.slice(1) : blocks }
}

export function sectionBody(section) {
  const text = read()
  const [s, e] = bounds(text, section)
  const { rest } = split(text.slice(s, e))
  return rest.join('\n\n')
}

export function replaceBody(section, content) {
  const text = read()
  const [s, e] = bounds(text, section)
  const { intro } = split(text.slice(s, e))
  const body = '\n' + (intro ? intro + '\n\n' : '') + content.trim() + '\n'
  write(text.slice(0, s) + body + text.slice(e))
}

export function appendTo(section, content) {
  const text = read()
  const [s, e] = bounds(text, section)
  const { intro, rest } = split(text.slice(s, e))
  const kept = rest.filter((b) => b.trim() !== 'none')
  const last = kept.length ? kept[kept.length - 1] : ''
  const listLike = /^(- |\d+\. )/.test(content.trim()) && /(^|\n)(- |\d+\. )[^\n]*$/.test(last) && !last.startsWith('|')
  let joined
  if (listLike) joined = [...kept.slice(0, -1), last + '\n' + content.trim()].join('\n\n')
  else if (last.startsWith('|') && content.trim().startsWith('|')) joined = [...kept.slice(0, -1), last + '\n' + content.trim()].join('\n\n')
  else joined = [...kept, content.trim()].join('\n\n')
  const body = '\n' + (intro ? intro + '\n\n' : '') + joined + '\n'
  write(text.slice(0, s) + body + text.slice(e))
}

export function setStatus(key, value) {
  const text = read()
  const [s, e] = bounds(text, 'Status')
  const body = text.slice(s, e)
  const re = new RegExp(`^- ${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: .*$`, 'm')
  if (!re.test(body)) throw new Error(`progress: no status line ${key}`)
  write(text.slice(0, s) + body.replace(re, `- ${key}: ${value}`) + text.slice(e))
}

export function getStatus(key) {
  const text = read()
  const [s, e] = bounds(text, 'Status')
  const m = text.slice(s, e).match(new RegExp(`^- ${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: (.*)$`, 'm'))
  return m ? m[1] : null
}

export function setRow(section, firstCell, cells) {
  const text = read()
  const [s, e] = bounds(text, section)
  const lines = text.slice(s, e).split('\n')
  const idx = lines.findIndex((l) => l.startsWith('| ' + firstCell))
  const row = '| ' + cells.join(' | ') + ' |'
  if (idx >= 0) {
    const old = lines[idx].split('|').slice(1, -1).map((c) => c.trim())
    const merged = cells.map((c, i) => (c === null || c === undefined ? old[i] ?? '' : c))
    lines[idx] = '| ' + merged.join(' | ') + ' |'
  } else {
    let lastRow = -1
    lines.forEach((l, i) => {
      if (l.startsWith('|')) lastRow = i
    })
    lines.splice(lastRow + 1, 0, row)
  }
  write(text.slice(0, s) + lines.join('\n') + text.slice(e))
}

export function removeLine(section, startsWith) {
  const text = read()
  const [s, e] = bounds(text, section)
  const { intro, rest } = split(text.slice(s, e))
  const out = rest
    .map((b) =>
      b
        .split('\n')
        .filter((l) => !l.startsWith(startsWith))
        .join('\n')
    )
    .filter((b) => b.trim())
  const body = '\n' + (intro ? intro + '\n\n' : '') + (out.length ? out.join('\n\n') : 'none') + '\n'
  write(text.slice(0, s) + body + text.slice(e))
}
