# Careers page (unit `marketing`): decisions

Phase 2 blockout. Stand-in shapes only. Every word is a key of `content/copy.json`.

## Files

- `layout.ts`: the whole page as a layout tree (`careersLayout()`), 1920 wide, one column 128 to 1792.
- `index.ts`: `makePage()`, the page logic: scroll, ticker, perk cards, the three apply buttons, phases, hint, skip.
- `script.ts`: the film pointer path and the film-only acting cues.
- `tests/marketing.test.ts`: layout, words, film events, self-ending gags, the three buttons, the rejected variant, `load(save())`, the keen bot.

## Layout

- First screen follows `references/approved/marketing-top.png`: top bar, hero with the big button, one medallion (award 0), perk cards 0 to 2, ticker strip at y 984 to 1040.
- Below: perks (cards 3 to 7 in a 3 by 2 grid, `perks.closing` in the sixth cell), awards 1 to 4, testimonials, comparison table, five-step process, questions, final call to action, footer.
- Section gap 170, heading to content 140, foot margin 128. These three numbers are chosen so that the judged scroll stills (0.25, 0.5, 1 of the scroll range) start in a gap between rows, 25 to 29 px above a row, and not through a card.
- `copy:marketing.hero.sublineLong` is the hero subline in long form. The approved first screen uses the short one, so the long one stands in the footer as the line about the company, under the brand.
- The ticker texts are layout nodes with their own states (`tape-N`, `tape-after`) so they count in the type register; the moving tape is drawn by the page, in a well cut into the page.

## Gags

- Phases, the same in live and film: stroll (2 s), perks (at least 6 s, and until the three first-screen cards are open), ticker (3 s), then idle (`gag()` is null). The page waits for the press.
- Perk card: when the cursor tip enters a card the whole slab turns over as one piece, about its long axis through its centre, and stays open. Event `card-flip` at the start, `FLIP_SECONDS` 0.63 as before. While it turns the card lies in a well `perk-i-pit` cut under it (half the card's height plus 8 deep), so the lower half has room. The slab is one shape, `perk-i-slab` (part `perk-cards`), built round its middle with both faces ground to the same bevel and its thickness in `v[0]`; the words and the rule that ride it are `perk-i-slab-<n>`. The shut words ride the upper face, the open words, the rule and the fine print ride the under face. The well is dark and a grey seal lies in its mouth while the slab turns. The raised edge stands at most half the card's height (124 px) above the card top; the cursor rides it up and down by `cursor.setGround`. Nothing hurts the cursor. Shut or open and at rest the card is the layout's own node, unchanged.
- Perk card, the shade of the under side: the key light comes from the upper left, so the under side of the slab is turned from it between 90 and about 126 degrees and gets only the fill. The turn eases by a steeper curve (`TURN_SHARP` 5, a tanh curve, still 0.63 s from end to end), so the slab passes that range fast. The stand-in tones of Phase 2 (`BACK_TONES`) are gone: the slab is the perk cards' own pale glass (`cardGlass()` in `real/perk-cards.ts`) on both faces.
- Perk card, the slant at half open: the raised edge of the slab is nearer to the camera, and the camera looks from above the middle of the screen, so on the left and right cards that edge is drawn further out than the sunk edge. It is the scene's own perspective, the same that every raised part has. Left as it is: the page cannot change the camera.
- With a still or wrong pointer the three first-screen cards open by themselves from 20 s into the perks phase (`live.skipLinkAfterSeconds`), half a second apart.
- Double take: once, when the "Unlimited PTO" card shows its fine print with the cursor on it.
- Apply: a press on any of the three caps (`nav-cta`, `hero-cta`, `final-cta`). The page takes the cursor (about 1.2 s, far under the 8 s limit), it backs off 44 px, jumps 96 px high onto the right part of the cap, clear of the label, `button-press` on landing, the cap sinks 10 px with the label and the cursor on it, `done()` 0.3 s later. `skip()` does the same on the hero button.
- Variant `rejected`: ticker repeats `copy:marketing.tickerAfterRejection`, footer shows `copy:step5.closing` in place of the plot twist, cards still turn, the buttons sink and come back, `done()` stays false, `gag()` is null, the cursor acts `exhausted`.

## Differences from the brief, told to the Builder

- The kit names a perk card as one slab that turns over on its long axis, or a face that slides aside. Here it is the first: one slab that turns over (the four slats of the first version are gone, asked by the Builder at 10:03 UTC).
- `hint()` points at the first unopened first-screen card during the stroll and perks phases (and, once the three are open, at the stand beside the hero button, without a press), and at the hero button from the ticker phase on (with a pulsing press). Only the bots read `hint()`: nothing in `src/ui/` or `src/app.ts` draws it, so a visitor never sees it point at the bare page. Reason: the bots walk to the hint, and the keen bot has to reach the perks and ticker gags before the press ends the page. In the rejected variant it points at the hero button without a press.
- The cursor rides surfaces with `cursor.setGround` (on `main` since f6c1585), so it stands on cards, caps and medallions and is not hidden under them.

## Film timing (page seconds)

- 0.25 to 1.85 stroll in from the left margin (steps at about 1.0 and 1.4).
- The three perk visits fill the beat: `card-flip` at 2.10 (card 0, double take about 2.7), 4.31 (card 1) and 6.35 (card 2), so the last fine print lies open at about 7.0. On each card the cursor stands in the bottom right corner, clear of the words.
- 7.8 to 8.7 it steps up the last card to admire it (`proud`, dust off at 8.2), 8.7 to 10.9 it turns and walks, `confident`, past the top of the card to its stand right of the hero button. The ticker runs at 120 px a second (`tapeSpeed`), so new words enter the strip all through the beat; its offset is 0 at 11.0, where the key `marketing-top` is taken with the cursor at the stand.
- 11.0 it crouches (`anticipate`), 11.2 to 11.6 it bounds back 150 px for a run-up (`jump`), 11.86 the pointer flicks to the cap and presses while the body still stands back, so the page winds it up and leaps it on to the button: `button-press` about 12.77, the stage turns the page at 13.5. No walk in this beat.

## Other

- The ticker is closed-form: its offset is a function of the page time, 36 px a second, set so that an item starts at the window's left pad at 11.0 s (the key) and, after the rejection, at 1.7 s.
- The value of the wait field sits at the pocket floor as the shell's `field()` places it; the blockout view of main 8c84635 lifts type on a flat pocket by itself, so the page no longer lifts it.
- The ticker's window is the pocket `ticker-window` (round ends, `TICKER.floor` deep) that the ground cuts; the rectangular well `ticker-well` is gone. The tape `ticker-tape` lies in it under a pane of glass and is lit by four small lamps inside the window (`TICKER_LOOK` in `real/ticker.ts`).
- The tape is clipped by the page: a run of the tape lies below the surface, so the part of it outside the window is under the slab. The blockout view of main 8c84635 lifts sunk type whose box centre is outside every well onto the page, which would spill a run that crosses the window's edge. A crossing run is therefore drawn with a 2 px box at its inner end (left aligned as it comes in, right aligned as it goes out), so its centre stays inside the well.
- The three links of the top bar work in the live site, as on a real page: `Perks & Benefits` scrolls to the perks section, `Our Values` to the awards (the page has no section of that name; the awards and the testimonials are what it has to say about itself), `Open Positions` to the final call to action, whose body says there are none. A link only scrolls. It starts no gag and takes no control.
