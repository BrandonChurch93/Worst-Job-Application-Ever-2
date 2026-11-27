// Two pictures compared: mean difference per channel, signed difference, mean of each.
//   node pipeline/change002/video-compare.mjs <a.png> <b.png>
import sharp from 'sharp'
const [a, b] = process.argv.slice(2)
const A = await sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const B = await sharp(b).removeAlpha().resize(A.info.width, A.info.height).raw().toBuffer({ resolveWithObject: true })
const n = A.info.width * A.info.height
const s = [0, 0, 0], d = [0, 0, 0], ma = [0, 0, 0], mb = [0, 0, 0]
for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { const x = A.data[i * 3 + c], y = B.data[i * 3 + c]; s[c] += Math.abs(x - y); d[c] += y - x; ma[c] += x; mb[c] += y }
console.log(a.split('/').pop(), 'vs', b.split('/').pop(), 'meanAbs', s.map((v) => (v / n).toFixed(3)).join(' '), 'signed b-a', d.map((v) => (v / n).toFixed(3)).join(' '), 'mean a', ma.map((v) => (v / n).toFixed(2)).join(' '), 'mean b', mb.map((v) => (v / n).toFixed(2)).join(' '))
