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

## The cut (`npm run cut`)

- `cut.ts` holds the work, so the tests can run it: `makeCut(pages, kept)` runs one `Stage` in film mode over `wholeFilmFlow()` with the `ScriptDriver` for the film's whole length, reads `stage.events`, and samples the film camera once a frame. `tools/cut.mjs` only loads it, reads `audio/kept/*.json` and writes the three files.

11. A frame of an event is `floor(step * fps / stepHz)`: the frame during which it happened, the same frame `filmState` reports it on.
12. A beat's event is the first event of that name inside the beat, and else the first within the tolerance, and else the nearest one, which is then reported as outside. An event that is never reported counts as outside too. Either way `npm run cut` prints the beat and exits 1.
13. The three files are written also when a beat's event is outside: the cut list then says `inside: false` for it. Nothing in the files depends on the day or the machine, so `--check` can say whether the files on disk are what the film gives now.
14. A narrator line's id is `line.<beat>.<index>`. A kept take is matched to its line by a record in `audio/kept/*.json` whose `id` or `line` is that id, or whose `text` is the line's text (pause marks or not), and its length is read from `seconds`, `lengthSeconds`, `durationSeconds` or `duration`. The sound files themselves are not in the repository, so the record is the only place the length can come from. Until a line has a take, its end is the soonest it can end at `audio.narratorMaxWordsPerSecond`, marked `estimate`.
15. In the shot list a camera is named after an entry of `cameras` when the page's film camera sits exactly on that page's camera of that name, `home` when it is the home camera, and `film` otherwise. A cut is a jump of the framing between two frames of one page: its centre by more than 8 percent of its width, or its width by more than 8 percent, or a change of named camera.
16. The 35 mm equivalent is the focal length with the same horizontal view on a frame 36 mm wide: `18 / (tan(fov / 2) * 16 / 9)`, with the vertical field of view the camera states. Focus is the camera's own `focus` when it has one, and else its distance to the point it looks at.
