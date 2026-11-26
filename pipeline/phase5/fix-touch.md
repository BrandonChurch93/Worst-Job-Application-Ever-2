# Fix pass after round 20: the page a touch-only device gets

Branch `agent/fix-touch`. Files: `src/ui/touch.ts`, `src/ui/touch.module.css`, `src/ui/message.ts`, `tests/fix-touch.test.ts`. Times are UTC on 2026-11-26, read with `date -u`.

## The fault

Round 20, the story and look critic, severe, on `screen-touch`: the page was flat CSS with no grain, no lit edge on the rule, no glass panel, no orange control and no shadow, so it read as a placeholder beside the other six pages.

## What the page is now

Everything is HTML and CSS. Nothing is fetched for the look.

| Part | How it is made | Taken from |
| --- | --- | --- |
| Ground | `--ceramic` under one tile of grain, 240 pixels of the screen square, drawn by an inline SVG filter (`feTurbulence` lit by `feDiffuseLighting` from the upper left) held in a data address. Over it one radial gradient that lets the light fall off from the upper left to the lower right | `key-step2-rest` of the build: the ground is 237,234,230 at the upper left and 196,193,188 at the lower right, with a deviation of 5.7 in a patch of 200 by 100 |
| Rule | A bar 6 page pixels thick with the bands of a turned rod, a dark lower edge and a tight shadow down and to the right | The header rule of `src/shell/parts.ts` (6 page pixels) and its rows in `key-step2-rest` at x 600, y 150 to 170 |
| Card | Sage glass with the page's grain showing through, a lit line all round its edge, a shade inside the upper and left edges, light inside the lower and right edges, the inner line of the bevel, and three shadows: tight and dark at the contact, soft further out | The perk cards of `key-marketing-top`: the corner of 22 page pixels, the glass at 177,183,178 to 196,203,197, the shadow at 127,121,111 |
| Type | The outlines of the stage's own fonts, as before: `inter-600` for the site's title at 47 page pixels, `inter-display-600` for the apology's title at 68, `inter-400` for the words at 28, ink `#262522` | `TYPE` in `src/shell/parts.ts`, `T.display` in `src/pages/marketing/layout.ts`, `--ink` in `src/ui/interface.module.css` |
| Pill | Only when `links.portfolioWork` holds an address. Glossy orange `#c4460f` with the light at its upper edge, in a dark gap and a ring of aluminium, with two shadows | The Apply button of `key-marketing-top`, `--accent` in `src/ui/interface.module.css` |

## Decisions

1. No progress beads and no new button with new words: ruled by the Builder. The page holds the site's title, the rule, `copy:live.touchOnly.title`, `copy:live.touchOnly.body`, and the link with `copy:live.touchOnly.link` only when there is an address.
2. The grain is one SVG filter in a data address inside the style sheet. It is no request: the page's requests are the same before and after (listed below).
3. The grain tile is always 240 pixels of the screen: 240 px at a pixel ratio of 1, 120 px at 2, 80 px at 3, set by `min-resolution`. So the grain is as fine as the screen on every device and never blurred.
4. The numbers the kit does not set live in `touch.module.css`, each named with one line: `--side`, `--corner`, `--tile`, `--ring`, the floors of the type. The page pixel `--u` is the window's width over 1920, as in the interface.
5. Type sizes: never under 18 px. On a phone upright the title of the site is one line (5.6 of 100 parts of the width), the apology's title is 34 to 35 px, the words 18 px.
6. A dark colour scheme: the page states `color-scheme: only light` and has no rule for `prefers-color-scheme`. `message.ts` also puts the class `device` on the root, so the window round the page (the bars of a phone on its side, the bounce of a scroll) is the ceramic and not the near black of `index.html`, and adds a `theme-color` of the same ceramic, read from the style sheet, for the browser's own bar. That is one `meta` tag written by the script: no request.
7. The link: an inline block that may wrap to two lines on a very narrow phone (320 px wide) in place of running off the card.
8. The falloff is a look of the page and not a lens vignette: `kit/04-LOOK.md` forbids a vignette on the pages, and the build's pages fall off toward the lower right only, under the key light from the upper left. The touch page does the same.
9. The judged still `screen-touch` is drawn by `src/main.ts` with `mountTouchMessage`, without `message.ts`. It shows the same page.
