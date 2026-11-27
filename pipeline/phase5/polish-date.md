# Polish date: a row of step 2 is never shown open and empty

Branch `agent/polish-date`, from `b3e4f902`. Owner of `src/pages/step2/**` for this round. Times are UTC, read with `date -u`.

## The fault

The story critic, pack frame 1:02.93: the Date of birth panel is open on an empty sage floor, the slot is not there.

## Measured before any change (b3e4f902)

The stage runs 240 steps a second (`config.sim.stepHz`); a picture of 60 a second is 4 steps.

MEASURED, stepped stage, no browser, no pack: `POLISH_DATE_TABLE=/tmp/date-before.txt npx vitest run tests/polish-date-measure.test.ts`. Steps counted from the row's first opening step:

| row | tray past a tenth | tray at full height | first machine part drawn | machine whole | row takes the hand | open by more than a tenth and no machine |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Phone, dial | +6 | +53 | +0 | +97 | +99 | 0 steps |
| 2 Date of birth, slot | +6 | +53 | +45 | +97 | +99 | 39 steps opening (0.163 s), 29 shutting (0.121 s) |
| 3 Volume, crank | +6 | +53 | +45 | +97 | +99 | 39 steps opening, 29 shutting |

- The same for the order 1, 2, 3 (3302 steps on the page), the order 3, 2, 1 (3301), the rows that open themselves after `live.skipLinkAfterSeconds` (35869) and the film's stage (48000).
- No code path of `src/pages/step2` reads the level (`rg -n "quality|level" src/pages/step2`: none), so `medium` and `low` run the same steps.
- MEASURED in pictures, `node pipeline/phase5/polish-date-live.mjs walk before-2 2 high` (the built site, level `high`, 1920 by 1080, every picture of 60): the pictures 0.050 to 0.167 s after the press show the tray open with nothing in it; the hint line is printed at 0.150 s, the slot stands at 0.183 s.
- MEASURED, the pack's own visitor, stepped (`POLISH_DATE_PACK=/tmp/pack-before.txt npx vitest run tests/polish-date-pack-measure.test.ts`): row 2 starts to open at 62.82 s and is open and empty on 10 pictures, 62.83 to 62.98 s. The critic's 1:02.93 is one of them (tray 197 px, lift 0). The machine is whole at 63.20 s.
- MEASURED, the film, frames in a row (`node pipeline/phase5/polish-date-film.mjs film-before 2 3250 30` and `... 3 3598 30`, draft tier, hd): the film has the same fault. Row 2: frames 3254 to 3262 open and empty, the slot faint at 3263, standing at 3264. Row 3: frames 3602 to 3610 open and empty, the crank faint at 3611, standing at 3612.

## The cause (STATED from the code)

`src/pages/step2/index.ts`: `openRow` sets `lift = 0`; `step()` lets the lift grow only while `phase === 'opening' && spring[i] >= 0.9` (`s.lift += dt / 0.25`); `machine()` and `overMachine()` scaled every part by `smooth(lift)`; the makers do not draw a part under 0.02 of its height (`rise()` in `src/real/slot-kit.ts`). So the slot and the crank had no height until their tray was nine tenths open. The dial never had the fault: `dialTop` does not go under `DIAL_BODY.rest`, so it lies in the floor and the tray uncovers it. No asset is waited for, no level of detail, no click.

## The change

`src/pages/step2/index.ts` only:

- `HOUSED = 0.022`: the slot and the crank lie in the floor of their trays at this share of their height while the tray opens over them and while it shuts, as the dial does, and rise from there on the same steps as before (`risen()`, used by `machine()` and `overMachine()`). At lift 1 the value is exactly 1.
- The lift, the spring, the phases and the cursor's ground are not touched, so no step of the opening moves.
- `SUNK` is gone: the reels carry their legends while housed.

Why 0.022 and not more. The first try was 0.07. The picture showed the reels through the pocket of the field below: the floor of a field is at -6 (`scale.heights.field`), the floor of a tray at -8, and the field below passes over the machine's place as the tray opens. The slot's knob is 78 above the tray's floor, so it stays under the field's floor up to 0.0256; the makers draw from 0.02. 0.022 puts the knob's top at -6.28 and the cabinet at 1.28 px (the dial rests at 1.6 px).

## Decisions

1. Staging: housed in the floor and uncovered by the tray, as the dial is. No new prop, no new colour.
2. The housing holds while the tray shuts too (Builder: yes, 07:50).
3. The film gets the same housing (Builder's decision, 07:50). Bounds: no beat time, no event and no cursor path moves.
4. The dial is left as it is (Builder: yes).
5. The cursor's ground (`ground()`) still reads `smooth(lift)`: changing it would move the cursor's height in the film. During the rise the ground is at most 0.022 of a part's height under the drawn top (1.7 px at the knob).
6. The hint line of a tray is printed when the tray is nine tenths open (`panel` in `states()`), as on the dial's row. Not changed.
