# Corporate models, second owner

Branch `agent/corporate-models`, from `origin/main` 49569eb. Started 02:35 UTC. The first owner's notes are in `corporate.md`.

## What a quick look at the approved images misses

1. The tower is glass with rooms behind it, not a painted box: in `lobby-doors` every bay shows rows of ceiling lamps deep inside, seen from below at an angle, so the floors and ceilings must be there and the glass must be see through and dark blue green.
2. The band is wider than the glass under it and its lower lip is chamfered and bright: it throws a dark strip on the lobby glass, and its letters stand on a brushed face whose streaks run the long way.
3. The lobby glass mirrors the two globe lamps: there is a second, dimmer pair of globes behind the panes.
4. From above the tower is a roof with a glass middle over a lit hall, and the front leans in by only a few pixels: what says "office tower" there is what is seen down through the roof.
5. The revolving door has no frame at all: four thick clear slabs with bright edges, held at the post by small brass clamps; the brass is in the post and its collars only.

## Baseline (MEASURED 02:39 UTC, `npm run build && npm run counts -- --key <key> --live low`)

| key | calls of my folder | triangles of my folder | whole frame calls | whole frame triangles |
| --- | --- | --- | --- | --- |
| table-wide | 21 | 57169 | 216 | 473936 |
| tier-corporate | 22 | 58165 | 118 | 265074 |
| lobby-doors | 19 | (not summed) | 139 | 333801 |

Per part at table-wide (meshes, colour, shadow, calls, triangles): hq 3/3/2/5/20884; boardroom 2/2/2/4/11584; beach 3/3/0/3/6921; revolving 2/2/1/3/4824; ladder 1/1/1/2/8184; wedges 1/1/1/2/3884; notes 1/1/1/2/888.

## Decisions

- HQ rebuilt as one straight shaft of glass over a lobby, with an open hall up the middle and a glazed lantern in the roof, instead of three stepped blocks with plant on top. The rooms are real: floors, ceilings with lamps, desks, lifts, columns. The glass is real and see through.
- A fourth shared material, `pane`: glass whose tint is the vertex colour and whose density is the second texture coordinate. The tower, the lobby, the lantern and the door leaves use it. The test of the folder allows it.
- The canopy and the vestibule are gone: the band is the canopy.
- The door leaves cast no shadow now, and their glass is a second instanced mesh marked `fine`, so the low tier draws the brass leaves without glass. This keeps the calls of HQ at five.
- The mirrored globes are two dim spheres behind the lobby glass at the mirrored places of the layout posts `corporate.globe.left` and `corporate.globe.right`.
- The seven rods and the cross strip of the carpet are removed; the two gold lines along the long edges stay.
- The front face stays upright: the place of the roof sign is the layout's.
- The solid material of the folder passes through the frame owner's `steel()` so polished faces show the room of the tier.
- Revolving door: no frame and no floor ring. Four slabs 8 thick with rounded corners on the `pane` material, bright ground edges, two brass clamps with screws per slab; a turned brass post of radius 12.5 with collars at three heights and a cap, on a stepped disc of radius 33. Its place is the layout's.
- Wedges: marble slab with grey veins, a steel cup, a nickel screw and a steel collar at each corner. The cup is 7.6 in radius because the test of the folder lets a wedge reach 8 past its posts.
- Beach: the parasol is gone. A sealed case on `pane` with bright edges and two soft streaks on the lid, sand, a palm of 17 fronds, a deck chair of wood slats, the crown's and the chair's shadows painted in the sand, the plate on the front edge.
- Boardroom: folders and glasses are gone, only the speaker phone stays on the table. Walnut top with grain streaks, twelve dark leather chairs, dark carpet. Its box in the layout is small and stands at the left edge, so the table is short where the approved image shows a long one: see "What I need".
- Notes: three leaves resting at 1.05 rad so the paper shows from above, a curled lower corner, pale yellow paper.
- Ladder: rebuilt after the first complete version, see below.
- The tower's front has lit sills outside the glass, so the strip that leans into the view from above shows rows of lit panes.
- The lantern carries three soft streaks, so the roof reads as glass from above.
- The carpet's pile is rows of faces that lean left and right in turn: the floor's lacquer shine is for faces that look straight up, and cloth must not have it.
- A finish that is no metal now says how much of the room it gives back (the fourth channel of the finishes picture, read as the specular intensity map). Before this, the room laid over the solid material by `steel()` washed every dark matte thing to grey: the red carpet was pink, the black chairs grey, the walnut dull. This was the largest single gain of the tier and was found late (03:33 UTC). An earlier line in my reports that blamed the lights' haze was wrong: the haze only touches materials with a clear coat.
- Brass is deeper (0xc79a45, dark 0x8f6a2a, gold 0xd6b160) and the solid material asks `steel()` for a brighter horizon and lamps (2.2 each).
- Lobby glass is dark blue green at a density of 0.32, the tower's at 0.66, and the mirrored globes are brighter (0.8) to show through it.

