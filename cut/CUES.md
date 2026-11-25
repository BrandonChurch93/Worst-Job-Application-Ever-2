# Cues

Made by `npm run cut`. Do not edit by hand.

Film B: 9180 frames at 60 a second, 153 s. Times are in seconds from the first frame of the film. A frame is counted from 0.

## Beats

| Beat | Start s | First frame | Last frame | Event | Event s | Event frame | Inside |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `marketing.stroll` | 0.000 | 0 | 119 | `step` | 1.000 | 60 | yes |
| `marketing.perks` | 2.000 | 120 | 479 | `card-flip` | 2.308 | 138 | yes |
| `marketing.ticker` | 8.000 | 480 | 659 | none |  |  |  |
| `marketing.apply` | 11.000 | 660 | 839 | `page-turn` | 13.500 | 810 | yes |
| `step1.keyboard` | 14.000 | 840 | 959 | `keyboard-rise` | 14.800 | 888 | yes |
| `step1.firstName` | 16.000 | 960 | 1439 | `bolt-hit-cursor` | 19.200 | 1152 | yes |
| `step1.lastName` | 24.000 | 1440 | 1739 | `keys-shuffle` | 26.000 | 1560 | yes |
| `step1.email` | 29.000 | 1740 | 2039 | `slab-drop` | 31.000 | 1860 | yes |
| `step1.resume` | 34.000 | 2040 | 2159 | `paper-slide` | 34.800 | 2088 | yes |
| `step1.tug` | 36.000 | 2160 | 2579 | `arms-out` | 38.800 | 2328 | yes |
| `step1.shredded` | 43.000 | 2580 | 2759 | `strips-zip` | 44.200 | 2652 | yes |
| `step2.open` | 46.000 | 2760 | 2879 | none |  |  |  |
| `step2.dial` | 48.000 | 2880 | 3239 | `dial-fling` | 52.163 | 3129 | yes |
| `step2.slot` | 54.000 | 3240 | 3599 | `coins` | 57.521 | 3451 | yes |
| `step2.crank` | 60.000 | 3600 | 3959 | `flatten` | 62.763 | 3765 | yes |
| `step2.continue` | 66.000 | 3960 | 4019 | `button-press` | 66.300 | 3978 | yes |
| `pinball.seal` | 67.000 | 4020 | 4259 | `ball-seal` | 68.600 | 4116 | yes |
| `pinball.reveal` | 71.000 | 4260 | 4499 | `power-on` | 72.600 | 4356 | yes |
| `pinball.launch` | 75.000 | 4500 | 4679 | `plunger` | 76.200 | 4572 | yes |
| `pinball.lobby` | 78.000 | 4680 | 4919 | `doors-slam` | 79.600 | 4776 | yes |
| `pinball.coffee` | 82.000 | 4920 | 5159 | `bumper` | 83.600 | 5016 | yes |
| `pinball.replyAll` | 86.000 | 5160 | 5579 | `ball-drop` | 88.800 | 5328 | yes |
| `pinball.fired` | 93.000 | 5580 | 5789 | `scoop-kick` | 94.400 | 5664 | yes |
| `pinball.highway` | 96.500 | 5790 | 6059 | `ramp-roll` | 98.300 | 5898 | yes |
| `pinball.save` | 101.000 | 6060 | 6239 | `flipper-save` | 102.200 | 6132 | yes |
| `pinball.drain` | 104.000 | 6240 | 6539 | `drain` | 106.000 | 6360 | yes |
| `boss.verify` | 109.000 | 6540 | 6839 | `checkbox` | 112.800 | 6768 | yes |
| `boss.unfold` | 114.000 | 6840 | 7079 | `unfold` | 115.708 | 6942 | yes |
| `boss.slabs` | 118.000 | 7080 | 7499 | `slab-fire` | 118.862 | 7131 | yes |
| `boss.popups` | 125.000 | 7500 | 7859 | `popup` | 125.204 | 7512 | yes |
| `boss.lastStand` | 131.000 | 7860 | 8159 | `session-expired` | 131.071 | 7864 | yes |
| `boss.collapse` | 136.000 | 8160 | 8279 | `power-down` | 136.229 | 8173 | yes |
| `boss.press` | 138.000 | 8280 | 8459 | `button-press` | 139.500 | 8370 | yes |
| `decision.wait` | 141.000 | 8460 | 8579 | `hold-music` | 141.400 | 8484 | yes |
| `decision.letter` | 143.000 | 8580 | 8819 | `stamp` | 145.300 | 8718 | yes |
| `decision.metrics` | 147.000 | 8820 | 9059 | `button-press` | 150.300 | 9018 | yes |
| `decision.reset` | 151.000 | 9060 | 9179 | `page-turn` | 150.754 | 9045 | yes |

