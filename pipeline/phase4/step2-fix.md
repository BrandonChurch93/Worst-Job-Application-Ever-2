# Step 2 fixer notes

Branch `agent/step2-fix`, from `origin/main` 997de9fb. Parts: `rows`, `dial`, `slot`, `crank`, `acting-step2`. Start 06:55 UTC, 26 November 2026.

## Before any change

MEASURED at 06:56 to 06:58 UTC on 997de9fb: `npm test` 102 files, 1390 of 1390; `npm run build` built; `npm run bots` "bots: all clear".

## What the approved images hold that a quick look misses

1. Highlight: the tray's lip carries one unbroken bright line all the way round, brightest on its lower and right run, and the open field's ring is a wide warm glow that soaks into the glass beside it. On the sheet every metal part has one hard glint toward the upper left and nothing else.
2. Bevel: the tray's lip is about 10 px of rounded glass that turns from page to floor in one curve. There is no black hairline outside it and no upright wall inside it.
3. Gap: in `step2-crank` the tray's floor is pale (about 200 of 255 in the middle, page 225); the build's is 120 to 170. Only `step2-dial` holds a dark band under the upper wall, about 40 px, soft.
4. Edge: the crank's arm is slim and long: hub to the grip's middle is about 145 px at the key's scale and the bar is about 22 px wide, a flat bar with one bright chamfer line on its upper edge. The arrow's tip rests on the lower right end of the grip and leaves the grip in sight.
5. On the sheet a machine has a tight dark line where it meets the paper and then one long soft shadow to the lower right, twice as long under the lever and the crank's grip, which stand highest. The meter's unlit lenses are darker than the page and lie in it, and the lit ones are amber with a pale core, not white.

## Round 9's issues on `main` 997de9fb, judged in the first four pictures (07:00 UTC)

Still true, severe first:

- R1-1 issue 1 (sheet): "The entire title, progress rail, divider and step heading are missing".
- R1-1 issue 2 (sheet): "The gray indicators stand proud like separate buttons and the four lit ones glow nearly white and cast a broad orange halo"; "a bright flat arm pointing much farther sideways".
- R1-1 issue 3 (sheet): "A dark slot below the housing is absent from the target"; "a short straight drop with a visible mounting plate". The window's corners are rounded since the judged commit.
- R1-1 issue 4 (sheet): "The bright continuous brushed face runs right up to the center cap"; the stop is "a bright little rounded rod".
- R1-1 issue 5 and R3-1 issue 3 (sheet): "short, fuzzy shadows"; "no dark contact line where the plate meets the paper".
- R1-1 issue 14 (sheet): the arrow "too far left and high"; labels "heavier, more prominent gray".
- R1-1 issue 9 (dial key): "a square-walled gray recess with an abrupt pale strip along its bottom".
- R1-1 issue 13 (dial key): the arrow at "the stop at the outer rim", not at the cap.
- R1-1 issue 12 (rest key): the arrow "points much more upright, touches the second field".
- R1-2 issue 3 (crank key): "a heavy dark inner shadow band along the top".
- R8-1 issue 3: the finished field's chevron. R8-1 issue 4: the blank volume field.
- R3-1 issue 2: a faint warm pool is there since the keeper's decision 28; the floor is still one smooth fill.
- R4-1 issues 3, 4, 5 and every R9 issue: judged in the sheets of each beat as each is worked.

Closed or changed since the judged commit:

- R1-2 issue 2: the arm stands 21.9 degrees over the horizontal at the key (keeper, decision 29). What is left is its length and width, and the arrow lying over the grip.

Not this part's:

- R3-1 issue 1, the wells of the closed fields: `rows.ts` hands every shape that is not a tray to `controls` of `src/shell/real/controls.ts`. The wells are the shared controls'.

## What was built, in the order of the brief

