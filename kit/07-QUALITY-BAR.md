# 07 · The quality bar

## The standard

Every page passes as a real web page and reads as a real object, photographed. Every key matches its approved image. The cursor is a character a viewer follows and feels for, with no face. Every gag has weight and lands on its frame. The pinball machine is the thing people remember. A stranger can finish the live site without a word of instruction. The checks below test that from different sides.

Quality here is pursued hard and inside limits. Use every round a limit allows while something severe or major is open. When a limit is reached, log what is open and move on. `AGENTS.md` explains why.

## Three kinds of automated check

`npm run gate -- --phase N` runs what that phase needs and prints pass or fail for each. The kind of a check decides what a red result means.

### Machine checks

They test the code and the files, not the picture. They are cheap and they run on the current build at the start of every round.

| Id | Check | From |
| --- | --- | --- |
| G1 | `npm run build` exits clean with no type errors | Phase 0 |
| G2 | Unit tests pass | Phase 0 |
| G3 | `npm run determinism` passes: on one machine, a still of each page, a film frame late in each page and a loop frame are pixel-identical across fresh page loads and when pictures are rendered in a different order | Phase 0, the film and loop parts from Phase 2 |
| G4 | Every still is exactly the size of its format. `film().frameCount` matches `cut/CUTLIST.json`. `loop().frameCount` equals `deliver.cardLoop.seconds` times `film.fps` | Phase 0, the film and loop parts from Phase 2 |
| G5 | No DOM control is in a still without `interface`, in any frame of film B or in the loop. The controls are present in every still with `interface` | Phase 2 |
| G6 | The config and the two content files pass startup validation, and every still and frame on the computed judged list is on the judged list in `kit/PROGRESS.md` | Phase 2 |
| G7 | Lengths. Film B is at most `film.maxSeconds`. Each page's length in `film.units` is within `film.unitTuneFraction` of its planned length in `film.plannedSeconds`. The opening is at most `intro.maxSeconds`. A film in `formats.hd` at `export.bitrateMbps` is under `platform.maxFileMb`. The check also prints, as a note and never as a failure, whether film B or film A is longer than `platform.standardAccountMaxSeconds`, the most a standard account on `platform.name` may post | Phase 2 |
| G8 | Every third-party file has a row in `ASSETS.md`. Every built or generated file that ships has a recipe in `assets-src/`. Every kept sound has its record | Phase 0 |
| G9 | No tracked file is over `repo.maxFileMb`. The tracked files together are under `repo.maxTreeGb`. No secret is tracked. `references/cache/` and `out/work/` are not tracked. Every file in `references/approved/MANIFEST.sha256` still has its listed hash. `content/copy.json` has the hash listed for it in `content/MANIFEST.sha256` | Phase 0 |
| G10 | The site needs only WebGL2 core and the extensions marked portable in `config/webgl-caps.json`. Where it uses float targets it has a half float path | Phase 0 |
| G11 | The words. Read from `stillState` for every page at rest and from `typeRegister` for every page: every run of type shows the string its copy key or config key holds, character for character; every copy key a layout tree names is drawn; and no run of type was made from a string written in code. Typed input, counters and the score display are the only runs whose text is made at run time | Phase 2 |
| G12 | The story. Read from `filmState` for every frame of the film: the beats of `film.beats` start in order; every beat with an `event` reports that event inside the beat, give or take `film.beatToleranceSeconds`; the cursor has arms only inside `cursor.armsOnlyInBeat`; its world scale is the same in every frame; it carries no damage on the first frame of a page; and no damage lasts longer than `cursor.damageHealSeconds` | Phase 2 |
| G13 | Stand-ins. No part that it covers is a stand-in, by the three tests in `kit/05-ARCHITECTURE.md`. It covers every part of the unit a round is about, in that round; every part of a unit marked `finished` in `kit/PROGRESS.md`; from the first round on `site` in Phase 5, every part outside the `film` unit; and from the first round on `film` in Phase 6, every part there is | Phase 3 |
| G14 | The loop's seam. The loop frame one past the last is pixel-identical to frame 0 | Phase 2 |
| G15 | Memory and counts. For every page, `info().textureMb` is at or under `assetSets.<set>.maxTextureMb` for both asset sets, and `info().counts` is within `perf` for every level of `live.quality` | Phase 3 |
| G16 | Hosting. `npm run hostcheck` is inside every limit in `host`, and the built site opens the careers page in `live` mode | Phase 5 |
| G17 | Finishing. `npm run bots`: every bot in `live.bots`, on each of `live.botSeeds` seeds, reaches the careers page after the rejection within `live.botMaxSeconds`. Outside the pinball scene the pointer is never ignored for longer than `live.controlTakenMaxSeconds` at a time. Inside it the flippers are never ignored for longer than that. No run ends in a state with no way forward | Phase 2 |
| G18 | One site. Read from `info().modules`: no module under `src/pages/`, `src/table/` or `src/boss/` is loaded by film mode and not by live mode. Read from what `npm run bots` prints: every beat's gag was reached in live mode by the `keen` bot | Phase 2 |

