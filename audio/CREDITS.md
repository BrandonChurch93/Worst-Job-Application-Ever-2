# The sound credits of this build

This build may spend at most 10000 ElevenLabs credits in all, on every call of every kind. 2000 of them are held back for what Brandon asks for at the review, so the build stops at 8000 before it. Nothing extra is made once the total passes 8000.

The count is of this build's own calls, never of what the account has left: the account is shared with other builds. Every call goes through `npm run credits`, which writes its row here before it returns and makes no call that would pass the limit. A sound effect is never asked for without its length. `kit/addenda/001-sound-budget-and-narrator.md` sets these rules. This file is written by the tool from `audio/CREDITS.json`.

Running total: 120 of 10000. Calls: 7.

## Rates

- Speech: 0.439 credits a character. MEASURED 2026-11-25T17:44:37Z on call 3: 18 credits for 41 characters, reported by the response; the account's usage moved by 0 across the call.
- Sound effects: not measured yet. Until it is, a call is checked at 40 credits a second

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
