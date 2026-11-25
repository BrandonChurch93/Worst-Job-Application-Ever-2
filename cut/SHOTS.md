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
| `step1.resume` | 2040 to 2159 | `home`, then `film` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 42.7, y 74.2, 1605 by 902.8 |
| `step1.tug` | 2160 to 2534 | `film` | follows, pushes in | x 45.8, y 79.6, 1582.1 by 889.9 | x 81.1, y 141, 1321.1 by 743.1 |
| `step1.shredded` | 2535 to 2759 | `film`, then `home` | follows, eases out | x 77.1, y 134.1, 1350.5 by 759.6 | x 0, y 0, 1920 by 1080 |

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
| `pinball.reveal` | 4260 to 4499 | `home`, then `film`, then `table-wide` | follows, eases out | x 0, y 457, 1920 by 1080 | floor corners (-2947.8, -557.7) (4867.8, -557.7) (1977.4, 5295.9) (-57.4, 5295.9) | 12 degrees, 96.3 mm; then 35 degrees, 32.1 mm | 5138 px, the point it looks at; then 2880 px, the point it looks at |
| `pinball.launch` | 4500 to 4679 | `table-wide`, then `film`, then `home`, then `film` | holds, follows, pushes in, eases out, cuts 20 times (on frame 4530, 4555, 4556, 4557, 4558, 4559, 4560, 4561, 4562, 4563, 4564, 4565, 4587, 4588, 4589, 4590, 4645, 4646, 4647, 4673) | floor corners (-2947.8, -557.7) (4867.8, -557.7) (1977.4, 5295.9) (-57.4, 5295.9) | floor corners (2096.1, 4050.9) (-1051.1, 4050.9) (287.9, 1745) (757.1, 1745) | 35 degrees, 32.1 mm; then 12 degrees, 96.3 mm; then 61.73 degrees, 16.9 mm; then 63.93 degrees, 16.2 mm; then 66 degrees, 15.6 mm; then 67.92 degrees, 15 mm; then 69.68 degrees, 14.5 mm; then 71.26 degrees, 14.1 mm; then 72.64 degrees, 13.8 mm; then 73.81 degrees, 13.5 mm; then 74.74 degrees, 13.3 mm; then 75.43 degrees, 13.1 mm; then 75.85 degrees, 13 mm; then 72.11 degrees, 13.9 mm; then 69.18 degrees, 14.7 mm; then 65.72 degrees, 15.7 mm; then 61.92 degrees, 16.9 mm; then 40 degrees, 27.8 mm | 2880 px, the point it looks at; then 5138 px, the point it looks at; then 1308 px, the point it looks at; then 1140 px, the point it looks at; then 982 px, the point it looks at; then 836 px, the point it looks at; then 704 px, the point it looks at; then 586 px, the point it looks at; then 485 px, the point it looks at; then 401 px, the point it looks at; then 337 px, the point it looks at; then 291 px, the point it looks at; then 265 px, the point it looks at; then 292 px, the point it looks at; then 320 px, the point it looks at; then 354 px, the point it looks at; then 393 px, the point it looks at; then 631 px, the point it looks at |
| `pinball.lobby` | 4680 to 4919 | `film`, then `tier-3`, then `film`, then `table-lobby`, then `film`, then `tier-3` | holds, shakes, follows, pushes in, eases out, cuts 19 times (on frame 4687, 4688, 4689, 4690, 4691, 4823, 4824, 4825, 4826, 4827, 4828, 4829, 4886, 4887, 4888, 4889, 4890, 4891, 4892) | floor corners (2100.5, 4067.3) (-1046.8, 4067.3) (292.2, 1761.4) (761.5, 1761.4) | x 0, y 1464, 1920 by 1080 | 40 degrees, 27.8 mm; then 37.24 degrees, 30.1 mm; then 36.47 degrees, 30.7 mm; then 35.62 degrees, 31.5 mm; then 34.72 degrees, 32.4 mm; then 33.75 degrees, 33.4 mm; then 28.17 degrees, 40.4 mm; then 29.04 degrees, 39.1 mm; then 29.87 degrees, 38 mm; then 30.66 degrees, 36.9 mm; then 31.41 degrees, 36 mm; then 32.1 degrees, 35.2 mm; then 32.73 degrees, 34.5 mm; then 27.27 degrees, 41.7 mm; then 12 degrees, 96.3 mm | 631 px, the point it looks at; then 914 px, the point it looks at; then 1020 px, the point it looks at; then 1142 px, the point it looks at; then 1280 px, the point it looks at; then 1432 px, the point it looks at; then 1561 px, the point it looks at; then 1384 px, the point it looks at; then 1219 px, the point it looks at; then 1070 px, the point it looks at; then 940 px, the point it looks at; then 832 px, the point it looks at; then 749 px, the point it looks at; then 1749 px, the point it looks at; then 5138 px, the point it looks at |
| `pinball.coffee` | 4920 to 5159 | `tier-3`, then `home`, then `tier-2` | follows | x 0, y 1464, 1920 by 1080 | x 0, y 2544, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.replyAll` | 5160 to 5579 | `tier-2`, then `film`, then `table-replyall`, then `film`, then `tier-2`, then `home` | follows | x 0, y 2544, 1920 by 1080 | x 0, y 3707.2, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.fired` | 5580 to 5789 | `home`, then `film`, then `table-fired`, then `film`, then `home` | holds, shakes, follows, pushes in, eases out, cuts 10 times (on frame 5678, 5679, 5680, 5681, 5682, 5755, 5756, 5757, 5758, 5759) | x 0, y 3708.1, 1920 by 1080 | x 0, y 3715.2, 1920 by 1080 | 12 degrees, 96.3 mm; then 30.66 degrees, 36.9 mm; then 31.41 degrees, 36 mm; then 32.1 degrees, 35.2 mm; then 32.73 degrees, 34.5 mm; then 33.3 degrees, 33.9 mm; then 29.87 degrees, 38 mm | 5138 px, the point it looks at; then 1280 px, the point it looks at; then 1141 px, the point it looks at; then 1017 px, the point it looks at; then 909 px, the point it looks at; then 819 px, the point it looks at; then 1433 px, the point it looks at |
| `pinball.highway` | 5790 to 6059 | `home`, then `film`, then `rail`, then `film`, then `home` | holds, follows, pushes in, eases out, cuts 16 times (on frame 5906, 5907, 5908, 5909, 5910, 5911, 5912, 5913, 5956, 5957, 5958, 5959, 5960, 5961, 5962, 5963) | x 0, y 3715.2, 1920 by 1080 | x 0, y 3715.2, 1920 by 1080 | 12 degrees, 96.3 mm; then 34.72 degrees, 32.4 mm; then 35.62 degrees, 31.5 mm; then 36.47 degrees, 30.7 mm; then 37.24 degrees, 30.1 mm; then 37.93 degrees, 29.5 mm; then 38.53 degrees, 29 mm; then 39.04 degrees, 28.6 mm; then 39.45 degrees, 28.2 mm; then 35.63 degrees, 31.5 mm; then 33.75 degrees, 33.4 mm | 5138 px, the point it looks at; then 1315 px, the point it looks at; then 1168 px, the point it looks at; then 1032 px, the point it looks at; then 911 px, the point it looks at; then 804 px, the point it looks at; then 713 px, the point it looks at; then 639 px, the point it looks at; then 583 px, the point it looks at; then 1474 px, the point it looks at |
| `pinball.save` | 6060 to 6239 | `home`, then `film`, then `table-save`, then `film` | eases out | x 0, y 3715.2, 1920 by 1080 | floor corners (-651.6, 3385.9) (2571.6, 3385.9) (2545.6, 5185.4) (-625.6, 5185.4) | 12 degrees, 96.3 mm; then 26.85 degrees, 42.4 mm | 5138 px, the point it looks at; then 3767 px, the point it looks at |
| `pinball.drain` | 6240 to 6539 | `film`, then `home` | follows, pushes in | floor corners (-600.6, 3410) (2520.6, 3410) (2501.1, 5155.4) (-581.1, 5155.4) | x 0, y 4896, 1920 by 1080 | 24.96 degrees, 45.7 mm; then 12 degrees, 96.3 mm | 3941 px, the point it looks at; then 5138 px, the point it looks at |

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
