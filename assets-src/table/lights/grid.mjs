import sharp from 'sharp'
const [name,key]=process.argv.slice(2)
const file=`out/work/lights/${name}-${key}.png`
const meta=await sharp(file).metadata()
const load=async f=>{const {data,info}=await sharp(f).resize(meta.width,meta.height).removeAlpha().raw().toBuffer({resolveWithObject:true});const w=info.width,h=info.height;const l=new Float32Array(w*h);for(let i=0;i<w*h;i++){const o=i*3;l[i]=(0.2126*data[o]+0.7152*data[o+1]+0.0722*data[o+2])/255}return {l,w,h}}
const grid=({l,w,h})=>{const G=8,H=6;const s=Array.from({length:H},()=>new Float64Array(G));for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;const v=4*l[i]-l[i-1]-l[i+1]-l[i-w]-l[i+w];s[Math.floor(y*H/h)][Math.floor(x*G/w)]+=v*v}return s.map(r=>Array.from(r).map(v=>v/(w*h)*1e5))}
const a=grid(await load(`references/approved/${key}.png`)),b=grid(await load(file))
console.log(meta.width,meta.height)
for(let y=0;y<6;y++)console.log(a[y].map(v=>v.toFixed(0).padStart(4)).join(' '),'  |  ',b[y].map(v=>v.toFixed(0).padStart(4)).join(' '))
