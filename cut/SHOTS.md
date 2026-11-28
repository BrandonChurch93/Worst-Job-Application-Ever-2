# Shots

Made by `npm run cut` from the film camera of each page (`page.camera('film', time)`), and `home` where a page has none. Do not edit by hand.

- Camera: `home` is the page straight on, filling the frame. A name from `cameras` is given when the film camera sits exactly on it, `film` when it is somewhere of its own.
- Move: holds, shakes (it moves a little and comes back), follows (the centre of the framing travels), pushes in (the framing gets narrower), eases out (it gets wider), cuts (the framing jumps between two frames of the same page).
- Framing: the part of the page the frame shows, in page pixels, as x and y of its top left corner and its width by its height, at the height the camera looks at. For a camera that is not straight on: the four corners of the frame on that floor, top left, top right, bottom right, bottom left.
- Lens, for the pinball shots: the vertical field of view, and the focal length that gives the same horizontal view on a 36 mm wide frame. Focus: the distance in page pixels from the camera to what is sharp, the camera's own when it states one, and else its distance to the point it looks at.

## marketing

Frames 0 to 839.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `marketing.stroll` | 0 to 119 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `marketing.perks` | 120 to 479 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `marketing.ticker` | 480 to 659 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `marketing.apply` | 660 to 839 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |

## step1

Frames 840 to 2759.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `step1.keyboard` | 840 to 959 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.firstName` | 960 to 1439 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.lastName` | 1440 to 1739 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.email` | 1740 to 2039 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.resume` | 2040 to 2159 | `home`, then `film` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 352, y 468, 620 by 348.8 |
| `step1.tug` | 2160 to 2534 | `film` | holds | x 352, y 468, 620 by 348.8 | x 352, y 468, 620 by 348.8 |
| `step1.shredded` | 2535 to 2759 | `film`, then `home` | follows, eases out | x 352, y 468, 620 by 348.8 | x 0, y 0, 1920 by 1080 |

## step2

Frames 2760 to 4019.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `step2.open` | 2760 to 2879 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.dial` | 2880 to 3239 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.slot` | 3240 to 3599 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.crank` | 3600 to 3959 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.continue` | 3960 to 4019 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |

## pinball