## After (MEASURED 03:31 UTC at fa4f84bb, `npm run build && npm run counts -- --key <key> --live low`)

| key | calls of my folder | triangles of my folder | whole frame calls | whole frame triangles |
| --- | --- | --- | --- | --- |
| table-wide | 20 | 47029 | 208 | 457816 |
| tier-corporate | 22 | 52117 | 118 | 261682 |
| lobby-doors | 19 | 43254 | 139 | 328471 |

Per part at tier-corporate (calls/triangles): hq 5/11882; boardroom 4/11500; beach 4/9859; revolving 3/4000; ladder 2/8184; wedges 2/4844; notes 2/1848.

## Looks used

About 19 renders of `lobby-doors` and `tier-corporate` each by 03:40 UTC, shared by the seven parts; no part has had 40.

## Decisions after the first complete version (03:49 to 04:20 UTC)

- Ladder: a flat brushed steel stringer 8.5 wide stands outside each under wire wherever the floor is free of other parts, with a bevelled upper edge; the rungs are thicker (radius 2.3); the flap at the foot is a tapered plate with seven pressed ribs and two side cheeks. The wire gauge agreed with the ramps owner is unchanged (radius 2.6, under 0.36 ball, side 0.56 ball).
- The solid material asks the frame's `steel()` for its new `sky` (0.6), so polished wire and pins show the lit air over the table.
- Boardroom, ruled by the Builder at 03:56 UTC and by `/root/table_runner` at 04:10 UTC: the box stays [3.25, 2.5, 1.2, 1.9] and h stays 0.9, because a long table across would stand in the ball's way onto the field. The table lies along the longer way of the box, the number of chairs is what fits along it at a pitch of 24 (two to eight a side), and the table stops short of the notes that lean into the room. All of it is read from the layout: if the box grows or turns, the table and the chairs follow.
- Notes rest at 1.12 rad, nearly flat, so three squares show from above. The corner is the dimmest lit place of the tier (MEASURED in the draft still: a face of albedo 1.55 comes out at sRGB (99, 86, 57) there, the carpet of albedo 0.14 before the doors near (190, 20, 30)), so the paper's colour is (3.0, 2.7, 1.25) and the walnut is (1.15, 0.36, 0.11). `/root/lamp_keeper` was asked at 04:10 UTC for light on that corner; if it comes, both go back under 1.
- Brass: the door leaves are a deeper brass (0.58 of the tone) with bright worn lines along the edges of each stile and rail; the portal is brushed, deeper (0.5 and 0.32 of its tone), with upright streaks on the jambs and two bright lines on the head; the turned post's four upright streaks are stronger.
- Lobby inside: the floor is half as bright, the back wall goes from dim at the floor to lit under the ceiling in three bands, the columns are dimmer.
- Glass: each door pane carries two slanting streaks and each slab of the revolving door one, so they read as glass; the slabs are 6 thick (were 8) with paler rims.
- Wedges: whiter marble (0.68, 0.86, 1.4 before the tier's warm lamps), slightly lighter veins.
- `/root/ball_keeper` and I agreed at 03:47 UTC: it never reads this folder; I send it one message with colours and measures when the HQ doors change.
- `npm run still -- --key tier-corporate --tier draft --format hd --diag standins` at 04:15 UTC: `standIns: []`.

## Decisions from 04:20 to 05:00 UTC

- Tower from above: the floors seen down the open middle are dark blue carpet (0.028, 0.05, 0.075) that gets dimmer floor by floor going down (0.3 at the lowest, 1 at the top), so the lit desks and the lit edges of the galleries stand out instead of a pale ring.
- Tower from the doors: the front glass is clearer (density 0.36, the sides stay 0.66, the back 0.8), the ceilings behind it are a dark blue green, and the ceiling lamps of the tower are warm and a little dimmer (0.8). MEASURED by looking at the draft still of `lobby-doors`: with the dense front the whole tower read as pale grey glass; now it reads as dark glass with rows of warm lamps, nearer the approved image. From above nothing changes (the ceilings face down).
- Door panes: the two slanting streaks are fainter (colour 0.5, 0.6, 0.62 at alpha 0.028), they read as a pane and no longer as paint.
- Boardroom light: `/root/lamp_keeper` put a hidden lamp over the `corporate.boardroom` box (in main since merge 22, 04:50 UTC). With it the walnut is back under 1 (0.62, 0.2, 0.06) and reads as warm wood: MEASURED (110, 68, 45) in the review still.
- Note paper stays over 1, at (2.4, 2.0, 0.62). MEASURED in draft stills: with the lamp, matte paper of albedo (0.98, 0.9, 0.46) comes out at sRGB (86, 77, 53), an olive grey; a finish with more shine gives (81, 73, 53); without shadows on the leaves nothing changes; a plain mesh in place of the instanced one gives the same. So the lamp reaches the table by its shine and a matte face near the floor gets little of it. `/root/lamp_keeper` was told at 04:39 UTC and asked for a factor; when it comes, the paper is divided by it. This is the one colour of the folder that is over 1.
- Push: from 04:31 to about 04:40 UTC `git push` failed on this machine (no credential after the sessions were resumed). The Builder ruled a hand over by bundle; one bundle (311b7a60 and its merge 956ba75a) was sent at 04:34 UTC and pushed by the Builder. The push works again since 04:40 UTC.

## Final counts (MEASURED 04:57 UTC at 8a8ceddc, `npm run build && npm run counts -- --key <key> --live low`)

| key | calls of my folder | triangles of my folder | whole frame calls | whole frame triangles |
| --- | --- | --- | --- | --- |
| table-wide | 19 (baseline 21) | 43833 (baseline 57169) | 192 | 435330 |
| tier-corporate | 21 (baseline 22) | 49773 (baseline 58165) | 111 | 256387 |
| lobby-doors | 18 (baseline 19) | 40910 (baseline 51244) | 124 | 304951 |

Per part at tier-corporate (calls/triangles): hq 5/12030; beach 4/9859; boardroom 4/8220; revolving 3/4008; ladder 2/9888; wedges 2/4844; notes 1/924.

Assets: none. The three asset folders of Corporate do not exist; every part is built in code. 0 MB.

## Looks used by the end

About 57 renders across the three keys since 02:39 UTC, shared by the seven parts; no part has had 40.

## The three least real things at the end

1. The brass at the doors under the lobby camera: the portal and the leaves read as flat yellow gold, where the approved image has dark mirrored brass with hard highlights. The streaks and worn edge lines are there but blur away.
2. The notes: the paper needs a colour over 1 to read as paper in that corner, and from straight above three squares on steel leaves are all that shows.
3. The revolving door from straight above: the four slabs show edge on, as thin pale bars, where the approved image, seen at a slant, shows broad clear wings.

## Stills at the end (MEASURED 04:58 to 05:04 UTC, `npm run compare -- --key <key> --tier review --format hd`)

- `tier-corporate` review 77.894 s, draft 41.212 s. `lobby-doors` review 75.287 s. `table-wide` review 63.595 s.
- Each was looked at whole and in native size crops. The ceilings of the tower were made darker once more after the first review still of `lobby-doors` (0.004, 0.008, 0.01 of the lamp colour); the second review still shows no change I can see, so the blue green of the tower front is the glass itself and the value stays.
