# Table frame, hardware and play: second owner's notes

Branch `agent/table-frame`, made from `origin/phase4-base` (f634ffb). Folders: `src/table/real/frame/`, `src/table/real/hardware/`, `src/table/real/play/`.

## What a quick look misses

1. The tier camera looks straight down from about 3060 px over the floor, so a flat top mirrors only what stands within 17 degrees of straight up. A flat rail top can only ever show the ceiling: steel reads as steel there only on its chamfers, rounds and wires.
2. The rails stand at page level, 96, 192 and 288 px over the floors of the three tiers. At the tier camera the outer land of both rails lies outside the picture (the top of a rail is drawn 3 to 10 percent wider than the floor), so what the picture shows of a rail is its inner face.
3. A metal with part of its light sent back as paint (metalness under 1) is what made the steel read as grey paint: the lamps lit it like a pale wall. Every steel, aluminium, zinc and brass of the three folders is now full metal.
4. `envMapIntensity` does nothing on these materials (the lights hook sets the surround), and the broad shine of the lamps on a metal is a pale sheet, not a glint. Both are handled in `frame/steel.ts`.
5. The apron is not in the lit zones, so its ceramic follows the website's light down to dusk. It is lifted in its own material by the share of that light that is off.

## Decisions

- `frame/steel.ts` is the one finish for metal in a lit zone, used by the three folders (`steel(studio(material), zone)` then `lit`). It replaces what the metal mirrors with a dark room: a dark ceiling with one soft panel, a row of far lamps, a bright line at the horizon, the tier's floor colour below, and rows of near lamps 72 px apart that show as points on any polished round or bank. It is scaled by the zone's `wjlEnv`, so it follows the general level. It keeps 35 percent of the lamps' own broad shine and none of the surround by default (`keep`, `direct` in `SteelLook`).
- Agreed with `/root/table_lighter` (00:40 UTC): they add no darkening of steel for these folders, `wjlEnv` keeps its meaning, the apron stays outside the lit zones in their first version and I lift its ceramic myself from `levels(ctx, zone('street')).website`.
- The flipper takes its size from `FLIP.radius`, `FLIP.tip` and `FLIP.length` of the layout. Until the layout on main carries `FLIP.tip` (the director's change of 00:50 UTC), the bat uses the director's stated sizes (0.4 and 0.26 balls) so the look can be judged. The fallback goes when the layout arrives.
- The bat: a low orange foot, a dark rubber band proud of the body all round (the line the ball meets), a moulded orange top set in from the rubber, a chrome screw at the pivot and at the tip, on a nylon bush over the floor. The approved images show a dark band, the brief's text says pale: the image wins.
- The left rail is cut as a narrow land at the page's edge, a polished low round that falls to the lane, and a ledge at the lane. The columns of the layout are not changed.
- The brass line let into the apron's slabs is gone: two calm pale fields.
- `tests/table-play.test.ts`: the limit for triangles not marked fine is 85000 (was 70000): the six bats are thick moulded bodies now.

## Measurements

See the report sent to the Builder; rows are copied here after each push.
