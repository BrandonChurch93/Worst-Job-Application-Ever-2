// The nine moulded pictures of the insert windows, as three atlases of three by three cells: the lens unlit, its glow, and its relief as heights.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export const LOOKS = {
  'a magnifying glass': { icon: 'magnifier', colour: '#2f9bff' },
  'an hourglass': { icon: 'hourglass', colour: '#f3ecdc' },
  'a clipboard with a tick': { icon: 'clipboard', colour: '#ffad3a' },
  'a slice of pizza': { icon: 'pizza', colour: '#ffad3a' },
  'an envelope with two arrows': { icon: 'envelope', colour: '#35c873' },
  'a knot in a rope': { icon: 'knot', colour: '#2f9bff' },
  'a ladder': { icon: 'ladder', colour: '#ff3d2e' },
  'a clock face': { icon: 'clock', colour: '#ffb648' },
  'three hats stacked': { icon: 'hats', colour: '#f3ecdc' }
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a, b, t) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)).join(',')})`

const ICONS = {
  magnifier: (s, w) => `<circle cx="232" cy="228" r="74" ${s(w)}/><line x1="287" y1="283" x2="352" y2="348" ${s(w * 1.7)}/><path d="M190 214 A44 44 0 0 1 222 184" ${s(w * 0.55)}/>`,
  hourglass: (s, w, fl) => `<line x1="184" y1="150" x2="328" y2="150" ${s(w * 1.2)}/><line x1="184" y1="362" x2="328" y2="362" ${s(w * 1.2)}/><path d="M202 150 L310 150 L310 182 Q310 216 270 256 Q310 296 310 330 L310 362 L202 362 L202 330 Q202 296 242 256 Q202 216 202 182 Z" ${s(w)}/><path d="M226 350 L286 350 L256 312 Z" ${fl}/><path d="M230 192 L282 192 L256 228 Z" ${fl}/><line x1="256" y1="262" x2="256" y2="300" ${s(w * 0.4)}/>`,
  clipboard: (s, w, fl) => `<rect x="184" y="162" width="144" height="200" rx="14" ${s(w)}/><rect x="220" y="140" width="72" height="42" rx="9" ${fl}/><polyline points="216,270 246,302 302,232" ${s(w * 1.3)}/>`,
  pizza: (s, w, fl) => `<path d="M256 374 L168 196 Q256 150 344 196 Z" ${s(w)}/><path d="M184 230 Q256 194 328 230" ${s(w * 0.6)}/><circle cx="234" cy="264" r="15" ${fl}/><circle cx="282" cy="254" r="14" ${fl}/><circle cx="257" cy="314" r="13" ${fl}/>`,
  envelope: (s, w) => `<rect x="170" y="228" width="172" height="118" rx="9" ${s(w)}/><polyline points="172,234 256,298 340,234" ${s(w)}/><path d="M248 206 Q236 168 198 174" ${s(w * 0.8)}/><polyline points="214,158 196,174 216,188" ${s(w * 0.8)}/><path d="M264 206 Q276 168 314 174" ${s(w * 0.8)}/><polyline points="298,158 316,174 296,188" ${s(w * 0.8)}/>`,
  knot: (s, w, fl, t, gap) => {
    const at = (q) => [256 + 46 * (Math.sin(q) + 2 * Math.sin(2 * q)), 250 - 46 * (Math.cos(q) - 2 * Math.cos(2 * q))]
    const from = 0.42
    const to = Math.PI * 2 - 0.42
    const n = 480
    const pts = []
    for (let i = 0; i <= n; i++) pts.push(at(from + ((to - from) * i) / n))
    const seg = (i0, i1) => 'M' + pts.slice(Math.max(0, i0), Math.min(n, i1) + 1).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L')
    const hits = []
    for (let i = 0; i < n; i++) {
      for (let j = i + 12; j < n; j++) {
        const [a, b, c, d] = [pts[i], pts[i + 1], pts[j], pts[j + 1]]
        const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
        if (Math.abs(den) < 1e-9) continue
        const u = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den
        const v = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den
        if (u >= 0 && u < 1 && v >= 0 && v < 1) hits.push(i, j)
      }
    }
    hits.sort((x, y) => x - y)
    const tail = (q, far) => {
      const d = [q[0] - far[0], q[1] - far[1]]
      const l = Math.hypot(d[0], d[1])
      return `M${q[0].toFixed(1)} ${q[1].toFixed(1)} L${(q[0] + (d[0] / l) * 78).toFixed(1)} ${(q[1] + (d[1] / l) * 78).toFixed(1)}`
    }
    let out = `<path d="${tail(pts[0], pts[6])}" ${s(w * 1.5)}/><path d="${tail(pts[n], pts[n - 6])}" ${s(w * 1.5)}/><path d="${seg(0, n)}" ${s(w * 1.5)}/>`
    hits.forEach((i, k) => {
      if (k % 2) return
      out += `<path d="${seg(i - 20, i + 20)}" ${gap(w * 2.7)}/><path d="${seg(i - 26, i + 26)}" ${s(w * 1.5)}/>`
    })
    return out
  },
  ladder: (s, w) => `<line x1="212" y1="146" x2="212" y2="366" ${s(w * 1.2)}/><line x1="300" y1="146" x2="300" y2="366" ${s(w * 1.2)}/>${[180, 224, 268, 312, 356].map((y) => `<line x1="212" y1="${y - 12}" x2="300" y2="${y - 12}" ${s(w)}/>`).join('')}`,
  clock: (s, w, fl) => {
    let ticks = ''
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      ticks += `<line x1="${256 + Math.cos(a) * 80}" y1="${256 + Math.sin(a) * 80}" x2="${256 + Math.cos(a) * 92}" y2="${256 + Math.sin(a) * 92}" ${s(w * (i % 3 === 0 ? 0.7 : 0.4))}/>`
    }
    return `<circle cx="256" cy="256" r="106" ${s(w)}/>${ticks}<line x1="256" y1="256" x2="256" y2="190" ${s(w)}/><line x1="256" y1="256" x2="302" y2="282" ${s(w)}/><circle cx="256" cy="256" r="10" ${fl}/>`
  },
  hats: (s, w, fl, t, gap) =>
    `<g transform="translate(0 -14)"><ellipse cx="256" cy="356" rx="102" ry="17" ${s(w)}/><path d="M198 352 L210 304 Q232 318 256 304 Q280 318 302 304 L314 352" ${s(w)}/><ellipse cx="256" cy="300" rx="80" ry="13" ${gap(w * 2.2)}/><ellipse cx="256" cy="300" rx="80" ry="13" ${s(w)}/><path d="M210 297 A46 46 0 0 1 302 297" ${s(w)}/><ellipse cx="256" cy="250" rx="60" ry="10" ${gap(w * 2.2)}/><ellipse cx="256" cy="250" rx="60" ry="10" ${s(w)}/><path d="M228 247 L226 172 L286 172 L284 247" ${s(w)}/><line x1="228" y1="228" x2="284" y2="228" ${s(w * 0.6)}/></g>`
}

const pen = (col, opacity = 1) => (w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"`

