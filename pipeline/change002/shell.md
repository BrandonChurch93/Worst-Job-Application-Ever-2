# Unit "shell": notes

Branch `agent/b-shell`, started from `origin/main` at dc3296b8 on 2026-11-27 at 21:26 UTC.

## 1. The field progress contract (contract 2 of the plan)

STATED by the note: "the progress bar counts fields".

The type, in `src/stage/types.ts`:

    export interface FieldProgress { done: number; total: number }

A page sets it by giving its `PageLogic` one more method, optional, beside `typing?()` and `volume?()`:

    fields?(): FieldProgress | null

It is read from the page's own state each time the stage makes a frame (`Stage.snap` in `src/stage/stage.ts`, through `railFields`), and nowhere else is anything kept. Example, in the object a page's `makePage` returns:

    const FIELDS = ['name', 'email', 'resume']
    // in the page's state: s.field, the index of the field in hand, saved and loaded with the rest
    fields: () => ({ done: s.field, total: FIELDS.length }),

How it is drawn: the stage writes `[done, total]` into `v` of the shape whose role is `progressRail` (the numbers a page hands the maker of a part; they are blended between two steps of the stage like every `v`). The rail's maker (`rail` and `railFill` in `src/shell/real/controls.ts`) lays a strip of `railSatin` over the `railFlat` bar: from the first button to the collar of the step in hand, and from that collar toward the next button by `done / total`. Both materials are the rail's own in `src/shell/materials.ts`; no prop, no new material, no new copy.

Decisions:
- `done` may be a fraction. A page that wants the fill to glide eases `done` in its own state; a page that reports whole numbers gets a fill that steps.
- `done / total` is clamped to 0..1. `total` of 0 or less, `null`, or no method at all: the rail is drawn as before, same key, same object.
- With `done` 0 on step 1 nothing is filled, so step 1 at rest looks as it did.
- The fraction is laid over the length of rail a visitor can see, from the collar of the step in hand to the far side of the next cap's edge (6 px under it), not from centre to centre: with three fields the three lengths seen are near 1 : 2 : 3. MEASURED in `tests/b-shell-fields.test.ts`.
- The steps behind the step in hand are filled too (`FILL_FROM_FIRST` in `controls.ts`). A page that reports nothing shows no fill at all, so steps 3, 4 and 5 show the bare rail until their pages report; `fields: () => ({ done: 0, total: 1 })` on a page with no fields keeps the fill behind its button. That line is for the owners of those pages, through the Builder.
- The fill has no eased motion of its own in the shell, because that would be state outside the page.

MEASURED: `npx vitest run tests/b-shell-fields.test.ts`: 8 tests passed. `npx tsc --noEmit -p .`: no output.
MEASURED by eye: `shell-pictures/rail-step2-2of3-draft.png`, a crop of `npm run still -- --page step2 --beat step2.open --at 0.9 --format hd --tier draft --force` with the stage told for that one render to report 2 of 3 on every page (not committed). The strip from 1 to 2 and two thirds of the way from 2 to 3 is the lighter satin; the rest is the flat grey of today.

### 1a. The Builder's rulings of 21:36 UTC on the rail, and what changed

