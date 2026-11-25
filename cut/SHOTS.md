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
| `step1.resume` | 2040 to 2159 | `home`, then `film` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 29.5, y 98.5, 1578.7 by 888 |
| `step1.tug` | 2160 to 2534 | `film` | follows, pushes in | x 31.7, y 105.6, 1553.9 by 874.1 | x 56.1, y 187.2, 1271.2 by 715.1 |
| `step1.shredded` | 2535 to 2759 | `film`, then `home` | follows, eases out | x 53.4, y 178, 1303 by 732.9 | x 0, y 0, 1920 by 1080 |

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
| `pinball.seal` | 4020 to 4259 | `home` | follows | x 0, y 0, 1920 by 1080 | x 0, y 445.2, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.reveal` | 4260 to 4499 | `home`, then `film`, then `table-wide` | follows, eases out | x 0, y 457, 1920 by 1080 | floor corners (-2327.2, 255.6) (4247.2, 255.6) (2077, 4852.1) (-157, 4852.1) | 12 degrees, 96.3 mm; then 35 degrees, 32.1 mm | 5138 px, the point it looks at; then 2975 px, the point it looks at |
| `pinball.launch` | 4500 to 4679 | `table-wide`, then `film`, then `home` | follows, pushes in | floor corners (-2327.2, 255.6) (4247.2, 255.6) (2077, 4852.1) (-157, 4852.1) | x 0, y 1466.8, 1920 by 1080 | 35 degrees, 32.1 mm; then 12 degrees, 96.3 mm | 2975 px, the point it looks at; then 5138 px, the point it looks at |
| `pinball.lobby` | 4680 to 4919 | `home`, then `tier-3`, then `film`, then `table-lobby`, then `film`, then `tier-3` | holds, shakes | x 0, y 1466.5, 1920 by 1080 | x 0, y 1464, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.coffee` | 4920 to 5159 | `tier-3`, then `home`, then `tier-2` | follows | x 0, y 1464, 1920 by 1080 | x 0, y 2544, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.replyAll` | 5160 to 5579 | `tier-2`, then `film`, then `table-replyall`, then `film`, then `tier-2`, then `home` | follows | x 0, y 2544, 1920 by 1080 | x 0, y 3617.1, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.fired` | 5580 to 5789 | `home`, then `tier-1`, then `film`, then `table-fired`, then `film`, then `tier-1` | holds, shakes, follows, pushes in, eases out, cuts 10 times (on frame 5678, 5679, 5680, 5681, 5682, 5755, 5756, 5757, 5758, 5759) | x 0, y 3617.8, 1920 by 1080 | x 0, y 3624, 1920 by 1080 | 12 degrees, 96.3 mm; then 30.66 degrees, 36.9 mm; then 31.41 degrees, 36 mm; then 32.1 degrees, 35.2 mm; then 32.73 degrees, 34.5 mm; then 33.3 degrees, 33.9 mm; then 29.87 degrees, 38 mm | 5138 px, the point it looks at; then 1280 px, the point it looks at; then 1141 px, the point it looks at; then 1017 px, the point it looks at; then 909 px, the point it looks at; then 819 px, the point it looks at; then 1433 px, the point it looks at |
| `pinball.highway` | 5790 to 6059 | `tier-1`, then `film`, then `rail`, then `film`, then `tier-1` | holds, follows, pushes in, eases out, cuts 16 times (on frame 5906, 5907, 5908, 5909, 5910, 5911, 5912, 5913, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011) | x 0, y 3624, 1920 by 1080 | x 0, y 3624, 1920 by 1080 | 12 degrees, 96.3 mm; then 34.72 degrees, 32.4 mm; then 35.62 degrees, 31.5 mm; then 36.47 degrees, 30.7 mm; then 37.24 degrees, 30.1 mm; then 37.93 degrees, 29.5 mm; then 38.53 degrees, 29 mm; then 39.04 degrees, 28.6 mm; then 39.45 degrees, 28.2 mm; then 35.63 degrees, 31.5 mm; then 33.75 degrees, 33.4 mm | 5138 px, the point it looks at; then 1315 px, the point it looks at; then 1168 px, the point it looks at; then 1032 px, the point it looks at; then 911 px, the point it looks at; then 804 px, the point it looks at; then 713 px, the point it looks at; then 639 px, the point it looks at; then 583 px, the point it looks at; then 1474 px, the point it looks at |
| `pinball.save` | 6060 to 6239 | `tier-1`, then `film`, then `table-save`, then `film` | eases out | x 0, y 3624, 1920 by 1080 | floor corners (-230, 3527.3) (2150, 3527.3) (2129.9, 4856.4) (-209.9, 4856.4) | 12 degrees, 96.3 mm; then 18.83 degrees, 61.1 mm | 5138 px, the point it looks at; then 4002 px, the point it looks at |
| `pinball.drain` | 6240 to 6539 | `film`, then `tier-1`, then `home` | follows, pushes in | floor corners (-212.9, 3532.9) (2132.9, 3532.9) (2116.9, 4844.6) (-196.9, 4844.6) | x 0, y 4896, 1920 by 1080 | 17.96 degrees, 64.1 mm; then 12 degrees, 96.3 mm | 4146 px, the point it looks at; then 5138 px, the point it looks at |

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
