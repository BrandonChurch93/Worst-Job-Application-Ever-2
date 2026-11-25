import type { InterfaceApi } from './api'
import css from './interface.module.css'
import { stepNames } from './words'

export interface Menu { open(): boolean; toggle(): void; update(): void }

// The words of the menu are ids: the three address parameters it changes, the levels, the step names and the view names.
export const MENU_ROWS = ['quality', 'step', 'diag'] as const

// For Brandon. Every button is out of the tab order and the whole menu is hidden from assistive technology.
export function mountMenu(root: HTMLElement, api: InterfaceApi, picked: (level: string) => void): Menu {
  const box = document.createElement('div')
  box.className = css.menu!
  box.hidden = true
  box.setAttribute('aria-hidden', 'true')
  root.append(box)
  const rows: { buttons: HTMLButtonElement[]; current: () => string; shown: string }[] = []

  const row = (name: string, values: string[], labels: string[], current: () => string, pick: (value: string) => void) => {
    const line = document.createElement('div')
    line.className = css.menuRow!
    const head = document.createElement('span')
    head.className = css.menuName!
    head.textContent = name
    line.append(head)
    const buttons = values.map((value, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.tabIndex = -1
      b.className = css.menuButton!
      b.dataset.value = value
      b.textContent = labels[i]!
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        pick(value)
        b.blur()
      })
      line.append(b)
      return b
    })
    box.append(line)
    rows.push({ buttons, current, shown: '' })
  }

  const steps = stepNames()
  row(MENU_ROWS[0], api.quality.levels, api.quality.levels, () => api.quality.level(), (v) => {
    picked(v)
    api.quality.set(v)
  })
  row(MENU_ROWS[1], steps.map((_, i) => String(i)), steps, () => String(api.step()), (v) => api.setStep(Number(v)))
  row(MENU_ROWS[2], api.diagnostics, api.diagnostics, () => api.diagnostic(), (v) => api.setDiagnostic(v))

  let open = false
  const update = () => {
    if (!open) return
    for (const r of rows) {
      const now = r.current()
      if (now === r.shown) continue
      r.shown = now
      for (const b of r.buttons) b.dataset.current = String(b.dataset.value === now)
    }
  }
  return {
    open: () => open,
    toggle() {
      open = !open
      box.hidden = !open
      update()
    },
    update
  }
}
