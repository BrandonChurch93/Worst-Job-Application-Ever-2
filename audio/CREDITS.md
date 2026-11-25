# The sound credits of this build

This build may spend at most 10000 ElevenLabs credits in all, on every call of every kind. 2000 of them are held back for what Brandon asks for at the review, so the build stops at 8000 before it. Nothing extra is made once the total passes 8000.

The count is of this build's own calls, never of what the account has left: the account is shared with other builds. Every call goes through `npm run credits`, which writes its row here before it returns and makes no call that would pass the limit. A sound effect is never asked for without its length. `kit/addenda/001-sound-budget-and-narrator.md` sets these rules. This file is written by the tool from `audio/CREDITS.json`.

Running total: 723 of 10000. Calls: 32.

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