- STATED by the Builder: `FILL_FROM_FIRST` stays true; a page with a rail and no `fields`, or `null`, is drawn as 0 of 1; the fill is the orange plastic of the button in hand, with a notch at each field's boundary.
- Done in `src/shell/real/controls.ts`: `railCount` gives 0 of 1 when the rail holds no count, so steps 3, 4 and 5 keep the fill up to the collar of their button with no line in their pages. The fill is `materials().orange`, the material of the cap of the step in hand. `railNotches` gives one notch at each boundary between two fields (total minus 1 of them), drawn as a strip of the `gap` material 2.5 px wide over the rail and the fill (`NOTCH_WIDE`, `NOTCH_OVER`). No new material.
- The fraction now runs from the collar of the step in hand to the edge of the next cap, so a notch stands exactly where the fill of that many fields ends; a full count goes 6 px under the cap.
- Found while doing it: two other shapes of the build carry the role `progressRail`, the boss's `health-track` (which uses `v` for its own lift) and the careers page's `process-rail`. `railFields` in `src/stage/stage.ts` and the fill in `controls.ts` now act only on the shape with id `progress-rail`. Before this, a boss page reporting fields would have had its health track's `v` overwritten.
- Test changed: `tests/b-shell-fields.test.ts`, "draws a page that reports nothing, null, or no fields at all with the key and the object of today" is now "draws a page with a rail that reports nothing, null, or no fields at all as 0 of 1: bare on step 1, filled up to the collar of the step in hand after it" (this note, 1a). Two tests added: the orange and the notches; the other rails left alone. The ratio of a full count to one field is now pinned between 3 and 3.3 (the 6 px under the cap).
- MEASURED: `npx vitest run tests/b-shell-fields.test.ts tests/b-shell-chrome.test.ts tests/ui.test.ts`: 3 files, 41 tests passed. `npx tsc --noEmit -p .`: no output.
- MEASURED on `out/work/stills/step2-step2_open-0p9-hd-draft.png` (hd, draft, 2 of 3 stamped for the render only): mean colour of the fill 213, 97, 37, relative luminance 0.228; of the bare rail 114, 117, 119, relative luminance 0.178. The difference is in hue more than in luminance.
- Picture: `shell-pictures/rail-orange-step1-1of3-step2-2of3.png`: step 1 at 1 of 3 and step 2 at 2 of 3 at 1920 wide (crops), and the same two frames scaled to 390 wide under them.

## 2. The header hook (asked by the Builder, 21:41 UTC)

The type, in `src/stage/types.ts`:

    export interface Chrome { header: number }

A page gives its `PageLogic` one more optional method:

    chrome?(): Chrome | null

`header` is how far the header is in: 1 in place, 0 off the top of the screen. It is read from the page's own state at each frame (`slideHeader` in `src/stage/stage.ts`, called in `Stage.snap` after `railFields`). Example:

    chrome: () => ({ header: 1 - easeOut(s.fightIn) }),

- The header is the shapes `header-title`, `header-rule`, `progress-rail`, `progress-1` to `progress-5` and their numerals (`isHeader`). Each is moved up by `(1 - header) * HEADER_OUT` page pixels (`HEADER_OUT` 240) and marked `moved`. The page's own shapes are not changed: the frame holds copies.
- No method, `null`, or `header` 1 or more: the frame is what the page drew. Values under 0 count as 0.
- The page eases the number itself; the shell keeps no state.
- MEASURED: `tests/b-shell-chrome.test.ts`, 6 tests passed. Picture `shell-pictures/chrome-header-0p55-step2-draft.png`: step 2 with `header` 0.55 stamped for one render (not committed), the header 108 px up.

### 2a. The caption's place in the hook (Builder, 21:57 UTC)

    export interface Chrome { header: number; caption?: number }

`caption` is the y of the lower edge of the caption panel in page px of the 1920 by 1080 design. Absent: `CAPTION.low`, 1044. `src/main.ts` passes it to the sound at each live frame (`sound.page(stage.page.id, stage.page.chrome?.()?.caption)`); the panel eases to it over `CAPTION.easeSeconds` (0.25 s) while words are shown and is simply there when none are (`easeCaption` in `src/ui/said.ts`).

The box the other units keep clear: 900 px wide by 96 px high in page px, centred, its lower edge at `caption` (1044 when a page names none). STATED limit: the type never goes under 13 px on the screen (`CAPTION.minFontPx`), so in a window narrower than 960 px the panel is higher than 96 page px. MEASURED in a window 640 px wide: `line.pinball.seal.0` on two rows, 300 by 43.1 screen px, which is 900 by 129 page px. In a window 1200 px wide every line is one row; the widest, `line.boss.slabs.0` (64 letters), is 479.7 by 38.6 screen px, which is 768 by 62 page px.

## 3. Item 1: the narrator speaks on events

STATED by Brandon: "right now it's constantly talking and I don't really want that. I want the voice over to actually play while the user is playing not necessarily on a timer but on an event basis."

