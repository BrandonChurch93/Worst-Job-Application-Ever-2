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

## Calls that do not exist

| Line | Trigger | Where | What is wanted |
| --- | --- | --- | --- |
| `liveOnly.watchFilm` 0, "It would rather watch. / Understandable." | the visitor chooses to watch the film | `src/main.ts` | one call of `sound.trigger('watchFilm')` at the click that changes the mode from live to film, before `sound.stop()`. `src/main.ts` calls `sound.trigger('idle')` and no other trigger, so this line is never said today. A `stop()` right after the call cuts the line: the call is only of use if the film's sound starts after the line, or if the line is said on the film's side. The Builder decides. |

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
