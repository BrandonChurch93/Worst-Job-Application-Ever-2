# The sound credits of this build

This build may spend at most 10000 ElevenLabs credits in all, on every call of every kind. 2000 of them are held back for what Brandon asks for at the review, so the build stops at 4677 before it. Nothing extra is made once the total passes 8000.

The count is of this build's own calls, never of what the account has left: the account is shared with other builds. Every call goes through `npm run credits`, which writes its row here before it returns and makes no call that would pass the limit. A sound effect is never asked for without its length. `kit/addenda/001-sound-budget-and-narrator.md` sets these rules. This file is written by the tool from `audio/CREDITS.json`.

Running total: 3166 of 10000. Calls: 196.

Hard limit: 4677. Brandon, by Partner, change note 003 update 4, 2026-11-27: "2,000 ElevenLabs credits for everything in change notes 002 and 003 together: narration, the shout, and every new sound effect"; "the ledger does not pass 4,677 without his word". Left before it: 1511. No call is made that would pass it.

## Rates

- Speech: 0.439 credits a character. MEASURED 2026-11-25T17:44:37Z on call 3: 18 credits for 41 characters, reported by the response; the account's usage moved by 0 across the call.
- Sound effects: 12 credits a second. MEASURED 2026-11-25T17:54:46Z on call 11: 6 credits for 0.5 s asked, reported by the response; the account's usage moved by 0 across the call.
- Speech with the model eleven_v3: 0.4384 credits a character. MEASURED 2026-11-27T23:06:02Z on call 181: 32 credits for 73 characters, reported by the response.
- Speech with the model eleven_v4: 0.4483 credits a character. MEASURED 2026-11-28T00:26:48Z on call 188: 26 credits for 58 characters, reported by the response; the account's usage moved by 0 across the call.

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
| 83 | 2026-11-25T18:16:18Z | POST /v1/sound-generation | scoop-kick take 1 | 0.6 s | HTTP 200, 2.0 s | 7 | reported by the response | 1456 |
| 84 | 2026-11-25T18:16:21Z | POST /v1/sound-generation | flasher take 1 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.0 s | 6 | reported by the response | 1462 |
| 85 | 2026-11-25T18:16:23Z | POST /v1/sound-generation | ramp-roll take 1 | 2 s | HTTP 200, 2.4 s | 22 | reported by the response | 1484 |
| 86 | 2026-11-25T18:16:26Z | POST /v1/sound-generation | ball-drop take 1 | 0.5 s | HTTP 200, 2.5 s | 6 | reported by the response | 1490 |
| 87 | 2026-11-25T18:16:28Z | POST /v1/sound-generation | flipper.1 take 1, variant 1 of 3 | 0.5 s for a cue of 0.2 s | HTTP 200, 2.1 s | 6 | reported by the response | 1496 |
| 88 | 2026-11-25T18:16:31Z | POST /v1/sound-generation | flipper.2 take 1, variant 2 of 3 | 0.5 s for a cue of 0.2 s | HTTP 200, 2.1 s | 6 | reported by the response | 1502 |
| 89 | 2026-11-25T18:16:33Z | POST /v1/sound-generation | flipper.3 take 1, variant 3 of 3 | 0.5 s for a cue of 0.2 s | HTTP 200, 1.7 s | 6 | reported by the response | 1508 |
| 90 | 2026-11-25T18:16:35Z | POST /v1/sound-generation | doors-slam take 1 | 0.6 s | HTTP 200, 2.0 s | 7 | reported by the response | 1515 |
| 91 | 2026-11-25T18:16:37Z | POST /v1/sound-generation | drain take 1 | 1.2 s | HTTP 200, 2.4 s | 13 | reported by the response | 1528 |
| 92 | 2026-11-25T18:16:40Z | POST /v1/sound-generation | tier-fall take 1 | 0.8 s | HTTP 200, 2.3 s | 9 | reported by the response | 1537 |
| 93 | 2026-11-25T18:16:43Z | POST /v1/sound-generation | lift take 1 | 1 s | HTTP 200, 2.4 s | 11 | reported by the response | 1548 |
| 94 | 2026-11-25T18:16:45Z | POST /v1/sound-generation | spiral take 1 | 2 s | HTTP 200, 2.5 s | 22 | reported by the response | 1570 |
| 95 | 2026-11-25T18:16:48Z | POST /v1/sound-generation | spinner take 1 | 0.8 s | HTTP 200, 2.0 s | 9 | reported by the response | 1579 |
| 96 | 2026-11-25T18:16:50Z | POST /v1/sound-generation | drop-target.1 take 1, variant 1 of 2 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.4 s | 6 | reported by the response | 1585 |
| 97 | 2026-11-25T18:16:54Z | POST /v1/sound-generation | drop-target.2 take 1, variant 2 of 2 | 0.5 s for a cue of 0.3 s | HTTP 200, 1.7 s | 6 | reported by the response | 1591 |
| 98 | 2026-11-25T18:16:56Z | POST /v1/sound-generation | sling.1 take 1, variant 1 of 2 | 0.5 s for a cue of 0.25 s | HTTP 200, 2.5 s | 6 | reported by the response | 1597 |
| 99 | 2026-11-25T18:16:58Z | POST /v1/sound-generation | sling.2 take 1, variant 2 of 2 | 0.5 s for a cue of 0.25 s | HTTP 200, 1.5 s | 6 | reported by the response | 1603 |
| 100 | 2026-11-25T18:17:00Z | POST /v1/sound-generation | ball-open take 1 | 0.7 s | HTTP 200, 2.0 s | 8 | reported by the response | 1611 |
| 101 | 2026-11-25T18:17:02Z | POST /v1/sound-generation | checkbox take 1 | 0.5 s for a cue of 0.2 s | HTTP 200, 2.2 s | 6 | reported by the response | 1617 |
| 102 | 2026-11-25T18:17:05Z | POST /v1/sound-generation | button-crack take 1 | 1 s | HTTP 200, 2.0 s | 11 | reported by the response | 1628 |
| 103 | 2026-11-25T18:17:07Z | POST /v1/sound-generation | unfold take 1 | 2 s | HTTP 200, 2.3 s | 22 | reported by the response | 1650 |
| 104 | 2026-11-25T18:17:10Z | POST /v1/sound-generation | boss-loop take 1 | 8 s, a loop | HTTP 200, 4.0 s | 88 | reported by the response | 1738 |
| 105 | 2026-11-25T18:17:15Z | POST /v1/sound-generation | dart-fire.1 take 1, variant 1 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 2.5 s | 6 | reported by the response | 1744 |
| 106 | 2026-11-25T18:17:17Z | POST /v1/sound-generation | dart-fire.2 take 1, variant 2 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.8 s | 6 | reported by the response | 1750 |
| 107 | 2026-11-25T18:17:19Z | POST /v1/sound-generation | dart-fire.3 take 1, variant 3 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.9 s | 6 | reported by the response | 1756 |
| 108 | 2026-11-25T18:17:52Z | POST /v1/sound-generation | dart-fire.4 take 1, variant 4 of 4 | 0.5 s for a cue of 0.15 s | HTTP 200, 1.6 s | 6 | reported by the response | 1762 |
| 109 | 2026-11-25T18:17:54Z | POST /v1/sound-generation | dart-hit.1 take 1, variant 1 of 4 | 0.5 s for a cue of 0.2 s | HTTP 200, 2.0 s | 6 | reported by the response | 1768 |
| 110 | 2026-11-25T18:17:57Z | POST /v1/sound-generation | dart-hit.2 take 1, variant 2 of 4 | 0.5 s for a cue of 0.2 s | HTTP 200, 1.7 s | 6 | reported by the response | 1774 |
| 111 | 2026-11-25T18:17:58Z | POST /v1/sound-generation | dart-hit.3 take 1, variant 3 of 4 | 0.5 s for a cue of 0.2 s | HTTP 200, 1.6 s | 6 | reported by the response | 1780 |
| 112 | 2026-11-25T18:18:00Z | POST /v1/sound-generation | dart-hit.4 take 1, variant 4 of 4 | 0.5 s for a cue of 0.2 s | HTTP 200, 2.0 s | 6 | reported by the response | 1786 |
| 113 | 2026-11-25T18:18:02Z | POST /v1/sound-generation | slab-fire.1 take 1, variant 1 of 3 | 0.5 s | HTTP 200, 2.4 s | 6 | reported by the response | 1792 |
| 114 | 2026-11-25T18:18:05Z | POST /v1/sound-generation | slab-fire.2 take 1, variant 2 of 3 | 0.5 s | HTTP 200, 1.9 s | 6 | reported by the response | 1798 |
| 115 | 2026-11-25T18:18:07Z | POST /v1/sound-generation | slab-fire.3 take 1, variant 3 of 3 | 0.5 s | HTTP 200, 2.2 s | 6 | reported by the response | 1804 |
| 116 | 2026-11-25T18:18:10Z | POST /v1/sound-generation | popup.1 take 1, variant 1 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.6 s | 6 | reported by the response | 1810 |
| 117 | 2026-11-25T18:18:13Z | POST /v1/sound-generation | popup.2 take 1, variant 2 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.6 s | 6 | reported by the response | 1816 |
| 118 | 2026-11-25T18:18:14Z | POST /v1/sound-generation | popup.3 take 1, variant 3 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.7 s | 6 | reported by the response | 1822 |
| 119 | 2026-11-25T18:18:16Z | POST /v1/sound-generation | power-down take 1 | 1.8 s | HTTP 200, 2.2 s | 20 | reported by the response | 1842 |
| 120 | 2026-11-25T18:18:19Z | POST /v1/sound-generation | hold-music take 1 | 4 s, a loop | HTTP 200, 3.4 s | 44 | reported by the response | 1886 |
| 121 | 2026-11-25T18:18:23Z | POST /v1/sound-generation | letter-drop take 1 | 0.5 s | HTTP 200, 2.8 s | 6 | reported by the response | 1892 |
| 122 | 2026-11-25T18:18:26Z | POST /v1/sound-generation | stamp take 1 | 0.6 s | HTTP 200, 2.3 s | 7 | reported by the response | 1899 |
| 123 | 2026-11-25T18:18:28Z | POST /v1/sound-generation | ui-tick take 1 | 0.5 s for a cue of 0.08 s | HTTP 200, 2.3 s | 6 | reported by the response | 1905 |
| 124 | 2026-11-25T18:18:31Z | POST /v1/sound-generation | key-tap take 1 | 0.5 s for a cue of 0.1 s | HTTP 200, 2.4 s | 6 | reported by the response | 1911 |
| 125 | 2026-11-25T18:18:34Z | POST /v1/sound-generation | ui-send take 1 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.2 s | 6 | reported by the response | 1917 |
| 126 | 2026-11-25T18:30:09Z | POST /v1/text-to-speech | line.live.idle.0 take 1, breaks of 1.3 s | 105 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 37 | reported by the response | 1954 |
| 127 | 2026-11-25T18:30:10Z | POST /v1/text-to-speech | line.live.idle.1 take 1, breaks of 1.9 s | 58 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 21 | reported by the response | 1975 |
| 128 | 2026-11-25T18:30:11Z | POST /v1/text-to-speech | line.live.hit.0 take 1, breaks of 0.0 s | 4 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 2 | reported by the response | 1977 |
| 129 | 2026-11-25T18:30:12Z | POST /v1/text-to-speech | line.live.hit.1 take 1, breaks of 0.0 s | 6 characters, stability 0.75, speed 0.7 | HTTP 200, 0.8 s | 3 | reported by the response | 1980 |
| 130 | 2026-11-25T18:30:13Z | POST /v1/text-to-speech | line.live.hit.2 take 1, breaks of 1.1 s | 49 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 17 | reported by the response | 1997 |
| 131 | 2026-11-25T18:30:14Z | POST /v1/text-to-speech | line.live.hit.3 take 1, breaks of 1.0 s | 46 characters, stability 0.75, speed 0.7 | HTTP 200, 0.8 s | 15 | reported by the response | 2012 |
| 132 | 2026-11-25T18:30:16Z | POST /v1/text-to-speech | line.live.slowTyping.0 take 1, breaks of 1.0 s | 44 characters, stability 0.75, speed 0.7 | HTTP 200, 0.8 s | 15 | reported by the response | 2027 |
| 133 | 2026-11-25T18:30:17Z | POST /v1/text-to-speech | line.live.realKeyboard.0 take 1, breaks of 1.1 s | 54 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 19 | reported by the response | 2046 |
| 134 | 2026-11-25T18:30:18Z | POST /v1/text-to-speech | line.live.tugLost.0 take 1, breaks of 1.1 s | 53 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 18 | reported by the response | 2064 |
| 135 | 2026-11-25T18:30:19Z | POST /v1/text-to-speech | line.live.pinball.flipper.0 take 1, breaks of 1.0 s | 92 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 31 | reported by the response | 2095 |
| 136 | 2026-11-25T18:30:20Z | POST /v1/text-to-speech | line.live.boss.verify.0 take 1, breaks of 1.4 s | 50 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 17 | reported by the response | 2112 |
| 137 | 2026-11-25T18:30:22Z | POST /v1/text-to-speech | line.live.boss.slow.0 take 1, breaks of 1.4 s | 56 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 20 | reported by the response | 2132 |
| 138 | 2026-11-25T18:30:23Z | POST /v1/text-to-speech | line.live.skip.0 take 1, breaks of 1.0 s | 88 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 29 | reported by the response | 2161 |
| 139 | 2026-11-25T18:30:24Z | POST /v1/text-to-speech | line.live.watchFilm.0 take 1, breaks of 1.1 s | 60 characters, stability 0.75, speed 0.7 | HTTP 200, 0.8 s | 22 | reported by the response | 2183 |
| 140 | 2026-11-25T18:44:16Z | POST /v1/text-to-speech | line.step1.firstName.1 take 2, breaks of 1.0 s | 79 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 25 | reported by the response | 2208 |
| 141 | 2026-11-25T18:44:17Z | POST /v1/text-to-speech | line.step2.crank.0 take 2, breaks of 1.0 s | 88 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 29 | reported by the response | 2237 |
| 142 | 2026-11-25T18:44:18Z | POST /v1/text-to-speech | line.live.idle.1 take 2, breaks of 1.9 s | 58 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 21 | reported by the response | 2258 |
| 143 | 2026-11-25T18:44:20Z | POST /v1/text-to-speech | line.live.hit.0 take 2, breaks of 0.0 s | 4 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 2 | reported by the response | 2260 |
| 144 | 2026-11-25T18:44:21Z | POST /v1/text-to-speech | line.live.boss.slow.0 take 2, breaks of 1.9 s | 56 characters, stability 0.75, speed 0.7 | HTTP 200, 0.9 s | 20 | reported by the response | 2280 |
| 145 | 2026-11-25T18:44:23Z | POST /v1/sound-generation | page-turn take 2 | 1.2 s | HTTP 200, 2.9 s | 13 | reported by the response | 2293 |
| 146 | 2026-11-25T18:44:26Z | POST /v1/sound-generation | slab-drop.2 take 2, variant 2 of 3 | 0.8 s | HTTP 200, 1.4 s | 9 | reported by the response | 2302 |
| 147 | 2026-11-25T18:44:28Z | POST /v1/sound-generation | strips-zip take 2 | 1 s | HTTP 200, 2.5 s | 11 | reported by the response | 2313 |
| 148 | 2026-11-25T18:44:31Z | POST /v1/sound-generation | button-crack take 2 | 1 s | HTTP 200, 2.9 s | 11 | reported by the response | 2324 |
| 149 | 2026-11-25T18:44:34Z | POST /v1/sound-generation | dart-hit.4 take 2, variant 4 of 4 | 0.5 s for a cue of 0.2 s | HTTP 200, 2.3 s | 6 | reported by the response | 2330 |
| 150 | 2026-11-25T18:44:37Z | POST /v1/sound-generation | popup.1 take 2, variant 1 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.9 s | 6 | reported by the response | 2336 |
| 151 | 2026-11-25T18:44:39Z | POST /v1/sound-generation | popup.2 take 2, variant 2 of 3 | 0.5 s for a cue of 0.4 s | HTTP 200, 1.5 s | 6 | reported by the response | 2342 |
| 152 | 2026-11-25T18:44:53Z | POST /v1/text-to-speech | line.step2.crank.0 take 3, breaks of 1.3 s | 88 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 29 | reported by the response | 2371 |
| 153 | 2026-11-25T18:44:54Z | POST /v1/text-to-speech | line.live.idle.1 take 3, breaks of 2.4 s | 58 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 21 | reported by the response | 2392 |
| 154 | 2026-11-25T18:44:55Z | POST /v1/text-to-speech | line.live.boss.verify.0 take 2, breaks of 1.4 s | 50 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 17 | reported by the response | 2409 |
| 155 | 2026-11-25T18:45:54Z | POST /v1/text-to-speech | line.step1.email.0 take 2, breaks of 0.1 s | 125 characters, stability 0.75, speed 0.7 | HTTP 200, 1.0 s | 40 | reported by the response | 2449 |
| 156 | 2026-11-25T18:46:20Z | POST /v1/text-to-speech | line.step1.email.0 take 3, breaks of 0.1 s | 125 characters, stability 0.75, speed 0.7 | HTTP 200, 1.1 s | 40 | reported by the response | 2489 |
| 157 | 2026-11-25T18:47:16Z | POST /v1/sound-generation | slab-drop.3 take 2, variant 3 of 3 | 0.8 s | HTTP 200, 1.6 s | 9 | reported by the response | 2498 |
| 158 | 2026-11-25T19:03:38Z | POST /v1/sound-generation | slab-drop.3 take 3, variant 3 of 3 | 0.8 s | HTTP 200, 1.7 s | 9 | reported by the response | 2507 |
| 159 | 2026-11-25T19:03:40Z | POST /v1/sound-generation | strips-zip take 3 | 1 s | HTTP 200, 1.7 s | 11 | reported by the response | 2518 |
| 160 | 2026-11-25T19:03:42Z | POST /v1/sound-generation | dart-hit.4 take 3, variant 4 of 4 | 0.5 s for a cue of 0.2 s | HTTP 200, 1.9 s | 6 | reported by the response | 2524 |
| 161 | 2026-11-25T19:11:32Z | POST /v1/sound-generation | slab-drop.2 take 3, variant 2 of 3 | 0.8 s | HTTP 200, 1.8 s | 9 | reported by the response | 2533 |
| 162 | 2026-11-25T19:24:24Z | POST /v1/sound-generation | tug-lost take 1 | 0.6 s | HTTP 200, 2.0 s | 7 | reported by the response | 2540 |
| 163 | 2026-11-25T19:24:26Z | POST /v1/sound-generation | arms-out take 1 | 0.5 s | HTTP 200, 2.0 s | 6 | reported by the response | 2546 |
| 164 | 2026-11-25T19:24:29Z | POST /v1/sound-generation | dial-fling take 1 | 0.8 s | HTTP 200, 2.4 s | 9 | reported by the response | 2555 |
| 165 | 2026-11-25T19:24:31Z | POST /v1/sound-generation | flipper-save take 1 | 0.5 s for a cue of 0.4 s | HTTP 200, 2.3 s | 6 | reported by the response | 2561 |
| 166 | 2026-11-25T19:24:34Z | POST /v1/sound-generation | session-expired take 1 | 0.8 s | HTTP 200, 2.1 s | 9 | reported by the response | 2570 |
| 167 | 2026-11-25T19:24:37Z | POST /v1/sound-generation | popup-close take 1 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.3 s | 6 | reported by the response | 2576 |
| 168 | 2026-11-25T19:24:39Z | POST /v1/sound-generation | carpet-roll take 1 | 1 s | HTTP 200, 2.2 s | 11 | reported by the response | 2587 |
| 169 | 2026-11-25T19:24:42Z | POST /v1/sound-generation | inbox-take take 1 | 0.6 s | HTTP 200, 2.2 s | 7 | reported by the response | 2594 |
| 170 | 2026-11-25T19:24:45Z | POST /v1/sound-generation | firehouse-take take 1 | 0.6 s | HTTP 200, 2.3 s | 7 | reported by the response | 2601 |
| 171 | 2026-11-25T19:24:47Z | POST /v1/sound-generation | metrics-card take 1 | 0.5 s | HTTP 200, 2.2 s | 6 | reported by the response | 2607 |
| 172 | 2026-11-25T19:24:50Z | POST /v1/sound-generation | skip take 1 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.1 s | 6 | reported by the response | 2613 |
| 173 | 2026-11-25T19:25:02Z | POST /v1/sound-generation | popup-close take 2 | 0.5 s for a cue of 0.3 s | HTTP 200, 2.2 s | 6 | reported by the response | 2619 |
| 174 | 2026-11-25T19:27:30Z | POST /v1/sound-generation | session-expired take 2 | 0.8 s | HTTP 200, 1.8 s | 9 | reported by the response | 2628 |
| 175 | 2026-11-25T19:28:56Z | POST /v1/sound-generation | session-expired take 3 | 0.8 s | HTTP 200, 4.5 s | 9 | reported by the response | 2637 |
| 176 | 2026-11-25T19:29:01Z | POST /v1/sound-generation | carpet-roll take 2 | 1 s | HTTP 200, 1.6 s | 11 | reported by the response | 2648 |
| 177 | 2026-11-25T19:30:12Z | POST /v1/sound-generation | carpet-roll take 3 | 1 s | HTTP 200, 2.1 s | 11 | reported by the response | 2659 |
| 178 | 2026-11-25T20:06:01Z | POST /v1/text-to-speech | line.live.tugLost.0 take 2, breaks of 1.1 s | 53 characters, stability 0.75, speed 0.7 | HTTP 200, 0.8 s | 18 | reported by the response | 2677 |
| 179 | 2026-11-27T23:03:32Z | GET /v1/models | which models may speak | nothing, a read | 9 models that speak | 0 | a read costs nothing | 2677 |
| 180 | 2026-11-27T23:03:44Z | GET /v1/voices/{the narrator} | what the narrator's voice is | nothing, a read | voice Worst-Job-Application-Ever, generated | 0 | a read costs nothing | 2677 |
| 181 | 2026-11-27T23:06:02Z | POST /v1/text-to-speech | SHOUT A take 1 (change note 003 update 4): model eleven_v3, stability 0, tags shouting then screaming, drawn out | 73 characters, stability 0, model eleven_v3 | HTTP 200, 2.1 s | 32 | reported by the response | 2709 |
| 182 | 2026-11-27T23:06:04Z | POST /v1/text-to-speech | SHOUT B take 1 (change note 003 update 4): model eleven_v3, stability 0, tags shouting then screaming, drawn out | 81 characters, stability 0, model eleven_v3 | HTTP 200, 2.5 s | 36 | reported by the response | 2745 |
| 183 | 2026-11-27T23:07:46Z | POST /v1/text-to-speech | SHOUT A take 2: model eleven_v3, stability 0, the vowels written long, tags screaming, louder, screaming at the top of his lungs | 108 characters, stability 0, model eleven_v3 | HTTP 200, 2.9 s | 48 | reported by the response | 2793 |
| 184 | 2026-11-27T23:07:49Z | POST /v1/text-to-speech | SHOUT B take 2: model eleven_v3, stability 0, the vowels written long, tags shouting slow and drawn out, then screaming at the top of his lungs | 121 characters, stability 0, model eleven_v3 | HTTP 200, 3.1 s | 53 | reported by the response | 2846 |
| 185 | 2026-11-27T23:09:06Z | POST /v1/text-to-speech | SHOUT B take 3: model eleven_v3, stability 0, four shorter syllables and the last written much longer, tags shouting drawn out, then screaming at the top of his lungs held long | 128 characters, stability 0, model eleven_v3 | HTTP 200, 2.6 s | 56 | reported by the response | 2902 |
| 186 | 2026-11-28T00:07:09Z | GET /v1/user/subscription | the account's quota | nothing, a read | plan creator, active: 17512 of 131000 used by every build on the account, reset 2026-12-25T16:56:49Z | 0 | a read costs nothing | 2902 |
| 187 | 2026-11-28T00:23:17Z | GET /v1/models | which models may speak | nothing, a read | 9 models that speak | 0 | a read costs nothing | 2902 |
| 188 | 2026-11-28T00:26:48Z | POST /v1/text-to-speech | SHOUT A round 2 take 1, voice Jerry B. Heroic Action Protagonist (change note 003 update 7) | 58 characters, stability 0, model eleven_v4 | HTTP 200, 8.8 s | 26 | reported by the response; the account's usage moved by 0 across the call | 2928 |
| 189 | 2026-11-28T00:27:10Z | POST /v1/text-to-speech | SHOUT B round 2 take 1, voice Jerry B. Heroic Action Protagonist (change note 003 update 7) | 54 characters, stability 0, model eleven_v4 | HTTP 200, 1.2 s | 24 | reported by the response; the account's usage moved by 0 across the call | 2952 |
| 190 | 2026-11-28T00:27:15Z | POST /v1/text-to-speech | SHOUT A round 2 take 1, voice Jerry B. Gruff and Gritty Commander (change note 003 update 7) | 58 characters, stability 0, model eleven_v4 | HTTP 200, 6.1 s | 26 | reported by the response; the account's usage moved by 0 across the call | 2978 |
| 191 | 2026-11-28T00:27:24Z | POST /v1/text-to-speech | SHOUT B round 2 take 1, voice Jerry B. Gruff and Gritty Commander (change note 003 update 7) | 54 characters, stability 0, model eleven_v4 | HTTP 200, 1.4 s | 24 | reported by the response; the account's usage moved by 0 across the call | 3002 |
| 192 | 2026-11-28T00:29:57Z | POST /v1/text-to-speech | SHOUT A round 2 take 2, voice Jerry B. Gruff and Gritty Commander, speed 0.8 (change note 003 update 7) | 69 characters, stability 0, speed 0.8, model eleven_v4 | HTTP 200, 1.5 s | 30 | reported by the response; the account's usage moved by 0 across the call | 3032 |
| 193 | 2026-11-28T00:30:02Z | POST /v1/text-to-speech | SHOUT B round 2 take 2, voice Jerry B. Gruff and Gritty Commander, speed 0.8 (change note 003 update 7) | 69 characters, stability 0, speed 0.8, model eleven_v4 | HTTP 200, 1.7 s | 30 | reported by the response; the account's usage moved by 0 across the call | 3062 |
| 194 | 2026-11-28T00:30:32Z | POST /v1/text-to-speech | SHOUT A round 2 take 3, voice Jerry B. Gruff and Gritty Commander, speed 0.7 (change note 003 update 7) | 75 characters, stability 0, speed 0.7, model eleven_v4 | HTTP 200, 1.4 s | 33 | reported by the response; the account's usage moved by 0 across the call | 3095 |
| 195 | 2026-11-28T00:30:38Z | POST /v1/text-to-speech | SHOUT B round 2 take 3, voice Jerry B. Gruff and Gritty Commander, speed 0.7 (change note 003 update 7) | 86 characters, stability 0, speed 0.7, model eleven_v4 | HTTP 200, 1.5 s | 38 | reported by the response; the account's usage moved by 0 across the call | 3133 |
| 196 | 2026-11-28T00:31:24Z | POST /v1/text-to-speech | SHOUT A round 2 take 4, voice Jerry B. Gruff and Gritty Commander, speed 0.7 (change note 003 update 7) | 74 characters, stability 0, speed 0.7, model eleven_v4 | HTTP 200, 1.4 s | 33 | reported by the response; the account's usage moved by 0 across the call | 3166 |
