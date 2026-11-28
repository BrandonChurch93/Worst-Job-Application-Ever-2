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
| `pinball.seal` | 4020 to 4475 | `home`, then `film` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 1131.4, y 345.6, 691.2 by 388.8 | 20 degrees, 57.4 mm | 3062 px, the point it looks at; then 1102 px, the point it looks at |
| `pinball.reveal` | 4476 to 4691 | `film`, then `table-wide` | holds, follows, eases out, cuts once (on frame 4554) | x 1131.4, y 345.6, 691.2 by 388.8 | floor corners (-11145.8, -16249.3) (13065.8, -16249.3) (1825.1, 5090.4) (94.9, 5090.4) | 20 degrees, 57.4 mm; then 35 degrees, 32.1 mm | 1102 px, the point it looks at; then 2881 px, aperture 5 |
| `pinball.launch` | 4692 to 4859 | `table-wide`, then `film` | holds, follows, pushes in, eases out, cuts 4 times (on frame 4794, 4813, 4814, 4815) | floor corners (-11145.8, -16249.3) (13065.8, -16249.3) (1825.1, 5090.4) (94.9, 5090.4) | floor corners (125.6, -84.7) (3272.8, -84.7) (1933.8, 2221.1) (1464.6, 2221.1) | 35 degrees, 32.1 mm; then 76 degrees, 13 mm; then 69.97 degrees, 14.5 mm; then 66.63 degrees, 15.4 mm; then 62.89 degrees, 16.6 mm; then 40 degrees, 27.8 mm | 2881 px, aperture 5; then 200 px, aperture 7; then 228 px, aperture 7; then 246 px, aperture 7; then 267 px, aperture 7; then 416 px, aperture 7 |
| `pinball.lobby` | 4860 to 5069 | `film`, then `tier-3`, then `film`, then `table-lobby`, then `film`, then `table-lobby`, then `tier-3`, then `home` | holds, shakes, follows, cuts 5 times (on frame 4871, 4872, 4875, 4947, 5040) | floor corners (125.6, -134.6) (3272.8, -134.6) (1933.8, 2171.2) (1464.6, 2171.2) | x 0, y 2395.4, 1920 by 1080 | 40 degrees, 27.8 mm; then 20 degrees, 57.4 mm; then 56 degrees, 19 mm | 416 px, aperture 7; then 414 px, aperture 7; then 415 px, aperture 7; then 3062 px, the point it looks at; then 241 px, aperture 4 |
| `pinball.coffee` | 5070 to 5321 | `home`, then `film` | holds, shakes, follows, cuts once (on frame 5175) | x 0, y 2411.3, 1920 by 1080 | x 568.5, y 2938.7, 781.9 by 439.8 | 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 3062 px, the point it looks at; then 565 px, aperture 12; then 609 px, aperture 12 |
| `pinball.replyAll` | 5322 to 5579 | `film`, then `table-replyall`, then `film`, then `table-replyall`, then `tier-2`, then `film`, then `tier-2` | holds, shakes, eases out, cuts once (on frame 5412) | x 562.4, y 2940.6, 782 by 439.9 | x 0, y 2544, 1920 by 1080 | 40 degrees, 27.8 mm; then 30 degrees, 37.8 mm; then 20 degrees, 57.4 mm | 557 px, aperture 12; then 1838 px, aperture 12; then 3062 px, the point it looks at |
| `pinball.fired` | 5580 to 5789 | `tier-2`, then `home`, then `film`, then `table-fired`, then `film` | holds, shakes, follows, cuts once (on frame 5754) | x 0, y 2544, 1920 by 1080 | floor corners (-839, 4011.9) (85.2, 2764.2) (695.8, 3977.9) (499.9, 4242.2) | 20 degrees, 57.4 mm; then 35 degrees, 32.1 mm | 3062 px, the point it looks at; then 456 px, aperture 3; then 412 px, aperture 3 |
| `pinball.highway` | 5790 to 6059 | `film`, then `home`, then `rail`, then `film`, then `home` | holds, shakes, follows, eases out, cuts 2 times (on frame 5796, 5865) | floor corners (-836.9, 4013.4) (85.1, 2766.8) (695.6, 3977.9) (499.9, 4242.5) | x 0, y 3715.2, 1920 by 1080 | 35 degrees, 32.1 mm; then 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 404 px, aperture 3; then 3062 px, the point it looks at; then 376 px, aperture 5 |
| `pinball.save` | 6060 to 6239 | `home`, then `film`, then `table-save`, then `film` | holds, shakes, cuts 2 times (on frame 6099, 6141) | x 0, y 3715.2, 1920 by 1080 | floor corners (-1583.2, 1242.3) (3589.6, 1313) (1404.5, 4998.9) (500.4, 4986.5) | 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 3062 px, the point it looks at; then 796 px, aperture 12; then 1225 px, aperture 12; then 1228 px, aperture 12 |
| `pinball.drain` | 6240 to 6539 | `film`, then `table-save`, then `home` | holds, follows, cuts once (on frame 6252) | floor corners (-1583.2, 1242.6) (3589.4, 1313) (1404.5, 4998.9) (500.4, 4986.5) | x 0, y 4896, 1920 by 1080 | 40 degrees, 27.8 mm; then 20 degrees, 57.4 mm | 1233 px, aperture 12; then 3062 px, the point it looks at |

## boss

Frames 6540 to 8459.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `boss.verify` | 6540 to 6839 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.unfold` | 6840 to 7079 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.slabs` | 7080 to 7499 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.popups` | 7500 to 7859 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.lastStand` | 7860 to 8159 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.collapse` | 8160 to 8279 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.press` | 8280 to 8459 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |

## decision

Frames 8460 to 9179.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `decision.wait` | 8460 to 8579 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.letter` | 8580 to 8819 | `home` | holds, shakes | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.metrics` | 8820 to 9059 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.reset` | 9060 to 9179 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
