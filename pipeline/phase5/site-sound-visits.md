# The two whole visits, from the engine's own log

`npm run sound -- --visit keen` and `npm run sound -- --visit skipper`, MEASURED. Times are seconds of the stage, which is the sound clock of the run.

## keen

keen, seed 20261124: finished in 124.05 s, 0 skips, 824 sounds started, 14 lines booked, 3 taken back or cut, 36 dropped
pages: marketing 0.02, step1 10.1, step2 32.92, step3 47.72, step4 87.97, step5 115.6, marketing 123.55

| at s | page | line | trigger | starts s | seconds | heard |
| --- | --- | --- | --- | --- | --- | --- |
| 0.03 | marketing | line.marketing.stroll.0 | event step | 0.03 | 5.122 | yes |
| 11.12 | step1 | line.step1.firstName.0 | event keyboard-rise | 11.15 | 5.344 | yes |
| 17.13 | step1 | line.step1.email.0 | event slab-drop | 22.50 | 7.472 | yes |
| 33.60 | step2 | line.step2.dial.0 | gag step2.dial | 35.97 | 5.864 | yes |
| 42.57 | step2 | line.step2.crank.0 | gag step2.crank | 47.84 | 6.454 | no, taken back |
| 49.32 | step3 | line.pinball.seal.0 | event ball-seal | 49.32 | 6.696 | yes |
| 58.17 | step3 | line.pinball.launch.0 | event plunger | 62.01 | 3.092 | yes |
| 63.42 | step3 | line.pinball.coffee.0 | event bumper | 71.11 | 3.936 | yes |
| 75.02 | step3 | line.pinball.fired.0 | event firehouse-take | 81.04 | 5.54 | yes |
| 85.20 | step3 | line.pinball.drain.0 | event drain | 92.58 | 4.558 | no, taken back |
| 88.65 | step4 | line.boss.verify.0 | event checkbox | 92.58 | 5.22 | yes |
| 95.58 | step4 | line.boss.slabs.0 | event slab-fire | 103.80 | 8.038 | yes |
| 121.03 | step5 | line.decision.letter.0 | event stamp | 121.03 | 3.474 | yes |
| 121.70 | step5 | line.decision.metrics.0 | event count-run | 130.51 | 5.736 | no, taken back |

