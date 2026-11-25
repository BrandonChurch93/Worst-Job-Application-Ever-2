// npm run caps: the WebGL2 limits and extensions of this machine under software rendering,
// written to config/webgl-caps.json. An extension is portable only when the public table
// in references/terms/webgl-extensions.json shows it in Chrome, Safari, Firefox and Edge.
import { at, readJson, writeJson } from './lib/paths.mjs'
import { launch, machine, softwareGlFlags } from './lib/browser.mjs'

const table = readJson(at('references', 'terms', 'webgl-extensions.json'))
const { browser, executablePath, version } = await launch()
const page = await browser.newPage()
await page.goto('about:blank')
const found = await page.evaluate(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
  if (!gl) return { webgl2: false }
  const names = ['MAX_TEXTURE_SIZE', 'MAX_3D_TEXTURE_SIZE', 'MAX_ARRAY_TEXTURE_LAYERS', 'MAX_CUBE_MAP_TEXTURE_SIZE', 'MAX_RENDERBUFFER_SIZE', 'MAX_COLOR_ATTACHMENTS',
    'MAX_DRAW_BUFFERS', 'MAX_SAMPLES', 'MAX_VERTEX_ATTRIBS', 'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS',
    'MAX_TEXTURE_IMAGE_UNITS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS', 'MAX_COMBINED_TEXTURE_IMAGE_UNITS', 'MAX_UNIFORM_BUFFER_BINDINGS', 'MAX_UNIFORM_BLOCK_SIZE',
    'MAX_ELEMENTS_VERTICES', 'MAX_ELEMENTS_INDICES', 'MAX_TEXTURE_LOD_BIAS', 'MAX_VIEWPORT_DIMS', 'ALIASED_LINE_WIDTH_RANGE', 'ALIASED_POINT_SIZE_RANGE']
  const limits = {}
  for (const n of names) {
    const v = gl.getParameter(gl[n])
    limits[n] = v && v.length !== undefined ? Array.from(v) : v
  }
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
  const extensions = gl.getSupportedExtensions() || []
  // Can a target of this format be rendered to and read back?
  const target = (internal, format, type, ext) => {
    if (ext) gl.getExtension(ext)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null)
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(fb)
    gl.deleteTexture(tex)
    return ok
  }
  const halfBefore = target(gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null)
  const tests = {
    rgba8Target: target(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null),
    rgba16fTargetWithNoExtension: halfBefore,
    rgba16fTargetWithHalfFloatExtension: target(gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, 'EXT_color_buffer_half_float'),
    rgba16fTargetWithFloatExtension: target(gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, 'EXT_color_buffer_float'),
    rgba32fTargetWithFloatExtension: target(gl.RGBA32F, gl.RGBA, gl.FLOAT, 'EXT_color_buffer_float')
  }
  return {
    webgl2: true,
    version: gl.getParameter(gl.VERSION),
    shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    fragmentHighFloat: { rangeMin: hp.rangeMin, rangeMax: hp.rangeMax, precision: hp.precision },
    limits,
    tests,
    extensions
  }
})
await browser.close()
if (!found.webgl2) {
  console.error('WebGL2 is not available in this browser with software rendering.')
  process.exit(1)
}
const rows = {}
for (const name of found.extensions.sort()) {
  const row = table.extensions[name]
  const portable = !!(row && row.chrome === true && row.safari === true && row.firefox === true && row.edge === true)
  rows[name] = { here: true, portable, inTable: !!row }
}
for (const [name, row] of Object.entries(table.extensions)) {
  if (rows[name]) continue
  rows[name] = { here: false, portable: row.chrome === true && row.safari === true && row.firefox === true && row.edge === true, inTable: true }
}
const out = {
  about: 'Written by npm run caps. The limits and extensions are those of this workspace under software rendering. portable is true only where the public table in references/terms/webgl-extensions.json shows the extension in current Chrome, Safari, Firefox and Edge on a computer. The site may need only WebGL2 core and the portable extensions; every other extension is used only behind a test.',
  browser: { version, binary: executablePath.replace(/^.*ms-playwright\//, 'ms-playwright/'), flags: softwareGlFlags },
  machine: machine(),
  gl: { version: found.version, shadingLanguage: found.shadingLanguage, vendor: found.vendor, renderer: found.renderer, fragmentHighFloat: found.fragmentHighFloat },
  limits: found.limits,
  targets: found.tests,
  floatTargets: {
    wanted: 'RGBA16F through EXT_color_buffer_float, with EXT_color_buffer_half_float as the second way to the same format',
    without: 'RGBA8 accumulation with the samples blended in 8 bit steps and dithered, chosen at startup when neither extension gives a complete RGBA16F target'
  },
  portableTable: { file: 'references/terms/webgl-extensions.json', dateRead: table.sources[0].dateRead },
  extensions: rows
}
writeJson(at('config', 'webgl-caps.json'), out)
const here = Object.entries(rows).filter(([, r]) => r.here)
console.log(`browser ${version}`)
console.log(`renderer ${found.renderer}`)
console.log(`MAX_TEXTURE_SIZE ${found.limits.MAX_TEXTURE_SIZE}, MAX_RENDERBUFFER_SIZE ${found.limits.MAX_RENDERBUFFER_SIZE}, MAX_SAMPLES ${found.limits.MAX_SAMPLES}, MAX_DRAW_BUFFERS ${found.limits.MAX_DRAW_BUFFERS}`)
console.log(`targets ${JSON.stringify(found.tests)}`)
console.log(`extensions here ${here.length}, of them portable ${here.filter(([, r]) => r.portable).length}, not in the table ${here.filter(([, r]) => !r.inTable).length}`)
console.log('wrote config/webgl-caps.json')
