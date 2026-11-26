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
10. Second pass, asked by the Builder: the page is a notice. The title of the site and the rule stay at the top, the rule across the page inside the margins. The card stands centred from left to right, at most 25 em of its words wide (836 px at 1920 wide), and the room under the rule is shared 42 parts above the card to 58 below (`--above`, `--below`), with a least room of `--gap` under the rule. It is done with two empty flex boxes (`.page::before`, `.page::after`): no new element, no word, no motion.
11. The card's shadows are stronger and its lower and right rim brighter and thicker, toward the perk card of the build. A fault of the first pass is mended with it: `max()` round a negative offset held the floor and dropped the scaled value, so those are `min()` now.

## Measured (second pass, 26 November 2026, 20:59 UTC)

Commands: `node out/work/fix-touch/shots.mjs after`, `node out/work/fix-touch/shots.mjs after-link --address https://example.com/work` (the address lives in the browser run only), `node out/work/fix-touch/contrast.mjs after`, `node out/work/fix-touch/contrast.mjs after-link`, `node out/work/fix-touch/rule.mjs out/work/fix-touch/after`. The scripts are in `out/work/`, which is not committed.

| size (CSS px) | scroll width | content height | least type | card top to bottom | share of the room above the card |
| --- | --- | --- | --- | --- | --- |
| 390x844, ratio 2 and 3 | 390 of 390 | 844 of 844 | 18.33 px | 307.4 to 529.9 | 42.2 of 100 |
| 390x844 with an address | 390 of 390 | 844 of 844 | 18.33 px | 268.4 to 583.7 | 42.2 of 100 |
| 844x390, ratio 2 and 3 | 844 of 844 | 390 of 390 | 22 px | 140.8 to 303.4 | 44.5 of 100 |
| 844x390 with an address | 844 of 844 | 390 of 390 | 22 px | 107.3 to 349.6 | 47.0 of 100 |
| 820x1180, ratio 2 and 3 | 820 of 820 | 1180 of 1180 | 22 px | 473.5 to 665.2 | 42.1 of 100 |
| 820x1180 with an address | 820 of 820 | 1180 of 1180 | 22 px | 432.5 to 721.9 | 42.1 of 100 |
| 1180x820, ratio 2 | 1180 of 1180 | 820 of 820 | 22 px | 324.0 to 537.1 | not measured |
| 320x568, ratio 2 | 320 of 320 | 568 of 568 | 18 px | 198.2 to 444.5 | 42.3 of 100 |
| 1920x1080, ratio 1 | 1920 of 1920 | 1080 of 1080 | 28 px | 424.7 to 739.0 (x 542 to 1378) | 43.6 of 100 |

The share is the room from the rule to the card's top, over that room and the room from the card's bottom to the window's bottom.

Contrast, measured on the pictures: the words on the card 8.5 to 8.8 to 1, the title on the card 8.0 to 8.3 to 1, the title of the site on the ground 11.1 to 12.0 to 1, the least of any run without the link 7.92 to 1; the white words on the orange pill 4.77 to 4.83 to 1, least 4.68 to 1.

Dark colour scheme: `cmp out/work/fix-touch/after/dark-390x844-dpr3.png out/work/fix-touch/after/phone-390x844-dpr3.png` says the two are byte equal.

Requests on the source server: 22 before and 22 after, the same list (the page, the client of the dev server and its env, `boot.ts`, `device.ts`, `message.ts`, `copy.ts`, `glyphs.ts`, `touch.ts`, `metrics.ts`, `glyphs.module.css`, `outline.ts`, `copy.json`, `narration.json`, `config.ts`, `touch.module.css`, `words.ts`, `showcase.json`, four `fonts/inter-*.json`). On the built site 9: the page, the index script, the message script, the touch script, the touch sheet, four font files. No picture, no model, no sound, no page module.

## Open

- With no address the card holds two runs of words and the ground round it is bare: the copy holds no more words for this page.
- At 320 wide the words of the pill wrap to two lines.
- The lower rim of the build's perk card is still a little thicker than this card's at 1920 wide, and the rule is a little paler than the build's.
- The judged still `screen-touch` is 1920x1080, a size no touch-only phone has: the kit's, left as it is.

## Checks (second pass, on the merge d9d4cfc0, ended 21:08 UTC)

- `npm run build`: exit 0.
- `npm run still -- --key <key> --format hd --tier draft --force` for `step1-fire`, `table-wide`, `boss-fight`, each then `cmp` with the picture made on dc83c2d0 before any change: byte equal, all three.
- `npm run still -- --id screen-touch --format hd --tier draft --force`: rendered, 1920x1080, the notice with the card centred.
- `npm run determinism`: pass, 12 pictures identical across two fresh loads and two orders.
- `npm run bots`: all clear.
- `npm test`: 141 files, 1770 tests passed. `tests/site-controls-boot.test.ts` is green and unchanged.
- `npx tsc --noEmit -p .`: exit 0, no output.
