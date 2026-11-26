# What the sound side needs from the pages

Every event the sound waited for exists since Phase 5 (26 November). Nothing here is open but the sound of `count-run`. `filmLive` in `src/audio/cues.ts` carries no `standIn` any more, and `tests/audio-live.test.ts` holds that.

## The events, where each is emitted and when

MEASURED with the stage itself: the film through `Stage` in film mode with `ScriptDriver` (the way `filmPlan` of `tools/mix.mjs` reads it), the live site with `npm run sound -- --visit keen` (seed 20261124).

| Event | Emitted in | When | Film, s of the film and frame | Live, keen bot, s of the page |
| --- | --- | --- | --- | --- |
| `carpet-roll` | `src/pages/step3/index.ts` (was there before Phase 5) | once, when the table reports the ball on the lobby floor | 79.479, frame 4768 (12.48 s of the page) | 12.48 |
| `inbox-take` | `src/pages/step3/index.ts` (was there) | when `office.inbox` takes the ball, with `hitsCursor` true | 85.779, frame 5146 | 19.48 |
| `firehouse-take` | `src/pages/step3/index.ts` (was there) | when `street.firehouse` takes the ball, with `hitsCursor` true | 93.258, frame 5595 | 27.30 |
| `boss-slow` | `src/boss/fight.ts`, called by `src/pages/step4/index.ts` (was there) | once in a fight, live mode only, at the step the fight's clock reaches `live.bossSlowSeconds` (25) with the boss above half its health | never | not in the keen run: the fight ended sooner |
| `metrics-card` | `src/pages/step5/index.ts` (added in Phase 5) | once, at the first step the metrics card is drawn at rest: `AT.panel[1]` of the phase `letter` | 144.200, frame 8652 (3.2 s of the page) | 3.2 |
| `count-run` | `src/pages/step5/index.ts` (added in Phase 5) | once, at the step the numbers of the card start to count: `AT.count[0]` of the phase `metrics` | 147.100, frame 8826 (6.1 s of the page) | 6.1 |

A skip in step 5 jumps past both moments, so a visitor who skips before them gets neither event.

## What each event sets off

| Event | Cue | Line of the film on the live site |
| --- | --- | --- |
| `carpet-roll` | `carpet-roll` | `pinball.lobby` 0, "Corporate headquarters. / So close." |
| `inbox-take` | `inbox-take` | `pinball.replyAll` 0, "Someone / hit reply all." |
| `firehouse-take` | `firehouse-take` | `pinball.fired` 0, "Fired. / Before it was hired. / A new record." |
| `metrics-card` | `metrics-card` | none, see below |
| `count-run` | none made yet (listed in `silentEvents`) | `decision.metrics` 0, "It will apply again tomorrow. / They always do." |
| `boss-slow` | none | `liveOnly.boss.slow` 0, "The button is winning. / The button." The engine no longer times the fight itself |

Decided in Phase 5, for Brandon to overrule: the line of `decision.metrics` hangs on `count-run` and not on `metrics-card`. The card is at rest 3.2 s into the page, 2.23 s before the stamp lands (5.43 s). Tied to `metrics-card` the line "It will apply again tomorrow" would be spoken over the stamp, and "Rejected. / In under a second." would wait for it and the gap and start 9.5 s after the stamp. Tied to `count-run` (6.1 s, where the film has the line at 6.0 s) the order of the film is kept. It is one row of `filmLive`.

## Calls that existed nowhere and now exist

| Line | Trigger | Where | State |
| --- | --- | --- | --- |
| `liveOnly.watchFilm` 0, "It would rather watch. / Understandable." | the visitor chooses to watch the film | `src/main.ts` | Done on main: `watchFilm()` turns the film on and then calls `sound.trigger('watchFilm')`. The engine says the line only while the film's opening plays and only if it ends 0.3 s before the film's first line. So it is said in film A from its start, and not said where the film has no opening. Nothing more is needed unless the line is wanted there too |

## Open for step 5: the numbers counting up

The sound `count-run` is not made. The Builder ruled at 19:23Z on 25 November that numbers counting up are not a contact. The event exists since Phase 5 and plays nothing until a cue is made:

| Cue | Event it would need | Page | When | Prompt it would be asked with | Seconds | Credits for one take |
| --- | --- | --- | --- | --- | --- | --- |
| `count-run` | `count-run` | `step5` | once, at the step the numbers of the metrics card start to count (`AT.count[0]` of the phase `metrics`) | A small mechanical counter with number wheels running fast and stopping, a quick even ratchet of light clicks ending on one firmer click | 1.2 | 14 |

It would be the twelfth and last cue `audio.extraCuesMax` allows.

## The rows of audio.sfx

Done. The Builder put `pipeline/sound/NEEDS-sfx.patch` on main in 9267c2b, and the eleven are in `eventCues` of `src/audio/cues.ts` since.
