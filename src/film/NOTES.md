# Film side: notes and decisions

Owner: the film builder, branch `agent/film`. Phase 2, stand-ins only.

## What is here

- `index.ts`: `makeOpening()` and `makeLoop()`, both plain synchronous makers. `frame(index)` and `pose(index)` take a whole or a fractional index and are pure functions of it.
- `opening.ts`: the two screens of film A's opening as two layout trees, and their timing from `intro`.
- `fire.ts`: the scene of the card loop behind `fireScene(phase)`: a stand-in keyboard deck, two stand-in turrets, the bolts, the scorch marks, and the cursor's recorded period.
- `loop.ts`: the card loop as a `FilmPiece`, with `state(index)`.

## Decisions

1. The opening's length. `intro` gives the typing (`prompt.length / charsPerSecond`), the read hold, the steps and the end hold. It does not give how long the reasoning level takes to set or how long the send takes. Those two are `LEVEL_SECONDS` 0.5 s and `SEND_SECONDS` 0.3 s in `opening.ts`. With the config as it stands the opening is 716 frames, 11.933 s, under `intro.maxSeconds`. If the config's numbers ever give more than the limit, the test `tests/film.test.ts` fails and says so: the config is not changed and nothing is clamped.
2. The first letter of the prompt is on frame 0 and letter k appears at `(k - 1) / charsPerSecond`, so frame 0 is a finished picture that is already being typed.
3. The reasoning level control is a pill at the foot of the input. It opens a menu of three options below itself for 0.4 s. Only `intro.reasoningLevel` has a word in the config, so the other two options and the level before the change are blank bars: no word is invented.
4. The opening has no cursor. The hero's first frame is the careers page.
5. The opening is drawn on a dark screen (tone `dark`, not black) with the input as a raised panel, the nearest stand-in to the named fallback of `kit/03-METHOD.md` section 13. It was made without the team's skill in this phase: this is the stand-in with the right length.
6. The card loop's scene is `deliver.cardLoop.candidates[0]`, `step1-fire`, from the `home` camera.
7. The loop's cursor is one `CursorBody`, driven for three periods by the loop's own pointer and cues (`act`, `react`, `hurt`, `knock`), with the third period kept as 1920 poses. The body's springs die out far inside one period, so the kept period closes on itself: the test holds the difference between the second and third period under 1e-6.
8. Until step 1's own keyboard and turrets are on `main`, `fireScene` draws its own stand-in deck, keys (no legends), turrets, bolts and marks on top of the page of step 1 as `main` gives it at rest. Parts: `keyboard` for the deck and keys, `turrets` for the turrets, bolts and marks.
9. What the cursor is up against. The turrets stand at the two ends of a deck that spans the content width (x 128 to 1792), so from the `home` camera they are outside a centred square crop (x 420 to 1500) and a centred 4:3 crop (x 240 to 1680) whatever the loop does. The threat that `state(index)` reports is therefore the bolt in flight or the fresh scorch mark nearest the cursor among those wholly inside the centred square. The test proves that on every frame, and half a frame later, there is one, and that it and the cursor are inside both crops.
10. Fair play is tested: every dodged bolt is aimed at where the cursor was `TRACK_DELAY` (0.25 s) before it was fired and lands where the cursor no longer is. One bolt in the loop hits. The burn heals inside the loop, so frame 0 shows a whole cursor.