Frames 4020 to 6539.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end | Lens | Focus |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pinball.seal` | 4020 to 4259 | `home` | follows | x 0, y 0, 1920 by 1080 | x 0, y 193.8, 1920 by 1080 | 20 degrees, 57.4 mm | 3062 px, the point it looks at |
| `pinball.reveal` | 4260 to 4475 | `home`, then `film`, then `table-wide` | holds, follows, pushes in, cuts 4 times (on frame 4287, 4288, 4289, 4332) | x 0, y 213.2, 1920 by 1080 | floor corners (-11145.8, -16249.3) (13065.8, -16249.3) (1825.1, 5090.4) (94.9, 5090.4) | 20 degrees, 57.4 mm; then 45.09 degrees, 24.4 mm; then 46.39 degrees, 23.6 mm; then 47.59 degrees, 23 mm; then 35 degrees, 32.1 mm | 3062 px, the point it looks at; then 857 px, the point it looks at; then 763 px, the point it looks at; then 683 px, the point it looks at; then 2881 px, aperture 5 |
| `pinball.launch` | 4476 to 4679 | `table-wide`, then `film` | holds, follows, eases out, cuts 3 times (on frame 4539, 4651, 4652) | floor corners (-11145.8, -16249.3) (13065.8, -16249.3) (1825.1, 5090.4) (94.9, 5090.4) | floor corners (125.6, 801) (3272.8, 801) (1933.8, 3106.9) (1464.6, 3106.9) | 35 degrees, 32.1 mm; then 76 degrees, 13 mm; then 69.18 degrees, 14.7 mm; then 65.72 degrees, 15.7 mm; then 40 degrees, 27.8 mm | 2881 px, aperture 5; then 200 px, aperture 7; then 232 px, aperture 7; then 251 px, aperture 7; then 416 px, aperture 7 |
| `pinball.lobby` | 4680 to 4919 | `film`, then `tier-3`, then `film`, then `table-lobby`, then `film`, then `table-lobby`, then `tier-3`, then `home`, then `film` | holds, shakes, follows, cuts 5 times (on frame 4709, 4710, 4713, 4785, 4878) | floor corners (125.6, 751.1) (3272.8, 751.1) (1933.8, 3057) (1464.6, 3057) | x 0.2, y 2505.1, 1920 by 1080 | 40 degrees, 27.8 mm; then 20 degrees, 57.4 mm; then 56 degrees, 19 mm | 416 px, aperture 7; then 414 px, aperture 7; then 3062 px, the point it looks at; then 241 px, aperture 4 |
| `pinball.coffee` | 4920 to 5159 | `film` | holds, shakes, follows, cuts 2 times (on frame 5013, 5157) | x 2.1, y 2508.5, 1920 by 1080 | floor corners (763.2, 2814.6) (1696.7, 2814.6) (1635.2, 3342.9) (824.7, 3342.9) | 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 3062 px, the point it looks at; then 565 px, aperture 12; then 1463 px, aperture 14; then 1435 px, aperture 14 |
| `pinball.replyAll` | 5160 to 5579 | `film`, then `table-replyall`, then `film`, then `tier-2`, then `film`, then `tier-2`, then `home` | follows, pushes in, eases out, cuts once (on frame 5250) | floor corners (774.3, 2810.8) (1700.5, 2810.8) (1639.5, 3335) (835.3, 3335) | x 0, y 3714.7, 1920 by 1080 | 20 degrees, 57.4 mm; then 30 degrees, 37.8 mm | 1422 px, aperture 14; then 1968 px, aperture 12; then 3062 px, the point it looks at |
| `pinball.fired` | 5580 to 5789 | `home`, then `table-fired`, then `film` | holds, shakes, cuts once (on frame 5634) | x 0, y 3714.7, 1920 by 1080 | floor corners (-835.1, 4012.3) (87, 2767.6) (695.8, 3977.8) (499.9, 4242.3) | 20 degrees, 57.4 mm; then 35 degrees, 32.1 mm | 3062 px, the point it looks at; then 458 px, aperture 3; then 410 px, aperture 3 |
| `pinball.highway` | 5790 to 6059 | `film`, then `home`, then `rail`, then `film`, then `home` | holds, shakes, follows, eases out, cuts 2 times (on frame 5796, 5865) | floor corners (-841.5, 4013) (82.8, 2762.7) (695.5, 3978) (500, 4242.5) | x 0, y 3715.2, 1920 by 1080 | 35 degrees, 32.1 mm; then 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 402 px, aperture 3; then 3062 px, the point it looks at; then 376 px, aperture 5 |
| `pinball.save` | 6060 to 6239 | `home`, then `film`, then `table-save`, then `film` | holds, shakes, cuts 2 times (on frame 6099, 6141) | x 0, y 3715.2, 1920 by 1080 | floor corners (-1583.1, 1242.5) (3589.5, 1313.1) (1404.5, 4998.9) (500.4, 4986.5) | 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 3062 px, the point it looks at; then 794 px, aperture 12; then 1225 px, aperture 12; then 1228 px, aperture 12 |
| `pinball.drain` | 6240 to 6539 | `film`, then `table-save`, then `home` | holds, shakes, follows, cuts once (on frame 6252) | floor corners (-1583.3, 1242.4) (3589.5, 1312.9) (1404.5, 4998.9) (500.4, 4986.5) | x 0, y 4896, 1920 by 1080 | 40 degrees, 27.8 mm; then 20 degrees, 57.4 mm | 1233 px, aperture 12; then 3062 px, the point it looks at |

## boss

Frames 6540 to 10235.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `boss.verify` | 6540 to 6839 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.unfold` | 6840 to 8585 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.slabs` | 8586 to 9143 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.popups` | 9144 to 9257 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.lastStand` | 9258 to 9395 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.collapse` | 9396 to 9467 | `home`, then `view` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 299.9, y 269.9, 960.4 by 540.3 |
| `boss.finish` | 9468 to 10163 | `view` | holds | x 300, y 270, 960 by 540 | x 300, y 270, 960 by 540 |
| `boss.press` | 10164 to 10235 | `view` | holds | x 300, y 270, 960 by 540 | x 300, y 270, 960 by 540 |

## decision

Frames 10236 to 10955.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `decision.wait` | 10236 to 10355 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.letter` | 10356 to 10595 | `home` | holds, shakes | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.metrics` | 10596 to 10835 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.reset` | 10836 to 10955 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