## Events with a cue

333 of the film's 333 events have a cue in the table of events to cues. A cue starts on the frame of its event.

| Time s | Frame | Beat | Event | Cue | Hits the cursor |
| --- | --- | --- | --- | --- | --- |
| 1.000 | 60 | `marketing.stroll` | `step` | `step` | no |
| 1.358 | 81 | `marketing.stroll` | `step` | `step` | no |
| 2.308 | 138 | `marketing.perks` | `card-flip` | `card-flip` | no |
| 2.446 | 146 | `marketing.perks` | `step` | `step` | no |
| 4.046 | 242 | `marketing.perks` | `step` | `step` | no |
| 4.063 | 243 | `marketing.perks` | `card-flip` | `card-flip` | no |
| 4.158 | 249 | `marketing.perks` | `step` | `step` | no |
| 4.267 | 256 | `marketing.perks` | `step` | `step` | no |
| 4.388 | 263 | `marketing.perks` | `step` | `step` | no |
| 5.746 | 344 | `marketing.perks` | `step` | `step` | no |
| 5.763 | 345 | `marketing.perks` | `card-flip` | `card-flip` | no |
| 5.858 | 351 | `marketing.perks` | `step` | `step` | no |
| 5.967 | 358 | `marketing.perks` | `step` | `step` | no |
| 6.088 | 365 | `marketing.perks` | `step` | `step` | no |
| 7.721 | 463 | `marketing.perks` | `step` | `step` | no |
| 8.533 | 512 | `marketing.ticker` | `step` | `step` | no |
| 9.896 | 593 | `marketing.ticker` | `step` | `step` | no |
| 10.050 | 603 | `marketing.ticker` | `step` | `step` | no |
| 10.192 | 611 | `marketing.ticker` | `step` | `step` | no |
| 10.333 | 620 | `marketing.ticker` | `step` | `step` | no |
| 10.504 | 630 | `marketing.ticker` | `step` | `step` | no |
| 12.058 | 723 | `marketing.apply` | `step` | `step` | no |
| 13.058 | 783 | `marketing.apply` | `button-press` | `button-press` | no |
| 13.500 | 810 | `marketing.apply` | `page-turn` | `page-turn` | no |
| 14.546 | 872 | `step1.keyboard` | `step` | `step` | no |
| 14.579 | 874 | `step1.keyboard` | `step` | `step` | no |
| 14.637 | 878 | `step1.keyboard` | `step` | `step` | no |
| 14.800 | 888 | `step1.keyboard` | `keyboard-rise` | `keyboard-rise` | no |
| 19.200 | 1152 | `step1.firstName` | `bolt-hit-cursor` | `bolt-hit` | no |
| 26.000 | 1560 | `step1.lastName` | `keys-shuffle` | `keys-shuffle` | no |
| 31.000 | 1860 | `step1.email` | `slab-drop` | `slab-drop` | no |
| 34.800 | 2088 | `step1.resume` | `paper-slide` | `paper-slide` | no |
| 38.800 | 2328 | `step1.tug` | `arms-out` | `paper-strain` | no |
| 44.200 | 2652 | `step1.shredded` | `strips-zip` | `strips-zip` | no |
| 45.000 | 2700 | `step1.shredded` | `button-press` | `button-press` | no |
| 45.500 | 2730 | `step1.shredded` | `page-turn` | `page-turn` | no |
| 46.533 | 2792 | `step2.open` | `step` | `step` | no |
| 46.558 | 2793 | `step2.open` | `step` | `step` | no |
| 46.579 | 2794 | `step2.open` | `step` | `step` | no |
| 46.608 | 2796 | `step2.open` | `step` | `step` | no |
| 46.654 | 2799 | `step2.open` | `step` | `step` | no |
| 48.054 | 2883 | `step2.dial` | `step` | `step` | no |
| 48.300 | 2898 | `step2.dial` | `row-open` | `row-open` | no |
| 48.846 | 2930 | `step2.dial` | `step` | `step` | no |
| 48.942 | 2936 | `step2.dial` | `step` | `step` | no |
| 49.042 | 2942 | `step2.dial` | `step` | `step` | no |
| 49.250 | 2955 | `step2.dial` | `dial-wind` | `dial-wind` | no |
| 49.525 | 2971 | `step2.dial` | `step` | `step` | no |
| 49.700 | 2982 | `step2.dial` | `dial-return` | `dial-return` | no |
| 50.029 | 3001 | `step2.dial` | `step` | `step` | no |
| 50.100 | 3006 | `step2.dial` | `dial-wind` | `dial-wind` | no |
| 50.375 | 3022 | `step2.dial` | `step` | `step` | no |
| 50.550 | 3033 | `step2.dial` | `dial-return` | `dial-return` | no |
| 50.879 | 3052 | `step2.dial` | `step` | `step` | no |
| 50.950 | 3057 | `step2.dial` | `dial-wind` | `dial-wind` | no |
| 51.225 | 3073 | `step2.dial` | `step` | `step` | no |
| 51.400 | 3084 | `step2.dial` | `dial-return` | `dial-return` | no |
| 52.163 | 3129 | `step2.dial` | `dial-fling` | `dial-return` | yes |
| 53.712 | 3222 | `step2.dial` | `step` | `step` | no |
| 53.754 | 3225 | `step2.dial` | `step` | `step` | no |
| 53.783 | 3227 | `step2.dial` | `step` | `step` | no |
| 53.813 | 3228 | `step2.dial` | `step` | `step` | no |
| 53.837 | 3230 | `step2.dial` | `step` | `step` | no |
| 53.858 | 3231 | `step2.dial` | `step` | `step` | no |
| 53.883 | 3233 | `step2.dial` | `step` | `step` | no |
| 53.904 | 3234 | `step2.dial` | `step` | `step` | no |
| 53.925 | 3235 | `step2.dial` | `step` | `step` | no |
| 53.946 | 3236 | `step2.dial` | `step` | `step` | no |
| 53.967 | 3238 | `step2.dial` | `step` | `step` | no |
| 53.987 | 3239 | `step2.dial` | `step` | `step` | no |
| 54.008 | 3240 | `step2.slot` | `step` | `step` | no |
| 54.033 | 3242 | `step2.slot` | `step` | `step` | no |
| 54.054 | 3243 | `step2.slot` | `step` | `step` | no |
| 54.079 | 3244 | `step2.slot` | `step` | `step` | no |
| 54.108 | 3246 | `step2.slot` | `step` | `step` | no |
| 54.146 | 3248 | `step2.slot` | `step` | `step` | no |
| 54.196 | 3251 | `step2.slot` | `step` | `step` | no |
| 54.200 | 3252 | `step2.slot` | `row-open` | `row-open` | no |
| 54.875 | 3292 | `step2.slot` | `step` | `step` | no |
| 55.367 | 3322 | `step2.slot` | `lever-pull` | `lever-pull` | no |
| 55.367 | 3322 | `step2.slot` | `reels-spin` | `reels-spin` | no |
| 55.396 | 3323 | `step2.slot` | `step` | `step` | no |
| 57.521 | 3451 | `step2.slot` | `coins` | `coins` | yes |
| 57.775 | 3466 | `step2.slot` | `step` | `step` | no |
| 57.846 | 3470 | `step2.slot` | `step` | `step` | no |
| 57.908 | 3474 | `step2.slot` | `step` | `step` | no |
| 58.000 | 3480 | `step2.slot` | `step` | `step` | no |
| 58.204 | 3492 | `step2.slot` | `step` | `step` | no |
| 58.271 | 3496 | `step2.slot` | `step` | `step` | no |
| 58.333 | 3500 | `step2.slot` | `step` | `step` | no |
| 58.392 | 3503 | `step2.slot` | `step` | `step` | no |
| 58.454 | 3507 | `step2.slot` | `step` | `step` | no |
| 58.529 | 3511 | `step2.slot` | `step` | `step` | no |
| 59.633 | 3578 | `step2.slot` | `step` | `step` | no |
| 59.692 | 3581 | `step2.slot` | `step` | `step` | no |
| 59.742 | 3584 | `step2.slot` | `step` | `step` | no |
| 59.792 | 3587 | `step2.slot` | `step` | `step` | no |
| 59.837 | 3590 | `step2.slot` | `step` | `step` | no |
| 59.892 | 3593 | `step2.slot` | `step` | `step` | no |
| 59.950 | 3597 | `step2.slot` | `step` | `step` | no |
| 60.083 | 3605 | `step2.crank` | `row-open` | `row-open` | no |
| 60.438 | 3626 | `step2.crank` | `step` | `step` | no |
| 60.508 | 3630 | `step2.crank` | `step` | `step` | no |
| 60.583 | 3635 | `step2.crank` | `step` | `step` | no |
| 60.883 | 3653 | `step2.crank` | `step` | `step` | no |
| 60.958 | 3657 | `step2.crank` | `step` | `step` | no |
| 61.033 | 3662 | `step2.crank` | `step` | `step` | no |
| 61.108 | 3666 | `step2.crank` | `step` | `step` | no |
| 61.158 | 3669 | `step2.crank` | `crank-turn` | `crank-turn` | no |
| 61.188 | 3671 | `step2.crank` | `step` | `step` | no |
| 61.267 | 3676 | `step2.crank` | `step` | `step` | no |
| 61.346 | 3680 | `step2.crank` | `step` | `step` | no |
| 61.429 | 3685 | `step2.crank` | `step` | `step` | no |
| 61.517 | 3691 | `step2.crank` | `step` | `step` | no |
| 61.604 | 3696 | `step2.crank` | `step` | `step` | no |
| 61.650 | 3699 | `step2.crank` | `crank-turn` | `crank-turn` | no |
| 61.700 | 3702 | `step2.crank` | `step` | `step` | no |
| 61.796 | 3707 | `step2.crank` | `step` | `step` | no |
| 61.900 | 3714 | `step2.crank` | `step` | `step` | no |
| 62.013 | 3720 | `step2.crank` | `step` | `step` | no |
| 62.129 | 3727 | `step2.crank` | `step` | `step` | no |
| 62.258 | 3735 | `step2.crank` | `step` | `step` | no |
| 62.321 | 3739 | `step2.crank` | `crank-turn` | `crank-turn` | no |
| 62.321 | 3739 | `step2.crank` | `crank-runaway` | `crank-runaway` | no |
| 62.433 | 3746 | `step2.crank` | `step` | `step` | no |
| 62.763 | 3765 | `step2.crank` | `flatten` | `flatten` | yes |
| 65.763 | 3945 | `step2.crank` | `peel-up` | `peel-up` | yes |
| 66.300 | 3978 | `step2.continue` | `button-press` | `button-press` | no |
| 66.500 | 3990 | `step2.continue` | `page-turn` | `page-turn` | no |
| 67.546 | 4052 | `pinball.seal` | `step` | `step` | no |
| 67.579 | 4054 | `pinball.seal` | `step` | `step` | no |
| 67.638 | 4058 | `pinball.seal` | `step` | `step` | no |
| 68.600 | 4116 | `pinball.seal` | `ball-seal` | `ball-seal` | no |
| 72.600 | 4356 | `pinball.reveal` | `power-on` | `power-on` | no |
| 76.200 | 4572 | `pinball.launch` | `plunger` | `plunger` | no |
| 79.600 | 4776 | `pinball.lobby` | `doors-slam` | `doors-slam` | no |
| 83.600 | 5016 | `pinball.coffee` | `bumper` | `bumper` | no |
| 88.800 | 5328 | `pinball.replyAll` | `ball-drop` | `ball-drop` | no |
| 94.400 | 5664 | `pinball.fired` | `scoop-kick` | `scoop-kick` | no |
| 98.300 | 5898 | `pinball.highway` | `ramp-roll` | `ramp-roll` | no |
| 102.200 | 6132 | `pinball.save` | `flipper-save` | `flipper` | no |
| 106.000 | 6360 | `pinball.drain` | `drain` | `drain` | no |
| 108.000 | 6480 | `pinball.drain` | `button-press` | `button-press` | no |
| 108.500 | 6510 | `pinball.drain` | `page-turn` | `page-turn` | no |
| 109.950 | 6597 | `boss.verify` | `step` | `step` | no |
| 110.088 | 6605 | `boss.verify` | `step` | `step` | no |
| 110.217 | 6613 | `boss.verify` | `step` | `step` | no |
| 110.367 | 6622 | `boss.verify` | `step` | `step` | no |
| 110.921 | 6655 | `boss.verify` | `step` | `step` | no |
| 111.071 | 6664 | `boss.verify` | `step` | `step` | no |
| 111.196 | 6671 | `boss.verify` | `step` | `step` | no |
| 112.017 | 6721 | `boss.verify` | `step` | `step` | no |
| 112.683 | 6761 | `boss.verify` | `step` | `step` | no |
| 112.800 | 6768 | `boss.verify` | `checkbox` | `checkbox` | no |
| 112.800 | 6768 | `boss.verify` | `step` | `step` | no |
| 113.525 | 6811 | `boss.verify` | `step` | `step` | no |
| 114.692 | 6881 | `boss.unfold` | `step` | `step` | no |
| 114.817 | 6889 | `boss.unfold` | `step` | `step` | no |
| 115.108 | 6906 | `boss.unfold` | `button-crack` | `button-crack` | no |
| 115.708 | 6942 | `boss.unfold` | `unfold` | `unfold` | no |
| 118.862 | 7131 | `boss.slabs` | `slab-fire` | `slab-fire` | no |
| 118.900 | 7134 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 119.321 | 7159 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 119.600 | 7176 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 119.654 | 7179 | `boss.slabs` | `step` | `step` | no |
| 120.025 | 7201 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 120.283 | 7217 | `boss.slabs` | `slab-drop` | `slab-drop` | no |
| 120.300 | 7218 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 120.421 | 7225 | `boss.slabs` | `slab-fire` | `slab-fire` | no |
| 120.733 | 7244 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 121.000 | 7260 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 121.179 | 7270 | `boss.slabs` | `step` | `step` | no |
| 121.425 | 7285 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 121.700 | 7302 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 121.862 | 7311 | `boss.slabs` | `slab-drop` | `slab-drop` | no |
| 121.979 | 7318 | `boss.slabs` | `slab-fire` | `slab-fire` | no |
| 122.117 | 7327 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 122.400 | 7344 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 122.817 | 7369 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 123.058 | 7383 | `boss.slabs` | `slab-drop` | `slab-drop` | yes |
| 123.100 | 7386 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 123.521 | 7411 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 123.537 | 7412 | `boss.slabs` | `slab-fire` | `slab-fire` | no |
| 123.800 | 7428 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 124.213 | 7452 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 124.217 | 7453 | `boss.slabs` | `step` | `step` | no |
| 124.500 | 7470 | `boss.slabs` | `dart-fire` | `dart-fire` | no |
| 124.896 | 7493 | `boss.slabs` | `slab-drop` | `slab-drop` | no |
| 124.904 | 7494 | `boss.slabs` | `dart-hit` | `dart-hit` | no |
| 125.096 | 7505 | `boss.popups` | `slab-fire` | `slab-fire` | no |
| 125.204 | 7512 | `boss.popups` | `popup` | `popup` | no |
| 125.396 | 7523 | `boss.popups` | `step` | `step` | no |
| 125.675 | 7540 | `boss.popups` | `step` | `step` | no |
| 125.900 | 7554 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 125.908 | 7554 | `boss.popups` | `popup` | `popup` | no |
| 126.183 | 7571 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 126.321 | 7579 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 126.463 | 7587 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 126.500 | 7590 | `boss.popups` | `slab-drop` | `slab-drop` | no |
| 126.600 | 7596 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 126.612 | 7596 | `boss.popups` | `popup` | `popup` | no |
| 126.733 | 7604 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 126.742 | 7604 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 126.892 | 7613 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 127.021 | 7621 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 127.154 | 7629 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 127.300 | 7638 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 127.583 | 7655 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 127.679 | 7660 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 127.850 | 7671 | `boss.popups` | `slab-fire` | `slab-fire` | no |
| 127.862 | 7671 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 127.963 | 7677 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 128.142 | 7688 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 128.242 | 7694 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 128.421 | 7705 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 128.521 | 7711 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 128.604 | 7716 | `boss.popups` | `slab-drop` | `slab-drop` | yes |
| 128.700 | 7722 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 128.800 | 7728 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 128.983 | 7739 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 129.067 | 7744 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 129.204 | 7752 | `boss.popups` | `step` | `step` | no |
| 129.262 | 7755 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 129.317 | 7759 | `boss.popups` | `step` | `step` | no |
| 129.329 | 7759 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 129.421 | 7765 | `boss.popups` | `step` | `step` | no |
| 129.529 | 7771 | `boss.popups` | `step` | `step` | no |
| 129.542 | 7772 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 129.563 | 7773 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 129.654 | 7779 | `boss.popups` | `step` | `step` | no |
| 129.767 | 7786 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 130.108 | 7806 | `boss.popups` | `step` | `step` | no |
| 130.242 | 7814 | `boss.popups` | `step` | `step` | no |
| 130.383 | 7823 | `boss.popups` | `step` | `step` | no |
| 130.604 | 7836 | `boss.popups` | `slab-fire` | `slab-fire` | no |
| 130.662 | 7839 | `boss.popups` | `dart-fire` | `dart-fire` | no |
| 130.771 | 7846 | `boss.popups` | `dart-hit` | `dart-hit` | no |
| 131.071 | 7864 | `boss.lastStand` | `session-expired` | `popup` | no |
| 131.208 | 7872 | `boss.lastStand` | `slab-drop` | `slab-drop` | no |
| 132.150 | 7929 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 132.254 | 7935 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 132.350 | 7941 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 132.454 | 7947 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 132.550 | 7953 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 132.662 | 7959 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 132.750 | 7965 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 132.871 | 7972 | `boss.lastStand` | `popup` | `popup` | no |
| 132.883 | 7973 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 132.950 | 7977 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 133.104 | 7986 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 133.150 | 7989 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 133.200 | 7992 | `boss.lastStand` | `step` | `step` | no |
| 133.308 | 7998 | `boss.lastStand` | `step` | `step` | no |
| 133.325 | 7999 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 133.350 | 8001 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 133.400 | 8004 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 133.458 | 8007 | `boss.lastStand` | `step` | `step` | no |
| 133.529 | 8011 | `boss.lastStand` | `slab-fire` | `slab-fire` | no |
| 133.550 | 8013 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 133.604 | 8016 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 133.750 | 8025 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 133.804 | 8028 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 133.950 | 8037 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 134.000 | 8040 | `boss.lastStand` | `slab-drop` | `slab-drop` | no |
| 134.146 | 8048 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 134.150 | 8049 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 134.333 | 8060 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 134.350 | 8061 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 134.475 | 8068 | `boss.lastStand` | `popup` | `popup` | no |
| 134.525 | 8071 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 134.550 | 8073 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 134.608 | 8076 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 134.617 | 8077 | `boss.lastStand` | `step` | `step` | no |
| 134.692 | 8081 | `boss.lastStand` | `step` | `step` | no |
| 134.750 | 8085 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 134.779 | 8086 | `boss.lastStand` | `step` | `step` | no |
| 134.838 | 8090 | `boss.lastStand` | `slab-fire` | `slab-fire` | no |
| 134.854 | 8091 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 134.950 | 8097 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 135.033 | 8102 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 135.150 | 8109 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 135.221 | 8113 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 135.350 | 8121 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 135.412 | 8124 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 135.463 | 8127 | `boss.lastStand` | `slab-drop` | `slab-drop` | no |
| 135.550 | 8133 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 135.600 | 8136 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 135.750 | 8145 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 135.792 | 8147 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 135.933 | 8156 | `boss.lastStand` | `step` | `step` | no |
| 135.950 | 8157 | `boss.lastStand` | `dart-fire` | `dart-fire` | no |
| 135.996 | 8159 | `boss.lastStand` | `dart-hit` | `dart-hit` | no |
| 136.012 | 8160 | `boss.collapse` | `step` | `step` | no |
| 136.117 | 8167 | `boss.collapse` | `step` | `step` | no |
| 136.146 | 8168 | `boss.collapse` | `slab-fire` | `slab-fire` | no |
| 136.150 | 8169 | `boss.collapse` | `dart-fire` | `dart-fire` | no |
| 136.229 | 8173 | `boss.collapse` | `dart-hit` | `dart-hit` | no |
| 136.229 | 8173 | `boss.collapse` | `power-down` | `power-down` | no |
| 139.500 | 8370 | `boss.press` | `button-press` | `button-press` | no |
| 140.500 | 8430 | `boss.press` | `page-turn` | `page-turn` | no |
| 141.400 | 8484 | `decision.wait` | `hold-music` | `hold-music` | no |
| 141.529 | 8491 | `decision.wait` | `step` | `step` | no |
| 141.546 | 8492 | `decision.wait` | `step` | `step` | no |
| 141.563 | 8493 | `decision.wait` | `step` | `step` | no |
| 141.579 | 8494 | `decision.wait` | `step` | `step` | no |
| 141.596 | 8495 | `decision.wait` | `step` | `step` | no |
| 141.621 | 8497 | `decision.wait` | `step` | `step` | no |
| 141.646 | 8498 | `decision.wait` | `step` | `step` | no |
| 141.692 | 8501 | `decision.wait` | `step` | `step` | no |
| 142.146 | 8528 | `decision.wait` | `step` | `step` | no |
| 142.762 | 8565 | `decision.wait` | `step` | `step` | no |
| 143.325 | 8599 | `decision.letter` | `step` | `step` | no |
| 143.800 | 8628 | `decision.letter` | `letter-drop` | `letter-drop` | no |
| 143.800 | 8628 | `decision.letter` | `paper-slide` | `paper-slide` | no |
| 144.075 | 8644 | `decision.letter` | `step` | `step` | no |
| 144.121 | 8647 | `decision.letter` | `step` | `step` | no |
| 144.158 | 8649 | `decision.letter` | `step` | `step` | no |
| 144.192 | 8651 | `decision.letter` | `step` | `step` | no |
| 144.221 | 8653 | `decision.letter` | `step` | `step` | no |
| 144.254 | 8655 | `decision.letter` | `step` | `step` | no |
| 144.283 | 8657 | `decision.letter` | `step` | `step` | no |
| 144.313 | 8658 | `decision.letter` | `step` | `step` | no |
| 144.346 | 8660 | `decision.letter` | `step` | `step` | no |
| 144.387 | 8663 | `decision.letter` | `step` | `step` | no |
| 144.446 | 8666 | `decision.letter` | `step` | `step` | no |
| 144.783 | 8687 | `decision.letter` | `step` | `step` | no |
| 144.863 | 8691 | `decision.letter` | `step` | `step` | no |
| 144.950 | 8697 | `decision.letter` | `step` | `step` | no |
| 145.300 | 8718 | `decision.letter` | `stamp` | `stamp` | yes |
| 145.300 | 8718 | `decision.letter` | `flatten` | `flatten` | yes |
| 148.092 | 8885 | `decision.metrics` | `peel-up` | `peel-up` | yes |
| 150.300 | 9018 | `decision.metrics` | `button-press` | `button-press` | no |
| 150.754 | 9045 | `decision.metrics` | `page-turn` | `page-turn` | no |

