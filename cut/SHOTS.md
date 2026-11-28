# Shots

Made by `npm run cut` from the film camera of each page (`page.camera('film', time)`), and `home` where a page has none. Do not edit by hand.

- Camera: `home` is the page straight on, filling the frame. A name from `cameras` is given when the film camera sits exactly on it, `film` when it is somewhere of its own.
- Move: holds, shakes (it moves a little and comes back), follows (the centre of the framing travels), pushes in (the framing gets narrower), eases out (it gets wider), cuts (the framing jumps between two frames of the same page).
- Framing: the part of the page the frame shows, in page pixels, as x and y of its top left corner and its width by its height, at the height the camera looks at. For a camera that is not straight on: the four corners of the frame on that floor, top left, top right, bottom right, bottom left.
- Lens, for the pinball shots: the vertical field of view, and the focal length that gives the same horizontal view on a 36 mm wide frame. Focus: the distance in page pixels from the camera to what is sharp, the camera's own when it states one, and else its distance to the point it looks at.

## marketing

Frames 0 to 1139.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `marketing.stroll` | 0 to 179 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `marketing.perks` | 180 to 419 | `home` | follows | x 0, y 0, 1920 by 1080 | x 0, y 1243.4, 1920 by 1080 |
| `marketing.ticker` | 420 to 986 | `home` | follows | x 0, y 1252.8, 1920 by 1080 | x 0, y 4286, 1920 by 1080 |
| `marketing.apply` | 987 to 1139 | `home` | holds | x 0, y 4286, 1920 by 1080 | x 0, y 4286, 1920 by 1080 |

## step1

