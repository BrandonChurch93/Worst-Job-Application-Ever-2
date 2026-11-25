// The headless browser of this workspace, driven with playwright-core.
// Nothing is downloaded: the browser already in the workspace is found and used.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'

export const softwareGlFlags = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

export function findBrowser() {
  if (process.env.WJA_BROWSER && fs.existsSync(process.env.WJA_BROWSER)) return process.env.WJA_BROWSER
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), '.cache', 'ms-playwright')
  const found = []
  if (fs.existsSync(cache)) {
    for (const dir of fs.readdirSync(cache).sort().reverse()) {
      const shell = path.join(cache, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell')
      const full = path.join(cache, dir, 'chrome-linux64', 'chrome')
      if (dir.startsWith('chromium_headless_shell-') && fs.existsSync(shell)) found.push(shell)
      if (dir.startsWith('chromium-') && fs.existsSync(full)) found.push(full)
    }
  }
  // The headless shell first: it is the build made for unattended runs.
  found.sort((a, b) => Number(b.includes('headless-shell')) - Number(a.includes('headless-shell')))
  if (!found.length) throw new Error('No browser found. Set WJA_BROWSER to a Chromium binary.')
  return found[0]
}

export async function launch(extraArgs = []) {
  const executablePath = findBrowser()
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [...softwareGlFlags, '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--force-color-profile=srgb', '--hide-scrollbars', ...extraArgs]
  })
  return { browser, executablePath, version: browser.version() }
}

export function machine() {
  const cpu = os.cpus()
  return {
    host: os.hostname(),
    cores: cpu.length,
    cpu: cpu[0] ? cpu[0].model : 'unknown',
    memoryMb: Math.round(os.totalmem() / 1048576),
    platform: `${os.platform()} ${os.release()}`,
    node: process.version
  }
}