- A red machine check is a bug. Fix it before critics see the round.
- If a machine check is still red after `quality.gateFixMaxAttempts` attempts in one round, or in one phase when no round is running, log it as a severe open item. A round goes on to the critics if pictures can still be rendered, and ends there if they cannot. A phase goes on to its next step.
- G13 is the one exception. A stand-in is never logged away. A red G13 is fixed by finishing the part with its fallback from `kit/03-METHOD.md`. That chain's last step can always be made, so G13 can always be brought to green. Changing a part's label in the register never turns it green: the file hash and the `standins` view are tested too.
- The four bots: `keen` plays as well as the script does. `clumsy` is slow and walks into every hit. `random` moves and clicks from the seeded random stream and takes the skip link when it appears. `skipper` does nothing but take the skip link on every step.

### Measures

They put a number on the picture or the motion. They run in every round, for the unit that round is about.

| Id | Measure | Units |
| --- | --- | --- |
| M1 | Sanity. In each judged still of the unit: `pictureStats` reports no invalid or infinite value in the picture before tone and grade. From `home`, every pixel on the frame's edge is page surface or something standing on the page, so nothing shows round the page. The cursor lies inside the frame whenever it is on the page | All pages |
| M2 | Texture detail. In the `texels` view of each judged still: among textured pixels, the share with fewer than `detail.minTexelsPerPixel` texels per screen pixel is at most `detail.maxSoftPixelFraction`. In a still taken through a lens with focus, only pixels whose blur circle is under `detail.focusCocPx` pixels are counted | All pages |
| M3 | Real sharpness. For each key: fine detail, measured as high frequency energy over the still, is at least `detail.minSharpnessRatio` of the same measure on the approved image at the same size | All pages |
| M4 | Readable type. From `stillState` for each page at rest and for each key: every run of type is at least `layout.minTextPx` tall, counted in page pixels, and its contrast against what lies under it is at least `layout.minTextContrast` | All pages |
| M5 | Layout. From `stillState` for each page at rest and for each key: every part is drawn within `layout.tolerancePx` of where the layout tree puts it, counted in page pixels at the page surface | All pages |
| M6 | The cursor's size. In each still from `home` in which the cursor stands at rest, its height is `cursor.heightPxAt1080` page pixels, within `cursor.sizeTolerancePx`. In each still from a tier camera, the ball is `table.ballPx` across in the picture and the cursor's length in the picture is `table.cursorInBallFraction` of that, both within `cursor.sizeTolerancePx` | All pages |
| M7 | Contact. From `filmState` for the unit's beats: every event whose `hitsCursor` is true happens within the cursor's own height in the picture of where the cursor is on that frame, and the cursor's damage or acting state changes on that frame or the next | All pages, `film` |
| M8 | Crowded tiers. For each tier, in a still from its tier camera: the standing parts counted from `tableState` are at least `table.minStandingPartsPerTier`, and, in the `coverage` view of that still, the share of floor pixels that lie further than `table.bareDistanceFraction` of the tier's width from any standing part, insert or printed line is at most `table.maxBareFraction` | `pinball` |
| M9 | One scale. From `stillState` for each page at rest and for each key from `home`: every part whose kind has an entry in `scale.sizes` has that size, every part's height off the surface is its kind's entry in `scale.heights`, both within `scale.tolerancePx`, and every mechanism the cursor works has its working parts at least `scale.heights.machineMinTop` above the surface | All pages |
| M10 | Ball paths. From `tableState`: every opening a ball uses clears `table.minClearanceBalls`. Every rail has an entry and an exit, and each opens onto a tier, a hold or another rail. The lift is open at both doors and both elbows. No rail or opening leads into the Retirement box. Every hold releases. Each tier has `table.insertsPerTier` inserts and one display whose characters are at least `layout.minTextPx` tall in the tier's still. And `npm run paths` leaves no ball at rest outside a hold, stuck in an opening or outside the machine | `pinball` |

- M2 counts texels, so a texture that was enlarged without gaining detail can pass it. M3 is there to catch that.
- A red measure is not a blocker. It is a severe issue in that round, beside the critics' issues, and it follows the same round limits.

### Deliverable checks

They test files that take long to make. They run only where `kit/08-BUILD-ORDER.md` names them, at the end of a phase.