Frames 1140 to 3263.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `step1.keyboard` | 1140 to 1259 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.firstName` | 1260 to 1739 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.email` | 1740 to 2213 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.resume` | 2214 to 2423 | `home`, then `film` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 352, y 468, 620 by 348.8 |
| `step1.tug` | 2424 to 2798 | `film` | holds | x 352, y 468, 620 by 348.8 | x 352, y 468, 620 by 348.8 |
| `step1.shredded` | 2799 to 3263 | `film`, then `home` | follows, eases out | x 352, y 468, 620 by 348.8 | x 0, y 0, 1920 by 1080 |

## step2

Frames 3264 to 4757.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `step2.open` | 3264 to 3377 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.dial` | 3378 to 3731 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.slot` | 3732 to 4127 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.crank` | 4128 to 4631 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step2.continue` | 4632 to 4757 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |

## pinball

Frames 4758 to 7277.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end | Lens | Focus |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pinball.seal` | 4758 to 5213 | `home`, then `film` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 1131.4, y 345.6, 691.2 by 388.8 | 20 degrees, 57.4 mm | 3062 px, the point it looks at; then 1102 px, the point it looks at |
| `pinball.reveal` | 5214 to 5429 | `film`, then `table-wide` | holds, follows, eases out, cuts once (on frame 5292) | x 1131.4, y 345.6, 691.2 by 388.8 | floor corners (-11145.8, -16249.3) (13065.8, -16249.3) (1825.1, 5090.4) (94.9, 5090.4) | 20 degrees, 57.4 mm; then 35 degrees, 32.1 mm | 1102 px, the point it looks at; then 2881 px, aperture 5 |
| `pinball.launch` | 5430 to 5597 | `table-wide`, then `film` | holds, follows, pushes in, eases out, cuts 4 times (on frame 5532, 5551, 5552, 5553) | floor corners (-11145.8, -16249.3) (13065.8, -16249.3) (1825.1, 5090.4) (94.9, 5090.4) | floor corners (125.6, -84.7) (3272.8, -84.7) (1933.8, 2221.1) (1464.6, 2221.1) | 35 degrees, 32.1 mm; then 76 degrees, 13 mm; then 69.97 degrees, 14.5 mm; then 66.63 degrees, 15.4 mm; then 62.89 degrees, 16.6 mm; then 40 degrees, 27.8 mm | 2881 px, aperture 5; then 200 px, aperture 7; then 228 px, aperture 7; then 246 px, aperture 7; then 267 px, aperture 7; then 416 px, aperture 7 |
| `pinball.lobby` | 5598 to 5807 | `film`, then `tier-3`, then `film`, then `table-lobby`, then `film`, then `table-lobby`, then `tier-3`, then `home` | holds, shakes, follows, cuts 5 times (on frame 5609, 5610, 5613, 5685, 5778) | floor corners (125.6, -134.6) (3272.8, -134.6) (1933.8, 2171.2) (1464.6, 2171.2) | x 0, y 2395.4, 1920 by 1080 | 40 degrees, 27.8 mm; then 20 degrees, 57.4 mm; then 56 degrees, 19 mm | 416 px, aperture 7; then 414 px, aperture 7; then 415 px, aperture 7; then 3062 px, the point it looks at; then 241 px, aperture 4 |
| `pinball.coffee` | 5808 to 6059 | `home`, then `film` | holds, shakes, follows, cuts once (on frame 5913) | x 0, y 2411.3, 1920 by 1080 | x 568.5, y 2938.7, 781.9 by 439.8 | 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 3062 px, the point it looks at; then 565 px, aperture 12; then 609 px, aperture 12 |
| `pinball.replyAll` | 6060 to 6317 | `film`, then `table-replyall`, then `film`, then `table-replyall`, then `tier-2`, then `film`, then `tier-2` | holds, shakes, eases out, cuts once (on frame 6150) | x 562.4, y 2940.6, 782 by 439.9 | x 0, y 2544, 1920 by 1080 | 40 degrees, 27.8 mm; then 30 degrees, 37.8 mm; then 20 degrees, 57.4 mm | 557 px, aperture 12; then 1838 px, aperture 12; then 3062 px, the point it looks at |
| `pinball.fired` | 6318 to 6527 | `tier-2`, then `home`, then `film`, then `table-fired`, then `film` | holds, shakes, follows, cuts once (on frame 6492) | x 0, y 2544, 1920 by 1080 | floor corners (-839, 4011.9) (85.2, 2764.2) (695.8, 3977.9) (499.9, 4242.2) | 20 degrees, 57.4 mm; then 35 degrees, 32.1 mm | 3062 px, the point it looks at; then 456 px, aperture 3; then 412 px, aperture 3 |
| `pinball.highway` | 6528 to 6797 | `film`, then `home`, then `rail`, then `film`, then `home` | holds, shakes, follows, eases out, cuts 2 times (on frame 6534, 6603) | floor corners (-836.9, 4013.4) (85.1, 2766.8) (695.6, 3977.9) (499.9, 4242.5) | x 0, y 3715.2, 1920 by 1080 | 35 degrees, 32.1 mm; then 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 404 px, aperture 3; then 3062 px, the point it looks at; then 376 px, aperture 5 |
| `pinball.save` | 6798 to 6977 | `home`, then `film`, then `table-save`, then `film` | holds, shakes, cuts 2 times (on frame 6837, 6879) | x 0, y 3715.2, 1920 by 1080 | floor corners (-1583.2, 1242.3) (3589.6, 1313) (1404.5, 4998.9) (500.4, 4986.5) | 20 degrees, 57.4 mm; then 40 degrees, 27.8 mm | 3062 px, the point it looks at; then 796 px, aperture 12; then 1225 px, aperture 12; then 1228 px, aperture 12 |
| `pinball.drain` | 6978 to 7277 | `film`, then `table-save`, then `home` | holds, follows, cuts once (on frame 6990) | floor corners (-1583.2, 1242.6) (3589.4, 1313) (1404.5, 4998.9) (500.4, 4986.5) | x 0, y 4896, 1920 by 1080 | 40 degrees, 27.8 mm; then 20 degrees, 57.4 mm | 1233 px, aperture 12; then 3062 px, the point it looks at |

## boss

Frames 7278 to 10511.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `boss.verify` | 7278 to 7577 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.unfold` | 7578 to 8783 | `home`, then `view` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 92.5, y 207.5, 1200 by 675 |
| `boss.slabs` | 8784 to 9341 | `view`, then `home` | follows, eases out | x 92.5, y 207.5, 1200 by 675 | x 0, y 0, 1920 by 1080 |
| `boss.popups` | 9342 to 9455 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.lastStand` | 9456 to 9593 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `boss.collapse` | 9594 to 9665 | `home`, then `view` | follows, pushes in | x 0, y 0, 1920 by 1080 | x 299, y 269.1, 963.1 by 541.8 |
| `boss.finish` | 9666 to 10439 | `view` | holds, follows, pushes in, eases out, cuts 2 times (on frame 9885, 9886) | x 299.8, y 269.8, 960.8 by 540.4 | x 300, y 270, 960 by 540 |
| `boss.press` | 10440 to 10511 | `view`, then `home` | follows, eases out | x 300, y 270, 960 by 540 | x 0, y 0, 1920 by 1080 |

## decision

Frames 10512 to 11405.

| Beat | Frames | Camera | Move | Framing at the start | Framing at the end |
| --- | --- | --- | --- | --- | --- |
| `decision.wait` | 10512 to 10631 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.letter` | 10632 to 10871 | `home` | holds, shakes | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.metrics` | 10872 to 11213 | `home`, then `view`, then `home` | follows | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.reset` | 11214 to 11405 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