| at s | page | line | what | trigger | why |
| --- | --- | --- | --- | --- | --- |
| 0.22 | marketing | line.marketing.perks.0 | dropped | event card-flip | it could start 10.94 s after its trigger, 6 s after line.marketing.stroll.0 ends, and may wait 10.00 s |
| 17.13 | step1 | line.live.hit.0 | dropped | hit by slab-drop | it could start 18.84 s after its trigger, 6 s after line.step1.email.0 ends, and may wait 0.40 s |
| 20.23 | step1 | line.step1.tug.0 | dropped | event arms-out | it could start 15.74 s after its trigger, 6 s after line.step1.email.0 ends, and may wait 10.00 s |
| 28.63 | step1 | line.live.hit.0 | dropped | hit by tug-lost | it could start 7.34 s after its trigger, 6 s after line.step1.email.0 ends, and may wait 0.40 s |
| 28.63 | step1 | line.live.tugLost.0 | dropped | event tug-lost | it could start 7.34 s after its trigger, 6 s after line.step1.email.0 ends, and may wait 3.00 s |
| 36.03 | step2 | line.live.hit.0 | dropped | hit by dial-fling | it could start 11.80 s after its trigger, 6 s after line.step2.dial.0 ends, and may wait 0.40 s |
| 45.60 | step2 | line.live.hit.0 | dropped | hit by flatten | it could start 14.69 s after its trigger, 6 s after line.step2.crank.0 ends, and may wait 0.40 s |
| 47.22 | step2 | line.step2.crank.0 | taken back | its page was turned | its page was turned before it began |
| 49.32 | step3 | line.live.hit.0 | dropped | hit by ball-seal | it could start 12.70 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 60.20 | step3 | line.pinball.lobby.0 | dropped | event carpet-roll | it could start 10.90 s after its trigger, 6 s after line.pinball.launch.0 ends, and may wait 10.00 s |
| 60.82 | step3 | line.live.hit.0 | dropped | hit by doors-slam | it could start 10.29 s after its trigger, 6 s after line.pinball.launch.0 ends, and may wait 0.40 s |
| 62.67 | step3 | line.live.hit.0 | dropped | hit by flasher | it could start 8.44 s after its trigger, 6 s after line.pinball.launch.0 ends, and may wait 0.40 s |
| 63.42 to 65.37, 5 times | step3 | line.live.hit.0 | dropped | hit by bumper | it could start 17.62 s after its trigger, 6 s after line.pinball.coffee.0 ends, and may wait 0.40 s |
| 64.97 | step3 | line.live.pinball.flipper.0 | dropped | event flipper | it could start 16.07 s after its trigger, 6 s after line.pinball.coffee.0 ends, and may wait 4.00 s |
| 66.75 to 71.88, 8 times | step3 | line.live.hit.0 | dropped | hit by flasher | it could start 14.29 s after its trigger, 6 s after line.pinball.coffee.0 ends, and may wait 0.40 s |
| 67.20 | step3 | line.pinball.replyAll.0 | dropped | event inbox-take | it could start 13.84 s after its trigger, 6 s after line.pinball.coffee.0 ends, and may wait 10.00 s |
| 67.20 | step3 | line.live.hit.0 | dropped | hit by inbox-take | it could start 13.84 s after its trigger, 6 s after line.pinball.coffee.0 ends, and may wait 0.40 s |
| 75.02 | step3 | line.live.hit.0 | dropped | hit by firehouse-take | it could start 17.56 s after its trigger, 6 s after line.pinball.fired.0 ends, and may wait 0.40 s |
| 77.08 | step3 | line.live.hit.0 | dropped | hit by scoop-kick | it could start 15.50 s after its trigger, 6 s after line.pinball.fired.0 ends, and may wait 0.40 s |
| 86.38 | step3 | line.live.hit.0 | dropped | hit by ball-open | it could start 16.76 s after its trigger, 6 s after line.pinball.drain.0 ends, and may wait 0.40 s |
| 86.38 | step3 | line.live.hit.0 | dropped | hit by flatten | it could start 16.76 s after its trigger, 6 s after line.pinball.drain.0 ends, and may wait 0.40 s |
| 86.88 | step3 | line.live.hit.0 | dropped | hit by peel-up | it could start 16.26 s after its trigger, 6 s after line.pinball.drain.0 ends, and may wait 0.40 s |
| 87.47 | step3 | line.pinball.drain.0 | taken back | its page was turned | its page was turned before it began |
| 88.65 | step4 | line.live.boss.verify.0 | dropped | event checkbox | it could start 15.15 s after its trigger, 6 s after line.boss.verify.0 ends, and may wait 4.00 s |
| 105.25 | step4 | line.boss.lastStand.0 | dropped | event session-expired | it could start 12.59 s after its trigger, 6 s after line.boss.slabs.0 ends, and may wait 10.00 s |
| 121.03 | step5 | line.live.hit.0 | dropped | hit by stamp | it could start 9.47 s after its trigger, 6 s after line.decision.letter.0 ends, and may wait 0.40 s |
| 121.03 | step5 | line.live.hit.0 | dropped | hit by flatten | it could start 9.47 s after its trigger, 6 s after line.decision.letter.0 ends, and may wait 0.40 s |
| 123.05 | step5 | line.decision.metrics.0 | taken back | its page was turned | its page was turned before it began |

loops and music: room-tone on marketing from 0 to the end of the visit; shredder on step1 from 20.23 to 30.75; boss-loop on step4 from 92.43 to 111.73; hold-music on step5 from 116 to 118.43
volume: 1 at 0.02 (marketing), 0.1 at 42.57 (step2), 0.2 at 43.6 (step2), 0.3 at 43.92 (step2), 0.4 at 44.25 (step2), 0.6 at 44.68 (step2), 0.9 at 45.17 (step2), 1 at 45.32 (step2)

## skipper

skipper, seed 20261124: finished in 117.43 s, 5 skips, 139 sounds started, 9 lines booked, 1 taken back or cut, 20 dropped
pages: marketing 0.02, step1 10.1, step2 30.9, step3 51.65, step4 74.63, step5 95.98, marketing 116.93