| Id | Check | Checked at the end of |
| --- | --- | --- |
| D1 | `out/roughcut.mp4` exists, at the `formats.preview` size, with the frame count of `film.units` at `film.previewFps` | Phase 1 |
| D2 | A preview of film B exists as `export.files.previewB` under `out/` and was rendered from the phase's final build. `ffprobe` reports `film.previewFps`, the `formats.preview` size and the right number of frames. In Phase 6 it carries a sound stream if any sound exists. The file is under `repo.maxFileMb` | Phases 2 and 6 |
| D3 | The local render proof exists from the phase's final build, as `kit/05-ARCHITECTURE.md` defines it. In Phase 2 for film B only. In Phase 6 for film B and the opening | Phases 2 and 6 |
| D4 | The review cut exists as `export.files.reviewCut`, with a sound stream if any sound exists, and the sound board of the review page plays every kept line and cue | Phase 5 |
| D5 | A preview of film A exists as `export.files.previewA` under `out/`: the opening followed by film B, with the final mix if any sound exists | Phase 6 |
| D6 | `deliver/` holds the card loop, its web copy and the card still. `ffprobe` reports `deliver.cardLoop.fps`, the right number of frames and the right sizes. The still is frame 0 | Phase 6 |
| D7 | `deliver/POST.md` exists and holds the three parts `kit/08-BUILD-ORDER.md` asks for | Phase 6 |

- A deliverable check that stays red after three tries is logged as a failed item and the phase goes on. In Phase 6 it is listed under "Failed QA items". It does not hold the build open.
- In Phase 2 the preview of film B is made of stand-ins. That is what D2 expects there.

### Sound checks

They are run with the gates and reported. None can fail a gate. A failing one becomes an open item.

| Id | Check |
| --- | --- |
| A1 | No sound plays, and no audio is started, before the first click on the live site |
| A2 | The sound control works by pointer and by keyboard, has a name and shows its state |
| A3 | A judged still rendered with the site's audio code present is byte equal to one rendered without it |
| A4 | The site's sound files are under `audio.appMaxMb` together and none is fetched before the first picture is complete |
| A5 | Every kept sound has its take, its prompt or its words, its measurements, the listener's answers and an `ASSETS.md` row |
| A6 | Each mix measures within one unit of `audio.filmLoudnessLufs` and peaks at or under `audio.truePeakDb` |
| A7 | A mix made twice is byte equal |
| A8 | No cue used more than `audio.maxTakesPerCue` takes and no line more than `audio.narratorMaxTakesPerLine` in the build, and none used more than that again in any one review round |
| A9 | Sync. In `cut/CUES.md`, every event of the film that the table of events to cues maps has its cue starting within `audio.contactSyncFrames` frames of it. Every narrator line starts inside its beat and ends at least `audio.lineGapSeconds` before the next line |
| A10 | Every kept narrator line, written down by the listener, is its line in `content/narration.json` word for word |
| A11 | With the site's sound files removed from the build, the site runs silent, hides the sound control and reports no error |

## Freshness

- `kit/05-ARCHITECTURE.md` defines the engine hash and a hash for each page.
- In a round, the stills, sheets and measures for the unit being worked on come from the current build.
- When a unit is finished, its judged stills, comparison images and sheets are kept with their hashes. They are the unit's evidence. A later change to another unit does not make them stale.
- The shell, the type, the materials, the light, the cursor and the grade are shared, so a later change to them can change a finished unit. After such a change, render that unit's keys again and look at them beside the kept ones. If they got worse, make one fix, once, for that unit and that change. If it is still worse, log an open item. Do not run the unit's rounds again.
- Everything is rendered once more from the frozen build in Phase 6. The record round and the Phase 6 gate use only that.

## Judged stills and frames

The fixed list the critics score. It is computed, not chosen.

1. Every entry of `keys`: the page at the key's moment, from its camera, in `formats.hd`.
2. Every entry of `sheets`: the build's own version of the sheet, from the `sheet` camera, or from the camera and at the size the entry names.
3. Every entry of `stills`. An entry with `interface` is captured with the controls on.
4. For `site`: one still of each of the six pages at rest, drawn through the live site's own path at the `high` level, from `home`, in `formats.hd`.
5. For `film`: frame 0; the frame at `film.hookSeconds`; for every beat, the frame of its event, or its middle frame if it has none; and the last frame. For the opening of film A: one frame in the middle of the typing, one with the reasoning level control open, and one in the middle of the build screen. For the loop: frame 0 and the frames a quarter, a half and three quarters of the way through.

- The list lives in `kit/PROGRESS.md` with the unit of each entry. The film's part is added when `cut/CUTLIST.json` first exists and replaced once, when the cut is fitted after the review.
- Judged stills are rendered at the `final` tier with the `full` asset set.
- Entries can be added. An entry is never removed.

## Packs

`npm run pack` builds what each critic receives.