## Narrator lines

37 lines, 0 with a kept take. The end of a line with no kept take is the soonest it can end at audio.narratorMaxWordsPerSecond, marked "estimate".

| Line | Beat | Start s | Start frame | End s | Last frame | Length | Gap to next s | Text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `line.marketing.stroll.0` | `marketing.stroll` | 0.000 | 0 | 1.875 | 112 | estimate | 0.725 | Behold. / The applicant. |
| `line.marketing.perks.0` | `marketing.perks` | 2.600 | 156 | 10.100 | 605 | estimate | 0.900 | It sees unlimited PTO / and believes it. / The fine print / goes unread. |
| `line.marketing.apply.0` | `marketing.apply` | 11.000 | 660 | 13.500 | 809 | estimate | 2.500 | And so / it applies. |
| `line.step1.firstName.0` | `step1.firstName` | 16.000 | 960 | 20.375 | 1222 | estimate | 0.425 | Step one. / Its own name. / Under fire. |
| `line.step1.firstName.1` | `step1.firstName` | 20.800 | 1248 | 23.300 | 1397 | estimate | 0.700 | Shot. / On field one. |
| `line.step1.lastName.0` | `step1.lastName` | 24.000 | 1440 | 28.375 | 1702 | estimate | 0.625 | The keys moved. / It did not notice. |
| `line.step1.email.0` | `step1.email` | 29.000 | 1740 | 33.375 | 2002 | estimate | 0.625 | A valid email. / Rejected. / As is tradition. |
| `line.step1.resume.0` | `step1.resume` | 34.000 | 2040 | 35.875 | 2152 | estimate | 0.475 | Ah. / The resume. |
| `line.step1.tug.0` | `step1.tug` | 36.350 | 2181 | 38.850 | 2330 | estimate | 1.000 | It grows arms. / Desperate. |
| `line.step1.tug.1` | `step1.tug` | 39.850 | 2391 | 42.350 | 2540 | estimate | 0.650 | The shredder / always wins. |
| `line.step1.shredded.0` | `step1.shredded` | 43.000 | 2580 | 45.500 | 2729 | estimate | 0.500 | Now type it again. |
| `line.step2.open.0` | `step2.open` | 46.000 | 2760 | 47.875 | 2872 | estimate | 0.425 | Personal details. / Simple. |
| `line.step2.dial.0` | `step2.dial` | 48.300 | 2898 | 52.675 | 3160 | estimate | 1.325 | A phone. / From before it was born. |
| `line.step2.slot.0` | `step2.slot` | 54.000 | 3240 | 59.000 | 3539 | estimate | 1.000 | Its birthday / is now a gamble. / It loses. |
| `line.step2.crank.0` | `step2.crank` | 60.000 | 3600 | 65.625 | 3937 | estimate | 1.575 | Volume. / All the way up. / It will regret that. |
| `line.pinball.seal.0` | `pinball.seal` | 67.200 | 4032 | 69.075 | 4144 | estimate | 2.325 | The skills assessment. |
| `line.pinball.reveal.0` | `pinball.reveal` | 71.400 | 4284 | 73.900 | 4433 | estimate | 1.100 | A career. / In reverse. |
| `line.pinball.launch.0` | `pinball.launch` | 75.000 | 4500 | 77.500 | 4649 | estimate | 0.500 | Welcome to the grind. |
| `line.pinball.lobby.0` | `pinball.lobby` | 78.000 | 4680 | 80.500 | 4829 | estimate | 1.500 | Corporate headquarters. / So close. |
| `line.pinball.coffee.0` | `pinball.coffee` | 82.000 | 4920 | 84.500 | 5069 | estimate | 1.850 | Coffee. / It solves nothing. |
| `line.pinball.replyAll.0` | `pinball.replyAll` | 86.350 | 5181 | 88.850 | 5330 | estimate | 1.000 | Someone / hit reply all. |
| `line.pinball.replyAll.1` | `pinball.replyAll` | 89.850 | 5391 | 92.350 | 5540 | estimate | 0.650 | Everyone / is now involved. |
| `line.pinball.fired.0` | `pinball.fired` | 93.000 | 5580 | 96.125 | 5767 | estimate | 0.375 | The firehouse. / It is fired. |
| `line.pinball.highway.0` | `pinball.highway` | 96.500 | 5790 | 100.250 | 6014 | estimate | 0.750 | The commute. / Two hours. / Each way. |
| `line.pinball.save.0` | `pinball.save` | 101.000 | 6060 | 103.500 | 6209 | estimate | 0.500 | Saved. / Unpaid, of course. |
| `line.pinball.drain.0` | `pinball.drain` | 104.000 | 6240 | 107.750 | 6464 | estimate | 1.500 | The unemployment office. / Where it belongs. |
| `line.boss.verify.0` | `boss.verify` | 109.250 | 6555 | 113.625 | 6817 | estimate | 0.375 | A robot? / It says no. / It lies. |
| `line.boss.unfold.0` | `boss.unfold` | 114.000 | 6840 | 117.125 | 7027 | estimate | 0.875 | The button / has had enough. |
| `line.boss.slabs.0` | `boss.slabs` | 118.000 | 7080 | 123.625 | 7417 | estimate | 1.375 | It fights back / the only way it knows. / Clicking. |
| `line.boss.popups.0` | `boss.popups` | 125.000 | 7500 | 127.500 | 7649 | estimate | 3.500 | Pop-ups. / The coward's weapon. |
| `line.boss.lastStand.0` | `boss.lastStand` | 131.000 | 7860 | 133.500 | 8009 | estimate | 2.500 | Session expired. / A classic. |
| `line.boss.collapse.0` | `boss.collapse` | 136.000 | 8160 | 137.875 | 8272 | estimate | 0.575 | It wins. / Barely. |
| `line.boss.press.0` | `boss.press` | 138.450 | 8307 | 140.325 | 8419 | estimate | 0.675 | It may submit. |
| `line.decision.wait.0` | `decision.wait` | 141.000 | 8460 | 142.875 | 8572 | estimate | 0.525 | Now we wait. |
| `line.decision.letter.0` | `decision.letter` | 143.400 | 8604 | 145.900 | 8753 | estimate | 1.100 | Or not. / Rejected. / Instantly. |
| `line.decision.metrics.0` | `decision.metrics` | 147.000 | 8820 | 150.125 | 9007 | estimate | 0.875 | It accepts. / It always does. |
| `line.decision.reset.0` | `decision.reset` | 151.000 | 9060 | 152.875 | 9172 | estimate |  | Look. / Still hiring. |
