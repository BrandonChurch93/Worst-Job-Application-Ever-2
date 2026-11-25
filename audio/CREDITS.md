# The sound credits of this build

This build may spend at most 10000 ElevenLabs credits in all, on every call of every kind. 2000 of them are held back for what Brandon asks for at the review, so the build stops at 8000 before it. Nothing extra is made once the total passes 8000.

The count is of this build's own calls, never of what the account has left: the account is shared with other builds. Every call goes through `npm run credits`, which writes its row here before it returns and makes no call that would pass the limit. A sound effect is never asked for without its length. `kit/addenda/001-sound-budget-and-narrator.md` sets these rules. This file is written by the tool from `audio/CREDITS.json`.

Running total: 1449 of 10000. Calls: 82.

## Rates

- Speech: 0.439 credits a character. MEASURED 2026-11-25T17:44:37Z on call 3: 18 credits for 41 characters, reported by the response; the account's usage moved by 0 across the call.
- Sound effects: 12 credits a second. MEASURED 2026-11-25T17:54:46Z on call 11: 6 credits for 0.5 s asked, reported by the response; the account's usage moved by 0 across the call.

## Calls

| # | Time, UTC | Endpoint | Line or cue | Asked for | Answer | Cost | How the cost is known | Running total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-11-25T17:38:41Z | GET /v1/user/subscription | the account's quota, read as section 5 of addendum 001 asks | nothing, a read | plan creator, active: 1816 of 131000 used by every build on the account, reset 2026-12-25T16:56:49Z | 0 | a read costs nothing | 0 |
| 2 | 2026-11-25T17:44:14Z | GET /v1/user/subscription | the account's quota, read again through the tool | nothing, a read | plan creator, active: 2426 of 131000 used by every build on the account, reset 2026-12-25T16:56:49Z | 0 | a read costs nothing | 0 |
| 3 | 2026-11-25T17:44:37Z | POST /v1/text-to-speech | pause test 1 of 3: commas | 41 characters | HTTP 200, 0.8 s | 18 | reported by the response; the account's usage moved by 0 across the call | 18 |
| 4 | 2026-11-25T17:44:49Z | POST /v1/text-to-speech | pause test 2 of 3: ellipses | 48 characters | HTTP 200, 0.9 s | 21 | reported by the response | 39 |
| 5 | 2026-11-25T17:44:51Z | POST /v1/text-to-speech | pause test 3 of 3: the documented break mark, 0.8 s | 84 characters | HTTP 200, 0.9 s | 27 | reported by the response | 66 |
| 6 | 2026-11-25T17:45:16Z | POST /v1/text-to-speech | speed test 1: speed 0.7, breaks of 1.0 s | 84 characters, speed 0.7 | HTTP 200, 1.0 s | 27 | reported by the response | 93 |
| 7 | 2026-11-25T17:45:17Z | POST /v1/text-to-speech | speed test 2: speed 0.8, breaks of 1.0 s | 84 characters, speed 0.8 | HTTP 200, 0.8 s | 27 | reported by the response | 120 |
| 8 | 2026-11-25T17:50:54Z | POST /v1/text-to-speech | stability test 1: speed 0.7, stability 0.75, take A | 84 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 27 | reported by the response | 147 |
| 9 | 2026-11-25T17:50:55Z | POST /v1/text-to-speech | stability test 2: speed 0.7, stability 0.75, take B | 84 characters, stability 0.75, speed 0.7 | HTTP 200, 1.3 s | 27 | reported by the response | 174 |
| 10 | 2026-11-25T17:50:57Z | POST /v1/text-to-speech | stability test 3: speed 0.7, stability 0.5, a second take | 84 characters, stability 0.5, speed 0.7 | HTTP 200, 0.9 s | 27 | reported by the response | 201 |
| 11 | 2026-11-25T17:54:46Z | POST /v1/sound-generation | effect rate test, and take 1 of cue card-flip | 0.5 s | HTTP 200, 1.9 s | 6 | reported by the response; the account's usage moved by 0 across the call | 207 |
| 12 | 2026-11-25T18:01:35Z | GET /v1/user/subscription | the sound agent's first read | nothing, a read | plan creator, active: 6717 of 131000 used by every build on the account, reset 2026-12-25T16:56:49Z | 0 | a read costs nothing | 207 |
| 13 | 2026-11-25T18:05:34Z | POST /v1/text-to-speech | line.marketing.stroll.0 take 1, breaks of 1.0 s | 84 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 27 | reported by the response | 234 |
| 14 | 2026-11-25T18:05:35Z | POST /v1/text-to-speech | line.marketing.perks.0 take 1, breaks of 1.0 s | 91 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 30 | reported by the response | 264 |
| 15 | 2026-11-25T18:05:37Z | POST /v1/text-to-speech | line.step1.firstName.0 take 1, breaks of 1.0 s | 88 characters, stability 0.75, speed 0.7 | HTTP 200, 1.2 s | 29 | reported by the response | 293 |
| 16 | 2026-11-25T18:05:38Z | POST /v1/text-to-speech | line.step1.firstName.1 take 1, breaks of 1.0 s | 79 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 25 | reported by the response | 318 |
| 17 | 2026-11-25T18:05:39Z | POST /v1/text-to-speech | line.step1.email.0 take 1, breaks of 1.0 s | 125 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 40 | reported by the response | 358 |
| 18 | 2026-11-25T18:05:41Z | POST /v1/text-to-speech | line.step1.tug.0 take 1, breaks of 1.4 s | 101 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 35 | reported by the response | 393 |
| 19 | 2026-11-25T18:05:42Z | POST /v1/text-to-speech | line.step2.dial.0 take 1, breaks of 1.0 s | 93 characters, stability 0.75, speed 0.7 | HTTP 200, 1.4 s | 31 | reported by the response | 424 |
| 20 | 2026-11-25T18:05:44Z | POST /v1/text-to-speech | line.step2.crank.0 take 1, breaks of 1.0 s | 88 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 29 | reported by the response | 453 |
| 21 | 2026-11-25T18:05:45Z | POST /v1/text-to-speech | line.pinball.seal.0 take 1, breaks of 1.0 s | 94 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 32 | reported by the response | 485 |
| 22 | 2026-11-25T18:05:47Z | POST /v1/text-to-speech | line.pinball.launch.0 take 1, breaks of 1.0 s | 43 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 14 | reported by the response | 499 |
| 23 | 2026-11-25T18:05:48Z | POST /v1/text-to-speech | line.pinball.lobby.0 take 1, breaks of 1.0 s | 55 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 19 | reported by the response | 518 |
| 24 | 2026-11-25T18:05:49Z | POST /v1/text-to-speech | line.pinball.coffee.0 take 1, breaks of 1.4 s | 49 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 17 | reported by the response | 535 |
| 25 | 2026-11-25T18:05:50Z | POST /v1/text-to-speech | line.pinball.replyAll.0 take 1, breaks of 1.0 s | 44 characters, stability 0.75, speed 0.7 | HTTP 200, 1.3 s | 15 | reported by the response | 550 |
| 26 | 2026-11-25T18:05:52Z | POST /v1/text-to-speech | line.pinball.fired.0 take 1, breaks of 1.0 s | 85 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 28 | reported by the response | 578 |
| 27 | 2026-11-25T18:05:53Z | POST /v1/text-to-speech | line.pinball.drain.0 take 1, breaks of 1.6 s | 64 characters, stability 0.75, speed 0.7 | HTTP 200, 1.3 s | 23 | reported by the response | 601 |
| 28 | 2026-11-25T18:05:55Z | POST /v1/text-to-speech | line.boss.verify.0 take 1, breaks of 1.0 s | 80 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 26 | reported by the response | 627 |
| 29 | 2026-11-25T18:05:56Z | POST /v1/text-to-speech | line.boss.slabs.0 take 1, breaks of 1.4 s | 106 characters, stability 0.75, speed 0.7 | HTTP 200, 1.3 s | 37 | reported by the response | 664 |
| 30 | 2026-11-25T18:05:57Z | POST /v1/text-to-speech | line.boss.lastStand.0 take 1, breaks of 1.0 s | 49 characters, stability 0.75, speed 0.7 | HTTP 200, 0.8 s | 17 | reported by the response | 681 |
| 31 | 2026-11-25T18:05:59Z | POST /v1/text-to-speech | line.decision.letter.0 take 1, breaks of 1.1 s | 50 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 17 | reported by the response | 698 |
| 32 | 2026-11-25T18:06:00Z | POST /v1/text-to-speech | line.decision.metrics.0 take 1, breaks of 1.9 s | 67 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 25 | reported by the response | 723 |
| 33 | 2026-11-25T18:13:01Z | POST /v1/sound-generation | room-tone take 1 | 20 s, a loop | HTTP 200, 4.7 s | 220 | reported by the response | 943 |
| 34 | 2026-11-25T18:13:07Z | POST /v1/sound-generation | step.1 take 1, variant 1 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.9 s | 6 | reported by the response | 949 |
| 35 | 2026-11-25T18:13:09Z | POST /v1/sound-generation | step.2 take 1, variant 2 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.6 s | 6 | reported by the response | 955 |
| 36 | 2026-11-25T18:13:11Z | POST /v1/sound-generation | step.3 take 1, variant 3 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.7 s | 6 | reported by the response | 961 |
| 37 | 2026-11-25T18:13:13Z | POST /v1/sound-generation | step.4 take 1, variant 4 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.5 s | 6 | reported by the response | 967 |
| 38 | 2026-11-25T18:13:14Z | POST /v1/sound-generation | button-press take 1 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.1 s | 6 | reported by the response | 973 |
| 39 | 2026-11-25T18:13:17Z | POST /v1/sound-generation | page-turn take 1 | 1.2 s | HTTP 200, 1.9 s | 13 | reported by the response | 986 |
| 40 | 2026-11-25T18:13:19Z | POST /v1/sound-generation | keyboard-rise take 1 | 1 s | HTTP 200, 2.5 s | 11 | reported by the response | 997 |
| 41 | 2026-11-25T18:13:22Z | POST /v1/sound-generation | key-press.1 take 1, variant 1 of 6 | 0.5 s for a cue of 0.15 s | HTTP 200, 2.3 s | 6 | reported by the response | 1003 |
| 42 | 2026-11-25T18:13:24Z | POST /v1/sound-generation | key-press.2 take 1, variant 2 of 6 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.7 s | 6 | reported by the response | 1009 |
| 43 | 2026-11-25T18:13:26Z | POST /v1/sound-generation | key-press.3 take 1, variant 3 of 6 | 0.5 s for a cue of 0.15 s | HTTP 200, 2.7 s | 6 | reported by the response | 1015 |
| 44 | 2026-11-25T18:13:29Z | POST /v1/sound-generation | key-press.4 take 1, variant 4 of 6 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.7 s | 6 | reported by the response | 1021 |
| 45 | 2026-11-25T18:13:31Z | POST /v1/sound-generation | key-press.5 take 1, variant 5 of 6 | 0.5 s for a cue of 0.15 s | HTTP 200, 2.2 s | 6 | reported by the response | 1027 |
| 46 | 2026-11-25T18:13:34Z | POST /v1/sound-generation | key-press.6 take 1, variant 6 of 6 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.5 s | 6 | reported by the response | 1033 |
| 47 | 2026-11-25T18:13:35Z | POST /v1/sound-generation | turret-rise take 1 | 0.6 s | HTTP 200, 2.2 s | 7 | reported by the response | 1040 |
| 48 | 2026-11-25T18:13:38Z | POST /v1/sound-generation | bolt-fire.1 take 1, variant 1 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.6 s | 6 | reported by the response | 1046 |
| 49 | 2026-11-25T18:13:41Z | POST /v1/sound-generation | bolt-fire.2 take 1, variant 2 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.0 s | 6 | reported by the response | 1052 |
| 50 | 2026-11-25T18:13:43Z | POST /v1/sound-generation | bolt-fire.3 take 1, variant 3 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.6 s | 6 | reported by the response | 1058 |
| 51 | 2026-11-25T18:13:45Z | POST /v1/sound-generation | bolt-hit.1 take 1, variant 1 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.1 s | 6 | reported by the response | 1064 |
| 52 | 2026-11-25T18:13:47Z | POST /v1/sound-generation | bolt-hit.2 take 1, variant 2 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.5 s | 6 | reported by the response | 1070 |
| 53 | 2026-11-25T18:13:49Z | POST /v1/sound-generation | bolt-hit.3 take 1, variant 3 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.5 s | 6 | reported by the response | 1076 |
| 54 | 2026-11-25T18:13:51Z | POST /v1/sound-generation | sizzle take 1 | 1.2 s | HTTP 200, 2.0 s | 13 | reported by the response | 1089 |
| 55 | 2026-11-25T18:13:53Z | POST /v1/sound-generation | keys-shuffle take 1 | 0.7 s | HTTP 200, 1.9 s | 8 | reported by the response | 1097 |
| 56 | 2026-11-25T18:13:55Z | POST /v1/sound-generation | slab-drop.1 take 1, variant 1 of 3 | 0.8 s | HTTP 200, 2.3 s | 9 | reported by the response | 1106 |
| 57 | 2026-11-25T18:13:58Z | POST /v1/sound-generation | slab-drop.2 take 1, variant 2 of 3 | 0.8 s | HTTP 200, 2.1 s | 9 | reported by the response | 1115 |
| 58 | 2026-11-25T18:14:45Z | POST /v1/sound-generation | slab-drop.3 take 1, variant 3 of 3 | 0.8 s | HTTP 200, 1.4 s | 9 | reported by the response | 1124 |
| 59 | 2026-11-25T18:14:47Z | POST /v1/sound-generation | paper-slide take 1 | 0.6 s | HTTP 200, 1.9 s | 7 | reported by the response | 1131 |
| 60 | 2026-11-25T18:14:49Z | POST /v1/sound-generation | shredder take 1 | 4 s, a loop | HTTP 200, 3.2 s | 44 | reported by the response | 1175 |
| 61 | 2026-11-25T18:14:53Z | POST /v1/sound-generation | paper-strain take 1 | 1.5 s | HTTP 200, 2.2 s | 17 | reported by the response | 1192 |
| 62 | 2026-11-25T18:14:55Z | POST /v1/sound-generation | strips-zip take 1 | 1 s | HTTP 200, 2.1 s | 11 | reported by the response | 1203 |
| 63 | 2026-11-25T18:14:57Z | POST /v1/sound-generation | row-open take 1 | 0.6 s | HTTP 200, 2.4 s | 7 | reported by the response | 1210 |
| 64 | 2026-11-25T18:15:00Z | POST /v1/sound-generation | dial-wind take 1 | 0.8 s | HTTP 200, 2.1 s | 9 | reported by the response | 1219 |
| 65 | 2026-11-25T18:15:02Z | POST /v1/sound-generation | dial-return take 1 | 0.9 s | HTTP 200, 2.8 s | 10 | reported by the response | 1229 |
| 66 | 2026-11-25T18:15:05Z | POST /v1/sound-generation | lever-pull take 1 | 0.7 s | HTTP 200, 2.8 s | 8 | reported by the response | 1237 |
| 67 | 2026-11-25T18:15:08Z | POST /v1/sound-generation | reels-spin take 1 | 2.5 s | HTTP 200, 2.6 s | 28 | reported by the response | 1265 |
| 68 | 2026-11-25T18:15:11Z | POST /v1/sound-generation | coins.1 take 1, variant 1 of 2 | 1.5 s | HTTP 200, 2.0 s | 17 | reported by the response | 1282 |
| 69 | 2026-11-25T18:15:13Z | POST /v1/sound-generation | coins.2 take 1, variant 2 of 2 | 1.5 s | HTTP 200, 1.6 s | 17 | reported by the response | 1299 |
| 70 | 2026-11-25T18:15:15Z | POST /v1/sound-generation | crank-turn take 1 | 0.8 s | HTTP 200, 2.2 s | 9 | reported by the response | 1308 |
| 71 | 2026-11-25T18:15:18Z | POST /v1/sound-generation | crank-runaway take 1 | 2 s | HTTP 200, 2.3 s | 22 | reported by the response | 1330 |
| 72 | 2026-11-25T18:15:20Z | POST /v1/sound-generation | flatten take 1 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.4 s | 6 | reported by the response | 1336 |
| 73 | 2026-11-25T18:15:23Z | POST /v1/sound-generation | peel-up take 1 | 0.6 s | HTTP 200, 2.1 s | 7 | reported by the response | 1343 |
| 74 | 2026-11-25T18:15:25Z | POST /v1/sound-generation | ball-seal take 1 | 1 s | HTTP 200, 2.3 s | 11 | reported by the response | 1354 |
| 75 | 2026-11-25T18:15:28Z | POST /v1/sound-generation | tube-run take 1 | 1.5 s | HTTP 200, 2.2 s | 17 | reported by the response | 1371 |
| 76 | 2026-11-25T18:15:30Z | POST /v1/sound-generation | lights-down take 1 | 1.5 s | HTTP 200, 2.5 s | 17 | reported by the response | 1388 |
| 77 | 2026-11-25T18:15:33Z | POST /v1/sound-generation | power-on take 1 | 2.5 s | HTTP 200, 2.8 s | 28 | reported by the response | 1416 |
| 78 | 2026-11-25T18:15:36Z | POST /v1/sound-generation | plunger take 1 | 0.8 s | HTTP 200, 2.1 s | 9 | reported by the response | 1425 |
| 79 | 2026-11-25T18:15:38Z | POST /v1/sound-generation | bumper.1 take 1, variant 1 of 4 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.5 s | 6 | reported by the response | 1431 |
| 80 | 2026-11-25T18:15:41Z | POST /v1/sound-generation | bumper.2 take 1, variant 2 of 4 | 0.5 s for a cue of 0.3 s | HTTP 200, 1.8 s | 6 | reported by the response | 1437 |
| 81 | 2026-11-25T18:15:43Z | POST /v1/sound-generation | bumper.3 take 1, variant 3 of 4 | 0.5 s for a cue of 0.3 s | HTTP 200, 1.8 s | 6 | reported by the response | 1443 |
| 82 | 2026-11-25T18:15:45Z | POST /v1/sound-generation | bumper.4 take 1, variant 4 of 4 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.0 s | 6 | reported by the response | 1449 |
