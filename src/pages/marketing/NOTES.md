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
- Perk card: when the cursor tip enters a card it turns over as four slats, like a departure board, and stays open. Event `card-flip` at the start. A whole card turning about its long axis would stand 248 px high and throw the cursor; slats stand 74 px, and the cursor rides on top by `cursor.setGround`. Nothing hurts the cursor.
- With a still or wrong pointer the three first-screen cards open by themselves from 20 s into the perks phase (`live.skipLinkAfterSeconds`), half a second apart.
- Double take: once, when the "Unlimited PTO" card shows its fine print with the cursor on it.
- Apply: a press on any of the three caps (`nav-cta`, `hero-cta`, `final-cta`). The page takes the cursor (about 1.2 s, far under the 8 s limit), it backs off 44 px, jumps 96 px high onto the right part of the cap, clear of the label, `button-press` on landing, the cap sinks 10 px with the label and the cursor on it, `done()` 0.3 s later. `skip()` does the same on the hero button.
- Variant `rejected`: ticker repeats `copy:marketing.tickerAfterRejection`, footer shows `copy:step5.closing` in place of the plot twist, cards still turn, the buttons sink and come back, `done()` stays false, `gag()` is null, the cursor acts `exhausted`.

## Differences from the brief, told to the Builder

- The kit names a perk card as one slab that turns over on its long axis, or a face that slides aside. Here it is four slats, each turning on its long axis, for the reason given above.
- `hint()` points at the first unopened first-screen card during the stroll and perks phases, and at the hero button from the ticker phase on (with a pulsing press). Reason: the bots walk to the hint, and the keen bot has to reach the perks and ticker gags before the press ends the page. In the rejected variant it points at the hero button without a press.
- The cursor rides surfaces with `cursor.setGround` (on `main` since f6c1585), so it stands on cards, caps and medallions and is not hidden under them.

## Film timing (page seconds)

- 0.25 to 1.85 stroll in from the left margin (steps at about 1.0 and 1.4).
- 2.2 card 0, double take about 2.7; 4.2 card 1; 5.9 card 2. On each card the cursor stands in the bottom right corner, clear of the words.
- 8 to 11 past the medallion (`proud`, dust off) and to a stand right of the hero button by 10.7. The key `marketing-top` is at 11.0.
- 12.06 the pointer flicks to the cap and presses while the body still stands beside it, so the jump is a real leap; `button-press` about 12.97, the stage turns the page at 13.5.

## Other

- The ticker is closed-form: its offset is a function of the page time, 36 px a second, set so that an item starts at the window's left pad at 11.0 s (the key) and, after the rejection, at 1.7 s.
- The value of the wait field sits at the pocket floor as the shell's `field()` places it; the blockout view of main 8c84635 lifts type on a flat pocket by itself, so the page no longer lifts it.
- The tape is clipped by the page: a run of the tape lies below the surface, so the part of it outside the window is under the slab. The blockout view of main 8c84635 lifts sunk type whose box centre is outside every well onto the page, which would spill a run that crosses the window's edge. A crossing run is therefore drawn with a 2 px box at its inner end (left aligned as it comes in, right aligned as it goes out), so its centre stays inside the well.