The rule, as agreed by the Builder at 21:41 UTC, and where it lives:

1. A line is set off by an event a page emits and by nothing else. No beat, no stillness, no clock sets one off (`filmLive` and `liveTriggers` in `src/audio/cues.ts`).
2. It starts within 0.4 s of that event or not then (`LIVE.liveLateSeconds` and `LIVE.waitSeconds` in `src/audio/levels.ts`; all waits are 0.4 now).
3. A line that could not start stays owed while its page lasts: the next time its event comes it has its chance again. Leaving the page drops it. A line of the film that was said is not said again in that visit (`LiveDesk.ask` in `src/audio/narrator.ts` spends a line only when it is booked).
4. Two lines never overlap, and after a line there are 6 s with no voice (`audio.liveNarratorMinGapSeconds`, not changed). An event that comes inside a line or inside those 6 s does not get its line then.
5. `idle.0` and `idle.1` are not said on the live site: stillness is a clock. The site still tells the sound how long the visitor has been still (`quiet()`), and the sound does nothing with it.
6. The press of Skip and the press of Watch the film are presses of the visitor, so their lines stay.

Why the old build talked all the time, MEASURED on the old engine (fee1d033), `npm run sound -- --visit keen`: a line could wait up to 10 s for its turn, so nearly every event that came during a line or its 6 s still got its line, late. 12 lines heard in 132.58 s, 63.19 s of voice (47.7 percent of the visit), 8 of the 12 began more than 0.4 s after their event (5.27, 1.52, 4.15, 9.70, 7.48, 1.46, 8.60, 3.30 s after), the silences between lines were 6.0 to 9.0 s, and `step2.dial.0` and `step2.crank.0` hung on a beat, not on an event.

The same visit on this build: 11 lines heard, 47.04 s of voice (35.5 percent), every line within 0.35 s of its event (9 of 11 at 0.00 s), silences between lines 6.0 to 17.2 s. Lines heard and the event of each: `marketing.stroll.0` 0.03 s (`step`), `step1.firstName.0` 11.20 (`keyboard-rise`), `live.hit.0` 28.97 (hit), `step2.dial.0` 35.55 (`dial-wind`), `pinball.seal.0` 50.63 (`ball-seal`), `live.hit.1` 63.97, `live.hit.2` 70.73, `live.hit.3` 82.27 (hits), `pinball.drain.0` 93.78 (`drain`), `boss.slabs.0` 104.34 (`slab-fire`), `decision.letter.0` 129.57 (`stamp`).

What is NOT changed, and is the Builder's to rule: the count of lines in a keen visit is 11 where it was 12. The voice is on for a third of the visit, not for half. If that is still too much talk, the one number to raise is the 6 s of silence (`audio.liveNarratorMinGapSeconds` in the frozen `config/`), or the four `hit` lines can be taken off the live site (three of the 11 lines heard are `hit` lines).

The table: every line of `content/narration.json`, what set it off before, what sets it off now. "Now" is always: within 0.4 s of the event, or owed until the event comes again on that page.