- No image has a long edge over `critics.maxImageLongEdgePx`. A full still is resized to fit. Fine detail and small type are shown in native-size crops.
- A pack is never more than `critics.maxFilesPerMessage` files. Crops are tiled into labeled grids. A run of consecutive frames is one sheet. If a critic's material still does not fit, split it across fresh critics with the same rubric, each with a whole number of pairs, stills or sheets. The merged score is the lowest of their scores, and the merged issues are all of their issues.
- Same file format for every image. All metadata is stripped.
- Neutral file names, as `AGENTS.md` requires.
- Pack images are written under `out/work/`.
- A critic receives its files as attachments only. Never give a critic a path into the repo or the workspace.
- A key file maps each neutral name to what it is. It is written outside every folder a critic can reach, and copied into the round folder only after every answer for the round is in.

## The critics

- Every critic is a fresh agent in every round.
- Each critic receives its pack, its own section of this file word for word, the severity scale below word for word, and the return format. Nothing else.
- R2 jurors receive only what their section says.
- Spread the critics and jurors across different model families. Rotate which family holds which role from round to round. If fewer families can see images than a role asks for, use every family there is, fill the rest with fresh agents on the same families, and log it.
- R1 and R3 to R9 each return one JSON object. The Builder writes the R2 scorecard from the jurors' answers.

```json
{
  "critic": "R3",
  "score": 7,
  "pass": false,
  "issues": [
    { "severity": "major", "file": "set-C-04.png", "where": "the orange button, lower right", "what": "it sits on the surface with no socket and no gap, like a sticker", "fix": "sink it into a socket with a dark gap all round and a tight shadow on the lower right" }
  ]
}
```

- `score` is 1 to 10. Issues are listed most severe first.
- R9 adds one more field, `reads`, as its section says.

Which critic judges which unit:

| Critic | `step1` | `step2`, `marketing`, `decision`, `boss` | `pinball` | `site` | `film` |
| --- | --- | --- | --- | --- | --- |
| R1 Match | yes | yes | yes | no | no |
| R2 Jury | yes | yes | yes | yes | yes |
| R3 Surface and detail | yes | yes | yes | no | no |
| R4 Motion | yes | yes | yes | yes | yes |
| R5 The whole | no | no | no | yes | yes |
| R6 Scroll stop | no | no | no | no | yes |
| R7 Compression | no | no | no | no | yes |
| R8 The page | yes | yes | yes | yes | no |
| R9 Acting | yes | yes | yes | no | yes |

The sheets `page-look`, `cursor-acting`, `cursor-damage` and `cursor-arms` are judged with `step1`. `machines` is judged with `step2` and `boss-stages` with `boss`.

### The severity scale

Every critic uses this scale, so small things are not inflated.

- `severe`: a viewer would notice it at once, on the site at normal size or in the playing video at normal speed.
- `major`: visible on a still at delivery size when you look for a moment. A native-size crop is delivery size.
- `minor`: visible only when zoomed past delivery size, or only by measuring against the target.

### R1 · Match

You are comparing pairs of images. In each pair, the file whose name ends in `-a` is the target. The file whose name ends in `-b` has to match it.

- Pack: for each key of the unit, the approved image as `-a` and the key's still as `-b`, at the same size, plus a grid of matching native-size crops of each. For each sheet judged with the unit, the approved sheet as `-a` and the build's version as `-b`. The lines under `settledAll` in the config, the lines under `settledUnit` for the pair's unit, and the pair's own `settled` lines, are given with that pair, word for word, under the heading `Settled` and the names of the pair's two files.
- Compare the layout: where every part sits, how large it is, how the page is divided. Compare the materials: the page surface and its grain, the glass, the metal, the coloured plastic, the paper. Compare the light: which side is lit, how long, dark and soft the shadows are, how bright the page is. Compare the arrow: its shape, its gloss, its dark edge, and whatever has been done to it. Compare the objects on the page, part by part. Compare the colour and the mood.
- For a pair that shows several states side by side, compare state by state.
- Do not compare the wording of any text. Compare only how the text looks: its size, weight, colour and place.
- `-b` does not have to match `-a` pixel for pixel. A viewer shown both should say: the same thing, in the same light, photographed twice.
- A pair comes with lines headed `Settled`. Each names one difference between `-a` and `-b` that is intended. Do not list that difference as an issue and do not lower the score for it. Judge everything else in the pair as usual.
- List every region where `-b` falls short of `-a` as an issue. Say what is different and which way to move it.
- Score 10 when `-b` has lost nothing against `-a`.

### R2 · Jury

One image per call, so no juror can compare images with each other.

- Judged images: up to `quality.jury.stillsPerUnit` of the unit's judged stills with no DOM control in them: its keys first, then the rest in list order. For `site`, the six stills drawn through the live site's path. For `film`, the film's judged frames outside the opening. In the record round, every judged still and frame with no DOM control, outside the opening.
- Controls: the approved key images of the same unit, resized and encoded exactly like the judged images. For `site` and `film`, the approved key images of all units.
- A judged image is paired with controls of a like kind: a whole page with whole pages, a tier with whole screens of a game, a close view of the machine with close views of the machine. A judged image with no control of a like kind is left out of the jury. Log which.
- Each image goes to `quality.jury.jurors` jurors.
- A control's votes are collected once and reused in later rounds.
- Each call is a fresh agent that receives one image and exactly this text, nothing else:

