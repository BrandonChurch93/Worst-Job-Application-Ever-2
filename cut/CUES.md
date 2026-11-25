# Cues

Made by `npm run cut`. Do not edit by hand.

Film B: 9180 frames at 60 a second, 153 s. Times are in seconds from the first frame of the film. A frame is counted from 0.

## Beats

| Beat | Start s | First frame | Last frame | Event | Event s | Event frame | Inside |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `marketing.stroll` | 0.000 | 0 | 119 | `step` | 14.546 | 872 | NO |
| `marketing.perks` | 2.000 | 120 | 479 | `card-flip` | 4.400 | 264 | yes |
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
| `step2.dial` | 48.000 | 2880 | 3239 | `dial-fling` | 50.400 | 3024 | yes |
| `step2.slot` | 54.000 | 3240 | 3599 | `coins` | 56.400 | 3384 | yes |
| `step2.crank` | 60.000 | 3600 | 3959 | `flatten` | 62.400 | 3744 | yes |
| `step2.continue` | 66.000 | 3960 | 4019 | `button-press` | 66.000 | 3960 | yes |
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
| `boss.verify` | 109.000 | 6540 | 6839 | `checkbox` | 111.000 | 6660 | yes |
| `boss.unfold` | 114.000 | 6840 | 7079 | `unfold` | 115.600 | 6936 | yes |
| `boss.slabs` | 118.000 | 7080 | 7499 | `slab-fire` | 120.800 | 7248 | yes |
| `boss.popups` | 125.000 | 7500 | 7859 | `popup` | 127.400 | 7644 | yes |
| `boss.lastStand` | 131.000 | 7860 | 8159 | `session-expired` | 133.000 | 7980 | yes |
| `boss.collapse` | 136.000 | 8160 | 8279 | `power-down` | 136.800 | 8208 | yes |
| `boss.press` | 138.000 | 8280 | 8459 | `button-press` | 139.200 | 8352 | yes |
| `decision.wait` | 141.000 | 8460 | 8579 | `hold-music` | 141.400 | 8484 | yes |
| `decision.letter` | 143.000 | 8580 | 8819 | `stamp` | 145.300 | 8718 | yes |
| `decision.metrics` | 147.000 | 8820 | 9059 | `button-press` | 150.300 | 9018 | yes |
| `decision.reset` | 151.000 | 9060 | 9179 | `page-turn` | 150.754 | 9045 | yes |

## Events with a cue

58 of the film's 87 events have a cue in the table of events to cues. A cue starts on the frame of its event.

| Time s | Frame | Beat | Event | Cue | Hits the cursor |
| --- | --- | --- | --- | --- | --- |
| 4.400 | 264 | `marketing.perks` | `card-flip` | `card-flip` | no |
| 13.000 | 780 | `marketing.apply` | `button-press` | `button-press` | no |
| 13.500 | 810 | `marketing.apply` | `page-turn` | `page-turn` | no |
| 14.546 | 872 | `step1.keyboard` | `step` | `step` | no |
| 14.579 | 874 | `step1.keyboard` | `step` | `step` | no |
| 14.637 | 878 | `step1.keyboard` | `step` | `step` | no |
| 14.800 | 888 | `step1.keyboard` | `keyboard-rise` | `keyboard-rise` | no |
| 26.000 | 1560 | `step1.lastName` | `keys-shuffle` | `keys-shuffle` | no |
| 31.000 | 1860 | `step1.email` | `slab-drop` | `slab-drop` | no |
| 45.000 | 2700 | `step1.shredded` | `button-press` | `button-press` | no |
| 45.500 | 2730 | `step1.shredded` | `page-turn` | `page-turn` | no |
| 46.546 | 2792 | `step2.open` | `step` | `step` | no |
| 46.579 | 2794 | `step2.open` | `step` | `step` | no |
| 46.638 | 2798 | `step2.open` | `step` | `step` | no |
| 66.000 | 3960 | `step2.continue` | `button-press` | `button-press` | no |
| 66.400 | 3984 | `step2.continue` | `button-press` | `button-press` | no |
| 66.500 | 3990 | `step2.continue` | `page-turn` | `page-turn` | no |
| 67.546 | 4052 | `pinball.seal` | `step` | `step` | no |
| 67.579 | 4054 | `pinball.seal` | `step` | `step` | no |
| 67.638 | 4058 | `pinball.seal` | `step` | `step` | no |
| 108.000 | 6480 | `pinball.drain` | `button-press` | `button-press` | no |
| 108.500 | 6510 | `pinball.drain` | `page-turn` | `page-turn` | no |
| 109.546 | 6572 | `boss.verify` | `step` | `step` | no |
| 109.579 | 6574 | `boss.verify` | `step` | `step` | no |
| 109.638 | 6578 | `boss.verify` | `step` | `step` | no |
| 139.200 | 8352 | `boss.press` | `button-press` | `button-press` | no |
| 140.000 | 8400 | `boss.press` | `button-press` | `button-press` | no |
| 140.500 | 8430 | `boss.press` | `page-turn` | `page-turn` | no |
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
| 150.300 | 9018 | `decision.metrics` | `button-press` | `button-press` | no |
| 150.754 | 9045 | `decision.metrics` | `page-turn` | `page-turn` | no |
| 151.800 | 9108 | `decision.reset` | `step` | `step` | no |
| 151.833 | 9110 | `decision.reset` | `step` | `step` | no |
| 151.892 | 9113 | `decision.reset` | `step` | `step` | no |

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
