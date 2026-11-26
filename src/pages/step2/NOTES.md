# Step 2, Personal Details: notes of the builder

Decisions taken without asking, in the order they were met.

## The page

- Form on `stepHead(2)`. Three rows at rest, 144 apart, fields 792 wide in the right column, labels and helpers in the left column. Continue sits bottom right, the note bottom left.
- A row opens a `well` under its own field: the tray floor is at `scale.heights.machineTray`, the rows below move down by the height of the tray. Only one row is open at a time.
- Continue is grey until all three rows hold a value, then takes the accent.
- Legends of the machines (digits of the dial, months, days, years of the reels) are data, not copy: `src/pages/step2/legends.json`, registered as `data:step2....`. The phone mask is `runtime:step2.phone`: the prefix `data:step2.phone.prefix` and the digits dialled so far. The field of the volume stays empty while the crank is turned, as in the approved key; the meter shows the level.

## The machines

- Dial: the order of a real rotary dial. The stop is at four o'clock; 1 is at two o'clock, the digits run against the clock through 9 at six o'clock to 0 at five o'clock, so 1 has the shortest way to the stop and 0 the longest. `references/approved/machines.png` is the reference for the look, not for which digit sits in which hole (the Builder's answer, 10:03 UTC).
- Dial: a hole is dragged clockwise to the stop. Digits 1 and 2 return the usual way. The digit that reaches `live.step2.dialDigitsBeforeItGivesUp` whips a full circle with the cursor in the hole and flings it to the left column: one hit per machine. The field then shows `rows.phone.gaveUp`.
- Slot: the lever is pulled down, the reels stop one after the other, the field shows `rows.birth.recorded`, the cabinet pays out coins at the cursor. It always pays out. The film date is 07 23 1991; the live date comes from the seeded stream.
- Crank: one turn is one segment, ten percent. The level starts at nothing, the handle rests up and to the right. After `live.step2.crankTurnsBeforeItRunsAway` turns the handle runs away to one hundred, and flattens the cursor once if the cursor is in its way. The hit can be dodged: `hint().dodge` points away from the hub.
- Volume: `volume()` is 1 until the row of the volume is opened, then the level of the crank, never under 0.1, and 1 once the row holds its value (the meter is full, or the step was skipped).
- In the film the cursor is taken and placed on the thing it holds (the hole, the knob, the grip) for as long as it holds it, so the hand never slips. Live, the visitor's pointer is the hand and nothing is taken until a machine hits.
- When Continue is pressed with a flat cursor (a visitor who is quicker than the peel), the cursor peels up in sight in 0.3 s and the page waits for it before it turns.
- A gag that sits idle, or lasts past `live.skipLinkAfterSeconds`, plays its own ending: the row opens itself, the dial gives up, the lever pulls itself, the crank runs away, Continue presses itself.
- The sheet `machines` shows the three machines in the order of the rows, the lever down, the meter above the crank with four segments lit, one cursor below, as in `references/approved/machines.png`.
- `skip()` fills the three rows, closes the open one and presses Continue.

## The measures (Builder's mail of 10:39 UTC)

- M5: the arm and the grip of the crank sit in the layout tree at the rest angle of the handle and carry `moved: true` while the handle is away from it; the knob of the lever carries it while the lever is pulled. `moved?: boolean` on `Shape` is the Builder's line in `src/stage/types.ts`, added on this branch as a commit of its own (`NEEDS:`) so that the merge is a no-op.
- M7: only three events of this page strike the cursor. `dial-fling`: the acting goes from scared (the whip) to shocked on the step of the fling. `coins`: emitted once, at the cursor, on the step the first coin hits it, and the acting goes from shocked to scared on that step; if no coin hits the cursor the event is emitted where the first coin lands, with no strike. `flatten`: the damage starts on its step. `peel-up` is the cursor's own act and no strike.
- In the film the acting follows `script.ts`, whose table holds times and two marks (`fling`, `strike`) that the machines set in `save()` on the step of the event, so the change can never drift from the event.
- The film's `coins` is now at 11.96 s (was 11.52 s): the cursor waits under the cabinet until it is struck, then runs.

## Where the brief and the kit differ

- The brief says the last beat is only the press of the button. The kit (01-FILM) has the cursor still flat at the start of `step2.continue`, peeling up before the press. Built as the kit says: flatten at 16.80 s, peel-up at 19.80 s, whole at 20.2 s, press at 20.3 s. No damage when the next page arrives.
- Accepted by the Builder at 10:03 UTC. The brief has `step2.dial` from 2 s. The approved key `step2-dial` at 3.2 s shows two digits dialled, so the film clicks the field at 1.88 s (0.12 s before the beat line) and dials 0 and 1 by 3.1 s. The beat event `dial-fling` is at 5.58 s, inside its beat.

## The blockout view

- The value of a field sits on the floor of its pocket (`scale.heights.field`); the blockout view lifts it into sight.
- The cursor stands on the machine under it through `cursor.setGround`: the wheel, the cabinet, the knob, the grip. The handle of the crank stops counting as ground once it runs away, so that it can hit.
- `hint()` asks for a press only when the pointer is on the thing to press, so a slow bot does not press beside it and hold on.

## Needs from the Builder (nothing blocks)

- None open. The cues of the ten events come with the table of the sound builder; the volume is given through `volume()`.
- Open at 10:54 UTC, for the Builder. M9 is red on main fc06ef9 for step 2 and for step 1 alike. `src/capture/showcase.ts` now reports `height` as `s.z1 - (n.floor ?? 0)`, the top above the part's own floor. The kit (05-ARCHITECTURE) says it is the top above the page surface. The shell's own progress buttons and Continue cap fail by their socket depth, and so do the working parts of the three machines here, which sit on other parts. With `s.z1` in that line M9 is green for step 2. Nothing in this folder was changed for it.

## Phase 4: the rows, the dial and the acting (agent step2-dial)

- The numbers a shape hands its maker in `v`: `dial-wheel` `v: [turn]`, the wheel's turn in radians, clockwise on the page. `field-focus` `v: [glow]`, the ring's light. `slot-reel-0..2` `v: [position]`, the reel's place in legends, fractional while it spins.
- The dial is one object carried by `dial-wheel` (part `dial`). `dial-centre`, `dial-stop` and `dial-hole-<k>` stay in the list for the logic and are drawn by that object. The numerals are `text` shapes on the plate under the wheel.
- A tray is a pocket of role `machineTray`, part `rows`, whose height grows with the row's spring. The open field's ring is `field-focus`, its caret `field-caret`.
- The dial lies in the tray's floor until the tray is open (`DIAL_BODY.rest`), then rises with its hub and its stop.
- The acting of the five beats, its words, its poses and its times: `pipeline/phase4/step2-dial.md`, "Acting". The times of each idea are the consts `EASY`, `DREAD`, `PULL`, `TEMPER` and `THROWN` in `script.ts`.
- The cursor's ground holds the Continue button's cap, so a flat cursor lies on the cap and not under it.
- An open tray is `TRAY_H` 250 px high, as in the approved images. Its rim is 8 px of shared satin aluminium, its wall the shared matt grey `cardSeal`, its floor the sunk glass; the shade under the upper and left walls is painted (`TRAY.floor`, `TRAY.soak`, `TRAY.wallShade`).
- The slot stands 12 px in from the tray's padding and 9 px under its top (`SLOT`), the crank's hub at `CRANK.hx` (padding plus 73), its grip 84 by 52.
- The dial's hub is a lacquered copy of the shared orange (`DIAL_BODY.hubCoat`, `hubRough`, `hubIor`); the risen dial lays a painted shade on the floor (`DIAL_BODY.cast`), away from the key.
- While the slot is sunk in the floor (`SUNK`, under 0.05 of its rise) its reel legends are not drawn.