> You will see one image. Which of these is it most likely to be? (a) a photograph of a real object, taken by a professional, (b) a frame from a top-budget animated film or a big-budget video game cinematic, (c) an ordinary 3D render, such as a stock product image, (d) a picture from a web 3D demo, a mobile game or a low-budget app. Answer with one letter, a confidence from 0 to 100, and the one thing that most influenced your answer.

Scoring:

- The control share is the share of all votes on the controls that were (a) or (b). The judged share is the same for the judged images.
- R2 passes when the judged share is no lower than the control share minus `quality.jury.maxShareGap`.
- The pictures are being held to the approved images, not to an absolute. If the jurors are hard on the controls, they will be as hard on the stills.
- A juror that does not answer is replaced once. If an image still has fewer than `quality.jury.jurors` minus one answers, R2 is logged as missing for that round and does not pass in it.
- What a juror wrote about a judged image is input for the next round. A failed R2 counts as one major issue.

### R3 · Surface and detail

You are told the images are computer generated.

- Pack: the unit's judged stills, and grids of native-size crops of every surface in them. For a page: the page surface where a highlight grazes it, a glass slab at its edge with what lies under it, a metal rim, a coloured button with its socket, the smallest text, the arrow with its edge and its shadow, a shadow where a part meets the page, and every object the page has. For the pinball machine: the glossy floor of each tier with its print, a lit insert, a post with its rubber, a bumper, a wire ramp, a flipper, each model, a lamp and what it lights, a display, the frame's rail, and the clear ball with the arrow in it.
- Look for what gives a page away: parts that sit on the surface like stickers, with no thickness, no bevel and no gap; shadows that are one soft blur with no dark line at the contact; a surface that is perfectly smooth and even; glass that is a flat grey panel with nothing showing through; metal with no brushing and no reflection; coloured plastic that is flat colour with no depth; soft, fuzzy or jagged text.
- Look for what gives the arrow away: a flat white shape with an outline, no thickness, no gloss, a shadow that does not separate when it lifts. Where it is damaged: a hole that is a dark spot and not a hole, cracks that are drawn lines, strips with no thickness.
- Look for what gives a mechanism away: a toy with no small hardware, parts that pass through each other, detail at the wrong scale, something that stands on the page and is not set into it.
- Look for what gives the pinball machine away: bare empty floor, stock shapes with no theme, parts all at one height with nothing above anything else, inserts that are flat coloured shapes with no glow, lamps that light nothing, a floor with no gloss and no reflections, models that are plain boxes, print that is blurry, a tier with no lit display, a ball that is not clearly a clear ball with a solid arrow inside it, and anything that reads as a model railway or a diorama and not as a machine.
- Look for anything that should not be there: a person, a hand, a face, a logo, a stray object, and any face or eyes on the arrow.
- Score 10 when every crop holds up at native size and nothing gives away how it was made.

### R4 · Motion

You are told the images are computer generated. Each sheet is a run of consecutive frames, read left to right, top to bottom.

- Pack for a page: one sheet across each beat of the page, at the `review` tier or higher; one sheet of consecutive frames at each hit; one sheet of the page turn that ends it.
- Pack for `pinball`, in addition: one sheet of consecutive frames at a bumper hit, at the flipper save, at the doors and on the rail; one sheet across the way in, from the seal to the whole machine in frame, and one across the way out.
- Pack for `site`: sheets drawn through the live site's path with a visitor's input: walking the arrow across a page, a hit, a page turn, the moment control is taken and the moment it is given back, the flippers being used.
- Pack for `film`: sheets across the whole film, one sheet across each page turn, and one across the opening of film A. For the loop: one sheet across it and one across its seam, last frames then first frames.
- Weight: do things move as if they had mass? A heavy block lands and stops dead. A key goes down and springs back. A machine winds up, runs and rings to a stop. Mark it down for even, soft, floaty or weightless motion.
- Timing: is there a wind-up before a big action, and a hold after it long enough to see what happened?
- Contact: on the frame something hits, do both things react, and does the page around them answer?
- The clear ball and the steel balls in the machine: do they move at the speed of steel on a slope, change direction in a frame or two on a hit, and never drift or glide? Does the scene look like a ball loose in a machine, or like something being moved by hand?
- The page turn: does the slab have mass, and does the new page settle?
- The camera: eased, with weight. On the pages it only ever moves straight in and straight out.
- Clarity: in each sheet, can you tell what happened without a caption? If not, say which sheet and what was unclear.
- In the loop's seam sheet: can you tell where the loop ends and begins?
- Stability: no flicker, crawling or shimmer in fine detail, small text or lamps.
- Score 10 when the motion could ship as it is.