- Point 2, the sheet `machines`: `machinesSheet()` draws the head of step 2 (title, rail, rule, heading), the three machines in three columns, each under its label, and the arrow at rest. Each machine is the page's own machine, built once at its own size and set in a group scaled for the sheet (`real/sheet.ts`, `scaled()`), so the sheet and the page cannot differ. The dial has a pale inner disc with a dark seam, a deeper stack and a dark flat stop. The slot has no dark slot under its housing. The crank has a slimmer arm, the meter dark lenses with amber lit ones. Every machine stands on a dark contact line.
- Point 3: the coins are spat from under the housing at the arrow, fall down the tray under a gravity of 2600 px/s2, bounce at most twice on the lower wall of the tray and lie there in two rows; when the tray shuts its lower wall carries them in. The knob rises with the wind-up of the script (it could not before, the pull was clamped at rest), is driven to its stop 4.5 percent past the full pull, held 0.1 s and springs back 7.5 percent past its place. Each reel gathers speed over 0.3 s, runs, and stops with a jolt, at 0.8, 1.15 and 1.5 s.
- Point 4, first pass: the stroll to the first field is three strides; the arrow leans in to the reels, small and tight (`nervous`), stands tall at the result (`shocked`), goes flat under the coins and holds it (`duck`, 0.38 s, the pointer still), darts for cover (`dart`), shakes the coins off (`dustOff`), packs down in a temper before any heat shows (`fume` at 13.3 s, `angry` at 13.5 s), marches and stamps. In the film the page no longer adds a flinch under each coin: the duck is the answer.
- Point 5: the volume field shows the level as a percent while the crank is turned: `runtime:step2.volume`, the number from the turns so far, the sign from `data:step2.volume.percent` in `legends.json`. `NOTES.md` is corrected.
- Point 6: the tip is held on the grip's far end through the turns and through the wind-up of the runaway; the finished field shows no chevron.
- Point 7: the tray's rim is narrower and its walls lean less and are shaded less. At the dial key the tip is 13 px nearer the cap than before (it rests on the lower right of the cap's shoulder 0.1 s after the key). At rest the arrow stands 21 px higher and clears the second field.
- Point 8: the dial's return gathers speed and slows into its stop (`RETURN`); the crank winds back 0.12 s before it runs away (`WIND`), as an offset of what is shown, so no event moves.

## Decisions

1. The sheet has the head of the page. This reverses the keeper's decision 15; the approved sheet has it.
2. The approved key `step2-dial` shows the brushed face up to the cap; the approved sheet `machines` shows a pale inner disc. The brief asks for the disc. The disc is built, on the page and on the sheet.
3. The percent is read from the turns of the crank, not from the stepped level, so it counts up smoothly.
4. The coins fall down the page, as on a wall, and also down onto the floor of the tray: one motion that reads from both sides. They lie on the tray's lower wall and go in with the tray.
5. `watch`, where the arrow stands to see the reels, is now beside the lever and not under the housing, so the coins have 110 px to fall after they strike it.
6. `REEL.read` is 0.388 s (was 0.4 s) so the event `coins` stays at 11.963 s with the arrow in its new place.
7. The first digit is wound in 0.24 s (was 0.3 s) and the second begins at 2.87 s (was 2.95 s), so the arrow has left the stop before the key at 3.2 s. The cursor's own follow is slow after a release; the tip is still 23 px from the shoulder at the key.
8. The tilt of the arrow at rest is the cursor's own body in `src/cursor/`. Not this part's.

## After the first pass (from 07:50 UTC)

- The tray: the wall is a cove (`TRAY.cove` 2.4, seven steps), smooth into the floor, its shade laid along the same curve; the rim is 6 px and the wall leans 1.9.
- The crank's wind-up: the film held the arrow at the wound-back angle while the arm was drawn somewhere else, so at 15.26 s the arrow stood above the hub with the grip far from it. The hold now uses the angle the arm is drawn at.
- The coins: when the row shuts they lay over the shutting tray and one over the third field (seen at 13.4 and 13.5 s). They now lie where they fell and the shutting tray covers them one by one; none is drawn past the tray's edge.
- The reels: 94 px wide with a 3.4 px lip and a shade that starts nearer the crest, so each reads as a roller with a dark gap beside it.
- The dial: the housing is lighter (0.86 of the shared steel, was 0.72) and the three dark lines thinner (seat gap 1.2, foot line 1.5, inner seam 1.3).
- The sheet: the crank stands at 0.9 rad, as approved.
- The peel up and the refill: the flat arrow drags itself to a place 190 px left of the button by 19.4 s, stands still there through the peel (19.8 s) and the refill, and steps to the button from 20.04 s. Looked at with the place 96 px left of the button, where the arrow stood on the button's edge; moved to 190 px and NOT looked at after the move (the acting looks of this round are used up).

Decisions after the first pass:

9. The coins do not ride the tray's lower wall as it shuts (decision 4 said they did): that carried them over the next field.
10. The tip at the dial key: the cursor's own follow keeps it at the stop for about 0.1 s after the pointer leaves and takes 0.3 s over the way. The two digits are now dialled 0.02 s and 0.04 s earlier (2.31 s and 2.83 s; the tray is not ready for a press before 2.30 s, and the second digit is not taken before 2.82 s), and the pointer rests at 5, 16 from the centre of the cap. MEASURED with the probe: at 3.2 s the tip is 28 px right of and 23 px below the centre of the cap, on its lower right shoulder (was 43, 30; the approved has about 25, 21).
11. The tray's wall is the floor's own frosted glass (`glassSunk`, was `cardSeal`), so wall and floor are one piece; its shade fades out at the foot. The rim's roll is flatter (36 degrees, was 60) so it shows less of a dark flank on each side.

12. The tray again, after a look at four times the size beside the approved key: the wall was 37 px wide, wider than the tray's corner is round (18 px), so the floor's corners were square and the wall met itself in a mitre. The rim is now 7 px and the wall leans 0.25 (5 px wide), so the floor's corner stays round and the wall is a thin band, dark on the light's side and bright across from it, as approved. The coins lie 14 px in from the tray's edge.
13. The meter: the unlit lenses are lighter (`clear.low` 0.44, was 0.3), the lit ones have a pale core, and the light the lit ones throw on the floor is stronger (0.8 a segment, was 0.5). The brief says dark inset lenses; the approved key `step2-crank` shows pale clear ones. The kit wins: lighter, not yet as clear as approved.

## After 08:30 UTC

- The dial key: the pointer leads past the cap (17 px left of its centre) and comes back to its lower right shoulder at 3.18 s, so the strut has the tip there at the key and settles on it. MEASURED with the probe: 16, 14 px from the cap's centre at 3.2 s, within 4 px of 15, 14 until 3.5 s; approved, measured at three times the size, has 15, 14 (my earlier 25, 21 was a bad reading).
- The dial: the base ring is its own darker steel (`seatDark` 0.6) so the stack reads as a wheel, a bezel and a dark base; the stop is darker (`stopDark` 0.3).
- R9-1 issue 7, the whip and the fling: in the whip the dial holds the arrow by its tip in the hole, its tail thrown outward and trailing the turn (`strike`, the angle following at 30 a second), drawn up to 1.3 long by the speed (`press`). Flung, it goes end over end twice in its 0.72 s in the air and lands upright, where the recoil takes over. No event moves. Looked at in 8 stills from 4.86 to 5.95 s.
- The rows: the Builder measured the rows of `step2-rest` against approved. MEASURED by me in both pictures (dark rows of type at x 120 to 520): approved has the first label at y 325 and the labels 148 and 149 px apart, the build had 307 and 143, 144. `ROW_Y` is now `HEADER.contentY + 12` and `PITCH` 149; the arrow rests 18 px lower (392). The edges of the open trays at the dial and crank keys are within 2 to 5 px of approved. The 6 px left at the top is the heading's place, the shell's. The footer is not moved: it is the shared place of Continue.
- The meter: segments 116 px tall, as approved (were 96). The lit ones have a warm pale core inside an orange rim and their lamp reaches 84 px (was 130), so the light stays near them on the tray's floor and on the sheet. The unlit ones are clearer (`clear` core 0.42, low 0.64, gain 0.3).

Decisions after 08:30:

14. The stills of the whip and the fling are counted as dial looks: they show what the machine does to the arrow, as the three stills of the crank's wind-up were counted as crank looks. The poses the arrow takes of itself stay acting, and those looks are used up.
15. The existing test of the rest place (`tests/step2-keeper.test.ts`, 1575, 374) now holds 1575, 392: the rows moved, so the place between them moved.
16. The footer keeps the shared place of Continue although approved has it 12 px lower (6 px after the header's own 6).

## Looks, counted by part

- rows: 11 (the rest key four times; the dial key four times and the crank key three times for the tray and the rows).
- dial: 20 (the dial key ten times, once at the review tier; the sheet twice; 8 stills of the whip and the fling).
- crank: 21 (the crank key sixteen times; three stills of the wind-up; the sheet twice).
- slot: 40 (one still of the coins lying at 13.0 s; the sheet six times; 8 stills at a wrong time that showed nothing; 22 stills of the lever, the reels and the coins; three stills of the tray shutting over the coins).
- acting: 40 (12 of the slot beat, 4 at a wrong time, 7 of the dial beat, 4 of the open beat, 8 of the crank beat, 5 of the peel). None left this round.
