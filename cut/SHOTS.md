# Shots

Made by `npm run cut` from the film camera of each page (`page.camera('film', time)`), and `home` where a page has none. Do not edit by hand.

- Camera: `home` is the page straight on, filling the frame. A name from `cameras` is given when the film camera sits exactly on it, `film` when it is somewhere of its own.
- Move: holds, follows (the centre of the framing travels), pushes in (the framing gets narrower), eases out (it gets wider), cuts (the framing jumps between two frames of the same page).
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
| `step1.resume` | 2040 to 2159 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.tug` | 2160 to 2579 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `step1.shredded` | 2580 to 2759 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |

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
| `pinball.seal` | 4020 to 4259 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.reveal` | 4260 to 4499 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.launch` | 4500 to 4679 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.lobby` | 4680 to 4919 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.coffee` | 4920 to 5159 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.replyAll` | 5160 to 5579 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.fired` | 5580 to 5789 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.highway` | 5790 to 6059 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.save` | 6060 to 6239 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |
| `pinball.drain` | 6240 to 6539 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 | 12 degrees, 96.3 mm | 5138 px, the point it looks at |

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
| `decision.letter` | 8580 to 8819 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.metrics` | 8820 to 9059 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
| `decision.reset` | 9060 to 9179 | `home` | holds | x 0, y 0, 1920 by 1080 | x 0, y 0, 1920 by 1080 |