### R4 blockout · Phase 2 only

You are told the images are an unfinished blockout made of placeholder shapes.

- Pack: each of the six pages at rest as a placeholder layout with its real text; sheets across the whole film from the blockout; one sheet across each beat of step 1; the framing of each pinball camera on the placeholder table; and the live site's screen with its controls.
- Judge only these: whether each page is laid out like a real web page, with aligned columns, even spacing and a clear order of importance; whether its text can be read; the order and pace of the beats; whether it is clear from the placeholders what each beat is; whether each pinball camera frames what it is for; and whether the controls are placed well and clear of the page's content.
- Do not judge materials, light, detail or realism. None of it exists yet.
- Score 10 when the layouts, the timing and the cameras could be finished as they are.

### R5 · The whole

You are told nothing about how the images were made.

- Pack for `site`: the six pages at rest on one sheet, the stills with controls, and sheets across one visitor's run through the live site.
- For the site: are these six pages one website, made of the same things in the same light? Is each page a different kind of scene, or do two of them feel the same? Does any page look less finished than the others? Is the pinball machine clearly the high point?
- Pack for `film`: sheets across the whole film and the film's judged frames in order.
- For the film: is it clear within seconds that this is a job application on a website and that the arrow is its hero? Does each page do something worse to it than the last? Does anything repeat? Is the pinball scene the high point, and the fight after it still a step up in stakes? Does the ending land, and does the last picture close the circle? Could you follow it with the sound off?
- Score 10 when nothing breaks the sense of one finished piece.

### R6 · Scroll stop

You are told nothing about how the images were made.

- Pack: frame 0 of film B, frames across its first `film.hookSeconds` seconds, and frames across the rest of its first page, each resized to `critics.phonePreviewWidthPx` wide. Then the same for film A, with its opening.
- Would this stop someone scrolling a feed with the sound off?
- Is it clear at this size, in the first frame, that this is a web page and that something on it is alive?
- Does something happen inside the first `film.hookSeconds` seconds that rewards staying?
- For film A: can the typed words be read at this size as they appear?
- Score 10 when the opening is striking at phone size with no sound and no caption.

### R7 · Compression

You are told the images are computer generated.

- Pack: stills taken from the stress encode beside the same frames before encoding, with grids of native-size crops.
- Look for banding in the soft falloff of light across the page, text that has turned soft or grown halos, fine surface texture that has turned to mush, fast small things that have smeared or vanished, blocks in the dark parts of the pinball scene, and lamp glow that breaks into steps.
- Losing some of the finest grain is expected at this bitrate and is not an issue.
- Score 10 when the encoded frames show no banding or blocking and every word can still be read.

### R8 · The page

You are told nothing about how the images were made. You are judging web page design.

- Pack for a page: the page at rest, its keys, and native-size crops of its text and controls.
- Pack for `site`: the six pages at rest, the stills with the controls on, and the message page for touch devices.
- If nothing on this page ever moved, would it pass as a page of a real, well made website?
- Is it clear what the page is for, what to read first and what to do first?
- Alignment, spacing and consistency: do columns line up, are gaps even, are like things the same size? Is the header the same on every step?
- Can every label, helper line and button be read? Does every field look like something you could use?
- Is there anything on the page with no purpose?
- Where a mechanism has come out of the page, does it read as something happening to a real page, or as a layout mistake?
- For the controls of the live site: are they quiet, readable, clearly not part of the joke, and out of the way?
- Score 10 when a product designer would sign off on every page.

### R9 · Acting

You are told the images are frames from an animation. Each sheet is a run of consecutive frames, read left to right, top to bottom. The character is a white arrow, a mouse cursor. It has no face. In some sheets it is sealed inside a clear ball, and it is still the character.

- Pack: one sheet for each beat of the unit, with no caption and a neutral name, and one sheet for each acting state the unit shows.
- First, before anything else, for each sheet write one line in `reads`: what the arrow is feeling, and what has just happened to it or is about to. Use the file name.

```json
"reads": [ { "file": "set-D-03.png", "read": "nervous, then hit by something and shocked; it has a hole in it" } ]
```

- Then judge. Is each pose clear enough to read in a glance, as a silhouette? Is there a wind-up before it acts and a reaction after something happens to it? Does it squash when it lands or is hit and stretch when it moves fast? Is each feeling held long enough to see? Does it react to everything that happens, or does it sometimes just slide along like a pointer? Is it the same character from sheet to sheet?
- It must never have a face, eyes, a mouth, legs or gloved hands. Any of those is a severe issue.
- Score 10 when every sheet reads at a glance and the arrow is a character you would follow.

The Builder then compares each read with what the beat is meant to show, from `kit/01-FILM.md` and the acting states of `kit/02-SUBJECT.md`. A read that names a different feeling, or misses what happened, is added to that critic's issues as a major issue with the words "did not read", and the pass bar counts it.

