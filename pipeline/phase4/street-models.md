# Street models: second owner's notes

Branch `agent/street-models`, made from `origin/main` (3a83a25, then merged up). Folder `src/table/real/models/street/`. The first owner's notes are `street.md`: read here, not edited. Where this file says something else, this file holds.

## What the approved images show in my part that a quick look misses

1. The firehouse roof is not dark. It is a pale grey deck inside a lighter stone parapet, with small grey units on it and the red of the beacon pooled on the deck. The sign is a cream plate with a thin gilt line that stands on the front edge of the parapet.
2. The mouth of the firehouse is wide and low, with round upper corners, in a pale stone frame that takes nearly half of the front. Inside it is black, with red on its jambs and on the rim of its floor. Each course of brick catches light on its upper edge and the mortar is darker than the brick.
3. The garage is pale concrete, not a cage: stacked solid decks that are bright on top with dark gaps between them, piers with ribs outside, and the clear trough on top.
4. The bank has a flat grey roof inside a stone parapet, four stout fluted columns with warm light behind them, and steps. The houses have brown, slate and dull red roofs, plaster or brick walls and one lit window each: none is a saturated toy colour.
5. Mom's Basement is a small white house with a brown roof, and its sign is a plate on its front, not a board over its roof. The road signs are yellow plates with black chevrons, each with a bright wire rim round it.

## Baseline (MEASURED at ce822d7 before any change)

- `npm test`: 92 files, 1330 tests passed. `npm run build`: built. `npm run bots`: all clear.
- `npm run build && npm run counts -- --key table-wide --live low`: whole frame 216 draw calls, 473936 triangles. My rows (draw calls, triangles): model-firehouse 6 (5 colour, 1 shadow), 50106; model-road-signs 4, 2740; model-moms 3, 2982; model-police 2, 1108; model-bank 1, 4038; model-garage 1, 1120; model-houses none at low (its screws are fine detail). Folder: 17 calls, 62094 triangles. The budget is therefore 17 calls and 92094 triangles.
- `npm run build && npm run counts -- --key tier-street --live low`: the same rows; whole frame 117 calls, 272030 triangles.
- One draft still: `npm run still -- --key tier-street --format hd --tier draft` 31.9 s; `youre-fired` 40.7 s; `last-save` 29.4 s.

## Asked of the director (02:35 UTC), answered 02:37 UTC

- Firehouse and police station 2 balls tall instead of 1.5: yes, their 633c2d9a. Until it is on main the same two lines are on my branch as the commit `NEEDS: ...` (`street-models-NEEDS.patch`).
- A smaller spiral: no (the trough is `SPIRAL.r` + 0.625 balls and the pitch is the least clearance). `SPIRAL.frame` could come from 1.525 to 1.45 if asked: not asked, my wall needs its 0.095 ball.
- The houses beside the bank and under the garage: no, every place there is crossed by a ball. They stay in the two lower shoulders.

## Decisions

- The mouth of the firehouse is the bay of the layout to the pixel: u 4.4 to 5.7, 103 px high (a ball and 7 px), round upper corners of 16 px, 0.55 ball deep. The bay ends 4.2 px from the building's right corner, so the right jamb of the stone frame is the corner pier itself.
- The stone frame is part of the one painted mesh now and does not shake: stone does not shake. The door rattles in its tracks instead. The draw call that the frame had is the red light of the bay (`street.firehouse.bay`, group `street.red`, the same material as the beacon's reflector).
- The door is two panels that hang in the head of the mouth. `doorOf` keeps its numbers (0.86 at rest, 0.95 up); the travel is 112 px, so at rest 6.7 px of the door's foot show under the stone and on a held ball it is gone. A door lower than that would stand in the ball.
- Brick: the mortar is darker than the brick, each brick is lighter along its upper edge and darker at its foot, and the relief is deeper (`wja-studio-street-paint-11`).
- No plinth under the front: the bay's floor is level with the street.
