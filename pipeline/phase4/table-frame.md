# Table frame, hardware and play: second owner's notes

Branch `agent/table-frame`, made from `origin/phase4-base` (f634ffb). Folders: `src/table/real/frame/`, `src/table/real/hardware/`, `src/table/real/play/`.

## What a quick look misses

1. The tier camera looks straight down from about 3060 px over the floor, so a flat top mirrors only what stands within 17 degrees of straight up. A flat rail top can only ever show the ceiling: steel reads as steel there only on its chamfers, rounds and wires.
2. The rails stand at page level, 96, 192 and 288 px over the floors of the three tiers. At the tier camera the outer land of both rails lies outside the picture (the top of a rail is drawn 3 to 10 percent wider than the floor), so what the picture shows of a rail is its inner face.
3. A metal with part of its light sent back as paint (metalness under 1) is what made the steel read as grey paint: the lamps lit it like a pale wall. Every steel, aluminium, zinc and brass of the three folders is now full metal.
4. `envMapIntensity` does nothing on these materials (the lights hook sets the surround), and the broad shine of the lamps on a metal is a pale sheet, not a glint. Both are handled in `frame/steel.ts`.
5. The apron is not in the lit zones, so its ceramic follows the website's light down to dusk. It is lifted in its own material by the share of that light that is off.

6. three.js r187 keeps a metal's own colour in `material.specularColorBlended`; `material.specularColor` is only the share a paint sends back (about a tenth). The first version of `steel.ts` used the second, so every metal mirrored the room at a tenth of its strength and without its tint, and the levels had been raised to make up for it. Found at 01:17 UTC by writing the terms out as colours. Now a metal mirrors with its own colour and a paint with its share.
7. The lamps of the table and the room are not equally bright: the room's values in `steel.ts` are shares of `SHOW` (0.14).
8. The wide dark field left and right of the machine in `table-wide` is the page, not a rail. The rail's land is the narrow bright strip with the screws.

## Decisions

