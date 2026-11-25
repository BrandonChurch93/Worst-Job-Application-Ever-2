# Step 2, Personal Details: notes of the builder

Decisions taken without asking, in the order they were met.

## The page

- Form on `stepHead(2)`. Three rows at rest, 144 apart, fields 792 wide in the right column, labels and helpers in the left column. Continue sits bottom right, the note bottom left.
- A row opens a `well` under its own field: the tray floor is at `scale.heights.machineTray`, the rows below move down by the height of the tray. Only one row is open at a time.
- Continue is grey until all three rows hold a value, then takes the accent.
- Legends of the machines (digits of the dial, months, days, years of the reels) are data, not copy: `src/pages/step2/legends.json`, registered as `data:step2....`. The phone mask and the volume percent are `runtime:step2.phone` and `runtime:step2.volume`.

## The machines

- Dial: a hole is dragged clockwise to the stop. Digits 1 and 2 return the usual way. The digit that reaches `live.step2.dialDigitsBeforeItGivesUp` whips a full circle with the cursor in the hole and flings it to the left column: one hit per machine. The field then shows `rows.phone.gaveUp`.
- Slot: the lever is pulled down, the reels stop one after the other, the field shows `rows.birth.recorded`, the cabinet pays out coins at the cursor. It always pays out. The film date is 07 23 1991; the live date comes from the seeded stream.
- Crank: one turn is ten percent. After `live.step2.crankTurnsBeforeItRunsAway` turns the handle runs away to one hundred, and flattens the cursor once if the cursor is in its way. The hit can be dodged: `hint().dodge` points away from the hub.
- A gag that sits idle, or lasts past `live.skipLinkAfterSeconds`, plays its own ending: the row opens itself, the dial gives up, the lever pulls itself, the crank runs away, Continue presses itself.
- `skip()` fills the three rows, closes the open one and presses Continue.

## Where the brief and the kit differ

- The brief says the last beat is only the press of the button. The kit (01-FILM) has the cursor still flat at the start of `step2.continue`, peeling up before the press. Built as the kit says: flatten at 16.7 s, healed at 20.1 s, press at 20.3 s. No damage when the next page arrives.

## Needs from the Builder (nothing blocks)

- Sound: the events `row-open`, `dial-wind`, `dial-return`, `lever-pull`, `reels-spin`, `coins`, `crank-turn`, `crank-runaway`, `flatten`, `peel-up` are emitted with the names of the cues in `audio.sfx`. They are silent until they are listed in `eventCues` in `src/audio/cues.ts`.
- Volume: a page cannot reach the audio. The level of the crank is in `save()` and is read with `volumeOf(saved)` from `src/pages/step2`. The app can use it to set the real volume.
- `dial-fling` is the beat event of `step2.dial` and has no cue of its own in `audio.sfx`.
