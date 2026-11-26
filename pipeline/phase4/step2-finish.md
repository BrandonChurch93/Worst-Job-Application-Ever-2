# Step 2 finisher notes

Branch `agent/step2-finish`, from `origin/main` cfd83123. Parts: `rows`, `dial`, `slot`, `crank`, `acting-step2`. Start 10:02 UTC, 26 November 2026. Limit 13:02 UTC.

## Before any change

MEASURED at 10:03 to 10:05 UTC on cfd83123: `npm test` 115 files, 1461 of 1461; `npm run build` built; `npm run bots` "keen reached every one of the 37 gags on every seed", "bots: all clear".

## What the approved images hold that a quick look misses

1. Highlight: each lens of the meter carries a wet white line down the inside of its left wall and a fainter one on the right; a lit lens is near white in its core and turns orange only at the wall, and its glow lies on the floor no further than about 15 px round it.
2. Bevel: a lens is a raised glass capsule with a wall about 5 px wide all round that is darker than its core, the ring a thick piece of clear glass shows, and it lays a soft shadow of 6 to 8 px to the lower right.
3. Gap: the slot's window has a black gasket of about 6 px inside a rounded steel bevel; between two drums the gap is near black and about 8 px; a drum is near white in its middle and falls to dark over its upper and lower quarter.
4. Edge: the dial's wheel ends in one thin bright rim line and then a darker base ring of about 10 px, with no repeated rings; each hole has a dark crescent at its upper left, and the cap has one soft highlight at its upper left.
5. The lever is a bent rod about a third as thick as its knob, out of a dark socket with a copper ring on the cabinet's side, and the knob hangs lower than the cabinet; the crank's arm is darker than its plate, tapered, with a kink before the grip. Both throw one long soft shadow to the lower right.

## Round 9's issues on `main` cfd83123, judged in the first four pictures (10:07 UTC)

Still true, severe first:

- R1-1 issue 2, severe (sheet): "The gray indicators stand proud like separate buttons and the four lit ones glow nearly white and cast a broad orange halo"; the build's lenses are flat plates with a rim line, the lit ones an even orange, the halo on the sheet is broad. "a bright flat arm": the arm is still pale and flat.
- R1-1 issue 3 (sheet): "the side crank is a short straight drop with a visible mounting plate instead of the target's bent, offset handle"; the drums are flatter and creamier than approved and the digits small.
- R1-1 issues 10 and 11, R1-2 issue 1: "a dark charcoal pill with bright white text, so it reads as enabled/primary". The cap is the shell's `waiting` material and the type's `gloss:light`.
- R1-1 issue 9 (dial key): "a brighter, harder outer ring": the bezel and base show four hard dark and bright rings where approved has one rim line and a dark base; "a more diffuse orange cap highlight".
- R1-1 issue 4 (sheet): the stop is still a rounded rod; the middle is steel by the last owner's decision 17.
- R1-1 issue 5, R3-1 issue 3 (sheet): the shadows under the lever and the crank are short; the contact line is there now, and too heavy round the crank's plate.
- R1-2 issue 4: the grip is a darker, mottled orange where approved is a smooth candy orange with one top highlight.
- R3-1 issue 2: "the glow looks pasted on": a faint pool only.
- R3-1 issue 4 (dial hardware), R3-1 issue 5 (flat digits, the payline a drawn line).
- R1-1 issue 8, R3-1 issue 1: the wells of the closed fields are flat. They are the shell's controls.
- R4-1 issues 3, 4, 5 and the R9 issues: judged in the sheets of each beat, point 5.

Closed since the judged commit, seen in the pictures:

- R1-1 issue 1: the sheet has its head and the three columns.
- R1-1 issues 6 and 7: the rows and trays stand within a few px of approved.
- R1-1 issue 13: the tip rests on the cap's shoulder at the dial key.
- R1-2 issue 2: the arm's angle at the crank key. R1-2 issue 3: the tray's floor is pale.
- R8-1 issue 3: the finished field has no chevron. R8-1 issue 4: the field shows the percent.

## Looks, counted by part


One look is one draft still, comparison or sheet. Counted to 11:02 UTC.

- rows: 1 (`compare --key step2-rest`).
- dial: 3 (`compare --key step2-dial` twice, the sheet `machines` once for the stop and the middle).
- slot: 5 (the sheet `machines` three times, `still --page step2 --beat step2.slot --at 0.35` twice).
- crank: 4 (`compare --key step2-crank` four times).
- acting: 9 (the sheets of `step2.slot` and `step2.continue`, one still of the peel, six sheets of film frames cut round the arrow: the lever, the poses of the open and the dial, the landing and the blow, the press of Continue, the last reel with the first coin, the blow of the crank with the recovery after the coins).