### The pick · Not part of any round

Run once, in Phase 6, if `deliver.cardLoop.scene` is `auto`.

- `deliver.cardLoop.pickJurors` fresh agents each receive the stills of the keys in `deliver.cardLoop.candidates` on neutral names, in a different order each, and exactly this text:

> You will see pictures that could each be the cover image of a project on a portfolio site. Which one would you most want to click? Answer with its file name and one sentence.

- The key with the most votes is the card's scene. A tie goes to the earlier entry of `deliver.cardLoop.candidates`, and so does a run in which nobody answered. A juror that does not answer is not replaced.
- Write the votes and the result into `kit/PROGRESS.md`. It is never run twice.

### The listener · Not part of any round

`kit/03-METHOD.md` section 12 gives the listener's fixed questions. Its answers are kept beside each sound. It decides which take is kept. It never decides whether Brandon will like it: that is what the review is for.

## The pass bar

For each of the six pages, all of these hold at once:

1. The machine checks are green.
2. The unit's measures are green.
3. Each critic the table gives the unit, other than R2, scores at least `quality.passScore` with no severe or major issue open.
4. R2 passes.
5. Every judged still of the unit was rendered at the `final` tier.

For the blockout: R4 blockout scores at least `quality.blockoutPass` with no severe issue open.

For `site`: the machine checks are green including G15, G16, G17 and G18, R4, R5 and R8 each score at least `quality.passScore` with no severe or major issue open, and R2 passes.

For `film`: the machine checks are green including G7, G12 and G14, M7 is green for every beat, R4, R5, R6, R7 and R9 each score at least `quality.passScore` with no severe or major issue open, and R2 passes.

Sound is not part of any pass bar.

## What to do with a critic's issues

- Fix causes, not symptoms. If a critic names an artifact, find what produces it.
- Never tune the picture to please one critic at the cost of another.
- The approved images and Brandon's stated choices outrank every critic. His choices:
  - Every page is a real, usable web page, seen straight on, sharp from edge to edge, filling the frame.
  - The ceramic look of the approved page, one orange accent, clean even light with no window shadows.
  - The cursor is a classic arrow with a black edge, at one fixed size, with no face and no eyes. Arms only in the tug of war. Damage heals in seconds. It acts like a cartoon and is rendered as real.
  - The order: the careers page, then the five steps as named. Each step a different kind of scene.
  - His own words, exactly, from `content/copy.json`. The jokes that name real companies stay out.
  - Step 1 has a complete keyboard docked at the bottom and turrets that fire bolts, not beams. Step 2 has plain rows that open one at a time, each with a reason.
  - The pinball machine is three tiers tall and set into the page, at the bar of a pinball video game that has shipped. It is a career in reverse: Corporate, then the Office, then the Street. The cursor rides through it sealed in a clear ball. It is choreographed and filmed from inside. An arcade cabinet rising out of the page was rejected.
  - Things come out of the page. The keyboard stands above it. No size is taken from an image.
  - Submit is a boss fight with a health bar. Rejection is instant, and everyone is rejected.
  - No music score. A slow, smug narrator who looks down on the applicant.
  - A computer with a mouse only. A touch device gets the message.
  - No people and no faces. No real brands.
  - Two cuts of the film, with the prompt opening in film A only.
  - Anything he says in the thread or at the review.

  An issue that asks the build to move away from an approved image or from one of those is declined, with the reason, under "Declined issues" in `kit/PROGRESS.md`. So is an issue that only repeats a settled difference: name the line. No other severe or major issue may be declined.
- If a fix would undo a change made for an earlier round, the issue is contested. Log it as an open item and do not change that thing again.
- Each phase judges only what that phase builds. If the blockout critic asks for detail, light or materials, log it as carried to the look lock and move on.
- An issue about a shared system raised in another page's round, the glass in the round on step 2, is logged as an open item for the polish rounds. Do not rework a shared system inside another unit's round.

## Rounds and their limits

- One round: build, machine checks, measures, pack, critics, read every issue, fix, log, status, commit, push.
- A round is counted when it starts. Write its number and the commit it judges into `kit/PROGRESS.md` and push before doing anything else in it. Tick off each part of the round there as it finishes, and push each tick.
- `npm run pack` is deterministic: the same commit, round and unit always give the same files, the same neutral names and the same key file. So a pack lost with `out/work/` is simply built again.
- Each critic's answer is written into `scorecards/round-NNN/` and pushed as soon as it arrives. The key file is added there only after every answer for the round is in.
- A round that a task ending interrupted is carried on under the same number from the last part ticked off: the pack is rebuilt if it is gone, and only the critics whose answers are not in the repo are asked again. It is never counted twice and never started over.
- Each round writes `scorecards/round-NNN/`: the pack manifest, the key file, the measures, each critic's JSON, the jurors' answers, and `SUMMARY.md` with the scores, the top issues and what changes next. Text files only.
- `kit/PROGRESS.md` gets one line per round.