- `frame/steel.ts` is the one finish for metal in a lit zone, used by the three folders (`steel(studio(material), zone)` then `lit`). It replaces what the metal mirrors with a dark room: a dark ceiling with one soft panel, a row of far lamps, a bright line at the horizon, the tier's floor colour below, and rows of near lamps 72 px apart that show as points on any polished round or bank. It is scaled by the zone's `wjlEnv`, so it follows the general level. It keeps 35 percent of the lamps' own broad shine and none of the surround by default (`keep`, `direct` in `SteelLook`).
- Agreed with `/root/table_lighter` (00:40 UTC): they add no darkening of steel for these folders, `wjlEnv` keeps its meaning, the apron stays outside the lit zones in their first version and I lift its ceramic myself from `levels(ctx, zone('street')).website`.
- The flipper takes its size from `FLIP.radius`, `FLIP.tip` and `FLIP.length` of the layout. Until the layout on main carries `FLIP.tip` (the director's change of 00:50 UTC), the bat uses the director's stated sizes (0.4 and 0.26 balls) so the look can be judged. The fallback goes when the layout arrives.
- The bat: a low orange foot, a dark rubber band proud of the body all round (the line the ball meets), a moulded orange top set in from the rubber, a chrome screw at the pivot and at the tip, on a nylon bush over the floor. The approved images show a dark band, the brief's text says pale: the image wins.
- The left rail is cut as a narrow land at the page's edge, a polished low round that falls to the lane, and a ledge at the lane. The columns of the layout are not changed.
- The brass line let into the apron's slabs is gone: two calm pale fields.
- `tests/table-play.test.ts`: the limit for triangles not marked fine is 85000 (was 70000): the six bats are thick moulded bodies now.

- Brushed aluminium is bright only where the approved images show it bright: the land of both rails and the marquee's housing (`TONE.aluBright`, `TONE.alu`). The walls, heads and banks of a tier are a dark metal (`METAL` in `frame/tier.ts`), so the inside of the machine stays dark steel.
- The marquee's foot, braces and ribbed beam are brushed aluminium again (02:00 UTC). I had made them dark paint at 01:10 and the Builder's review named the backbox as near black against the approved silver bezel: my error.
- The loader's cup is a dish that falls in a quarter round from the lip to the floor, in the cup's dark tone, 34 px across the fall. It cannot go below the page, so its depth is drawn by the fall and the tone.
- The tube's bend at the loader and the marquee's size are the layout's (`railOf('feed')`, the shape `marquee.back`): they go to the director.

## Decisions after the Builder's review of 01:42 UTC

- The apron's zone lies at the street floor's height (the Builder's ruling, the director's 7125cd0). `frame/apron.ts` builds for whatever height the zone has: `H = max(7, -zone.floor)`. Side rails carry the tier's rails on, a slim near rail (44 px) closes them, a cast deck lies between them with the two plates, the plaque and a square drain slot in an aluminium bezel. The page's fields `apron-left`, `apron-right` and `apron-card` are laid on the deck whether the page gives their height from its own surface or from the floor.
- Where the apron lies at the street's height the street's end wall is a low wall (56 px), open at the mouth. Where it stands at the page's height the wall stays the well's end with its tunnel. The switch is `zone('apron').floor`, so it follows the layout.
- The page's slab opens only where the draw list has a `well`: the apron needed one. Asked of the director (in as 3edf15f on their branch); my patch `table-frame-NEEDS.patch` is the same line and is not applied on my branch.
- The apron's metal mirrors the street's room: `steel(material, zone, look, from)` takes the lit zone whose room an unlit zone stands in (`roomOf` in `frame/mats.ts`). Its ceramic is lifted from the street's website level and takes no shadow of the page's light in the well.
- Every land of the frame is pale: left rail, right rail and the bed under the feed tube, head rail, corner block, cross rails, lift housings. The inner faces stay dark (`METAL`).
- The tubes' ferrules are 9 px chrome rings every 5.1 balls with 5 px straps (were 22 px grooved collars every 3.4 balls). The collars at a tier's joints and at the tube's ends keep their size.
- The wire ramps: wire 4.2 px in radius (was 2.6), hoops 3.4 (was 2.2), with the under wires moved out so the ball still rests on them. The play metal mirrors a brighter panel, so chrome reads bright.
- Orange is the site's shared number `0xc74c00` on bats, plunger knob, lift doors and elbows (the Builder's word of 02:10). The bats had `0xff9838` from 01:15 to 02:12 to match the amber of the approved bats.

## Measurements

Calls / triangles from `npm run build && npm run counts -- --key <key> --live low`. Before is origin/main 6060c7a.

| key | part | before | 876cb74 | 9994ce2 |
|---|---|---|---|---|
| table-wide | table-frame | 18 / 12802 | 18 / 13024 | 17 / 11948 |
| table-wide | table-hardware | 28 / 36340 | 28 / 36340 | 28 / 35380 |
| table-wide | loader | 15 / 29406 | 15 / 31154 | 14 / 19482 |
| table-wide | lift | 13 / 19336 | 13 / 19336 | 13 / 15640 |
| table-wide | flippers | 12 / 22944 | 12 / 30672 | 12 / 30672 |
| table-wide | ramps | 5 / 20584 | 5 / 20584 | 5 / 20584 |
| table-wide | marquee | 4 / 2120 | 4 / 1730 | 4 / 2168 |
| tier-street | table-frame | 15 / 10822 | 15 / 10966 | |
| tier-street | flippers | 6 / 11472 | 6 / 15336 | |

Draft stills in hd (`npm run still -- --key <key> --format hd --tier draft`): table-wide 41 to 45 s, 646 calls at a842706 and 638 at c65c00d with the apron's well; tier-street 31 to 33 s, 527 calls at a842706, 535 with the well and main's merge 14.