| Line | Page | What set it off before (fee1d033) | What sets it off now |
| --- | --- | --- | --- |
| `line.marketing.stroll.0` | careers | event `step`, then up to 10 s of waiting for its turn | event `step` |
| `line.marketing.perks.0` | careers | event `card-flip`, then up to 10 s of waiting for its turn | event `card-flip` |
| `line.step1.firstName.0` | step 1 | event `keyboard-rise`, then up to 10 s of waiting for its turn | event `keyboard-rise` |
| `line.step1.firstName.1` | step 1 | event `bolt-hit-cursor`, then up to 10 s of waiting for its turn | event `bolt-hit-cursor` |
| `line.step1.email.0` | step 1 | event `slab-drop`, then up to 10 s of waiting for its turn | event `slab-drop` |
| `line.step1.tug.0` | step 1 | event `arms-out`, then up to 10 s of waiting for its turn | event `arms-out` |
| `line.step2.dial.0` | step 2 | the beat `step2.dial` being reached (no event of the page), then up to 10 s of waiting | event `dial-wind` |
| `line.step2.crank.0` | step 2 | the beat `step2.crank` being reached (no event of the page), then up to 10 s of waiting | event `volume-sign`, or `crank-turn` while step 2 does not yet give volume-sign |
| `line.pinball.seal.0` | step 3 | event `ball-seal`, then up to 10 s of waiting for its turn | event `ball-seal` |
| `line.pinball.launch.0` | step 3 | event `plunger`, then up to 10 s of waiting for its turn | event `plunger` |
| `line.pinball.lobby.0` | step 3 | event `carpet-roll`, then up to 10 s of waiting for its turn | event `carpet-roll` |
| `line.pinball.coffee.0` | step 3 | event `bumper`, then up to 10 s of waiting for its turn | event `bumper` |
| `line.pinball.replyAll.0` | step 3 | event `inbox-take`, then up to 10 s of waiting for its turn | event `inbox-take` |
| `line.pinball.fired.0` | step 3 | event `firehouse-take`, then up to 10 s of waiting for its turn | event `firehouse-take` |
| `line.pinball.drain.0` | step 3 | event `drain`, then up to 10 s of waiting for its turn | event `drain` |
| `line.boss.verify.0` | step 4 | event `checkbox`, then up to 10 s of waiting for its turn | event `checkbox` |
| `line.boss.slabs.0` | step 4 | event `slab-fire`, then up to 10 s of waiting for its turn | event `slab-fire` |
| `line.boss.lastStand.0` | step 4 | event `session-expired`, then up to 10 s of waiting for its turn | event `session-expired` |
| `line.decision.letter.0` | step 5 | event `stamp`, then up to 10 s of waiting for its turn | event `stamp` |
| `line.decision.metrics.0` | step 5 | event `count-run`, then up to 10 s of waiting for its turn | event `count-run` |
| `line.live.idle.0` | any | the clock: 12 s of stillness (`live.idleSeconds`), then up to 4 s of waiting | nothing: not said on the live site (the call is no longer made) |
| `line.live.idle.1` | any | the clock: 12 s of stillness (`live.idleSeconds`), then up to 4 s of waiting | nothing: not said on the live site (the call is no longer made) |
| `line.live.hit.0` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.hit.1` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.hit.2` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.hit.3` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.slowTyping.0` | step 1 | event `slow-typing`, up to 2 s of waiting | event `slow-typing` |
| `line.live.realKeyboard.0` | step 1 | event `real-keyboard`, up to 4 s of waiting | event `real-keyboard` |
| `line.live.tugLost.0` | step 1 | event `tug-lost`, up to 3 s of waiting | event `tug-lost` |
| `line.live.pinball.flipper.0` | step 3 | event `flipper`, the first time only, up to 4 s of waiting | event `flipper`, until it has been said once |
| `line.live.boss.verify.0` | step 4 | event `checkbox`, up to 4 s of waiting | event `checkbox` |
| `line.live.boss.slow.0` | step 4 | event `boss-slow`, up to 6 s of waiting | event `boss-slow` |
| `line.live.skip.0` | any | event `skip` (the press of Skip), up to 4 s of waiting | event `skip` |
| `line.live.watchFilm.0` | any | the press of Watch the film (a call of the interface), up to 3 s of waiting | the same press |

Lines whose event no page gives yet are in the table as owed for good until the page gives it; for step 2 the Builder named `volume-sign` as to come, and until it does `crank-turn` sets off `step2.crank.0`.

MEASURED in a real browser, every line by its event, `node pipeline/change002/shell-caption.mjs --lines-only` (the site's engine built as it is, a real AudioContext, each line's event sent to it; record in `shell-caption.json`): 32 of 34 lines said, each by its event (not said, as the rule has it: `line.live.idle.0`, `line.live.idle.1`); page errors 0; the page drew a frame every 16.7 ms (median).

Tests: `tests/b-shell-sound.test.ts`, "item 1" (3 tests): every film line hangs on an event of its own page and none on a beat; in a storm of every event on every page each line starts within 0.4 s of the event that set it off, never two at once, 6 s after each; every event name the units of change 002 gave has a cue or a named silence.

