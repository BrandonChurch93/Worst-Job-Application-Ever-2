// The local render's own parts: the installed Chrome with its graphics card on, the final mix, the frames of a proof.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { at } from './paths.mjs'
import { ensureBuild, formatOf, openSession } from './capture.mjs'
import { serve } from './serve.mjs'
import { around } from './film-plan.mjs'

export function chromePlaces(platform, env, home) {
  const out = []
  if (env.WJA_CHROME) out.push(env.WJA_CHROME)
  if (platform === 'darwin') out.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'))
  else if (platform === 'win32') {
    for (const base of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA]) if (base) out.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'))
  } else out.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome')
  return out
}

export function findChrome() {
  const places = chromePlaces(os.platform(), process.env, os.homedir())
  const found = places.find((p) => fs.existsSync(p))
  if (!found) throw new Error(`no installed Chrome found. The local render uses the Chrome that is installed, with its graphics card on, and never downloads a browser. Looked in: ${places.join(', ')}. Install Chrome, or set WJA_CHROME to its program file`)
  return found
}

export const isSoftware = (renderer) => /swiftshader|llvmpipe|software|basic render/i.test(renderer || '')

// A capture session. With `software` it is the harness's own headless browser. Without, the installed Chrome in a window, graphics card on.
export async function openLocal({ format, assets = 'full', software = false }) {
  let session
  if (software) session = await openSession({ format, assets })
  else {
    const executablePath = findChrome()
    ensureBuild()
    const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
    const f = formatOf(format)
    let browser
    try {
      browser = await chromium.launch({
        executablePath, headless: false,
        args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-color-profile=srgb', '--hide-scrollbars', '--window-size=1280,800']
      })
    } catch (e) {
      await server.close()
      throw new Error(`the installed Chrome at ${executablePath} did not start: ${String(e.message).split('\n')[0]}`)
    }
    const context = await browser.newContext({ viewport: { width: Math.min(f.width, 1920), height: Math.min(f.height, 1080) }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const problems = []
    page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`)
    })
    const close = async () => {
      await browser.close()
      await server.close()
    }
    await page.goto(`${server.url}/index.html?mode=capture&format=${f.id}&assets=${assets}`)
    try {
      await page.evaluate(() => window.showcase.ready)
    } catch (e) {
      await close()
      throw new Error(`the site did not start in the installed Chrome: ${String(e.message).split('\n')[0]}\n${problems.join('\n')}`)
    }
    session = { page, browser, version: browser.version(), server, problems, info: await page.evaluate(() => window.showcase.info()), format: f, assets, close }
  }
  session.graphics = await session.page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return 'no WebGL 2'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
  })
  session.software = isSoftware(session.graphics)
  return session
}

// The final mix of a film among the files of audio/final/. Null when there is none.
export function mixFor(names, which, fileName) {
  const sound = names.filter((n) => /\.(wav|flac|aif|aiff|m4a|mp3)$/i.test(n)).sort()
  const stem = (n) => n.replace(/\.[a-z0-9]+$/i, '').toLowerCase()
  const exact = [`film-${which}`, fileName.toLowerCase(), `final-${which}`, which]
  for (const want of exact) {
    const hit = sound.find((n) => stem(n) === want)
    if (hit) return hit
  }
  return sound.find((n) => new RegExp(`(^|[-_ ])${which}($|[-_ ])`).test(stem(n))) || null
}

export function finalMix(which, cfg) {
  const dir = at('audio', 'final')
  if (!fs.existsSync(dir)) return null
  const name = mixFor(fs.readdirSync(dir), which, which === 'a' ? cfg.export.files.filmA : cfg.export.files.filmB)
  return name ? path.join(dir, name) : null
}

// The frames of a proof: `seconds` of film in a row at the film's rate, round one frame, inside one page.
export function proofRange(frame, fps, seconds, first, last) {
  const frames = around(frame, Math.round(seconds * fps), 1, first, last)
  return { first: frames[0], last: frames[frames.length - 1], frames: frames.length }
}

export function opener(platform) {
  if (platform === 'darwin') return ['open', []]
  if (platform === 'win32') return ['cmd', ['/c', 'start', '']]
  return ['xdg-open', []]
}