function cell(look, kind, i) {
  const c = look.colour
  const dark = mix(c, '#06080c', 0.86)
  const draw = ICONS[look.icon]
  let rings = ''
  if (kind === 'relief') {
    for (let r = 20; r < 250; r += 10) rings += `<circle cx="256" cy="256" r="${r}" fill="none" stroke="#fff" stroke-width="3.2" opacity="0.2"/>`
    return `<rect width="512" height="512" fill="#000"/><circle cx="256" cy="256" r="250" fill="#262626"/>${rings}<circle cx="256" cy="256" r="244" fill="none" stroke="#ffffff" stroke-width="9" opacity="0.8"/>${draw(pen('#ffffff'), 22, 'fill="#fff"', pen('#555555', 1), pen('#262626'))}`
  }
  for (let r = 20; r < 240; r += 10) rings += `<circle cx="256" cy="256" r="${r}" fill="none" stroke="${kind === 'glow' ? '#ffffff' : mix(c, '#ffffff', 0.3)}" stroke-width="2" opacity="${kind === 'glow' ? 0.1 : 0.14}"/>`
  if (kind === 'lens') {
    const ink = mix(c, '#06080c', 0.82)
    const mid = mix(c, '#06080c', 0.42)
    const rim = `<circle cx="256" cy="256" r="246" fill="none" stroke="${mix(c, '#ffffff', 0.45)}" stroke-width="7" opacity="0.55"/><circle cx="256" cy="256" r="236" fill="none" stroke="${dark}" stroke-width="3" opacity="0.5"/>`
    return `<radialGradient id="l${i}" cx="256" cy="256" r="262" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(c, '#06080c', 0.36)}"/><stop offset="0.7" stop-color="${mix(c, '#06080c', 0.5)}"/><stop offset="1" stop-color="${mix(c, '#06080c', 0.7)}"/></radialGradient><rect width="512" height="512" fill="url(#l${i})"/>${rings}${rim}${draw(pen(ink, 0.85), 15, `fill="${ink}" opacity="0.85"`, pen(mid, 0.9), pen(mid))}`
  }
  const ink = mix(c, '#0a0c10', 0.78)
  const lit = mix(c, '#ffffff', 0.5)
  const rim = `<circle cx="256" cy="256" r="240" fill="none" stroke="${mix(c, '#06080c', 0.5)}" stroke-width="3" opacity="0.45"/>`
  return `<radialGradient id="g${i}" cx="256" cy="256" r="262" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.78)}"/><stop offset="0.38" stop-color="${mix(c, '#ffffff', 0.42)}"/><stop offset="0.72" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, '#06080c', 0.62)}"/></radialGradient><rect width="512" height="512" fill="url(#g${i})"/>${rings}${rim}${draw(pen(ink, 0.94), 14, `fill="${ink}" opacity="0.94"`, pen(lit, 0.9), pen(lit))}`
}

export async function insertAtlases(inserts, dir, size) {
  fs.mkdirSync(dir, { recursive: true })
  for (const kind of ['lens', 'glow', 'relief']) {
    let body = ''
    inserts.forEach((n, i) => {
      const look = LOOKS[n.picture]
      if (!look) throw new Error(`No moulded picture for "${n.picture}"`)
      body += `<svg x="${(i % 3) * size}" y="${Math.floor(i / 3) * size}" width="${size}" height="${size}" viewBox="0 0 512 512">${cell(look, kind, i)}</svg>`
    })
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 3}" height="${size * 3}">${body}</svg>`
    const img = sharp(Buffer.from(s))
    if (kind === 'relief') await img.greyscale().blur(size / 190).png({ compressionLevel: 9 }).toFile(path.join(dir, 'inserts-relief.png'))
    else await img.removeAlpha().webp({ quality: 92 }).toFile(path.join(dir, `inserts-${kind}.webp`))
  }
}
