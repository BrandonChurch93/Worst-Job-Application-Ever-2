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
