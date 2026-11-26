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


One look is one draft still, comparison or sheet. Counted to 12:41 UTC. The limit is 40 for each part.

- rows: 1 (`compare --key step2-rest`). The tray's floor was judged in the crank's and the dial's stills and is counted there.
- dial: 9 (`compare --key step2-dial` and draft stills of the key, the sheet `machines` for the stop and the middle).
- slot: 11 (the sheet `machines`, `still --page step2 --beat step2.slot` at 0.35 and 0.62).
- crank: 26 (`compare --key step2-crank` and draft stills of the key).
- acting: 25 (sheets of film frames, whole or cut round the arrow: the lever, the open, the dial, the landing, the blow, Continue, the coins, the recovery, the snag of the dial, the warned arrow, the whip in the frames the beat sheet takes, the throw off the crank, the double take, the strut, the crank beat and the Continue beat in whole frames, the angry run, the refill before and after its move).

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
15. The dial's return, R4-1 issue 3: where the whip ends the wheel is stopped dead for 0.05 s with the arrow on it and stretched, the latch bounces and dies, and the event `dial-fling` is the first stopped frame. The numbers dialled still register at the release.
16. The lamps of the meter dip for 0.07 s at the blow of the crank, so the blow is in the machine and in the arrow at once.
17. After the blow the arrow shrinks back from the crank when it sees it still turning, and goes to Continue in two parts with a stall between them.
18. A lens of the meter stands in a narrow seat of two meshes (a lip of the lens's wall glass and a contact line). The line is the part's own soft grey through `studio()`, lighter than the shared gap, because beside the approved key the shared gap drew a black ring round every lens. `tests/step2-keeper.test.ts` held 2 meshes for a lens and now holds 4; the work changed what it holds.
19. The crank's plate lays a soft shade on the tray down and to the right (`CRANK_LOOK.cast`), its face is darker, its screws are larger, the bar is brushed.
20. The dial stands in a seat with a thin foot line and lays a longer shade (`DIAL_BODY.cast`, `castOut`, `castAway`); the cap is glossier.
21. The crank's instruction stands where the approved key has it, in the tray's upper left.
22. The payout tray is satin steel with a mid grey bed. The reels' numerals are heavy and narrow (three fused copies), and a drum is shaded deeper toward its edges.
23. Two approved images disagree and I kept one: the key `step2-dial` shows turned steel up to the cap, the sheet `machines` shows a cream inner disc, and R1-1 issue 9 asks for the disc. See decision 5.
24. Not changed, and why. R1-1 issue 11 asks for the counter's crank to hang below the machine: the knob's place is the layout's and the pull's path is the gag's. R1-2 issue 9 is the open field's header, drawn by the shell's controls, which are the shared look's.
25. R9-1 issue 7, the whip as the event of the beat. The third number is taken at 3.8 s and wound in 0.42 s, so the whip runs from 4.22 s to 5.58 s (it ran from 4.81 s). Its speed is 5 rad/s plus 8.5 times the fourth power of the time, so it carries the arrow slowly at first: the beat sheet's frames at 4.17, 4.7 and 5.27 s have the arrow at 4, 11:30 and 2 o'clock on the wheel. The throw is from the top of the wheel to the left, 0.55 s in the air with two tumbles and a long body; it comes down 96 px short of its place, on its side, and skids the rest in 0.26 s. The event `dial-fling` stays at 5.58 s.
26. R9-1 issue 8 and R9-2 issue 7, in the film only. 0.05 s after `crank-runaway` the crank throws the arrow off: 0.28 s in the air, one and a half tumbles, a skid of 0.1 s, to the far end of the meter. There it does the cursor's `doubleTake` from 15.62 s with turns of the body on top: toward the crank, away, toward it again, a stretch of 1.42, a snap to 0.7 at 16.21 s. The handle speeds up alone through all of it. The acting state stays `shocked` from 15.22 s to 16.24 s, the longest run of that state in the page, so the state's sheet is this one. `doubleTake` was at the dial's landing and is here now; `cower` is not used. In live mode the user's pointer is not taken from the crank.
27. R9-1 issue 9. The flat arrow is laid down again at 19.73 s for 0.6 s (19.77 s until 12:10Z: the frame at 20.267 s then showed a body still flat), so it lies flat at 20.0 s, peels from 20.03 s, refills from 20.2 s, is half filled at 20.267 s and whole at 20.33 s; the press is at 20.42 s. The events `peel-up` (19.95 to 20.03 s) and `button-press` (20.3 to 20.42 s) moved and my test `tests/step2-dial-acting.test.ts` moved with them; the page turn at 20.5 s and the beat's length are the kit's. What the flat body looks like is the cursor's.
28. R9-2 issue 6. Before the first field the arrow stands on end (turned 0.14), stretched 1.26, and goes in three hops of 14 px with a squash of 0.9 on each landing, from 1.03 s to 1.66 s. The squash and lean back before the walk are gone: they read as doubt.
29. R9-2 issue 8. The arrow turns its tip to the crank's hub when it goes back in at 16.32 s. The heat of `angry` is the cursor's: I asked for heat 0.6 and the Builder refused it with a picture, because approved's glow covers the same half of the head; the yellow flecks are the shared look's item now. No patch is on this branch.
30. The well of a tray, the Builder's look at merge 34: the floor's shade under the upper and left wall is deeper and shorter (soak 0.44 over 13 px, was 0.25 over 22 px), the floor is a little darker (1.13, was 1.16) and the far side is lighter (0.13 over 12 px). All three trays share it.
31. The unlit lens of the meter had a dark outline where approved's is clear glass with a light edge. MEASURED in a draft still with the wall painted green: the outline is the lens's upright wall and seat, which the studio's light from above leaves at about a quarter of their tone. The wall and seat now give off a little of their own pale tone (`edgeLight` 0.5), standing for the light a clear block carries to its edges; their tone is lighter (`rimTone` 0.86, was 0.68), the dark line inside the rim of the picture is fainter (0.12, was 0.3) and the foot line is a lighter grey. The lit lens keeps its picture and its orange wall.
32. The well again, measured this time. MEASURED down one column of the crank key (approved and the build at the review tier, green channel, 10 to 90 px under the upper wall): approved 81, 105, 130, 146, 154, 156, 160, 165, 163; the build before 101, 126, 144, 156, 165, 170, 175, 177, 179; the build after 86, 112, 128, 143, 153, 160, 166, 169, 172 at the draft tier. The floor's shade has a second, long part (`far` 0.4 over 120, base 1.28; 0.32 over 110 was tried first and gave 91, 117, 133, 148, 157, 164, 170, 173, 176), the floor is a little warmer (blue down 3.5 percent) and the lower lip's light reaches twice as far (0.16 over 24). Approved's is still a little deeper from 60 px on (156 to 163 against 160 to 172). The build's column after is 30 px to the right of the one before, clear of the last lens. All three trays share it; seen on the dial key too.

## End of the round (12:35 UTC)

The three things least real in step 2, as I see them in my own stills and film frames:

1. The well of a tray is still shallower than approved's at the dial: approved's dial well is dark to half its height, the build's shade is the crank's, lighter. The rim of a tray is one bright line and a grey one where approved's is a thick clear lip with a bright lower edge.
2. The shade under the crank's arm and grip, and under the slot's lever, is fainter and cooler than approved's long warm shade to the lower right.
3. On the way to Continue the arrow is a pale lump for three seconds (the exhausted body over the flat one); at the size the film is judged in, the peel and the refill are small changes of a small shape. The body is the cursor's; the timing is mine and is as slow as the kit's beat lets it be.

Not done: R1-1 issue 11 and R1-2 issue 9 (decision 24); the dial's repeated rim rings at the draft tier; a held pose of the whip longer than the 1.36 s it has.

Tried last and not kept (12:41 UTC): the plate's shade on the floor at `cast.dark` 0.66 and 0.78 with a warm tint. Two draft stills showed almost no change beside approved's deep warm shade, so the part of the shade that is seen is not where I thought; the file is as it was pushed.