| What | Limit | Key | Floor round |
| --- | --- | --- | --- |
| Blockout rounds in Phase 2 | per build | `quality.blockoutMaxRounds` | the first |
| Rounds on `step1` in Phase 3 | per unit | `quality.lookLockMaxRounds` | the first |
| Rounds on `pinball` in Phase 4 | per unit | `quality.pinballMaxRounds` | the first |
| Rounds on every other page in Phase 4 | per unit | `quality.maxRoundsPerUnit` | the first |
| Rounds on `site` in Phase 5 | per build | `quality.siteMaxRounds` | the first |
| Polish rounds in Phase 5, and in each extension | per pass | `quality.polishMaxRounds` | none |
| Rounds on a finished unit when a review round, the review, an addendum or a note from Brandon asks for changes to it | per unit, per request | `quality.maxRoundsPerUnit` | none |
| Rounds on `film` in Phase 6 | per build | `quality.filmMaxRounds` | the first |
| Runs of the record round in Phase 6 | per build | `quality.recordRoundMaxRuns` | the first |
| Passes through the QA gauntlet in Phase 6 | per build | `quality.gauntletMaxPasses` | the first |
| Attempts to fix one machine check | per round, or per phase outside a round | `quality.gateFixMaxAttempts` | |
| Takes of one generated picture | per asset | `assets.maxTakesPerAsset` | |
| Photographs and footage studied | per build | `assets.maxStudySources` | |
| Takes of one sound effect | per cue in the build, and per cue again in each review round that names it | `audio.maxTakesPerCue` | |
| Takes of one narrator line | per line in the build, and per line again in each review round that names or rewrites it | `audio.narratorMaxTakesPerLine` | |
| Low-tier looks rendered while tuning one part | per part, per round, and per phase for parts tuned outside a round | `assets.maxTuningLooksPerPart` | |
| Searches for the pinball take | each time a take is needed: the first one, after a change to the machine's layout or physics, and after a pinball beat's time has moved | `quality.takeSearchMaxRuns` | |
| Moves of `cameras.home.fovDeg` | per build | one | |
| Returns of a tier of the pinball machine to its build agents for being too bare, before it is integrated | per tier | one | |
| Working time of one review round | per round Brandon sends | `budget.reviewRoundHours` | |
| Fixes to a finished unit that a change to a shared system made worse | per unit, per change | one | |
| Wall-clock time of one build agent | per agent | `budget.buildAgentMaxHours` | |
| Tries at each step of the fallback chain | per part | three | |
| Tries of an image-to-3D model | per model, and in all | one, and three failures in all end the idea | |
| Tries at looking for a workspace skill, and for the narrator's voice | per thing looked for | three | |
| Runs of the pick for the card's scene | per build | one | |
| Tries of a failing tool call | each time | `budget.toolRetryMax` | |
| Replacements of an agent that ran past its limit | per job | one | |
| Restarts of a job that ran past its limit | per job | one | |
| Replacements of a juror that did not answer | per image, per round | one | |
| Tries at a deliverable check | per phase | three | |

- A loop ends early only when its pass bar holds.
- An extra round starts only while its count and the clock allow, as `AGENTS.md` says.
- When the tuning looks for a part run out, the part goes forward as it is. It is not a stand-in if it is the real technique, and it is judged in the round.
- When the searches for a take run out with no take that holds every beat, keep the best one found, move the director to its named fallback for the beats that missed, and log an open item.
- When a count or the clock ends a loop without a pass: keep the build from the unit's best judged round, plus later fixes only while the machine checks and measures stay green. Write every open severe and major issue under "Open items" in `kit/PROGRESS.md` with the still, the critic's words, what was tried and what to try next. Mark the unit `finished` with the limit that ended it, and go on.
- Open items are worked again in the polish rounds of Phase 5, worst first.
- Nothing in this kit loops without a limit in this table. If you find yourself repeating a step that is not in the table, stop after three tries, log it as an open item and go on.

## The plateau rule

- If the same issue survives `quality.plateauRounds` rounds in a row, change technique. Move to the next rung for that problem in the ladder in `kit/04-LOOK.md` and log which rung.
- A declined issue and a contested issue do not count toward the plateau and never move a rung.
- When a problem's rungs are used up, it becomes an open item. It is never a blocker.

## The record round

- Run once in Phase 6, from the frozen build: every measure and every critic the table gives each unit, R1 to R9, on the full judged list.
- Its scores are the final scores in `kit/PROGRESS.md` and in the `BUILD COMPLETE` block.
- It is a record. It is not followed by fixes. It runs again only when a QA gauntlet fix changed a pixel, and at most `quality.recordRoundMaxRuns` times in all.