## 4. Item 10: no sound on the careers page but the press of Apply

STATED by the brief: "while the careers page is the page on screen no sound effect plays but that press. The narrator and the music are not sound effects and are not touched by this item." STATED by the Builder at 21:41 UTC: the room tone and `page-turn` are silent on that page.

Done, live site (`src/audio/index.ts`, `src/audio/cues.ts`, `src/main.ts`):
- `quietPage` is `marketing`, `quietPageCues` is `['button-press']`. While the page on screen is the careers page an event plays its cue only if the cue is in that list.
- The sound has to know the page on screen and not guess it from events, so `src/main.ts` tells it at each live frame and at a jump by the step control (`sound.page(id)`).
- The turn from the careers page to step 1 and the turn from step 5 back to it play no `page-turn` cue. Loops that still ring are stopped when the careers page is on screen.
- The room tone does not run on the careers page: it is not started at the first touch any more, starts half a turn (0.5 s, `LIVE.quietTurnSeconds`) after the turn away begins, and is taken out over the turn back (see item 9).

Done, film (`src/audio/mix.ts`, and `tools/mix.mjs` by the NEEDS patch): the mix reads the page of each event of the cut, lays no cue while the careers page is on screen but `button-press`, no `page-turn` into or out of it, and no room tone there.

MEASURED, live: `npm run sound -- --visit keen` on this build: on the careers page 0.02 to 10.2 s and from 132.08 s, the room tone runs 10.2 to 132.08 s only. MEASURED by `shell-hum.mjs`: in the 10 s after each of three restarts every sample the site gives out is 0.
MEASURED, film, on `cut/CUTLIST.json` with `quietSpans` and `cueOfEvent` of this build: the careers page is on screen for frames 0 to 810 and 9075 to 9180; 34 events with a cue fall there (30 `step`, 3 `card-flip`, 1 `button-press`); 33 are silent and one plays, `button-press` at frame 751 (12.52 s). The `page-turn` at frames 810 and 9045 is silent.
NOT DONE: the film's sound file is not remade. `npm run mix` writes `audio/mix/*`, which is not this unit's; it is the Builder's run after `npm run cut`. Until then the film that exists still has the old sound.

Tests: `tests/b-shell-sound.test.ts`, "item 10" (8 tests).

## 5. Item 9: the hum after a restart

STATED by Brandon: "after the application ends and it restarts at the beginning, there's this weird like humming sound that should not be there super annoying."

