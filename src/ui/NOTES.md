# The interface: notes of the builder of `src/ui/` and `src/probe/`

## What is here

| File | What it is |
| --- | --- |
| `api.ts` | The contract with the site: `InterfaceApi`, and every function the site calls |
| `interface.ts`, `interface.module.css` | The three controls of live mode, the playback controls of film mode, the hidden live region |
| `menu.ts` | The menu on the M key |
| `picker.ts` | How the site picks a level by itself. Pure logic |
| `device.ts` | `touchOnly()`, `lessMotion()` |
| `touch.ts`, `touch.module.css` | The message page for a touch-only device |
| `words.ts` | Every key of the copy and the config the interface shows |
| `names.ts` | The names of the four controls that show an icon and no word. For Brandon to approve |
| `glyphs.ts`, `outline.ts` | The words of the controls, drawn from the baked outlines of the stage's fonts |
| `icons.ts` | The five icons, drawn in code |
| `dev.html`, `dev.ts` | The interface over a grey box or a still, with a made-up site. Not part of the built site |
| `shots.mjs`, `check.mjs` | Pictures of the dev page, and a run that drives it as a visitor would |
| `site.mjs` | A run that drives the wired site itself: `node src/ui/site.mjs --shots --probe` |
| `../probe/index.ts` | The probe page: `mountProbe(host, run)`, `PROBE_SCENES`, `ProbeRunner` |
| `../probe/stats.ts` | The numbers and the block of plain text. Pure logic |
| `../probe/labels.ts` | The words of the probe page. For Brandon to approve |

## Decisions

1. Place of the three controls: one row at the top left, above the site title, with its left edge on the left edge of the content column (x 128) and its centre at y 30 of 1080. The header's title starts at y 66 and the progress rail starts at x 1014, so that strip is empty on every page that uses the shell's header, and on the careers page too. The bottom was ruled out by the ticker of the careers page and by the buttons the steps keep there. The right of the top is ruled out by the progress rail, which starts at y 24. The margins left and right of the column are 128 wide, too narrow for the two links.
2. Order in the row and in the tab order: sound, `copy:live.watchFilm`, `copy:live.skip`. The skip link is last so that nothing moves when it appears.
3. Sizes follow the picture: one page pixel is the picture's width over 1920. The type is 16 page pixels and never under 12 px. Every control is at least 24 px on its short side.
4. The skip link is a `button` that looks like a link, because it does something on the page. The film link is an `a` with the address `?mode=film`, and a click calls `api.watchFilm()`.
5. Keys, as the Builder set them. While one of the controls has the focus, every key is the control's and the browser's, and none goes on to the page. While the picture has the focus, keys go to the page. The host of the controls comes before the picture in the document and the picture can take the focus, so the tab order is sound, film link, skip link, picture, and Shift with Tab leads back. A click made with the pointer takes the focus off the control again, so the visitor's typing goes back to the page.
6. The menu on M. A plain M typed into a field would open it, so `InterfaceApi` has the optional `typing()`: while it is true, M goes to the page and the menu opens with Alt and M. Its words are ids: `quality`, `step` and `diag` are the names of the three address parameters it changes, the levels are the ids of `live.quality`, the steps are `employer.name` for the careers page and `copy:site.steps`, the views are the ids given in `api.diagnostics`. Every button has `tabindex="-1"` and the menu is `aria-hidden`.
7. The level picker. It starts at the best level. First frames: after 12 frames of warm-up it takes one window of 0.75 s at each level and goes down until the median frame rate of a window holds that level's `minFps`. After that it leaves a level only when three windows of 2 s in a row stay under `minFps`. A frame longer than 1 s is a stall and is left out. It only ever goes down, so it cannot loop. The numbers are in `PICKER` in `picker.ts`: the kit does not set them, so they are not in the config.
8. The interface runs the picker itself in `update()` when `live.defaultQuality` is `auto`, or when `api.quality.auto()` says so. A level chosen in the menu pins it. The interface only ever lowers the site's level: if the site lowered it by itself, the interface leaves it there.
9. Film mode: a bar along the bottom with play, the position, the time, sound and back. The bar spans the content column from y 978 to 1046 of 1080, so on the careers page it covers the whole ticker (y 984 to 1040) and no half of it shows above or below. The bar is opaque: at 0.94 a page's button showed through behind the time (seen at 0:55 of the film). It fades after 2.6 s without a pointer move while the film plays, and never while it is paused or while a control in it has the focus. Space or K plays and pauses, the arrows move 5 s, a click on the picture plays and pauses. Without `api.film` only sound and back are drawn. While the film has not begun (paused at 0) a large play sign stands in the middle of the picture: this is the offer a visitor who asks for less motion gets. It is decoration with no name, because the picture under it already plays on a click and the bar holds the named play control.
10. What lies under the row. The optional `api.backing()` says it. `page`: the empty strip above the title, and the row is drawn bare. `light`: pale content that has scrolled under the row, as on the careers page after a scroll, and the row gets a pale capsule with a thin edge. `dark`: a tier of the table or another dark thing, and the row turns pale on a dark capsule. The row does not move between the three.
11. The probe. The slowest one percent is one over the mean time of the slowest hundredth of the frames. The level the site would pick is the best level whose slowest scene still holds that level's `minFps`, and the last level if none does. The card's name is read from a context of its own with `WEBGL_debug_renderer_info`, unless the runner gives `graphicsCard()`. The page starts measuring when it is mounted.
12. The names file holds four names: `Sound`, `Play`, `Position in the film`, `Back to the application`. Play and pause are one toggle with one name and `aria-pressed`. Sound is one toggle with `aria-pressed`, true when sound is on.
13. The type. The site ships its fonts as baked outlines in `public/fonts/*.json`, which the DOM cannot use as a font. So `glyphs.ts` draws each word as an inline SVG from those same outlines, with the stage's own kerning, in `inter-500` for the controls and in the shell's fonts for the touch message. The word itself stays in the page as text, hidden from the eye, for a screen reader and for the search of the browser. Until the outlines have loaded, or if they do not load, the word shows as plain text in the system's sans serif. `ready()` in `api.ts` resolves when they have loaded or failed, and never rejects, so a still with the interface can wait for it. The clock of the film is set with every digit as wide as the widest, so the bar does not shift each second.
14. The words of the probe page are in `src/probe/labels.ts`. The probe is a measuring tool for Brandon and not a page of the site.

## Open

- `parts/PARTS.json`: the parts `interface` and `quality-levels` draw no shape on the stage. They are DOM and logic, so no shape carries them.
- The controls follow the picture's rectangle. On the tall pages the row lies over whatever has scrolled under the top of the screen: the site says so with `backing()`.
- Taken by the Builder on main (e970ef5): a visitor who asks for less motion and gives no mode gets the film. It was asked as `NEEDS.patch`, which is gone now.
- Over one of the controls the system's pointer shows, because they are real links and buttons. The stage's cursor waits where it left the picture. Whether the stage should hide its cursor meanwhile is the Builder's to say.
- The words of the ticker on the careers page are drawn outside its well, left of x 128 and right of x 1792. It is the page's, and it shows beside the film's bar.
- Set by the Builder: a device is touch-only only when it also takes touches (`navigator.maxTouchPoints` over 0 or a coarse pointer). A machine that reports no pointer at all gets the site.
- Set by the Builder: both pointers stay over a control, the two pickers stay, the 12 px floor of the type stays.