## Decisions

1. The lever of the slot machine comes out of a socket and is bent. The plate with two screws is gone; a dark steel barrel with a copper ring stands on the cabinet's side at `SLOT.pivotY`, a stub runs out of it, a quarter bend of 15 px turns it, and the rod runs straight to the knob. The knob's path, the pull of 126 px and the time of the `coins` event are as they were. The rod is 7.4 px in radius (was 5.6) and satin.
2. The legends of the reels are the slot's own shapes (`part: 'slot'`), drawn by `slot.ts` with the page's type maker's data in the style `paper:ink`, so a legend lies round its drum as it runs past the payline. Month and day are 48 px (were 34). The year stays 34 px, because at 48 px it is wider than its reel and the layout's check says so; it is drawn 1.16 times as tall, which reads as the condensed year of the approved sheet.
3. A lens of the meter is 8 px thick (was 3.4), with a round shoulder of 5 px, a dark wall line, a wet line inside the wall on the light's side and a clearer core. A lit lens has a pale core and an orange wall. The lamp over the lit lenses reaches 58 px (was 72).
4. The crank's bar is darker (`0x767a80`) and slimmer inside its shape (0.68 of the shape's half width, was 0.8). The shape itself and the grip keep their sizes.
5. The dial: the middle of the wheel is a pale matt disc in a raised satin ring. The last owner's decision 17 kept steel to the cap because the key shows steel; round 13's R1-1 issue 9 asks for the cream disc of the sheet. The disc is pale and matt, not cream and not turned steel, so that it reads as a disc in a ring on both. The stop is a flat wedge, 19 px broad at the bezel and 7 px at its tip. The cap is 14 px tall (was 17) with a flatter crown and a satin coat. The housing is lighter and rougher, the gap round the base 0.6 px (was 1.2), the contact line 0.7 px (was 1.5).
6. Round 13's R1-2 issue 1, as the Builder ruled: a done, closed row has its chevron again. The kit says each row has "a plain glass input with a small chevron" and nothing about a done row losing it. It was taken off for round 9's R8-1 issue 3. The value of a done row is set in the type's own softer ink on glass (`glass:soft`).
7. Round 13's film issues, R9-1 and R9-2: the arrow's body is told outright where the page's cues left it neutral. `script.ts` has a table `poses` beside `reactions`, read in the film only: a turn of the body toward a thing, a squash or a stretch for a time, a hold. The body, its size and its material stay the cursor's. No pose stands in the half second before a key, so the three approved moments keep the arrow they had.
8. The lever is held down 0.42 s (was 0.1) with the arrow on the knob, and the knob is drawn up a little before the pull. The reels, the event `lever-pull` and the beat's length stay.
9. The peel after the crank falls inside its beat. The flat body is laid down again twice while the arrow is dragged to Continue, so the cursor's own peel and refill run from 19.95 s to 20.25 s and the press at 20.3 s is made by a whole arrow. The event `peel-up` moved from 19.8 s to 19.95 s and the test that holds it moved with it.
10. The blow of the crank, R4-1 issue 2 and R9-2 issue 5. The kit names the cause: the crank "flattens it on the way round". At the frame the handle meets the arrow the crank loses four fifths of its speed and the flat arrow is kicked along the handle's path, away from the hub, and slides to a stop in about 0.2 s. The lamps do not answer on that frame yet.
11. After the coins the arrow darts to the right margin beside the row (was a long glide to the page's foot), shudders, stays squashed and turned toward the machine, and stands up when the anger starts. R9-2 issue 4.
12. The coins, R4-1 issue 1. The last reel reads 0.69 s after the lever (was 0.39 s), so the stop is one beat and the pay the next. At the stop the housing kicks down 3 px and comes back; the first three coins leave the payout mouth fast and aimed at the arrow, the rest burst as before. The event `coins` is the first coin on the arrow and stays at 11.96 s.
13. The payout mouth is built: a satin steel trough with a dark bed under the cabinet, where the kit says the coins burst from the tray. The approved sheet shows no mouth; the kit's words are followed and the mouth is kept as small as a coin needs.
14. Not mine and told to the Builder: the arrow's flight to the hand-off place while the page folds is the stage's lift, and the crazed flat body is the cursor's own look.