Found, MEASURED by `node pipeline/change002/shell-hum.mjs` (the keen visit three times over through the site's own engine in a browser whose sound is rendered offline; record `shell-hum.json`, picture `shell-pictures/hum-after-restart-before-after.png`, clips in `shell-clips/`):
- Before the mend (the engine of fee1d033), the careers page 1 s to 11 s after it is back on screen: rms -47.6 dB, peak -33.3 dB after each of the three restarts; 100 Hz at -56.6, -56.9, -56.9 dB; 201, 198, 198 tones more than 10 dB over the noise beside them; the loudest are 100.3 Hz (-56.6 dB), 200 Hz (-62.6 dB), 399.9 Hz (-64.8 dB), 249.8 Hz (-68.3 dB), 599.9 Hz (-69.0 dB); 46 percent of the energy is between 80 and 160 Hz.
- Its source: the loop `room-tone` (`public/audio/room-tone.flac`, 19.0 s). The old engine started it at the first touch and never stopped it, and started it again at `start()`. During the application it lies under the effects, the voice and the hold music; back on the careers page it is the only thing that sounds, and the file itself carries a comb of tones at every multiple of 50 Hz up to about 8 kHz, strongest at 100 Hz. That is the hum.
- After the mend: every sample is 0 in those 10 s, after restart 1, 2 and 3.

The mend, two parts:
1. The tone stops at the turn back to the careers page (faded over 0.5 s) and does not start again until half a turn after the next turn away. So after a restart nothing sounds on the careers page (item 10 says the same).
2. Asked by the Builder: the tones are taken out of the room tone under steps 1 to 5 too, in the engine, behind one switch, `TONE.dehum` in `src/audio/levels.ts`, on. `dehum` in `src/audio/dsp.ts` is a comb at every multiple of 50 Hz (`TONE.humHz`, `TONE.combKeep` 0.9) and two notches (100 Hz q 6, 200 Hz q 12), run twice round the loop so that the join of the loop has no step. It is applied to the decoded `room-tone` only, in the site and in the film mix. The file is not changed.

MEASURED on the file with the switch off and on (picture `shell-pictures/room-tone-dehum-off-on.png`): rms -46.0 dB to -48.5 dB; 100 Hz -54.6 dB to -69.1 dB; tones more than 10 dB over the noise beside them 197 to 14; change of energy by band 20 to 80 Hz -0.27 dB, 80 to 160 Hz -4.75 dB, 160 to 640 Hz -2.16 dB, 640 to 5000 Hz -4.97 dB, 5000 to 20000 Hz -4.29 dB. The level is not raised again to make up for the 2.5 dB.
UNKNOWN: whether the room "still reads as a room" with the switch on. That is a judgement of the ear and the Builder's: the two clips are `shell-clips/room-tone-dehum-off-10s.flac` and `shell-clips/room-tone-dehum-on-10s.flac`. The broadband noise between the tones is left within 2 dB by test; what is taken out is the comb.

Tests: `tests/b-shell-sound.test.ts`, "item 9" (4 tests) and "stays so after a first, a second and a third restart".

## 6. The words on screen while they are spoken

STATED by the Builder at 21:41 UTC: the visible caption for the live site is built now, in `said.ts`, driven from the audio clock; "a soft panel at the bottom centre in the site's type, the same on every page, and above the pinball video and the boss fight too". The film's captions are not built now.

Done: `makeCaption` in `src/ui/said.ts`. One panel in the page over the canvas (z 40, takes no clicks), the site's Inter 500 drawn with the same outlines as the stage (`src/ui/glyphs`), ink `#262522` on the paper colour `rgba(231, 228, 221, 0.97)` with a hairline and a soft shade, scaled with the picture. The engine gives it, by `sound.said()`, each line that is booked with its words (as read: the pause mark is not shown), and the start and end of its voice on the sound's own clock. At each drawn frame the panel reads that clock: the words are on from the first frame at or after the start of the voice to the first frame at or after its end. Every word comes from `content/narration.json`; none is typed into code.

MEASURED, the panel against the voice (`shell-caption.mjs`; the voice is timed where it is handed to the browser, the caption by a watcher of the page that reads the same clock; neither from the panel's own log): 
- The engine and the panel in a browser that draws a frame every 16.7 ms, every line by its event (32 lines): the words come on 0.000 to 0.020 s after the start of the voice and go 0.007 to 0.043 s before the end of its sound. The sound as decoded is 0.024 to 0.046 s longer than the length in `public/audio/index.json` (the padding of the mp3), and the panel goes at the first frame after the length in the index. The words shown are the words of the line with the pause mark left out, for all 32.
- The whole site as built, the keen bot playing it in real time, in this sandbox, which has no graphics card and draws the site with a software renderer:
- Run `site` (mode live; a frame every 2.60 s, median): `line.marketing.perks.0` on 2.821 s after the voice starts, off 4.444 s after it ends; `line.marketing.stroll.0` on 2.961 s after the voice starts, off 0.599 s after it ends.
- Run `site-step3-low-640` (mode live, from step 3, quality low, 640 by 360; a frame every 0.55 s, median): `line.pinball.seal.0` on 0.012 s after the voice starts, off 0.490 s after it ends.
- Run `site-step3-low-960` (mode live, from step 3, quality low, 960 by 540; a frame every 1.02 s, median): `line.pinball.seal.0` on 0.009 s after the voice starts, off 0.171 s after it ends.
- Run `site-step4-low-960` (mode live, from step 4, quality low, 960 by 540; a frame every 1.10 s, median): `line.boss.verify.0` on 0.000 s after the voice starts, off 0.204 s after it ends.
- Run `site-step1-low-960` (mode live, from step 1, quality low, 960 by 540; a frame every 1.40 s, median): `line.step1.firstName.0` on 0.012 s after the voice starts, off 2.205 s after it ends.
- What that says: the panel can only change when the page draws a frame. Here a frame takes 0.55 to 2.6 s, so the words go off up to that much after the voice (0.17 to 4.4 s MEASURED); they come on at once when the line is booked inside a frame (0.000 to 0.012 s), and 2.8 to 3.0 s late in the run whose frames took 2.6 s. At 60 frames a second the same code is within 0.020 s at the start and 0.043 s at the end (first point).
- UNKNOWN: the numbers on the hosted site on a machine with a graphics card. The hosted pages answer 403 to this sandbox.
- NOT DONE: every line on the whole site. A keen visit says 11 of the 34, and in this sandbox the site runs at a few percent of its speed, so the runs above hold 5 lines on 4 pages. Every line is covered by the first point only.
- The film: no caption is built (the Builder's ruling), so nothing is measured there.

The look, by eye: `shell-pictures/caption-live-step3-step4.png`, the live site at 960 by 540 on step 3 and step 4 with a line's words on the panel. On step 4 the panel at its default place lies over the lower half of the Submit button: no page names its `caption` place yet. A picture on step 1 was not got (the sandbox took longer to take the picture than the line lasted).

Film captions, not built. Two ways:

(a) The caption is part of the picture the film renders. The film is made of frames read off the canvas, so a panel of the page (what the live site has) is not in them; the caption would be drawn in the scene. To stay fixed to the screen while the pinball cameras move it cannot be a shape of the page (those lie on the table and move with it): it is a quad placed at each frame from that frame's own camera (`CameraPose`: eye, target, up, fov), a fixed distance d down the view axis, 2 d tan(fov/2) high, drawn last with no depth test, and it must be left out of depth of field, grain and the camera's shake, or the words blur and tremble. That means a pass after the picture's finishing in the render engine, which is not this unit's. The words would come from `cut/CUTLIST.json` (`lines`: `first` and `last` frame of each line are there today) so no clock is read. About 5 to 7 hours: 2 for the pass and the quad, 1 for the panel drawn with the stage's type, 1 to 2 for looking at it over all five pages and the opening at both formats, 1 for tests and the determinism run; and the whole film is rendered again.

(b) The caption is laid over the finished frames in the cut. It is fixed to the screen by construction: it never enters the scene, so no camera touches it. What it needs from the cut: for each line its first and last frame (in `cut/CUTLIST.json` `lines` already), the y of the panel's lower edge for each stretch of the film (one number a unit, or the 1044 default; step 1's deck and the fight want it higher), and one step in the encode that lays a picture with alpha over frames `first` to `last` (ffmpeg `overlay` with `enable='between(n,first,last)'`, in `tools/film.mjs` or `tools/lib/film-encode.mjs`, not this unit's: a NEEDS patch). This unit would make the 20 panels as pictures with alpha from the same `said.ts` at each format's size. About 2 to 3 hours, no frame rendered again, one more encode. Exact to the frame (1/60 s).

(b) is the cheaper and the safer of the two; (a) is only worth it if the caption should take the scene's light.

## 7. The cue table for the event names of change 002

In `src/audio/cues.ts`, three lists the Builder fills in by file name: `newEventCues` (event to the nearest kept cue; the file to come is named in the row), `newSilent` (events with no sound until their file exists), `prefixCues` (`strike:` and what follows it: silent until the strikes have sounds). `cueOfEvent(name)` is a function now: exact name first, then prefix. Old event names keep their old cues.

| Event | Cue until its file exists |
| --- | --- |
| `shield-glance` | `bolt-hit` |
| `shot-round` | `dart-hit` |
| `cannon-fire`, `big-fire` | `slab-fire` |
| `boss-heal` | `power-on` |
| `bullet-fire` | `bolt-fire` |
| `turret-lock`, `turret-load` | `lever-pull` |
| `arena-break`, `keys-break`, `page-crack` | `button-crack` |
| `date-key` | `key-press` |
| `reel-stop` | `drop-target` |
| `date-hit`, `field-done` | `checkbox` |
| `date-miss` | `popup-close` |
| `crank-full` | `crank-runaway` |
| `vacuum-slip` | `ball-drop` |
| `vacuum-lose` | `scoop-kick` |
| `frenzy-on` | `flasher` |
| `loot` | `coins` |
| `boss-move`, `cannon-tell`, `big-tell`, `turret-off`, `slab-shadow`, `volume-sign`, `field-next`, `vacuum-on`, `frenzy-off`, every `strike:<id>:<n>` | silence |
| `turret-rise`, `flatten`, `peel-up` | the cue of that name, as before |

## 8. Decisions

- The turns into and out of the careers page play no `page-turn` cue; the room tone and `page-turn` count as sound effects there.
- The tone does not start until the sound knows the page on screen.
- The idle lines are never said on the live site. `liveTriggers.idle` stays in the table as a call the site no longer makes, so the take is still loaded and the film's tools still find it.
- A line whose event comes while another speaks is not queued: it stays owed until its event comes again, and is dropped when its page is left.
- The dehum does not raise the tone's level again.
- The film's careers spans are read from the page of each event, which is why `tools/mix.mjs` had to pass it (NEEDS).
- The caption is a panel of the page fed on the sound's clock, not a shape of the stage: it has to be the same over the pinball video and the fight, and a shape of the page would move with the page.
- `LIVE.quietTurnSeconds` 0.5 is half a turn: MEASURED, the stage reports the new page 0.5 s after the `page-turn` event (pages at 10.2, 33.72, 49.03, 96.43, 124.13, 132.08 s against turns 0.5 s before each).
- `step2.crank.0` hangs on `volume-sign`, with `crank-turn` beside it until step 2 gives `volume-sign`.

## 9. The NEEDS patch

`pipeline/change002/shell-NEEDS.patch`, applied as commit 76f33b97 ("NEEDS: ..."): `tools/mix.mjs` passes the `page` of each event of the cut to `mixFilm`, writes `hushed` and `quiet` into its record, and its check A9 does not count a hushed event as a cue that failed to sound. Told to the Builder at 22:04 UTC.

## 10. Tests changed or removed, each with the note that changed it

New: `tests/b-shell-sound.test.ts` (21 tests), `tests/b-shell-fields.test.ts`, `tests/b-shell-chrome.test.ts`.

Changed, because the rule each pinned was changed by section 3 (item 1) of this note:
- `tests/audio-live.test.ts`: "says by number how long ..." is now "lets every kind of line start at most liveLateSeconds ..."; "gives a line one chance" is now the owed rule; the tests of a trigger during a line, a trigger inside the gap, taking a waiting line back, leaving the old page, a pageless line through a turn, the step 2 rows (events, not beats), a trigger during another line in the engine, skip and page turn taking a waiting line back; "drops the line whose start would be later" is now "says it when its event comes again".
- `tests/audio-rules.test.ts`: the gag test is now "no line on a beat"; the idle test is now "no line by stillness"; the least gap test; the test of a skip in the middle of a line.

Changed by section 4 (item 10):
- `tests/audio-rules.test.ts`: the fall back test uses `button-press` on step 1 (a `step` on the careers page is silent now).
- `tests/audio-engine.test.ts`: four tests tell the sound the page first (`s.page('step1')`); the tone starts once the page is known.
- `tests/audio-visit.test.ts`: the room tone runs from the turn away from the careers page to the turn back, not from 0 to the end.

Removed, by the Builder's mail of 21:57 UTC (section 1a): `tests/b-shell-fields.test.ts`, "leaves every page of the build as it was: none reports fields". The test beside it holds what replaces it: a page that reports nothing draws as 0 of 1.

Red and left, by the same mail: `tests/cut-of-build.test.ts`, until the Builder runs `npm run cut` on the merged tree.
