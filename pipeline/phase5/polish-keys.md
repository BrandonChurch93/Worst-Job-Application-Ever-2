# Polish keys: the held key, the page's answer to a hit, the give back of step 1

Branch `agent/polish-keys`, from 664bedb5. Files changed: `src/pages/step1/index.ts`, `src/pages/step1/keyboard.ts`, `src/pages/step1/turrets.ts`, `src/pages/step1/real/keyboard.ts`, `src/pages/step1/real/turrets.ts`, `src/pages/step1/real/turret-fx.ts`, `tests/polish-keys.test.ts`, `tests/polish-keys-measure.test.ts`, `tests/polish-keys-film.test.ts`, `tests/polish-keys-run.ts`, `pipeline/phase5/polish-keys-shots.mjs`, this note.

Every number below is from the live stage stepped under the pack's own visitor, frames of 60 a second, by `POLISH_KEYS_TABLE=<file> npx vitest run tests/polish-keys-measure.test.ts`. "Before" is 664bedb5.

## Decisions

1. All three mends are on the live site only. The film's draw list of step 1 is not changed by one value, so no film frame changes and no film sheet is owed. This is narrower than the first plan sent to the Builder, which named film frames for A and B. Proof: `tests/polish-keys-film.test.ts` writes one sha1 of the draw list and the cursor's pose for every film frame of the page; the file made at 664bedb5 and the file made now are compared by `cmp`. The three draft stills are compared by `cmp` as well.
2. A, the travel. A key held down on the live site is drawn slid `SINK.x`, `SINK.y` (5.5 px, 5.5 px) toward its shadow in the page's plane, its label with it, and its shadow drawn in to `SINK.shade` of its length. The camera looks straight down the travel of a key, so the 6 px of height a key goes down by are about 1.3 px on screen at 1920 by 1080 (STATED, from the camera's distance); the slide is what is seen. The cap's tint at the bottom is the one a pressed key had before (`SUNK`, 0.24 darker): the letter's contrast on a pressed cap is what it was.
3. A, the hold. The key stays at the bottom for as long as the button of the click that pressed it is down, the pointer anywhere. It rises on the release on the spring it had (0.14 s, a short overshoot). One press types one letter however long it is held.
4. A, the turrets. While a key is held on the live site a turret does not wind up: a shot whose wind up would run under the held key is put off, by `STAY` (0.7 s) at the most for one shot, so holding a key down does not stop the turrets. A bolt already in the air flies on. The film never calls this.
5. B. On the live site a bolt that hits the arrow presses no key. The caps within `JAR.reach` of the strike are thrown outward from it by up to `JAR.px` on the frame of the hit and are back within `JAR.seconds`; the deck's own shake is kept. The strike's light is thrown on the deck and the caps round it (`EMIT.thrown`) and dies with a time constant of `SCORCH.quick` (0.04 s, was 0.4 s). A bolt that misses the arrow and lands on a cap still taps that cap, and the tap types no letter: it is a depth in the draw only, `strike()` is not called.
6. C. No new prop. In the tug's end the mended arrow is put with its tip `CAUGHT.under` px under the hood's lip of the shredder's cassette (before it lay 43 px below it, touching nothing), drops its tired pose and is drawn out long toward the hood over the last `CAUGHT.strain` seconds. At the end the cassette kicks (`CAUGHT.kick`), the arrow is thrown back short to where the pile lay and swings, stands, and is released `CAUGHT.beat` (0.15 s) after the snap. Before, the release came 0.42 s after the same moment, so the visitor waits less.
7. The arms are untouched and stay inside `step1.tug`.

## Numbers

See the report at the end of this note, filled from the tables after the last change.