| at s | page | line | trigger | starts s | seconds | heard |
| --- | --- | --- | --- | --- | --- | --- |
| 0.03 | marketing | line.marketing.stroll.0 | event step | 0.03 | 5.122 | yes |
| 20.13 | step1 | line.live.idle.0 | call idle | 20.13 | 8.014 | yes |
| 42.40 | step2 | line.live.idle.1 | call idle | 42.40 | 5.162 | yes |
| 50.90 | step2 | line.live.skip.0 | event skip | 53.56 | 5.644 | yes |
| 56.32 | step3 | line.pinball.seal.0 | event ball-seal | 65.21 | 6.696 | yes |
| 69.62 | step3 | line.pinball.coffee.0 | event bumper | 77.90 | 3.936 | no, taken back |
| 86.13 | step4 | line.live.idle.0 | call idle | 86.13 | 8.014 | yes |
| 101.42 | step5 | line.decision.letter.0 | event stamp | 101.42 | 3.474 | yes |
| 102.08 | step5 | line.decision.metrics.0 | event count-run | 110.89 | 5.736 | yes |

| at s | page | line | what | trigger | why |
| --- | --- | --- | --- | --- | --- |
| 0.22 | marketing | line.marketing.perks.0 | dropped | event card-flip | it could start 10.94 s after its trigger, 6 s after line.marketing.stroll.0 ends, and may wait 10.00 s |
| 30.10 | step1 | line.live.skip.0 | dropped | event skip | it could start 4.05 s after its trigger, 6 s after line.live.idle.0 ends, and may wait 4.00 s |
| 56.32 | step3 | line.live.hit.0 | dropped | hit by ball-seal | it could start 21.59 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 63.15 | step3 | line.live.idle.0 | dropped | call idle | it could start 14.75 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 4.00 s |
| 64.38 | step3 | line.pinball.launch.0 | dropped | event plunger | it could start 13.52 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 10.00 s |
| 66.40 | step3 | line.pinball.lobby.0 | dropped | event carpet-roll | it could start 11.50 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 10.00 s |
| 67.03 | step3 | line.live.hit.0 | dropped | hit by doors-slam | it could start 10.87 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 68.87 | step3 | line.live.hit.0 | dropped | hit by flasher | it could start 9.04 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 69.62 to 70.23, 3 times | step3 | line.live.hit.0 | dropped | hit by bumper | it could start 18.22 s after its trigger, 6 s after line.pinball.coffee.0 ends, and may wait 0.40 s |
| 71.65 | step3 | line.pinball.coffee.0 | taken back | its page was skipped | its page was skipped before it began |
| 71.65 | step3 | line.live.skip.0 | dropped | event skip | it could start 6.25 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 4.00 s |
| 72.17 | step3 | line.live.hit.0 | dropped | hit by ball-open | it could start 5.74 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 72.17 | step3 | line.live.hit.0 | dropped | hit by flatten | it could start 5.74 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 72.68 | step3 | line.live.hit.0 | dropped | hit by peel-up | it could start 5.22 s after its trigger, 6 s after line.pinball.seal.0 ends, and may wait 0.40 s |
| 94.63 | step4 | line.live.skip.0 | dropped | event skip | it could start 5.51 s after its trigger, 6 s after line.live.idle.0 ends, and may wait 4.00 s |
| 101.42 | step5 | line.live.hit.0 | dropped | hit by stamp | it could start 9.47 s after its trigger, 6 s after line.decision.letter.0 ends, and may wait 0.40 s |
| 101.42 | step5 | line.live.hit.0 | dropped | hit by flatten | it could start 9.47 s after its trigger, 6 s after line.decision.letter.0 ends, and may wait 0.40 s |
| 107.48 | step5 | line.live.idle.1 | dropped | call idle | it could start 15.14 s after its trigger, 6 s after line.decision.metrics.0 ends, and may wait 4.00 s |
| 115.98 | step5 | line.live.skip.0 | dropped | event skip | it could start 6.64 s after its trigger, 6 s after line.decision.metrics.0 ends, and may wait 4.00 s |

loops and music: room-tone on marketing from 0 to the end of the visit; hold-music on step5 from 96.38 to 98.81
volume: 1 at 0.02 (marketing)
