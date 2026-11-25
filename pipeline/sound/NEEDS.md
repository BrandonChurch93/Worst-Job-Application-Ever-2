# What the sound side needs from the pages

The sound agent does not edit a page. Each need is: the line, the trigger in Brandon's words, the page, the name wanted for the event, and the moment it must be reported. Until an event exists the line is tied to a stand-in, named here, and `filmLive` in `src/audio/cues.ts` carries the wanted name as `standIn`.

All of this is STATED from reading the page code, not measured in a browser.

## Events that do not exist

| Line | Trigger in Brandon's words | Page | Event wanted | When it must be reported | Stand-in used now |
| --- | --- | --- | --- | --- | --- |
| `pinball.lobby` 0, "Corporate headquarters. / So close." | the ball rolls onto the red carpet | `step3` (`src/pages/step3/index.ts`) | `carpet-roll` | once, at the step the ball first touches the lobby floor after the launch (`T.onTable`, 10.85 s of the page) | the stage reporting the beat `pinball.lobby` (page time 11.0 s, 0.15 s after `T.onTable`) |
| `pinball.replyAll` 0, "Someone / hit reply all." | the inbox takes the ball | `step3` | `inbox-take` | once, at the step ball 0 is first held by `office.inbox` (towed there by `T.inboxBy`, 19.1 s) | the stage reporting the beat `pinball.replyAll` (page time 19.0 s) |
| `pinball.fired` 0, "Fired. / Before it was hired. / A new record." | the ball drops into the firehouse | `step3` | `firehouse-take` | once, at the step the ball is first held by `street.firehouse` (towed there by `T.firedBy`, 27.2 s) | the stage reporting the beat `pinball.fired` (page time 26.0 s, so the line starts 1.2 s before the ball is in) |
| `decision.metrics` 0, "It will apply again tomorrow. / They always do." | the metrics card appears | `step5` (`src/pages/step5/index.ts`) | `metrics-card` | once, at the first step the metrics card is drawn at rest | the stage reporting the beat `decision.metrics` (the step the page's phase becomes `metrics`) |

## An event a live line wants

| Line | Trigger in Brandon's words | Page | Event wanted | When it must be reported | Stand-in used now |
| --- | --- | --- | --- | --- | --- |
| `liveOnly.boss.slow` 0, "The button is winning. / The button." | the fight is going badly for the visitor | `step4` (`src/pages/step4/index.ts`) | `boss-slow` (the name the page's own notes and `liveTriggers` already use; the page does not emit it) | once in a fight, live mode only, at the step the page decides the visitor is slow. The page knows the boss's health and the engine does not, so the page is the one to decide | the engine says the line once, at the first event or beat of the fight after it has lasted as long as the film's fight (`boss.collapse.from` minus `boss.unfold.from`, 22 s now) since the event `unfold`. `power-down`, a skip or a page turn ends the count. From the first `boss-slow` the page emits, the engine leaves the line to the page |

## Calls that existed nowhere and now exist

| Line | Trigger | Where | State |
| --- | --- | --- | --- |
| `liveOnly.watchFilm` 0, "It would rather watch. / Understandable." | the visitor chooses to watch the film | `src/main.ts` | Done on main: `watchFilm()` turns the film on and then calls `sound.trigger('watchFilm')`. The engine says the line only while the film's opening plays and only if it ends 0.3 s before the film's first line. So it is said in film A from its start, and not said where the film has no opening. Nothing more is needed unless the line is wanted there too |

## Events the extra cues need

Eleven extra cues are made and packed (`pipeline/sound/NOTES.md`, "Extra cues"). Seven hang on events that are emitted today and need nothing from a page: `tug-lost`, `arms-out`, `dial-fling`, `flipper-save`, `session-expired`, `popup-close`, `skip`. Four are mapped to events of their own names that no page emits yet. They are silent until Phase 4 adds the events, and need no change on the sound side when it does:

| Cue | Event wanted | Page | When |
| --- | --- | --- | --- |
| `carpet-roll` | `carpet-roll` | `step3` | the same event the line `pinball.lobby` wants, above |
| `inbox-take` | `inbox-take` | `step3` | the same event the line `pinball.replyAll` wants |
| `firehouse-take` | `firehouse-take` | `step3` | the same event the line `pinball.fired` wants |
| `metrics-card` | `metrics-card` | `step5` | the same event the line `decision.metrics` wants |

When those four events exist, the four lines of the film that fire on their gag now (`standIn` in `filmLive`) can be tied to them: tell the sound agent, it is a change of four rows in `src/audio/cues.ts`.

## Open for step 5: the numbers counting up

`count-run` is not made. The Builder ruled at 19:23Z that numbers counting up are not a contact, and the event does not exist. It stays open for step 5:

| Cue | Event it would need | Page | When | Prompt it would be asked with | Seconds | Credits for one take |
| --- | --- | --- | --- | --- | --- | --- |
| `count-run` | `count-run` | `step5` | once, at the step the numbers of the metrics card start to count (`AT.count[0]` of the phase `metrics`) | A small mechanical counter with number wheels running fast and stopping, a quick even ratchet of light clicks ending on one firmer click | 1.2 | 14 |

It would be the twelfth and last cue `audio.extraCuesMax` allows.

## The rows of audio.sfx

`config/` is the Builder's. The eleven rows are in `pipeline/sound/NEEDS-sfx.patch`, a `git diff` of `config/showcase.json` that applies on main. Once it is on main the sound agent moves the eleven from `extraCues` into `eventCues` in `src/audio/cues.ts`, so that the cut's field `cue` names them too.

## Lines tied to the stage's report of a beat, where an event would be exact too

These need nothing. They are listed so the choice is known.

| Line | Trigger in Brandon's words | Tied to | Why not the event |
| --- | --- | --- | --- |
| `step2.dial` 0 | the Contact number row opens | the stage reporting the beat `step2.dial` | `row-open` is emitted for all three rows and carries no row. The page reports the beat `step2.dial` in the same step in which row 0 opens. |
| `step2.crank` 0 | the Audio volume row opens | the stage reporting the beat `step2.crank` | the same, for row 2. |

## Triggers that cannot be heard as written

| Line | Trigger in Brandon's words | What happens |
| --- | --- | --- |
| `marketing.stroll` 0 | the careers page first appears and the visitor moves the mouse | A browser lets no sound start before the first click. The line is tied to the first `step` event on the page `marketing` that reaches the engine once it is unlocked, so a visitor who moves the mouse and has not clicked hears nothing, and hears the line at the first step after the first click. |
