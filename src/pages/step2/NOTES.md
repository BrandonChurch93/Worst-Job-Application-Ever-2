# Step 2, Personal Details: notes of the builder

Decisions taken without asking, in the order they were met.

## The page

- Form on `stepHead(2)`. Three rows at rest, 144 apart, fields 792 wide in the right column, labels and helpers in the left column. Continue sits bottom right, the note bottom left.
- A row opens a `well` under its own field: the tray floor is at `scale.heights.machineTray`, the rows below move down by the height of the tray. Only one row is open at a time.
- Continue is grey until all three rows hold a value, then takes the accent.
- Legends of the machines (digits of the dial, months, days, years of the reels) are data, not copy: `src/pages/step2/legends.json`, registered as `data:step2....`. The phone mask is `runtime:step2.phone`: the prefix `data:step2.phone.prefix` and the digits dialled so far. The field of the volume stays empty while the crank is turned, as in the approved key; the meter shows the level.

## The machines

- Dial: a hole is dragged clockwise to the stop. Digits 1 and 2 return the usual way. The digit that reaches `live.step2.dialDigitsBeforeItGivesUp` whips a full circle with the cursor in the hole and flings it to the left column: one hit per machine. The field then shows `rows.phone.gaveUp`.
- Slot: the lever is pulled down, the reels stop one after the other, the field shows `rows.birth.recorded`, the cabinet pays out coins at the cursor. It always pays out. The film date is 07 23 1991; the live date comes from the seeded stream.
- Crank: one turn is one segment, ten percent. The level starts at nothing, the handle rests up and to the right. After `live.step2.crankTurnsBeforeItRunsAway` turns the handle runs away to one hundred, and flattens the cursor once if the cursor is in its way. The hit can be dodged: `hint().dodge` points away from the hub.
- Volume: `volume()` is 1 until the row of the volume is opened, then the level of the crank, never under 0.1, and 1 once the row holds its value (the meter is full, or the step was skipped).
- In the film the cursor is taken and placed on the thing it holds (the hole, the knob, the grip) for as long as it holds it, so the hand never slips. Live, the visitor's pointer is the hand and nothing is taken until a machine hits.
- When Continue is pressed with a flat cursor (a visitor who is quicker than the peel), the cursor peels up in sight in 0.3 s and the page waits for it before it turns.
- A gag that sits idle, or lasts past `live.skipLinkAfterSeconds`, plays its own ending: the row opens itself, the dial gives up, the lever pulls itself, the crank runs away, Continue presses itself.
- The sheet `machines` shows the three machines in the order of the rows, the lever down, the meter above the crank with four segments lit, one cursor below, as in `references/approved/machines.png`.
- `skip()` fills the three rows, closes the open one and presses Continue.

## Where the brief and the kit differ

- The brief says the last beat is only the press of the button. The kit (01-FILM) has the cursor still flat at the start of `step2.continue`, peeling up before the press. Built as the kit says: flatten at 16.58 s, peel-up at 19.58 s, whole at 19.98 s, press at 20.3 s. No damage when the next page arrives.
- The brief has `step2.dial` from 2 s. The approved key `step2-dial` at 3.2 s shows two digits dialled, so the film clicks the field at 1.88 s (0.12 s before the beat line) and dials 0 and 1 by 3.1 s. The beat event `dial-fling` is at 5.58 s, inside its beat.

## The blockout view

- The value of a field sits on the floor of its pocket (`scale.heights.field`); the blockout view lifts it into sight.
- The cursor stands on the machine under it through `cursor.setGround`: the wheel, the cabinet, the knob, the grip. The handle of the crank stops counting as ground once it runs away, so that it can hit.
- `hint()` asks for a press only when the pointer is on the thing to press, so a slow bot does not press beside it and hold on.

## Needs from the Builder (nothing blocks)

- None open. The cues of the ten events come with the table of the sound builder; the volume is given through `volume()`.
