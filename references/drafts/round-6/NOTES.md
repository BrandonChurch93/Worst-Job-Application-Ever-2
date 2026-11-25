# Reference round 6 · The pinball machine · NOTES

Start time: 2026-11-24 19:18:17 MST (2026-11-25T02:18:17Z)
Four-hour limit ends: 2026-11-24 23:18:17 MST (2026-11-25T06:18:17Z)

Brief: `references/BRIEF-round-6.md` at commit 84a2ae5.

Labels used below: MEASURED means I checked it on the kept file. STATED means the brief, a tool or the judge said it. UNKNOWN means not tested.

## Study

Looked at before generating. None of it is committed.

| Game | Why | What was looked at |
| --- | --- | --- |
| Demon's Tilt (Wiznwar, 2019) | The three-tier table | The developer's merged capture of the whole table, three screens high, and one Steam store screenshot of the middle tier |
| Xenotilt: Hostile Pinball Action (Wiznwar, 2024) | A second three-tier table | One Steam store screenshot of the bottom tier |
| Pinball FX and Pinball FX2 (Zen Studios), original tables only: Wild West Rampage and Sorcerer's Lair | The 3D simulation showing its own original tables | One Zen Studios press screenshot of Wild West Rampage (whole table from the player's end) and one press screenshot of Sorcerer's Lair |
| Pro Pinball: Timeshock! Ultra (Barnstorm Games) | A simulation built to look like a physical machine | One Steam store screenshot holding the whole table from above and a view from the player's end |
| Yoku's Island Express (Villa Gorilla, 2018) | The hero is the ball | One press screenshot of the hero ball on a ledge with flippers in frame |

No table based on a film, a comic or another licensed subject was looked at.

What is taken, in five lines:

1. Fullness. In Timeshock and Wild West Rampage no part of a screen is bare: every gap between parts holds printed art, an insert, a post or a lamp. Each tier here is packed the same way, with printed artwork under clear coat as the first layer and the standing parts on top.
2. Tier framing. Demon's Tilt and Xenotilt put a pair of flippers at the bottom centre of every screen, with slingshots and inlanes making a funnel down to them and the shots fanned out above. Each of our tiers is framed like that, one tier to one 16:9 screen.
3. The centerpiece. Each tier in Demon's Tilt has one thing several times bigger than anything else, on the centre line above the flippers; Wild West Rampage puts its biggest building at the head. Ours: the HQ tower, the three coffee bumpers, and the highway over the street.
4. Lamps and glow. Timeshock and Sorcerer's Lair light the table from itself: rows and arcs of lit inserts, pools of warm light under plastics, lamp reflections in the clear coat, and darkness round the table so it glows. Ours does the same, one colour of light per tier.
5. Finding the ball. In Yoku's Island Express the ball is the lightest small thing on a darker, saturated ground and the flippers are one bright colour used for nothing else. Ours: a white cursor in a clear ball with hard highlights over darker printed art, and orange only on flippers, plunger knob and lift doors.

Not taken: any layout, artwork, character or name.

## Model

`seedream_5` (Seedream 5 Pro, ByteDance), the same for all twelve images. It accepts up to ten reference images and returns exact 16:9 at 2816 by 1584; every generated file is scaled to 1920 by 1080 with no other processing unless a section says so. G2 is a join of three takes and is saved at 2160 by 3840.

Whether it is the strongest photoreal model on this account that accepts references is UNKNOWN: no bake-off was run, to save takes. It was chosen because it made all fifteen approved images of this website, so the ceramic, aluminum, orange and the cursor match what is already approved.

## How each take was judged

Each take was first checked by me against "What to check". Then one fresh agent that had not seen the brief was given only a copy of the image under a neutral file name and the two questions, word for word. Its answer is quoted in each section. Where a kept file was changed after it was generated, a fresh judge saw the changed file too, and each section quotes the judge who saw the file exactly as it is kept.

## Results at a glance

No take passed the blind judge. 41 takes were made across the twelve images, every image went to its limit, and every take was judged: 46 judge answers in all, counting the five files judged again after a change. On the second question every judge named things that could not work, so nothing passes whichever way the first question is read. Each image below is its best take, kept at the limit as the brief says.

The table quotes the judge who saw each file exactly as it is kept.

| Image | File | Takes | Kept | The judge's first answer on the kept file | Things named | Changed after generation |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | `G1-machine-wide.png` | 4 of 4 | take 3 | "Best fit of the five: a frame from a top-budget film". The judge before it, who saw the same picture with one small roof plate not yet blanked, said "Most likely a screenshot from a commercial pinball video game" and named 9 | 7 | Yes. One letter added to the drain plate by hand; the marks on a small roof plate smoothed away |
| G2 | `G2-machine-top.png` | 3 of 3 | take 1 | "Amateur generated art (an AI-generated image), of the five options. It is a polished one". The judge before it, who saw the same join with the clock's marks not yet blanked, said "Closest to a screenshot (or table-select/promo render) from a commercial pinball video game" and named 10 | 12 | It is a join of the kept G3, G4 and G5, with a frame made in code |
| G3 | `G3-tier-corporate.png` | 4 of 4 | take 4 | "Most likely generated art" | 9 | No |
| G4 | `G4-tier-office.png` | 4 of 4 | take 4 | "generated art, of the five options" | 9 | No |
| G5 | `G5-tier-street.png` | 4 of 4 | take 3 | "Most likely amateur generated (AI) art" | 9 | Yes. One sign re-made by the model and pasted in; the mock numerals on the clock insert smoothed away |
| G6 | `G6-loader-page.png` | 3 of 3 | take 2 | "Of the five options, the closest is a commercial video game ... But it does not read as a pinball game" | 6 | No |
| G7 | `G7-clear-ball.png` | 4 of 4 | take 3 | "Most likely generated art" | 9 | No |
| G8 | `G8-rail-cam.png` | 3 of 3 | take 3 | "amateur generated art, graded to look like a film frame". Before the retouch another judge said "a frame from a top-budget film (or a high-end commercial)" | 8 | Yes. The bank's roof smoothed |
| G9 | `G9-lobby-doors.png` | 3 of 3 | take 2 | "it most resembles a frame from a top-budget film" | 6 | No |
| G10 | `G10-reply-all.png` | 3 of 3 | take 2 | "it reads most like a frame from a top-budget film" | 8 | No |
| G11 | `G11-youre-fired.png` | 3 of 3 | take 2 | "Most likely: a frame from a top-budget film" | 6 | No |
| G12 | `G12-last-save.png` | 3 of 3 | take 2 | "Most likely a frame from a top-budget film" | 9 | No |

What the judges named again and again, in almost every image that shows them (STATED by the judges; I see the same):

- The lift tube is closed at both ends and nothing shows how a ball gets in, out or up.
- The street's wire ramp reads as a handrail on posts, not a track, with no way on and no way off.
- The parking garage spiral is stacked rings too close together for a ball.
- The plunger's knob and spring sit inside the frame.
- Nothing carries a ball back up a tier.
- No score, no display and no interface in the tier views and close shots, which most judges gave as their reason for not saying game screenshot.

Miniature and diorama (STATED by the judges). The brief says the machine is "not a model railway, not a diorama, not a doll's house". The judges of eight of the twelve kept files used the word miniature for what they saw: G1, G2, G4, G5, G8, G9, G11 and G12. Two of them used the word diorama: for G1 "a beach diorama at the top right", and for G2 "miniature-diorama photorealism", given as a reason for calling it generated art. For G4 and G5 the word is used of the cubicles and the buildings, which the brief asks to be small moulded toys. For G1, G9, G11 and G12 the judge gave a miniature set as one of the ways its film frame could have been made, and for G8 the judge wrote "a believable miniature-set feel".

The first answer is not a stable measure (MEASURED on three images). The same picture got different first answers from different fresh judges when only a small patch had changed between them:

- G1: "Amateur generated art" as generated, with the misspelled plate; "a screenshot from a commercial pinball video game" after the plate was fixed; "a frame from a top-budget film" after 92 by 5 px of a roof plate were smoothed.
- G2: "a screenshot ... from a commercial pinball video game", then "Amateur generated art" after the clock's marks were smoothed (1,433 pixels of 8.3 million).
- G8: "a frame from a top-budget film", then "amateur generated art, graded to look like a film frame" after the bank's roof was smoothed.

The second answers are steady: the same faults are named by every judge of the same picture.

Words: every word in every kept file is on the allowed list and spelled right (MEASURED at full size on each file). Two of them were not spelled right by the model and were corrected afterwards: `Mom's Basement` in G5, and so in G2, and `Unemployment Office` in G1.

Three things were blanked after generation, which is what the brief says to do with a sign that cannot be got right: marks like unreadable lettering on a small roof plate in G1, twelve mock numerals on the clock insert in G5 and G2, and a ruled texture like a printed page on the bank's roof in G8. One thing of that kind was left as generated: the clipboard insert in G3, and so in G2, is drawn with ruled lines like a checklist, with no letter to be read.

Contact sheet: `references/drafts/round-6/contact-sheet.jpg`.

## The images

In the brief's order of work: G7, G3, G4, G5, G2, G1, G6, G8 to G12. The order they were in fact made is in the choices at the end.

### G7 · The clear ball

- File: `references/drafts/round-6/G7-clear-ball.png`
- Model: `seedream_5`
- Takes made: 4 of 4 allowed. Kept: take 3.
- Reference images passed in, in order: `references/approved/cursor-acting.png`; `references/approved/cursor-damage.png`.

Takes:

- Take 1 (three panels, 45 degree macro). My check: no must line failed. Misses: at rest the cursor stands upright in the middle of the ball; at the hit it is not squashed; the flipper is orange in the left panel and white in the other two; the ball is as wide as the flipper is long. Judge: "closest to a frame from a top-budget film", then named eight things in the second answer. Failed.
- Take 2 (made at the same time as take 1; one playfield with three balls on it). My check: no must line failed. Misses: at the hit the cursor's tail is fused to the aluminum plug; the plug is a fifth of the ball's width; the ball is as wide as the bumper cap. Judge: "Stock image", then named seven things. Failed.
- Take 3 (three panels; prompt changed to state the scale in balls, a whole orange flipper, a small flush plug, no rod, deep focus, the cursor against the wall away from the bumper). My check: no must line failed. Judge: "Most likely generated art", then named nine things. Failed. Kept as the best of four.
- Take 4 (made at the same time as take 3; same prompt with the camera at 70 degrees). My check: no must line failed. Misses: the tumbling cursor came out as a four-pointed star shape; the plug is a fifth of the ball's width in the left panel and missing in the right. Judge: "amateur generated art", then named seven things. Failed.

The judge's answer on the kept take:

> picture-0103.png — answers after viewing the full image and each of its three panels enlarged.
>
> WHAT IT IS
> A three-panel strip (black dividers) of macro close-ups on a teal-and-gold pinball playfield: a clear glass ball with a white mouse-cursor arrow inside it, orange flippers, lit round inserts, chrome wire guides, and a big white pop bumper in the right panel.
>
> Q1. Which is it most likely to be?
> Most likely generated art. Of the five options that is the only one that fits, although "amateur" undersells the finish: the surface polish is high (photoreal glass and lacquer, shallow depth of field, a teal/orange film-style grade), but the content does not hold together the way a designed or photographed table would.
> - Not a commercial pinball video game screenshot: no score, HUD or full-table view, heavy macro blur, and no playable table geometry.
> - Not a top-budget film frame: it is a three-panel composite, and the hero prop changes from panel to panel.
> - Not a textbook picture: no labels and nothing is being explained.
> - Stock image is the runner-up: it would pass as a conceptual "cursor in a pinball" stock picture at thumbnail size, but not on inspection.
> Tells that it is generated: the cursor is a crisp arrow with water droplets on it in the left panel, a clean flat arrow in the middle, and a melted, lumpy shape with a pointed spike in the right; the ball's seam and little rivet move or vanish between panels; insert symbols (star, arrows) are smudged half-shapes; hardware starts and stops without purpose.
>
> Q2. Could a ball really travel every lane and ramp you can see?
> No. There is no complete lane or ramp anywhere in the image, and several things could not work:
> - The ball is far too big. It is about two-thirds the length of a flipper (a real ball is about a third) and wider than the gap between any pair of wire rails shown, so it could not enter them.
> - It is a hollow clear shell with a seam and a rivet, holding a flat arrow, not a steel ball; it would not roll true or survive a bumper hit.
> - Left panel: the flipper has a screw head at one end and a support post under each end, so it appears pinned at both ends and could not swing. A rail runs right beneath it where the ball would need to drain or return.
> - Left panel, top left: the wire guide bends into a post and stops; it leads nowhere.
> - Middle panel: the two diagonal wire rails run straight behind the ball at a height that would pass through it, and they have no visible entrance or exit, so they are not a usable ramp or habitrail.
> - Middle panel, lower left: the wire loop closes onto a rubber-ringed post, a dead end narrower than the ball.
> - Middle panel, upper left: a second flipper sits jammed against those rails, which would block its swing.
> - Right panel: the pop bumper is several times the ball's size, and the ball sits tucked under the cap's overhang where it would wedge rather than be kicked away. The orange flipper-like bar at the top lies flat with fixings at both ends, so it could not move either.
> - Overall: no inlanes, outlanes, shooter lane, drain or ramp entry is visible, so nothing connects into a route.
>
> Limits: I judged from the image alone; I cannot confirm how it was actually produced.

Judge result: FAILED both questions (STATED by the judge). Kept at the limit of four takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: it called it generated art, not a game screenshot or a film frame, and named nine things that could not work.
- Scale. The whole flipper in the left panel is about 1.7 balls long. The brief says 3. The ball is too big next to the flipper.
- Cursor size. Its length is about 0.70 of the ball's width in the left panel, 0.68 in the middle and 0.76 in the right. The brief says about three quarters.
- Focus. The prompt asked for deep focus. The parts behind each ball are soft, so the hardware in the background cannot be read part for part. It is depth of field, not motion blur.
- Middle panel. The aluminum plug cannot be seen in it (it shows in the left and right panels, with the seam). The right wire rail runs behind the edge of the ball, so the lane reads narrower than the ball. An orange flipper sits against those rails at the upper left.
- Middle panel. The cursor is turned diagonal and off the wall but is not upside down; "tumbling" reads only from its tilt.
- Left panel. The flipper shows a bolt head at its wide end and what looks like a second support under its narrow end (STATED by the judge as pinned at both ends).
- Right panel. The ball sits under the overhang of the bumper cap. The squashed cursor has an uneven outline with a spike at its tip; the cracks in its enamel are there.
- Insert pictures (stars, arrows) are soft half-shapes close up. No words or numbers anywhere (MEASURED: none found at full size).

Full prompt of the kept take:

```text
A reference sheet from the art bible of a commercial 3D pinball video game with photoreal graphics: three close-up views side by side in one 16:9 frame. Three equal upright panels separated by two thin black vertical lines. All three panels show THE SAME pinball on THE SAME pinball table at three different moments, in the same light, with the same playfield artwork and the same hardware finish. In each panel the camera looks down at the playfield at about 50 degrees.

SCALE, the most important thing to get right: the ball is small next to the hardware, as a real pinball is. A flipper is three times as long as the ball is wide. A pop bumper's cap is two and a half times as wide as the ball. A lane is one and a half times as wide as the ball. A post with its rubber ring is half as wide as the ball. In each panel the ball is about one third of the panel's width, no bigger.

THE BALL, identical in all three panels: a sphere of thick, perfectly clear acrylic, like a gumball capsule, the size of a pinball. It is made of two clear halves; where they meet there is one hairline seam on the surface, running right round the ball's middle. One small round brushed aluminum plug, no bigger than a shirt button, an eighth of the ball's width, is set flush in the outer surface where the ball was sealed. Crisp little highlights from the lamps. It bends the playfield seen through its rim a little. It sits on the playfield, mirrored in the clear coat, with a soft shadow and a bright spot of focused light under it. It is hollow and holds only the cursor: no rod, no axle, no hub, no liquid, no snow, no glitter, no base.

THE CURSOR, the same object in all three panels, copied from reference images 1 and 2: the classic mouse-pointer arrow as a real solid object, a thick, slightly domed slab of glossy white enamel with a raised glossy black edge all the way round it. It is loose inside the hollow ball and it is BIG: from tip to tail it measures three quarters of the ball's width, so it only just fits. It is not printed on the ball, not a sticker, not engraved, not a reflection. It has no face, no eyes, no mouth, no arms, no legs, no hands.

LEFT PANEL, at rest. One whole glossy orange pinball flipper lies diagonally across the lower half of the panel: long and tapered, wide and round at its pivot end where a steel shaft holds it, narrow at its rounded tip, with a black rubber ring round its whole edge. It is three times as long as the ball is wide. The ball has come to rest against the upper edge of the flipper, near the pivot, where a ball settles when a flipper is held up. Inside, the cursor has slid down and lies slumped on the bottom of the ball, leaning back against the inside wall, tip tilted up. It is sweating: small beads of water on its white enamel, and more tiny clear droplets beaded on the inside surface of the acrylic above it. The seam and the aluminum plug are plain to see.

CENTRE PANEL, rolling fast. The ball is rolling down a lane between two chrome wire lane guides; the lane is one and a half times as wide as the ball. At the mouth of the lane stands a polished steel post with a white rubber ring, half as wide as the ball. The ball's seam is tipped at a steep angle because the ball has turned. Inside, the cursor is tumbling: it has left the wall and hangs in the middle of the hollow ball, turned upside down and diagonal, touching nothing, throwing a small shadow on the inside of the ball. Frozen by a fast flash. Completely sharp.

RIGHT PANEL, the hit. A big pop bumper fills the right half of the panel: a round white cap two and a half times as wide as the ball, a chrome ring under it, a white skirt at its base, its lamp lit. Part of the cap is cut off by the panel's edge. The ball is at the instant of striking it: the ball's side touches the bumper's skirt, low down, under the edge of the cap. Inside, the cursor has been thrown flat against the inside wall on the side of the ball AWAY from the bumper. It is squashed against the curve: wider, thinner, bent to fit the wall, its black edge bulging, fine cracks in the enamel, like the flattened cursor in reference image 2. It touches only the wall, not the plug. Frozen by a fast flash. Completely sharp.

THE PLAYFIELD, the same in all three panels: a flat pinball playfield, midnight navy and deep teal printed artwork with fine gold lines, under a thick glossy clear coat that mirrors the lamps. Round lit inserts set flush in it glow amber, white and red and carry only simple shapes: an arrow, a star, a circle. Steel posts with rubber rings, chrome wire guides and small warm lamps stand where real ones would, each one a complete, well-made part. Every flipper in the sheet is orange. Dense, designed, no bare patch.

LIGHT AND FOCUS: lit by the machine's own lamps, warm amber and cold white points, with a soft dim fill from the upper left. Deep focus: everything in every panel is sharp, the parts behind the ball too. No bokeh, no blur.

There are no words, letters, numbers, captions or labels anywhere in the image. The captions written under the cursors in the reference images must not be copied. No people, no hands, no fingers. No sheet of glass over the playfield. No fog, no smoke, no haze, no lens flare, no motion blur.
```

### G3 · Tier 3, Corporate

- File: `references/drafts/round-6/G3-tier-corporate.png`
- Model: `seedream_5`
- Takes made: 4 of 4 allowed. Kept: take 4.
- Reference images passed in, in order: `references/guides/round-6/guide-tier-corporate.png` (the unlabeled guide); `references/drafts/round-6/G7-clear-ball.png` (the kept G7).

Takes:

- Take 1. Counts right: two flippers, two slingshots, three inserts, one tower, one revolving door, one beach box, one table with twelve chairs, five drop targets, three sticky notes, one ladder ramp; both signs spelled right. Misses: scribbles like handwriting on the three sticky notes; the revolving door is a closed glass drum; the lift tube stops a third of the way up and does not reach its door; three lamps each side, not two. Judge: "Most likely generated art", then named nine things. Failed.
- Take 2 (made at the same time; same prompt plus a paragraph on finish). Counts right, both signs spelled right. Misses: three lines of scribble on each sticky note; gold marks like letters printed near the bottom left; the revolving door is a rimmed wheel of six wedges. Judge: "Most likely a screenshot (or promo capture) from a commercial pinball video game", then named seven things that could not work. Failed on the second question.
- Take 3 (take 2 passed back in as a third reference with a list of nine changes). The model returned take 2 almost unchanged: same scribbles, same rimmed wheel. Judge: "Amateur generated art (AI image), fairly confident", then named eight things. Failed.
- Take 4 (made at the same time as take 3; a fresh picture from the take 2 prompt, rewritten for every fault the two judges named: free-standing spinner, blank notes, entry flap and width for the ramp, tube joined to its door, lane widths, inlanes, no artwork like letters, deep focus, a scale paragraph). Counts right, both signs spelled right, no other writing. Judge: "Most likely generated art", then named nine things. Failed. Kept as the best of four: it is the only take with no writing off the list and with a way on and off the ramp.

The judge's answer on the kept take:

> picture-0304.png: verdict after viewing it at full size and zooming into each region.
>
> Q1. What is it most likely to be?
> Most likely generated art, not a real screenshot from a commercial pinball video game. The finish is far above "amateur", and at a glance it passes for commercial pinball game key art, but the details say it was not captured from a shipping game.
> - Polish is high: photoreal steel, marble, acrylic and lacquer, coherent warm lighting, shallow depth of field, and clean legible text ("Corporate HQ", "Retirement").
> - Against a real game screenshot: no score, HUD, ball count or any UI, and the layout is not playable (see Q2). A shipped table has to be mechanically coherent.
> - Against the other options: it is not a film frame (static top-down product view, no scene), not a textbook picture (no labels or diagram intent), and stock image is possible only in the sense that stock sites carry generated images.
> - Rough confidence: generated about 80%, real game screenshot about 10%, stock about 5%, the rest negligible.
>
> Q2. Could a ball really travel every lane and ramp? No. Things that could not work:
> - Contradictory direction arrows in one lane. The right-hand lane has three arrows pointing up, then two pointing down. The top lane points right on the left of the building, and on the right of the building one arrow points right and three point left.
> - The top lane vanishes behind or under the Corporate HQ building, with no visible passage through it.
> - The clear tube on the left has no usable exit. It runs from the orange elbow at top left to a closed rounded cap with a small spout into a bracket in the bottom-left corner, below the flipper line. A ball would be stuck or delivered straight to the drain.
> - The "Retirement" beach box is sealed acrylic on all sides, so no ball can get in, even though the ramp arches right under it.
> - The Corporate HQ doors are closed, with no visible opening, so the red-carpet lane has no visible way in.
> - A four-blade turnstile on a brass post sits dead centre of that carpet lane. A straight shot hits the post, and the space either side is about one ball wide.
> - The wire ramp is drawn as a ladder with handrails only at the arch. The rails are narrower than the ball, so it could ride them, but the straight climb has no side guards, and the far end finishes in curled wire loops above the right inlane with no clear drop or hand-off.
> - The boardroom table and chairs are a solid block across the upper left. The five white rectangles and three sticky notes below it are flat, so nothing there is a lane or target a ball could use.
> - No plunger or launch mechanism is visible; the right lane runs off the bottom of the frame.
>
> What does look workable: the two flippers, the marble slingshots, the inlane/outlane guides and the centre drain gap are roughly right, though the flippers are oversized relative to the ball (about 4.5 ball diameters long versus roughly 3 on a real table). The ball itself is a clear glass sphere with a mouse cursor inside, not steel.

Judge result: FAILED both questions (STATED by the judge). Kept at the limit of four takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: it called it generated art (about 80% sure) and named nine things that could not work.
- Ball size (MEASURED). The ball is about 70 px across on the 1920 px frame, 1/27 of the width. The brief says 1/20. A flipper is about 4.5 to 4.8 of these balls long. The brief says 3.
- Camera. Not straight down: the tower shows its whole glass front and the spinner stands on a tall brass post seen from the side. The brief says things lean "a very little".
- Arrows. In the launch lane three arrows point up and two point down. Along the orbit lane the arrows left of the tower point right, and right of the tower one points right and three point left. The prompt asked for up and for left.
- Orbit lane. It passes behind the tower and cannot be seen there.
- Lobby doors. They are shut glass doors with handles, lit from inside. The prompt asked for doors standing open. They are about two balls wide, not three.
- Revolving door. It is a four-vane glass spinner on a brass post in the middle of the carpet, with about one ball of carpet each side of it, not one and a half.
- Lift tube. It joins the orange door at the top left, but its bottom end is a closed cap in a bracket in the bottom left corner. It should run on off the bottom of the frame.
- Chute. Under the gap between the flippers there is a printed gold outline, not an opening in the board.
- Ladder ramp. It has an entry flap, rungs, a U-turn under the beach box and comes down the right side, but it has side rails only round the turn, and its lower right end finishes in wire loops above the right inlane (STATED by the judge as no clear drop).
- Drop targets and sticky notes. The five targets and the three notes read as flat on the board from this angle, not as standing targets.
- No plunger in frame (the plunger is in tier 1; the launch lane runs off the bottom of this frame as the guide shows).
- Ceramic border. Not in frame. The edge of the picture is the aluminum rail, as in the guide for the tier views.
- Focus (STATED by the judge as shallow depth of field). I see the whole frame as sharp at full size; UNKNOWN which is right.
- Words (MEASURED at full size): `Corporate HQ` and `Retirement`, both spelled right. No other letters or numbers found. The clipboard insert is drawn with seven ruled lines, each with a small mark at its left end, like a checklist. No letter can be read in it (MEASURED at six times enlargement), and it was left as generated.

Full prompt of the kept take:

```text
A screenshot from a finished commercial 3D pinball video game with photoreal graphics: one full screen of play, looking straight down at one tier of a pinball table. It looks exactly like a photograph of a real, physical pinball playfield taken from directly overhead with a long lens. 16:9. The tier fills the whole frame from its left edge to its right edge. Dense, designed, polished and readable: every part of the board is busy, nothing is bare, and every lane is clear to see.

REFERENCE IMAGE 1 is a LAYOUT GUIDE made of flat coloured blocks. Follow it exactly for where each thing is and how big it is. Do not copy its flat colours or its flat look: every block stands for a real, solid, photographed pinball part, described below. REFERENCE IMAGE 2 shows the ball of this game, three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it only for how the ball looks. This image has exactly one ball.

THE PLACE: the executive floor of a big company, built as a pinball playfield. The board is flat: midnight navy marble with fine gold inlay lines and art-deco gold pinstripes, printed as artwork under a thick glossy clear coat that shows sharp reflections of every lamp and part. Its light is cold white and gold. Everything that stands on the board is real pinball hardware or a small moulded playfield sculpture fixed among the hardware.

THE FRAME, as in the guide. Far left edge: a brushed aluminum side rail with a fine straight grain. Just inside it, the lift: a clear acrylic tube with aluminum collars, one and a half balls wide, running straight up from the bottom edge of the frame to the upper left corner. At its top end it joins one small glossy orange lift door, whose open mouth faces right onto the board, so a ball carried up the tube rolls out there. The tube touches nothing else. Far right: the launch lane, a straight open channel running the full height of the frame beside the right aluminum rail. It is one and a half balls wide, plainly wider than the ball, and its floor is clear and empty, with a row of small identical arrow inserts set flush in the floor, every one pointing up the lane. At the top right corner it curves left in one smooth bend into the orbit lane. The orbit lane is an open lane of the same width along the whole top edge of the tier, between a curved steel wall above it and a low steel wall below it, its floor clear, with small identical arrow inserts set flush in the floor, every one pointing left. At the top left corner the orbit lane curves down and opens onto the board in a clear lane between the lift door and the left end of the boardroom table.

UPPER PART, placed exactly as in the guide:
- Top centre, the centerpiece and by far the biggest thing in the image: the company's headquarters, a tall glass-and-steel office tower seen from above. We see its flat steel roof and, because it leans a very little toward the top of the frame, a sliver of its glass front with lit windows and a pair of wide brass lobby doors at its foot, three balls wide, facing down the tier and standing open on a brightly lit lobby. Flat on the roof lies a lit sign with two words: "Corporate HQ".
- One round white flasher dome at each side of the lobby doors, both lit bright white.
- From the lobby doors a short red carpet ramp with brass edges runs down toward the middle of the tier.
- On the carpet in front of the doors: the revolving door, one large four-vane spinner: a brass centre post with four flat glass vanes in a cross, each vane one and a half balls long, seen from above as a plain cross. It stands free: there is no ring, no rim, no drum and no wall round it, only bare red carpet, so it bats a ball that touches it.
- Upper left: one long boardroom table of dark walnut with exactly twelve empty black leather chairs, six along each long side. Nobody is there. Along its near edge, a straight row of exactly five white drop targets.
- Below the drop targets, a little to the right: exactly three standup targets shaped like yellow sticky notes, stepping down to the right. Each is plain blank yellow: nothing is written, printed or drawn on any of them.
- Top right: one sealed clear acrylic box, lit warm from inside like sunshine, holding a tiny sunny beach: sand, turquoise water, one palm tree, one deck chair. It has no door and no lane leads to it. A small brass plate along the top edge of its lid carries one word: "Retirement".
- Right, below the box: the corporate ladder, one chrome wire ramp for the ball, built like a ladder: two parallel chrome rails with rungs between them. It is one and a half balls wide between its rails, plainly wider than the ball, and the two rails stay the same distance apart from one end to the other. Its way on is its lower left end: a wide steel entry flap lying on the board in open floor to the right of centre, facing the flippers. From there it climbs up and to the right, makes one U-turn in front of the beach box, and comes straight down the right side. Its way off is its lower right end, where both rails end together, side by side, just above the board at the top of the right inlane. Nothing crosses it and it crosses no lane.

LOWER PART, the same on every tier of this machine, placed exactly as in the guide:
- A pair of glossy orange flippers at the bottom centre, each three balls long, on steel shafts, each with a black rubber band round it. Their pivots are wide apart and their tips point down toward the centre, with a gap one and a half balls wide between the tips.
- Below the gap: the chute, a steel-edged opening in the board through which a missed ball falls to the tier below.
- A slingshot above and outside each flipper: a triangle of polished white marble and chrome, with a rubber band round three posts and a lamp inside.
- Outside each slingshot: an inlane and an outlane, each one and a half balls wide, divided by one chrome wire lane guide. The inlane runs between the slingshot and the guide and leads straight onto the base of the flipper, so a ball that rolls down it rolls onto the flipper. The outlane runs outside the guide and leads down past the flipper. Two lit amber lamps set flush in the floor on each side. No bolt or post stands in the mouth of a lane.
- Above the flippers, in an arc: exactly three large round lit inserts set flat and flush in the board, level with its surface. Each shows one simple picture and no words. Left: a magnifying glass. Middle: an hourglass. Right: a clipboard. They glow ice blue, white and gold.
- Everywhere between these: printed gold artwork of straight lines, arcs, fans and chevrons only, rows of small identical lit arrow and circle inserts along the lanes, steel posts with rubber rings, small lamps. None of the artwork looks like letters, numbers or writing. Nothing stands in a lane.

THE BALL: exactly one ball, the clear acrylic ball of reference image 2, one twentieth of the frame's width across. It is on the red carpet at the lower edge of the revolving door, touching one of its vanes. We look down through the top of the clear ball at the solid white arrow cursor with its black edge lying inside it; the arrow is three quarters of the ball's width and is plain to see. A crisp highlight on the ball and a soft shadow under it.

FINISH: the level of the best modern 3D pinball simulations on sale today. Rich contrast, glowing lamps, deep sharp reflections in the clear coat, crisp moulded plastics with printed art, chrome wire, brass, real screws, posts and rubber rings. The tower stands tall toward the camera: its roof is the nearest thing to the lens, and the perspective shows slivers of its glass sides.

LIGHT: every lamp is on. General lighting round the edges of the tier, a lamp under every insert, both flasher domes, lit windows in the tower, the warm glow of the beach box. Light from each insert spills onto the post beside it. Cold white and gold overall.

CAMERA: directly overhead, long lens, so things that stand up lean only a very little outward toward the edges of the frame and show a sliver of their sides. Deep focus: every part of the image is sharp from edge to edge, with no soft or blurred area anywhere.

LETTERING: the only words anywhere in the image are "Corporate HQ" on the tower's roof and "Retirement" on the beach box, spelled exactly like that. There are no other letters or numbers anywhere: no score, no display, no labels, no captions, no brand, no logo. Inserts and plastics carry only pictures, arrows, circles, stars and stripes.

NOT IN THE IMAGE: no people, no hands, no faces; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, smoke, haze, lens flare or blur; not pixel art, not a flat illustration, not a cartoon, not a diorama, not a model railway.

SCALE, with the ball as the unit: the frame is twenty balls wide and eleven tall. A flipper is three balls long. Every lane, the ramp and the lift tube are one and a half balls wide, so the ball fits in each of them with room to spare. The tower's footprint is four balls wide.
```

### G4 · Tier 2, The Office

- File: `references/drafts/round-6/G4-tier-office.png`
- Model: `seedream_5`
- Takes made: 4 of 4 allowed. Kept: take 4.
- Reference images passed in, in order: `references/guides/round-6/guide-tier-office.png` (the unlabeled guide); `references/drafts/round-6/G7-clear-ball.png` (the kept G7); `references/drafts/round-6/G3-tier-corporate.png` (the kept G3).

Takes:

- Take 1. Follows the guide. Counts right except the staplers: three bumpers with coffee lid caps, one coffee machine with `Coffee`, six cubicles, five drop targets, one inbox with a scoop, three inserts. Misses: the slingshots are red triangular plastics with a wire, not clearly staplers; launch lane arrows point up at the top and down at the bottom; the ball sits just below the lowest bumper; the lift tube ends in an elbow at the bottom left. Judge: "Most likely generated art", then named eight things. Failed.
- Take 2 (made at the same time; same prompt plus a paragraph naming the routes). Misses: flat disc caps on the bumpers, not coffee lids; an orbit lane along the top and an orange elbow at the top left that the guide does not have; cubicles of odd shapes. Judge: "amateur generated art (an AI-generated image)", then named twelve things. Failed.
- Take 3 (prompt rewritten for every fault the two judges named: straight lift tube, launch lane walled off with every arrow up, no lane along the top, bumpers a ball and a half apart, desk staplers, blank printed notes, inlanes that meet the flipper). Misses: seen at an angle with dark margins left and right, so the tier does not fill the frame; nine cubicles, not six; the slingshots are red triangles, not staplers. Judge: "amateur generated art (AI-generated)", then named ten things. Failed.
- Take 4 (made at the same time as take 3; the take 3 prompt plus the routes paragraph). Seen from straight above, tier fills the frame, all counts right, `Coffee` spelled right, no other writing. Judge: "generated art, of the five options", with "promotional art for a commercial pinball video game" as its second choice, then named nine things. Failed. Kept as the best of four: it is the only take with all counts right, real staplers and the overhead view.

The judge's answer on the kept take:

> Answer for picture-0404.png (I viewed it at full size plus zoomed crops of every lane, tube and corner).
>
> WHAT IT IS: an office-themed pinball playfield seen from above: six miniature cubicles top left, three coffee-cup pop bumpers, a "Coffee" machine top right, an inbox tray of envelopes with a hole in its front, red staplers as slingshots, orange flippers, three lit inserts (pizza, envelope, knot), a clear tube down the left side, a chrome arrowed lane down the right side and across the top, and a glass ball with a mouse cursor inside.
>
> Q1. MOST LIKELY CATEGORY: generated art, of the five options. It is not a real commercial pinball game screenshot, film frame, stock photo or textbook picture.
> - Against a game screenshot: no score, HUD or display, and the layout is not functionally consistent (see Q2). A shipped pinball game has to simulate the ball, so its lanes must connect.
> - Against a film frame or textbook: nothing explains or stages anything; it is a single decorative top-down still.
> - For generated art: convincing at a glance, but mechanisms dissolve under zoom (lanes with capped ends, arrows that contradict each other, a smudged unreadable tag bottom right, vague playfield decals).
> - Caveat on "amateur": the finish is well above amateur. Lighting, materials, theme and the lower third are polished enough that at a glance it passes for promotional art for a commercial pinball video game. That is my second-choice reading.
>
> Q2. COULD A BALL TRAVEL EVERY LANE AND RAMP? No. The lower third would work; most of the upper lanes and tubes would not.
>
> Things that could not work:
> - Left clear tube: narrower than the ball (ball is about 80 px across, tube about 55-60 px). Its bottom end is a closed chrome cap with a stub going into the dark apron, so there is no exit onto the playfield.
> - Right chrome lane: its upper three arrows point up and its lower two point down, so it has no single direction. The track is narrower than the ball, continuous rails wall it off from the playfield with no opening, and two flat tabs block its bottom end.
> - Top lanes: the left one has arrows pointing right, the right one points left, and both end in riveted end plates either side of the centre. The U-shaped chrome pocket between them is closed at its lower end, so a ball arriving there has no way out.
> - No plunger or shooter lane is visible, so there is no evident way for a ball to enter play at all.
> - Column of five white targets: the upper two or three sit almost touching the left coffee-cup bumper, a gap far smaller than the ball, so they cannot be hit.
> - Three coffee-cup bumpers: packed so tightly the ball cannot pass between them; it can only strike the outside of the cluster.
> - Cubicles and coffee machine: sealed scenery with no entrances. That is fine as decoration, but they are not shots.
> - Orange part clipped to the tube (left, mid-height): looks like a diverter or gate but connects to nothing.
> - Minor: the tube lies over the left outlane, and the ball is glass rather than steel (fine for a video game, not a real machine).
>
> Things that would work: the two flippers and the centre drain gap (about 1.5 ball widths), the stapler slingshots, the inlane/outlane wire guides with their lights, the three round inserts, and the hole in the front of the inbox tray, which is wide enough to act as a scoop.

Judge result: FAILED both questions (STATED by the judge). Kept at the limit of four takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: it called it generated art and named nine things that could not work.
- Launch lane arrows (MEASURED). Five arrow inserts: the top three point up, the bottom two point down. The prompt asked for every one to point up.
- Lift tube. It has a clear elbow at the top left that turns into a clear rail along the top edge, and at the bottom it ends in a chrome collar and stub in the bottom left corner. The prompt asked for a dead straight tube leaving the frame at both ends. It is narrower than the ball (STATED by the judge: tube about 55 to 60 px against a ball of about 80 px on its view).
- Top edge. A chrome strip with small arrow lamps runs along the top on both sides of the chute and reads as a lane with closed ends. This tier has no lane along the top in the guide.
- Lift door. The orange part at mid-left is a clip on the tube with a wire, not clearly a door that opens onto the tier.
- Bumpers. The three coffee cups stand closer together than one ball, so a ball cannot pass between them. The brief puts the ball among the three; here it touches the lowest one from below.
- Drop targets. The top two or three of the five stand close to the left bumper, nearer than one ball.
- Ball size (MEASURED). About 109 px across on the 1920 px frame, so the tier is about 18 balls wide, not 20. A bumper cap is about 2.1 balls across (brief: 2.5). A flipper is about 2.8 balls long (brief: 3).
- A small blank paper tag on a loop of string lies on the dark panel in the bottom right corner. It is not a pinball part and nothing in the brief asks for it.
- No plunger in frame (the plunger is in tier 1; the launch lane runs off the bottom of this frame as the guide shows).
- Ceramic border. Not in frame. The edge of the picture is the aluminum rail, as in the guide for the tier views.
- Words (MEASURED at full size): `Coffee`, spelled right. No other letters or numbers found. The envelopes, the printed notes and the coffee lids are blank.

Full prompt of the kept take:

```text
A screenshot from a finished commercial 3D pinball video game with photoreal graphics: one full screen of play, looking straight down at one tier of a pinball table. It looks exactly like a photograph of a real, physical pinball playfield taken from directly overhead with a long lens. 16:9. The tier fills the whole frame from its left edge to its right edge. Dense, designed, polished and readable: every part of the board is busy, nothing is bare, and every lane is clear to see.

REFERENCE IMAGE 1 is a LAYOUT GUIDE made of flat coloured blocks. Follow it exactly for where each thing is and how big it is. Do not copy its flat colours or its flat look: every block stands for a real, solid, photographed pinball part, described below. REFERENCE IMAGE 2 shows the ball of this game, three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it only for how the ball looks. This image has exactly one ball. REFERENCE IMAGE 3 is the tier above this one on the same machine, already finished. Match its brushed aluminum side rails, its clear lift tube on the left, its launch lane on the right, its orange flippers, its lane guides and lamps, the size of its parts and of its ball, its overhead camera and its photographic finish. Do not copy its navy marble, its tower or its other parts: this tier is a different place.

THE PLACE: an open-plan office, built as a pinball playfield. The board is flat: grey-green carpet tiles with beige laminate walkways, printed as artwork under a thick glossy clear coat that shows sharp reflections of every lamp and part. Its light is flat fluorescent: cool, even, a little green-white. Accent colours: sticky-note yellow, stapler red, coffee brown. Everything that stands on the board is real pinball hardware or a small moulded playfield sculpture fixed among the hardware.

THE FRAME, as in the guide and in reference image 3. Far left edge: a brushed aluminum side rail. Just inside it, the lift: a clear acrylic tube with aluminum collars, one and a half balls wide, running dead straight up the full height of the frame: it enters at the bottom edge and leaves at the top edge, with no bend, no elbow and no cap, because it carries on to the tiers above and below. Left edge, at mid height, just below the cubicles, where the lift opens onto this tier: one small glossy orange lift door, a hinged flap in the right side of the tube, standing open onto the board. The tube touches nothing else. Far right: the launch lane, a straight open channel running the full height of the frame beside the right aluminum rail, shut off from this tier by one continuous low steel wall: the launched ball only passes through here on its way up to the top tier. It is one and a half balls wide, plainly wider than the ball. It enters at the bottom edge of the frame and leaves at the top edge, dead straight. Its floor is clear and empty, with a row of small identical arrow inserts set flush in the floor, every single one pointing up toward the top of the frame. Top centre: the chute from the tier above, a steel-edged opening two balls wide through which the ball drops in, straight down onto the bumpers. The rest of the top edge is a plain low steel wall with a row of small white lamps. There is no lane along the top of this tier.

UPPER PART, placed exactly as in the guide:
- Top centre, the centerpiece and the biggest things in the image: exactly three large pop bumpers in a triangle, two side by side above and one below between them, with gaps one and a half balls wide between them so the ball can pass. Each has a white skirt at its base, a chrome ring, and a cap that is a white plastic takeaway coffee cup lid with a raised rim and a small sip hole, sitting on a coffee-brown body. Each cap is two and a half balls across. A warm lamp is lit inside each bumper.
- Right of the bumpers, at the top: one office coffee machine, a moulded brown and steel machine seen from above, with small lit buttons that carry no words and a paper cup under its spout. Flat on its top lies a sign with one word: "Coffee".
- Upper left: the cubicle farm, exactly six cubicles in two rows of three. Each has low beige fabric walls, a desk, one dark switched-off monitor and an empty chair. Nobody is there.
- Along the right side of the cubicle farm: a straight column of exactly five white drop targets, facing the bumpers.
- Right: the inbox, one large beige office mail tray piled with blank white envelopes, seen from above. At its lower left front corner: the scoop, a dark steel-edged hole in the board, big enough to swallow a ball.

LOWER PART, the same on every tier of this machine, placed exactly as in the guide:
- A pair of glossy orange flippers at the bottom centre, each three balls long, on steel shafts, each with a black rubber band round it. Their pivots are wide apart and their tips point down toward the centre, with a gap one and a half balls wide between the tips.
- Below the gap: the chute, a steel-edged opening in the board through which a missed ball falls to the tier below.
- A slingshot above and outside each flipper. Each slingshot is a giant glossy red office stapler seen from above, the classic desk stapler: a long red top arm with a rounded nose, hinged at its back end over a flat steel base. It lies along the slingshot's long inner edge, with the rubber band and its three posts beside it and a lamp under it. Exactly two red staplers, one each side, mirror images of each other.
- Outside each slingshot: an inlane and an outlane, each one and a half balls wide, divided by one chrome wire lane guide. The inlane runs between the slingshot and the guide, and its lower end turns in to meet the pivot end of the flipper, so the flipper is the continuation of the inlane and a ball that rolls down it rolls onto the top of the flipper. No rail or guide runs under a flipper. The outlane runs outside the guide and leads down past the flipper. Two lit amber lamps set flush in the floor on each side. No bolt or post stands in the mouth of a lane.
- Above the flippers, in an arc: exactly three large round lit inserts set flat and flush in the board, level with its surface. Each shows one simple picture and no words. Left: a slice of pizza. Middle: an envelope with two curved arrows. Right: a knot of rope. They glow yellow, green and blue.
- Everywhere between these: printed artwork of carpet tiles, floor-plan lines, cable runs, paper clips, coffee rings and plain blank sticky notes with nothing on them; rows of small identical lit arrow and circle inserts along the lanes; steel posts with rubber rings; small lamps. None of the artwork looks like letters, numbers or writing. Nothing stands in a lane.

THE BALL: exactly one ball, the clear acrylic ball of reference image 2, one twentieth of the frame's width across, much smaller than a bumper cap. It is in the gap in the middle of the three bumpers, touching the skirt of the lower bumper, plain to see between the three caps. We look down through the top of the clear ball at the solid white arrow cursor with its black edge lying inside it; the arrow is three quarters of the ball's width and is plain to see. A crisp highlight on the ball and a soft shadow under it.

FINISH: the level of the best modern 3D pinball simulations on sale today. Rich contrast, glowing lamps, deep sharp reflections in the clear coat, crisp moulded plastics with printed art, chrome wire, brass, real screws, posts and rubber rings.

LIGHT: every lamp is on. General lighting round the edges of the tier, a lamp under every insert, a lamp in each bumper, small lit buttons on the coffee machine. Light from each insert spills onto the post beside it. Flat, even, fluorescent overall.

CAMERA: directly overhead, long lens, so things that stand up lean only a very little outward toward the edges of the frame and show a sliver of their sides. Deep focus: every part of the image is sharp from edge to edge, with no soft or blurred area anywhere.

LETTERING: the only word anywhere in the image is "Coffee" on the coffee machine, spelled exactly like that. There are no other letters or numbers anywhere: no score, no display, no labels, no captions, no brand, no logo. The monitors are dark and blank, the envelopes and sticky notes are blank. Inserts and plastics carry only pictures, arrows, circles, stars and stripes.

NOT IN THE IMAGE: no people, no hands, no faces; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, smoke, haze, lens flare or blur; not pixel art, not a flat illustration, not a cartoon, not a diorama, not a doll's house.

SCALE, with the ball as the unit: the frame is twenty balls wide and eleven tall. A flipper is three balls long. A bumper cap is two and a half balls across. Every lane, every ramp and the lift tube are one and a half balls wide, so the ball fits in each of them with room to spare.

ROUTES, all clear to see: the ball drops in at the top centre straight onto the three bumpers. An open lane one and a half balls wide runs down each side of the bumper group to the flippers. From the left flipper an open shot runs up to the scoop at the inbox; from the right flipper an open shot runs up to the row of drop targets beside the cubicles and to the lift door on the left. The cubicles, the coffee machine and the inbox stand outside the lanes, against the walls, and block nothing.
```

### G5 · Tier 1, The Street

- File: `references/drafts/round-6/G5-tier-street.png`
- Model: `seedream_5`
- Takes made: 4 of 4 allowed. Kept: take 3.
- How it was made: Take 3 as generated, with one retouch after generation: the sign on the house at the bottom left came out as "Mom's" over a second word of malformed letters, roughly "Baskutt". The 512 px square round that house was cut out, sent back to the same model with the instruction to change only the lettering to `Mom's Basement` (prompt: `Reproduce this photograph exactly ... Change one thing only: the dark serif lettering on the cream sign plate. It now reads, on two lines, exactly: Mom's / Basement`), made twice, both spelled right, and the sign plate alone (148 by 92 px of the 2816 px original, feathered) was pasted back from the first one. Nothing else in the file was changed, and a fresh judge saw that file (see the takes below). Then one more change. The clock-face insert above the flippers came out with twelve small marks shaped like numerals, none of them a real number, although the prompt asked for "a clock face with two hands and no numbers". The brief says a sign that cannot be got right is left blank, so the twelve marks were smoothed away: about 1,600 pixels in all, inside a ring 105 by 91 px on the 2816 px original (about 76 by 66 px on the kept file). The hands were not touched and nothing else was changed. Another fresh judge then saw the file exactly as it is kept; its answer is the one quoted below. Neither change was counted as a take.
- Reference images passed in, in order: `references/guides/round-6/guide-tier-street.png` (the unlabeled guide); `references/drafts/round-6/G7-clear-ball.png` (the kept G7); `references/drafts/round-6/G3-tier-corporate.png` (the kept G3).

Takes:

- Take 1. Misses: seen at a steep angle with dark margins, so the tier does not fill the frame; signs wrong: "You're Fire-" (cut off), "Student Loan", an unreadable "Mom's ..."; two tiny houses only. Judge: "amateur generated art", then named eight things. Failed.
- Take 2 (made at the same time; same prompt plus a paragraph naming the routes). Seen from straight above. `You're Fired`, `Background Check`, `Student Loans` spelled right. Misses: "Mom's Ekōaier" and "Unemployment Offier"; four tiny houses near the top and none above the slingshots, five houses in all, not seven; no spinner to be seen; lift tube ends in a cap at the apron. Judge: "amateur generated (AI) art", then named seven things. Failed.
- Take 3 (prompt rewritten for every fault the two judges named: two rows of three houses, large cream signs spelled letter by letter, cellar hatch as a hole in the outlane, office doorway two balls wide, plunger tip in the lane, wire ramp as two rails side by side with a stated way on and off, spiral as a wide clear half-pipe, straight lift tube, every launch lane arrow up). Seen from straight above, all counts right, four of five signs spelled right, the fifth wrong ("Mom's" over roughly "Baskutt") and retouched as described above. Judge (on the file with the sign retouched): "Generated art (AI image), of the five options. Fairly confident, not certain", then named nine things. Failed. After the clock's marks were smoothed away a second fresh judge saw the file as it is kept; its answer is the one quoted below: "Most likely amateur generated (AI) art", then named nine things. Failed. Kept as the best of four: the only take with every count right and every sign right after the retouch.
- Take 4 (made at the same time as take 3; the take 3 prompt plus the routes paragraph). Misses: seen at an angle with dark margins; "Enemployment Offer" and "Mom's Basenen"; houses scattered over the upper board. Judge: "amateur generated art (AI-generated)", then named ten things. Failed.

The judge's answer on the kept take:

> Answer for picture-0505.png (viewed at full 1920x1080 and in zoomed crops of every region).
>
> WHAT IT SHOWS
> A top-down, photoreal view of a satirical "career" pinball table: miniature buildings labelled "You're Fired" (red beacon), "Student Loans" (columned bank), "Background Check" (blue beacon), "Mom's Basement" (tiny house, bottom left), and a drain labelled "Unemployment Office". The ball is a clear glass sphere with a white mouse-cursor arrow inside. Two orange flippers, two yellow chevron slingshots, three round inserts (ladder, clock, hat), a clear tube down the left side, a two-rail wire ramp arching across the middle, a spiral parking garage on the right, and a plunger lane with lit arrows on the far right.
>
> Q1 - WHICH IS IT MOST LIKELY?
> Most likely amateur generated (AI) art. This is a judgement from the image alone, not a certainty.
> - Not a commercial pinball video game: there is no score, ball count, HUD or display, and the table is not playable (see Q2). A shipped game has to have a layout its physics engine can actually run a ball through.
> - Not a top-budget film frame: the lighting, depth of field and grain are cinematic, but a film art department would not leave garbled details. Several of the lit lane arrows are malformed blobs/diamonds rather than arrows, and one arrow in the plunger lane points down while the four above it point up. In the right mid-field there is a melted tangle of wire, glass and lamp posts that resolves into no real object.
> - Not a stock image or textbook picture: the joke labels are too specific for stock, and nothing is diagrammed or explanatory.
> - What points to generation: globally convincing, locally incoherent. Clean, correctly spelled label text sits beside nonsense micro-detail, and the mechanisms look right at a glance but do not connect or fit the ball.
>
> Q2 - COULD A BALL REALLY TRAVEL EVERY LANE AND RAMP? 
> No. Measuring the ball at about 105 px across (it is consistent with the flippers, which are about 2.6 ball-widths long, close to a real table), these things could not work:
>
> 1. Plunger/shooter lane (right): about 65-73 px wide between its rails, so narrower than the ball. The plunger's knob also sits inside the cabinet over the apron, not sticking out the front where a player could pull it, and the lane arrows contradict each other (four up, one down).
> 2. Left clear tube: about 81 px outside diameter, so the ball is wider than the tube. Its bottom ends in a chrome elbow that goes into the apron corner with no outlet back onto the playfield, and nothing visible feeds its top (the top-lane arrows next to it point away from it).
> 3. Top lane: the left arrows point right and the right arrows point left, both converging on a lit box at top centre, but the two channels end in rounded, capped ends short of that box. Balls from both sides would meet head-on with no exit shown.
> 4. Wire ramp across the middle: it humps up in the centre and falls to both ends, so there is no single downhill direction and no ramp entry from the flippers to give the ball speed. The left end closes in a U-bend at playfield level; the right end just butts into the garage wall and a little windmill/spinner post. The two rails are only about 30 px apart with ladder rungs between them and no side guides, so it reads as a handrail, not a ball track. The ball is in fact sitting on the playfield beside it, not on it.
> 5. Spiral parking garage: the clear trough on top is roughly 40 px wide (well under half the ball) and is a closed swirl with no clear entry. The levels below are separate stacked rings, not a continuous helix, with gaps far smaller than the ball. The only exit is a flat metal strip about 20 px wide at the bottom that dumps between two posts.
> 6. "Background Check" building: its doorway is completely blocked by the garage standing in front of it, so it cannot be shot from the flippers, and its little bridge leads only onto the unusable garage top.
> 7. Inlanes and outlanes: the inlanes measure about 90-100 px and the outlanes about 65 px, so the ball barely fits or does not fit at all (real lanes are clearly wider than the ball).
> 8. Left outlane / "Mom's Basement": the house sits directly in the outlane's path, and the square hole beside it has an opening of only about 70 px, smaller than the ball.
> 9. Smaller issues: the "Unemployment Office" sign plate sits right at the mouth of the centre drain; the wire ramp's support posts and the tangle of lamp posts stand in open playfield; "Student Loans" has no opening at all (it would only be a bumper/target).
>
> What would plausibly work: the two flippers and their gap (about 1.4 ball-widths), the slingshots, the straight centre road down to the drain, and the "You're Fired" scoop, whose opening (about 134 px) is wide enough for the ball.
>
> Caveats: sizes are pixel measurements from a single slightly perspective view, so raised parts (tube, garage top) carry some error, but being nearer the camera would make them look larger, not smaller, which makes the misfit worse. I did not search the web, so I have not checked whether this image exists elsewhere.

Judge result: FAILED both questions (STATED by the judge). Both judges who saw this take gave generated art as the first answer, and each named nine things. Kept at the limit of four takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: it called it amateur generated art and named nine things that could not work (quoted above). The judge before it, who saw the file with the clock's marks still on it, also called it generated art ("fairly confident, not certain"; a film frame was "the only real rival") and named nine.
- `Mom's Basement` was not spelled right by the model in the full picture. The sign in the file is a retouch (see "How it was made").
- Wire ramp. Two chrome rails with rungs on thin posts, more like a handrail than a track a ball rides. It has a peak over the road. Its left end is a closed loop near the bank with no flap, and its right end meets the outside of the spiral beside a post. So the way on and the way off are not clear (STATED by both judges; I see the same). The last judge measures the two rails as about 30 px apart against a ball of about 105 px (STATED; not measured by me).
- Parking garage spiral. The three levels are stacked rings, not one continuous ramp, and the clear half-pipe on the roof is a closed loop round a hole. The way off is a thin metal tongue at the lower right corner of the garage, narrower than the ball.
- Police station door. The spiral and the spinner stand directly in front of it.
- Spinner. It came out as a small pinwheel on a post beside the police station, not a flat flag hanging between two posts across the lane.
- Launch lane arrows (MEASURED). Five arrow inserts: the top four point up, the lowest one points down.
- Top edge. Arrow lamps along the top left point right and those along the top right point left; a lit box at the top centre is the chute. The prompt asked for no lane along the top; the lamps and rails there read as one.
- Lift tube. It runs straight up the left side to an orange funnel at the top left corner, not to a door between the firehouse and the bank, and at the bottom it ends in a chrome elbow at the apron.
- Plunger. The spring and the orange knob are inside the frame at the foot of the launch lane, a little left of the lane's centre line.
- Inlanes. The wire guides below each inlane run on under the flippers toward the drain (STATED by the earlier judge with moderate confidence; I see the same on both sides). The last judge measures the inlanes at about 90 to 100 px and the outlanes at about 65 px against a ball of about 105 px, so the ball barely fits or does not fit (STATED; not measured by me).
- Mom's house stands in the left outlane beside its hatch and takes about half of the outlane's width.
- Insert pictures. The left one is a ladder and the middle one a clock face with three hands and a plain face. As generated it had twelve marks shaped like numerals, none a real number; they were smoothed away after generation (see "How it was made"). The right one shows one hat with a brim, perhaps two, not a stack of three.
- Stray small things on the board near the spiral: a bent street lamp and a loose nut (STATED by the earlier judge; I see a bent lamp post and a small ring). The last judge calls it "a melted tangle of wire, glass and lamp posts that resolves into no real object".
- Launch lane width (STATED by the last judge; not measured by me). About 65 to 73 px between its rails against a ball of about 105 px, so the lane is narrower than the ball.
- Lift tube width (STATED by the last judge; not measured by me). About 81 px across, so the ball is wider than the tube.
- Cellar hatch (STATED by the last judge; not measured by me). Its opening is about 70 px, smaller than the ball. The prompt asked for a hole one and a half balls wide.
- Small lit arrows (MEASURED). Two of the five arrow lamps in the launch lane are diamond-shaped blobs, not arrows, and one of the lamps along the top edge carries a doubled chevron. Both judges call the small arrows malformed. None reads as a letter.
- Bank. It has no opening for a ball, and the drain's sign plate sits at the mouth of the drain (STATED by the last judge; I see the same).
- Ball size (MEASURED). About 100 px across on the 1920 px frame, so the tier is about 19 balls wide. A flipper is about 3 balls long.
- Ceramic border. The apron along the bottom is ceramic as asked. The border on the other sides is not in frame; the edge of the picture is the aluminum rail, as in the guide for the tier views.
- Words (MEASURED at full size): `You're Fired`, `Background Check`, `Student Loans`, `Unemployment Office`, all spelled right by the model; `Mom's Basement`, spelled right by the retouch. No other letters or numbers found.

Full prompt of the kept take:

```text
A screenshot from a finished commercial 3D pinball video game with photoreal graphics: one full screen of play, looking straight down at one tier of a pinball table. It looks exactly like a photograph of a real, physical pinball playfield taken from directly overhead with a long lens. 16:9. The tier fills the whole frame from its left edge to its right edge. Dense, designed, polished and readable: every part of the board is busy, nothing is bare, and every lane is clear to see.

REFERENCE IMAGE 1 is a LAYOUT GUIDE made of flat coloured blocks. Follow it exactly for where each thing is and how big it is. Do not copy its flat colours or its flat look: every block stands for a real, solid, photographed pinball part, described below. REFERENCE IMAGE 2 shows the ball of this game, three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it only for how the ball looks. This image has exactly one ball. REFERENCE IMAGE 3 is the top tier of the same machine, already finished. Match its brushed aluminum side rails, its clear lift tube on the left, its launch lane on the right, its orange flippers, its lane guides and lamps, the size of its parts and of its ball, its overhead camera and its photographic finish. Do not copy its navy marble, its tower or its other parts: this tier is a different place.

THE PLACE: the city outside, at dusk, built as a pinball playfield. The board is flat: deep teal and navy streets printed as artwork, with road markings, crossings, kerbs, parking bays and manhole covers, under a thick glossy clear coat that shows sharp reflections of every lamp and part. Its light is warm dusk: amber windows and street lamps, with red and blue flashers. Everything that stands on the board is real pinball hardware or a small moulded playfield sculpture fixed among the hardware.

THE FRAME, as in the guide and in reference image 3. Far left edge: a brushed aluminum side rail. Just inside it, the lift: a clear acrylic tube with aluminum collars, one and a half balls wide, running dead straight up from the left end of the apron to the top edge of the frame, where it leaves the frame with no bend, no elbow and no cap, because it carries on to the tier above. Left edge, upper part, between the firehouse and the bank, where the lift opens onto this tier: one small glossy orange lift door, a hinged flap in the right side of the tube, standing open onto the board. The tube touches nothing else. Far right: the launch lane, a straight open channel running the full height of the frame beside the right aluminum rail, shut off from this tier by one continuous low steel wall: the launched ball only passes through here on its way up to the top tier. It is one and a half balls wide, plainly wider than the ball, and leaves the frame at the top edge, dead straight. Its floor is clear and empty, with a row of small identical arrow inserts set flush in the floor, every single one pointing up toward the top of the frame. At its foot, bottom right: the plunger, a steel rod with a coiled spring whose tip stands in the foot of the lane, in line with it, and whose glossy orange ball knob sits at the very bottom edge of the frame, below the end of the lane. Top centre: the chute from the tier above, a steel-edged opening two balls wide through which the ball drops in. The rest of the top edge is a plain low steel wall with a row of small white lamps. There is no lane along the top of this tier.

UPPER PART, placed exactly as in the guide:
- Upper left: one red brick firehouse seen from above, with one red flasher dome on its roof, lit. At its lower edge its garage door stands open onto the scoop, a dark steel-edged hole in the board. Flat on its roof lies a sign: "You're Fired".
- Upper right: one police station seen from above, blue-grey stone, with one blue flasher dome on its roof, lit. Flat on its roof lies a sign: "Background Check". On the open lane at the right, just below the station: one spinner, a small flat steel flag hanging on a wire between two posts across the lane.
- Left, below the firehouse: one bank with stone columns along its front. Flat on its roof lies a sign: "Student Loans". Along its right side: a straight column of exactly five white drop targets.
- Right, below the police station and clear of its door: one three-level parking garage of grey concrete, seen from above, with one clear plastic spiral ramp wound once round it: an open clear half-pipe one and a half balls wide, plainly wide enough for the ball. Its way on is a steel entry flap lying on the board at the garage's lower left corner, facing the flippers. It winds up round the garage in one turn and ends open at the top deck, where the wire ramp begins.
- Across the tier: the highway. A printed road runs up the middle of the board from the flippers to the chute. Over it crosses the overpass, one chrome wire ramp that a ball rides: two chrome rails side by side at the same height, like a railway track, one and a half balls apart, joined underneath by small U-shaped wire hoops, held up on a few thin steel stands. The ball rolls along between the two rails. It is the same width from end to end. Its way on is at the top deck of the parking garage, where the spiral delivers the ball. From there it arcs over the centre of the tier, high above the road, and comes down to the left. Its way off is its lower left end, where both rails end together, side by side and open, just above the board at the top of the left inlane. Nothing crosses it.
- The suburbs. Directly above the left slingshot, between the bank and the slingshot: one row of exactly three tiny houses standing side by side, each with a pitched roof and lit amber windows. Directly above the right slingshot, below the parking garage: one more row of exactly three tiny houses side by side. That is six tiny houses in two rows of three. There are no houses anywhere else in the upper part of the board: the ground between the firehouse and the police station is road and printed street only.
- Bottom left, at the foot of the left outlane: one more tiny house, a little bigger than the others, standing against the wall beside the outlane. In the floor of the outlane in front of it: its cellar hatch, an open steel-edged hole in the board one and a half balls wide, into which an outlane ball drops. Flat on its roof lies a wide cream sign as long as the roof, with two words in large plain black letters: "Mom's Basement".
- Along the whole bottom edge: the apron, a smooth band of matte off-white ceramic. At its centre, right under the gap between the flippers: a small grey office front with a dark open doorway two balls wide. That doorway is the drain, wide enough to swallow the ball. Over the door, across the whole width of the office front, a wide cream sign with two words in large plain black letters: "Unemployment Office".

LOWER PART, the same on every tier of this machine, placed exactly as in the guide:
- A pair of glossy orange flippers at the bottom centre, each three balls long, on steel shafts, each with a black rubber band round it. Their pivots are wide apart and their tips point down toward the centre, with a gap one and a half balls wide between the tips.
- A slingshot above and outside each flipper: a triangle of road-sign yellow plastic with black chevron stripes, with a rubber band round three posts and a lamp inside.
- Outside each slingshot: an inlane and an outlane, each one and a half balls wide, divided by one chrome wire lane guide. The inlane runs between the slingshot and the guide, and its lower end turns in to meet the pivot end of the flipper, so the flipper is the continuation of the inlane and a ball that rolls down it rolls onto the top of the flipper. No rail or guide runs under a flipper. The outlane runs outside the guide and leads down past the flipper. Two lit amber lamps set flush in the floor on each side. No bolt or post stands in the mouth of a lane.
- Above the flippers, in an arc: exactly three large round lit inserts set flat and flush in the board, level with its surface. Each shows one simple picture and no words. Left: a ladder. Middle: a clock face with two hands and no numbers. Right: a stack of three hats. They glow red, amber and white.
- Everywhere between these: printed street artwork, rows of small identical lit arrow and circle inserts along the lanes, steel posts with rubber rings, tiny street lamps. None of the artwork looks like letters, numbers or writing. Nothing stands in a lane.

THE BALL: exactly one ball, the clear acrylic ball of reference image 2, one twentieth of the frame's width across. It is on the street between the firehouse and the bank, just right of the scoop, rolling left toward it. We look down through the top of the clear ball at the solid white arrow cursor with its black edge inside it; the arrow is three quarters of the ball's width and is plain to see. A crisp highlight on the ball and a soft shadow under it.

FINISH: the level of the best modern 3D pinball simulations on sale today. Rich contrast, glowing lamps, deep sharp reflections in the clear coat, crisp moulded plastics with printed art, chrome wire, brass, real screws, posts and rubber rings.

LIGHT: every lamp is on. General lighting round the edges of the tier, a lamp under every insert, the red dome, the blue dome, lit windows in every building. Red light falls round the firehouse and blue light round the police station. Light from each insert spills onto the post beside it. Warm dusk overall.

CAMERA: directly overhead, long lens, so things that stand up lean only a very little outward toward the edges of the frame and show a sliver of their sides. Deep focus: every part of the image is sharp from edge to edge, with no soft or blurred area anywhere.

LETTERING: the only words anywhere in the image are these five signs, each a cream plate with large plain black letters, spelled exactly like this, letter for letter: "You're Fired" on the firehouse roof; "Background Check" on the police station roof; "Student Loans" on the bank roof; "Mom's Basement" (M-o-m-'-s, then B-a-s-e-m-e-n-t) on the roof of the house at the bottom left; "Unemployment Office" (U-n-e-m-p-l-o-y-m-e-n-t, then O-f-f-i-c-e) over the door of the office front at the bottom centre. Every letter is crisp and correct. There are no other letters or numbers anywhere: no score, no display, no labels, no captions, no street names, no brand, no logo. Inserts and plastics carry only pictures, arrows, circles, stars and stripes.

NOT IN THE IMAGE: no people, no hands, no faces, no cars with drivers; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, smoke, haze, lens flare or blur; not pixel art, not a flat illustration, not a cartoon, not a diorama, not a model railway.

SCALE, with the ball as the unit: the frame is twenty balls wide and eleven tall. A flipper is three balls long. Every lane, every ramp and the lift tube are one and a half balls wide, so the ball fits in each of them with room to spare.
```

### G2 · All three tiers from directly above

- File: `references/drafts/round-6/G2-machine-top.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 1.
- How it was made: Joined, not generated. The brief allows either. Take 1 is the join; takes 2 and 3 were generated to see whether the model could do better in one picture, and it could not. The join was made from the 2816 by 1584 originals of the kept G3, G4 and G5. (1) The ball was painted out of each: a 512 px square round the ball was sent back to the same model with the instruction to remove only the ball, and the result was pasted back under a feathered mask of the pixels that had changed. (2) Each tier was warped a little so that its sides are square (the tier takes narrow slightly toward the top), scaled to 2514 by 1452 px, and the three were stacked: corporate, office, street. (3) The seams were tidied by hand: the lift tube was cloned across each tier's capped end so that it runs the whole length, with a tube collar pasted over the first seam; the launch lane was cloned through each tier's end with 80 px cross-fades; five lane arrows that pointed down were flipped to point up (two in G3, two in G4, one in G5); the blank paper tag on the office tier's bottom edge was covered. (4) The frame is not from the model. The tier takes end at the rail, so the rail and the border round the whole machine were made in code: a brushed aluminum rail with mitred corners (68 px at the sides and 44 px at the top and bottom of a 2700 by 4800 canvas) and matte ceramic of about RGB 208, 205, 196 outside it, with a soft contact shadow. The file is saved at 2160 by 3840, so each tier keeps about the detail of its own 1920 px file. (5) One change after the first judge: the mock numerals on the street tier's clock-face insert were smoothed away, as in G5, and the join was built again from the same parts by the same code. MEASURED: the kept file differs from the first join only inside a patch 85 by 68 px at that clock (1,433 pixels of 8.3 million). A second fresh judge then saw the file exactly as it is kept; its answer is the one quoted below.
- Reference images passed in, in order: none for the join itself (it is the kept G3, G4 and G5); for each of the three ball removals, one reference: the 512 px crop of that tier's take round the ball; takes 2 and 3, generated and not kept, were each given `references/guides/round-6/guide-machine-top.png` (the unlabeled guide), then the kept G3, G4 and G5. G7 was not passed because this view has no ball.

Takes:

- Take 1, the join described above. Three tiers in order, each with its flippers; no ball; no marquee; rail and border all round; all eight tier words present and spelled right. Judge: "Closest to a screenshot (or table-select/promo render) from a commercial pinball video game", then named ten things. Failed on the second question. After the clock's marks were smoothed away a second fresh judge saw the file as it is kept; its answer is the one quoted below: "Amateur generated art (an AI-generated image), of the five options. It is a polished one, but that is still the best fit", then named twelve things. Failed. Kept as the best of three: the only one with no ball, the only one with the rail and the border both plain to see, the only one any judge took for a game screenshot, and its layout is exactly the layout of the kept tier images.
- Take 2 (generated; a prompt naming the parts of all three tiers, with lettering on the drain plate only). One coherent machine, three tiers with their flippers, `Unemployment Office` spelled right. Misses: a ball with the cursor on the red carpet, though the prompt said no ball; the rim is a wide band of ceramic with rounded corners and no aluminum rail to be seen inside it; the lift tube is in two pieces, each ending in an elbow; blocks cross the launch lane at each wall. Judge: "Amateur generated art (an AI-generated image), not a commercial pinball video game screenshot", then named ten things. Failed.
- Take 3 (generated; the take 2 prompt with every path written out as open at both ends: the launch lane and orbit lane, one lift tube with an open mouth at each tier, slots at the foot of the outlanes, both wire ramps as tracks; the rail described as bright silver). Misses: two balls with cursors, one on the red carpet and one beside the firehouse, though the prompt said no ball; a small plate on the coffee machine with unreadable lettering; a dark grey textured surface beyond the border, like a floor; the aluminum rail is a thin bright line; the paths came out as in take 2. Judge: "Most likely: amateur generated art (AI-generated image)", then named eleven things. Failed.

The judge's answer on the kept take:

> picture-0204.png — answers (viewed at full 2160x3840 and zoomed section by section)
>
> WHAT IT SHOWS
> A top-down, photoreal view of a satirical "career" pinball table inside a thin silver frame on a blank grey background. It is three complete mini-playfields stacked in one cabinet, each with its own pair of orange flippers, slingshots, lane guides and three lit inserts:
> - Top (navy/gold art-deco): "Corporate HQ" glass tower with red carpet and a clear four-blade turnstile, a boardroom table, sticky notes, a sealed acrylic "Retirement" beach box, a ladder-shaped wire ramp.
> - Middle (green office floor): six cubicles, three coffee-cup pop bumpers, a "Coffee" machine, an inbox tray of envelopes, red-stapler slingshots.
> - Bottom (night street): "You're Fired", "Student Loans", "Background Check", "Mom's Basement", a spiral parking-garage ramp, a railing-style bridge, and the drain labelled "Unemployment Office".
> A shooter lane with up-arrow lights runs the full right side from a spring plunger; a clear tube with orange fittings runs the full left side.
>
> Q1 — WHICH IS IT MOST LIKELY?
> Amateur generated art (an AI-generated image), of the five options. It is a polished one, but that is still the best fit.
> - Not a commercial pinball video game screenshot: no ball anywhere, no score, HUD, display or camera framing of a playable game, and the mechanics do not form a working table (see Q2). A shipped game has to be playable.
> - Not a top-budget film frame: portrait 9:16, static, evenly lit product-style top-down shot with no scene around it.
> - Not a stock image: too specific a one-off joke, and presented as a framed object on an empty backdrop.
> - Not a textbook picture: nothing is labelled or explained; the only text is the gag signage.
> - Points toward generated art: miniature-diorama photorealism, tidy symmetric repetition of the same flipper/slingshot/lane kit three times, crisp joke labels, and hardware that looks right piece by piece but does not connect into a ball path.
>
> Q2 — COULD A BALL TRAVEL EVERY LANE AND RAMP?
> No. The plain downhill cascade is believable: drain between the top flippers, drop through the centre chute to the middle level, drain again to the bottom level, then into "Unemployment Office". Most of the other routes would not work. No ball is shown, so ball size below is my estimate from flipper length (about a third of a flipper).
>
> Things that could not work:
> 1. Plunger: the knob and spring sit entirely inside the framed cabinet, in the lane itself, so nobody could pull it.
> 2. Shooter lane: its walls run unbroken past the middle and bottom levels, so a launched ball can only go to the very top. The chrome channels under each level curve toward the lane but show no opening or gate into it.
> 3. Top arch: the lane across the top runs straight into the Corporate HQ tower, which sits on top of it with no opening. The arrow lights on the left half point right and those on the right half point left, so both halves aim at a solid building.
> 4. Corporate HQ: the doors are closed glazed doors, not a hole, and the turnstile's post stands in the middle of the carpet. Nothing can enter.
> 5. "Retirement": a sealed clear box with no entrance. The ladder ramp curls underneath it and comes back down without reaching it.
> 6. Ladder ramp: it is literally a ladder, two rails with rungs and a flat entry plate, with no side guides on the straight climb, so a ball would roll off. It ends in a wire hook hanging over the right lane rather than a proper exit.
> 7. Left tube: the bottom end is a closed chrome cap beside "Mom's Basement", the orange fittings at the middle and lower levels sit on the side of an apparently unbroken tube, and the arrows by its top mouth point out toward HQ. Nothing visible feeds a ball in or drives it up the table's full length.
> 8. Coffee-cup bumpers: the three are packed tighter than my estimated ball width, and the chute from the upper level empties right above the cluster. A ball could not pass between them and could wedge in the pocket.
> 9. Bridge in the bottom level: it is a pedestrian handrail (two rails stacked vertically on posts), not a ball track. Its left end closes in a U-bend with no entry, and its right end just butts into the side of the garage.
> 10. Spiral parking garage: the decks look closer together than a ball is tall, and the only feed is the "Background Check" archway at ground level behind it, with nothing to lift a ball to the top deck.
> 11. "You're Fired" scoop: its mouth opens almost directly onto the roof of the "Student Loans" building below it, so there is no clean shot from the flippers. "Student Loans" itself has no opening.
> 12. Overall scale: three full-size playfields end to end would be roughly three times a normal table's length, with the upper two sets of flippers far out of a player's sight and reach.
>
> Less certain: whether a ball could pass under the bridge railing, and whether the triangular corner plates below each level's outlanes are aprons hiding a return path or dead ends. The top-down angle makes heights hard to judge.

Judge result: FAILED both questions on the file as kept (STATED by the judge): "amateur generated art", and twelve things named that could not work. The judge before it, who saw the same join with the clock's marks still on it, gave the game screenshot ("or table-select/promo render") as its first answer and named ten things. The two files differ by 1,433 pixels, so one judge's first answer is not a stable measure. Kept at the limit of three takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: it called it amateur generated art and named twelve things that could not work (quoted above). The judge before it said game screenshot and named ten. All of these come from the kept G3, G4 and G5 or from the brief's own design (three tiers end to end, a sealed beach box); the join adds no part and removes none except the balls and the paper tag.
- It is not one photograph. It is three photographs joined, and the rail and the border round it were made in code, not by the model (see "How it was made"). At full size the rail is cleaner and flatter than the photographed metal inside it.
- Three top strips. Each tier take has a chrome strip with arrow lamps along its own top edge, so the join shows one under each wall as well as the orbit lane at the head. The guide has a lane along the top of the corporate tier only. On each strip the arrows left of centre point right and those right of centre point left, as generated.
- Lift tube. One clear tube the whole length, as the guide shows, but only because the capped ends of the three tier tubes were cloned over. It has an orange elbow at the top left, an orange flap beside it at the office tier and at the street tier, and a closed cap at the bottom beside Mom's house. At the top of the street tier the join shows as a sleeve a few pixels out of line.
- Launch lane. One lane the whole length, every arrow pointing up after five were flipped by hand; one arrow in the street tier is malformed. Nothing marks where a launched ball leaves the lane (STATED by both judges: no gates, and walls that run unbroken past the office and street tiers).
- Plunger. The spring and the orange knob are inside the rail at the lower right.
- Outlanes of the corporate and office tiers end at the wall below them with no opening; only the chute at the centre leads down (STATED by the earlier judge; I see the same. The last judge is not sure whether the corner plates there hide a way through).
- Ladder ramp. It starts at a flap, turns round under the beach box and comes back down beside the right inlane; the beach box is sealed. Both judges count both as faults; the last one adds that the ramp has no side guides on its straight climb and ends in a wire hook over the right lane. The sealed box and the ramp that returns are the brief's design ("It climbs, loops and sets the ball down where it started").
- Street wire ramp. Its left end is capped above the bank's targets with no flap, its posts stand in the centre of the tier, and the spiral is fed only by it (STATED by the earlier judge; I see the same). The last judge adds that its two rails are stacked one above the other like a handrail and that its right end butts into the side of the garage.
- Doors. The tower's lobby doors are shut with the revolving door on its post in front of them, and the police station's door is behind the spiral (STATED by both judges; I see the same).
- Orbit lane at the head. It passes behind the tower, where it cannot be seen, and the arrow lamps on both halves point toward the tower (STATED by both judges; I see the same).
- Bumpers. The three coffee cups stand closer together than a ball, right under the chute from the tier above (STATED by the last judge; noted under G4).
- Firehouse. It stands directly above the bank, so its scoop faces the bank's roof and there is no clear shot at it from the flippers (STATED by the last judge; I see the same). The bank has no opening.
- Length. Three playfields end to end are about three times a normal table's length, with the upper two pairs of flippers far from the player (STATED by the last judge). That is the brief's design.
- Camera. Each tier was photographed with things leaning a little outward from its own centre, so in the join the buildings of each tier lean from three different centres, not from one.
- Size. 2160 by 3840, twice the 1080 by 1920 of a 9:16 frame at this round's width.
- Diorama (STATED by the judge). The brief's "Never" list names a diorama. The judge gives "miniature-diorama photorealism" as one of its reasons for calling the picture generated art.
- Words (MEASURED at full size): `Corporate HQ`, `Retirement`, `Coffee`, `You're Fired`, `Background Check`, `Student Loans`, `Mom's Basement`, `Unemployment Office`. All eight are present and spelled right; `Mom's Basement` by the retouch described under G5. No other letters or numbers found. The street tier's clock face is plain: its mock numerals were smoothed away as described under G5. The clipboard insert carries the same ruled lines as in the kept G3, like a checklist, with no letter to be read.
- Musts (MEASURED): three tiers, each with its own pair of flippers, in the order corporate, office, street from head to foot; no ball; no marquee; no people; no cabinet, legs, room or other machine; no real name or brand found.

Full prompt of the kept take:

```text
No generation prompt: the kept G2 was joined, not generated.

It is the kept takes of G3, G4 and G5 (their 2816 by 1584 originals), one above the other, corporate, office, street.

The only generation calls behind it are the three that painted the balls out. Each sent a 512 px square crop round the ball back to the same model, with the crop as the only reference image, and pasted the result back under a feathered mask of what had changed. Their prompts:

--- Ball removed from the G3 take ---
REFERENCE IMAGE 1 is a close photograph of part of a pinball playfield, seen from straight above: a strip of red carpet with thin gold edges on a midnight navy marble playfield with fine gold inlay lines; on the carpet a small revolving door, four clear acrylic vanes with chrome edges on a brass post with a round brass base; two white globe lamps at the top; round lit inserts at the bottom showing an hourglass. On the carpet, at the lower right of the revolving door, sits a clear glass ball with a white arrow inside it.

Reproduce this photograph exactly: the same framing, the same objects in the same places, the same colours, the same light, the same sharpness. Change one thing only: the clear glass ball with the white arrow inside it is gone, removed from the picture. Where it was you now see what was behind it: the red carpet, the lower right clear vane of the revolving door, whole, with its chrome edge, and the round brass base of the door's post. The ball's shadow and the patch of light it threw on the carpet are gone too: the carpet there is plain, evenly lit red carpet.

There is no ball anywhere in the image and no arrow anywhere in the image. No words, letters or numbers. Nothing else changes.

--- Ball removed from the G4 take ---
REFERENCE IMAGE 1 is a close photograph of part of a pinball playfield, seen from straight above: a pop bumper whose cap is a white coffee cup lid, with a brown cup body, a lamp glowing under the lid, and a steel ring and a black rubber ring round its foot; a playfield of beige and grey-green carpet tile under a glossy clear coat; round lit inserts at the bottom showing an envelope. Just below the bumper, touching its foot, sits a clear glass ball with a white arrow inside it.

Reproduce this photograph exactly: the same framing, the same objects in the same places, the same colours, the same light, the same sharpness. Change one thing only: the clear glass ball with the white arrow inside it is gone, removed from the picture. Where it was you now see what was behind it: the beige carpet tile of the playfield, and the whole of the steel ring and the black rubber ring round the foot of the bumper, unbroken. The ball's shadow and the bright patch of light it threw on the floor are gone too: the floor there is plain, evenly lit beige tile, with the straight edge between the beige tile and the grey-green tile running on as it does elsewhere.

There is no ball anywhere in the image and no arrow anywhere in the image. No words, letters or numbers other than those already on the sign. Nothing else changes.

--- Ball removed from the G5 take ---
REFERENCE IMAGE 1 is a close photograph of part of a pinball playfield, seen from straight above: at the left a small red brick firehouse with grey stone trim, lit amber windows and a dark garage opening; a glossy dark teal and navy playfield printed with streets and white dashes; at the right a chrome wire ramp of two rails on thin posts; at the bottom a small row of white lamps. On the street just right of the firehouse, above the left end of the wire ramp, sits a clear glass ball with a white arrow inside it.

Reproduce this photograph exactly: the same framing, the same objects in the same places, the same colours, the same light, the same sharpness. Change one thing only: the clear glass ball with the white arrow inside it is gone, removed from the picture. Where it was you now see what was behind it: the glossy dark teal street of the playfield with soft reflections of the lamps, the right-hand wall of the firehouse standing whole, and the two chrome rails of the wire ramp running on unbroken to their left end. The ball's shadow is gone too.

There is no ball anywhere in the image and no arrow anywhere in the image. The lettering on the cream sign at the top left stays exactly as it is. No other words, letters or numbers. Nothing else changes.
```

### G1 · The whole machine from the player's end

- File: `references/drafts/round-6/G1-machine-wide.png`
- Model: `seedream_5`
- Takes made: 4 of 4 allowed. Kept: take 3.
- How it was made: Take 3 as generated, with one retouch after generation. The plate over the drain came out as "Uemployment Office". Re-making the plate with the same model (the method used for G5: a 768 px square crop sent back with the instruction to change only the lettering) was tried twice and failed twice: "Jemployment Office" and "Uamployment Office". So the plate was fixed by hand on the 2816 px original: the lettering was lifted off the plate, the "U" was moved 11 px left, "employment" 10 px right and "Office" 6 px right, and a copy of the plate's own "n" (the one in "ment") was set between the "U" and the "e". No letter was drawn. Nothing outside the plate (412 by 78 px of the 2816 px original) was changed. A fresh judge saw that file and took it for a game screenshot (see the takes below). Then one more change: a small grey plate on the tower's roof carried raised marks that could be taken for unreadable lettering, and the brief says a sign that cannot be got right is left blank, so the face of that plate (92 by 5 px of the 2816 px original, about 63 by 4 px on the kept file) was smoothed to plain grey. Nothing else was changed. Another fresh judge then saw the file exactly as it is kept; its answer is the one quoted below. Neither change was counted as a take.
- Reference images passed in, in order: `references/guides/round-6/guide-machine-wide.png` (the unlabeled guide); the G2 join (take 1 of G2, the file now at `references/drafts/round-6/G2-machine-top.png`), passed as a 1080 by 1920 copy; `references/drafts/round-6/G7-clear-ball.png` (the kept G7).

Takes:

- Take 1 (long prompt naming every part of every tier). All three tiers with their flippers, marquee `THE DAILY GRIND` and digits right. Misses: the machine sits on a wide slab of ceramic, not a narrow border; the drain plate reads "Uemployment Office"; unreadable squiggles on the bank pediment and on a sign on the tower. Judge: "Most likely generated art (the \"amateur generated art\" option)", then named ten things. Failed.
- Take 2 (made at the same time; shorter prompt, lettering only on the marquee and the drain plate, every roof bare). `THE DAILY GRIND` in bold capitals, six digits, `Unemployment Office`, all right as generated. Misses: no ceramic border outside the aluminum rail (only the apron is ceramic); the near corners of the rail run off the bottom corners of the frame; plunger spring and knob inside the lane. Judge: "Most likely: a frame from a top-budget film" and, in the same answer, "film-grade finish, probably generated", then named eleven things. Failed.
- Take 3 (the take 2 prompt plus: a table-overview line asking for a crisp image, the frame as two bands with the narrow ceramic border outermost and the aluminum rail inside it, the plunger rod through the rail with the knob outside, the ball one twenty-fifth of the frame wide). The only take with the ceramic border outside the aluminum rail. Marquee and digits right. The drain plate read "Uemployment Office". Judge, on the file as generated: "Amateur generated art (an AI-generated image)", naming the misspelled plate first, then eleven things. Failed. After the drain plate was fixed a fresh judge was asked: "Most likely a screenshot from a commercial pinball video game, rendered at close to film quality", then nine things. Failed on the second question. After the roof plate was blanked a third fresh judge saw the file as it is kept; its answer is the one quoted below: "Best fit of the five: a frame from a top-budget film", with amateur generated art as the runner-up, then seven things. Failed. Kept as the best of four: the only take with both the ceramic border and the rail, the only one any judge took for a game screenshot, and every word right after the retouch.
- Take 4 (made at the same time as take 3; the take 3 prompt plus: drain doorway larger than the ball, open chutes two balls wide between the tiers, a lift tube with open mouths, the wire ramp as two rails side by side). Words right as generated. Misses: no ceramic border; the ball sits on the plunger rod like a knob, so the judge could not tell whether it was the ball. Judge: "Amateur generated art (an AI image-generator picture), fairly confident", then named nine things. Failed.

The judge's answer on the kept take:

> Answer for picture-1306.png (viewed at full 1920x1080 and in zoomed crops of every region).
>
> WHAT IT IS
> A pinball table called "THE DAILY GRIND" seen from the player's end against a black void. Score display reads 042500. Office-life props: glass office tower, six cubicles, coffee machine, inbox tray, red staplers as upper slingshots, a bank, red and blue buildings with beacon lights, tiny houses, a spiral parking garage, a beach diorama at the top right, a clear ball with a mouse cursor inside sitting on the plunger, and a drain labelled "Unemployment Office".
>
> QUESTION 1 - most likely source
> Best fit of the five: a frame from a top-budget film (high-end CG or a photographed miniature). I hold this with moderate confidence, not certainty; a single still cannot prove origin.
> - For film: cinema-grade lighting and materials, fine grain and slight softness like a 16:9 video frame, every prop is a deliberate story gag, text is clean, and the composition is an opening beat (ball waiting on the plunger, nothing in motion).
> - Not a commercial pinball video game: no HUD, no on-screen score or ball count, no button prompts, and the layout is not playable (see below). A shipped game needs a table that works.
> - Not a stock image: too specific and narrative, with a titled, one-off design.
> - Not a textbook picture: no labels, callouts or explanatory purpose.
> - Amateur generated art is the runner-up. The non-working mechanics and a few mushy spots (the tangle of wire guides by the beach box, the vague hardware at the top of the left tube, the ambiguous garage spiral) would fit generated imagery. But the finish, symmetry, crisp lettering and coherent art direction are well above what "amateur" suggests. The unplayable layout fits either a prop built for looks or generated art, so it does not settle it.
>
> QUESTION 2 - could a ball travel every lane and ramp?
> No. Only one route looks workable: up the shooter lane on the right wall (the one with lit arrows), in at the top right, then down through the centre gaps between each flipper pair to the drain. Things that could not work:
> 1. Left clear tube: runs the whole left wall but ends at the bottom in a sealed chrome cap sitting on the apron, so there is no exit. Its top end (orange elbow) is not fed by any lane or ramp. The tube also looks no wider than the ball.
> 2. Centre wire "ramp": it is really a handrail. Its two rails are stacked one above the other on posts rather than side by side, so a ball cannot ride it. It has no entry flap, its left end curls shut, and its right end runs into the garage posts. Its posts also stand in the main shot paths above the bottom flippers.
> 3. Stepped playfield: the table appears to be three terraces with vertical risers under the top and middle flipper pairs. A ball can drop down a tier through the centre notch, but nothing brings it back up (no ramp, no lift). The bottom flippers could never reach the bumpers, cubicles, coffee machine, inbox, tower or beach.
> 4. Spiral parking garage: nothing feeds its top and no exit is visible at the bottom. The levels read as separate stacked rings, not one continuous helix, and the vertical posts cross the openings.
> 5. Plunger: the knob and spring are inside the cabinet with the knob pressed against the front rail. There is no room to pull it back and a player could not reach it.
> 6. Blocked targets: the bank has a solid columned front with no ball opening; the cubicles are open-top boxes with no entrances, so a ball that hopped in would stay; the beach box sits right where the shooter lane lets out.
> 7. Outlanes: the bottom-left one is blocked by a house beside a square hole; the bottom-right one ends in a blank wedge with no opening to the drain.
> Minor: the ball is clear glass rather than steel.
> Parts that look plausible: the three pop bumpers, the slingshots under the yellow signs, the bottom flipper pair, the inbox tray slot and red-building archway as scoops, and the centre drain.

Judge result: FAILED (STATED by the judge). On the file as kept the first answer was "a frame from a top-budget film", not a game screenshot, and seven things were named that could not work. Kept at the limit of four takes. This one picture got three different first answers from three fresh judges: "Amateur generated art" as generated, with the misspelled plate; "a screenshot from a commercial pinball video game" after the plate was fixed; "a frame from a top-budget film" after 92 by 5 px of a roof plate were smoothed. So one judge's first answer is not a stable measure. The second answers agree: all three judges named the lift tube, the wire ramp, the spiral, the plunger and the lack of any way up.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: its first answer was a film frame, not a game screenshot, and it named seven things that could not work (quoted above). The judge before it, on the file with the roof plate still marked, said game screenshot and named nine.
- `Unemployment Office` was not spelled right by the model: it made "Uemployment Office". The plate in the file is a hand retouch (see "How it was made").
- Lift tube (MEASURED). One clear tube the whole length of the left side, closed at both ends: a chrome cap at the apron and an orange fitting at the top left. The orange lift doors came out as orange flaps clipped to the outside of the tube, two of them; none opens onto a tier.
- No way up (STATED by both judges of the retouched file; I see the same). Nothing carries a ball up a tier. At the centre of each wall between tiers there is a lit recess where the chute should be: the earlier judge read it as a closed pocket, the last judge as a notch a ball can drop through (UNKNOWN which). The prompt asked for a low wall across the machine with a drain gap at its centre.
- Parking garage spiral. Stacked rings closer together than the ball is high; nothing feeds it and nothing leaves it.
- Wire ramp. A handrail: two chrome rails one above the other on posts, with a peak over the road, from the firehouse to the garage. Not a track a ball could ride, no way on and no way off.
- Plunger (MEASURED). The spring and the orange knob are inside the frame, in the lower right corner of the launch lane. The prompt asked for the rod to pass out through the rail with the knob outside it.
- Ball size (MEASURED). About 100 px across on the 1920 px frame; the prompt asked for one twenty-fifth of the width, 77 px. It is about half as long as a bottom flipper (asked: one third) and wider than the launch lane it rests on.
- Marquee (MEASURED). `THE DAILY GRIND` is spelled right, in thin capitals with "THE" smaller than the other two words; the prompt asked for large clean capitals. The marquee is 31% of the frame's width; in the guide it is about 26%.
- Tower roof (MEASURED). The prompt asked for bare roofs; the model put a small grey plate on the tower's roof, about 63 px wide on the 1920 px frame, with raised marks like unreadable lettering. In the file the plate is blank because its face was smoothed after generation (see "How it was made"). The plate itself is still there.
- Frame (MEASURED). Ceramic border outside, brushed aluminum rail inside, along both long sides and across the foot. Across the head both are hidden by the marquee. The near corners of the ceramic border run off the bottom corners of the frame, so there is darkness beyond the long sides and the head but not beyond the foot. In perspective the border is wider than the rail at the near end.
- Sharpness. The near two tiers are sharp. The corporate tier and the marquee are a little softer; the earlier judge calls it "gentle depth of field" and the last judge "fine grain and slight softness". The brief asks for sharp front to back.
- Corporate tier. Its flippers read brown-orange, darker than the other two pairs. The ladder ramp is a small tangle of chrome wire under the beach box with no clear start or end. The revolving door stands in front of the tower doors.
- Bumpers. The three coffee lid bumpers stand closer together than a ball's width (STATED by the earlier judge; I see the same. The last judge lists the bumpers among the parts that look plausible).
- Bottom right outlane ends in a flat pocket against the apron with no hole (STATED by both judges; I see the same). Mom's house and its hatch are at the bottom left as asked; the last judge reads the house as blocking that outlane beside its hole.
- Targets (STATED by the last judge; I see the same): the bank has a solid columned front with no opening for a ball, the cubicles are open-topped boxes with no way in from the side, and the beach box stands where the launch lane lets out at the top right.
- The buildings carry no signs. That was asked for in the prompt, to keep misspelled small signs out of the wide view, so seven of the allowed tier words are absent: `Corporate HQ`, `Retirement`, `Coffee`, `You're Fired`, `Background Check`, `Student Loans`, `Mom's Basement`.
- Diorama (STATED by the judge). The brief's "Never" list names a diorama. The judge calls the retirement corner "a beach diorama" and gives "a photographed miniature" as one way the picture could have been made.
- Words (MEASURED at full size): `THE DAILY GRIND`, spelled right by the model; `Unemployment Office`, spelled right by the retouch; and 042500 on the display under the marquee, digits only as the brief asks. No other letters or numbers found. The clock-face insert on the street tier has hands and small dots for the hours, no numerals.
- Musts (MEASURED): three tiers, each with its own pair of flippers, in the order corporate, office, street from head to foot; the cursor is inside the ball, a solid white arrow with a black edge, clearly seen; no people; no cabinet, legs, room or other machine; no real name or brand found.

Full prompt of the kept take:

```text
A photograph-real frame from a finished commercial pinball video game: the table overview, the whole machine seen from where the player stands. A real, physical pinball playfield, photographed. 16:9. This is the game's table overview screen: crisp, clean and razor sharp from the nearest rail to the marquee, with no film grain, no lens blur and no vignette.

REFERENCE IMAGE 1 is a layout guide of flat coloured blocks. Copy its framing exactly: the outline of the machine in the frame, the angle, how much it narrows toward the far end, the three bands that are the three tiers, the upright marquee at the far end, the ball at the lower right. Follow where things are and how big they are, and make everything a real, photographed object. Do not copy its flat colours or its drawing style.

REFERENCE IMAGE 2 is the same machine photographed from straight above, with every part in its place. Build this picture from it: the same three tiers, the same parts in the same places, the same materials and colours, now seen in perspective from the foot of the machine. Reference image 2 has no ball and no marquee; this picture has one ball and the marquee.

REFERENCE IMAGE 3 shows the ball three times: a clear acrylic ball with a white arrow cursor sealed inside. There is exactly one ball in this picture and it looks like that.

CAMERA: at the foot of the machine, a player's eye, looking up the length of the machine and down at it at about forty degrees. Normal lens. The near end of the machine spans the bottom of the frame; the long sides converge; the far end is about a third as wide as the near end and sits in the upper middle of the frame. The machine fills most of the frame. Everything is in sharp focus from front to back.

WHAT IS IN THE FRAME, from the bottom edge to the top:
1. THE FRAME ROUND THE MACHINE, two bands, as in reference image 1. Outermost: a narrow flat border of matte off-white ceramic (the cream band in reference image 1). Inside it: a low brushed aluminum rail (the grey band), about as wide as the ceramic border. Both bands run along the foot, up both long sides and across the far end, and both can be seen plainly the whole way round. The ceramic border is narrow, no wider than the rail: it is a border, not a slab and not a table top. Outside the ceramic border: plain darkness.
2. The apron of tier 1: a band of off-white ceramic with a small grey office front at its centre whose dark doorway is the drain, and on the office's roof a cream sign plate with dark serif letters: "Unemployment Office".
3. TIER 1, THE STREET, the lower half of the frame, in amber dusk light: a pair of orange flippers, two yellow slingshots with black chevrons, three round lit inserts, a dark teal and navy street playfield under glossy clear coat, the red brick firehouse with its red dome lit, the bank with stone columns, the police station with its blue dome lit, the parking garage with a clear spiral, a chrome wire ramp over the road, six tiny houses, and one more tiny house at the foot of the left outlane.
4. A low wall across the machine with a drain gap at its centre.
5. TIER 2, THE OFFICE, in flat pale green-white fluorescent light: its own pair of orange flippers, two red staplers as slingshots, three round lit inserts, grey-green carpet tile and beige laminate, three pop bumpers capped with white coffee cup lids, a coffee machine, a cubicle farm, an inbox tray heaped with envelopes.
6. A low wall across the machine with a drain gap at its centre.
7. TIER 3, CORPORATE, the smallest and farthest, in cold white and gold light: its own pair of orange flippers, two white marble slingshots, three round lit inserts, midnight navy marble with gold inlay, a red carpet and a small revolving door, a glass and steel tower with glowing lobby doors and two lit white globe domes, a sealed glass box with a tiny beach in it, a walnut boardroom table.
8. THE MARQUEE, standing upright at the head of the machine, facing the camera: a low, wide brushed aluminum frame, as wide as the far end of the playfield. In it a lit art panel, a city skyline at dusk under an amber and violet sky, with the name of the game across it in large clean capitals: "THE DAILY GRIND". Under the art panel, in the same frame, a black display strip with exactly six glowing amber dot-matrix digits: 0 4 2 5 0 0.

ALONG THE LEFT SIDE, inside the rail: a clear acrylic lift tube with aluminum collars, the whole length of the machine.
ALONG THE RIGHT SIDE, inside the rail: the launch lane, a narrow straight channel the whole length of the machine with small lit arrow inserts, all pointing up the machine. At its near end, lower right corner of the frame: the plunger. Its steel rod passes out through the aluminum rail at the foot of the machine and its round orange knob sits outside the rail, where a player's hand would pull it; its coil spring and its tip are inside the lane. Resting against the plunger's tip, down inside the lane between the lane's two walls, is the clear ball. It is small: one twenty-fifth of the frame's width across, one third as long as a bottom flipper. The cursor inside it is plain to see: a solid white enamel arrow with a black edge. The cursor is only an arrow: no face, no eyes, no limbs.

LIGHT: only the machine's own lamps. Each tier glows its own colour, so the three tiers read as three different places: amber dusk, pale office green-white, cold white and gold. The marquee glows. Sharp reflections in the clear coat. Clean air, deep rich contrast, darkness all round the machine.

LETTERING: only two things are lettered: "THE DAILY GRIND" on the marquee (T-H-E, D-A-I-L-Y, G-R-I-N-D) with the six amber digits under it, and "Unemployment Office" (U-n-e-m-p-l-o-y-m-e-n-t, O-f-f-i-c-e) on the plate at the apron. In this wide view no building carries a sign plate: every roof is bare. Inserts carry pictures only. No other letters or numbers, and nothing that looks like blurred writing.

NOT IN THE IMAGE: no people, no hands, no faces; no cabinet, no legs, no coin door, no arcade, no room, no floor, no wall, no other machine, no glass sheet over the playfield; no fog, no smoke, no haze, no lens flare, no motion blur; no second ball; not a cartoon, not an illustration, not a toy, not a diorama, not a model railway, not isometric.
```

### G6 · The loader page

- File: `references/drafts/round-6/G6-loader-page.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 2.
- Reference images passed in, in order: `references/approved/page-look.png`; `references/approved/step2-dial.png`; `references/guides/round-6/guide-loader-page.png` (the unlabeled guide); `references/drafts/round-6/G7-clear-ball.png` (the kept G7).

Takes:

- Take 1. Passes as a page of the site: same ceramic, aluminum and orange, straight on, sharp; both lines of words right. Misses against the guide: the port sits too far left and is too big (centre about 0.80 of the way across, a quarter of the width), the ball is about 175 px across, the tube leaves at a slant toward the lower right, and the cover panels are two raised cards with round corners. Judge: "generated art (of the five options, that is the closest fit) ... a stock-style concept render is the runner-up", then named six things. Failed.
- Take 2 (prompt changed: port position and size given in percent of the frame, ball one quarter of the ring, tube "perfectly vertical", cover panels described as tile joints). Follows the guide: port at the right, small ball, upright tube with three collars running off the bottom, flat seams. Both lines of words right. Judge: "Of the five options, the closest is a commercial video game ... But it does not read as a pinball game", then named six things. Failed. Kept.
- Take 3 (made at the same time as take 2; a fresh wording with the sizes given in pixels). Misses: a second, larger ring-shaped recess appears behind the port; the ball is about 150 px across. Judge: "generated art is the best fit", then named eight things. Failed.

The judge's answer on the kept take:

> picture-0602.png — answers to the two questions. I viewed the full frame; my attempts to view zoomed crops failed, so fine-detail calls below are from the full-frame view only.
>
> What the image actually shows: a flat, top-down, off-white paper/ceramic-looking surface styled as a web form. Header text "The Worst Job Application Ever", a 5-step progress indicator made of metal studs joined by a rod (step 3 is a glossy orange button), heading "Step 3: Skills Assessment", and grey placeholder bars where body text would be. On the right is a brushed-metal circular dish holding a clear glass marble with a mouse-cursor arrow inside it, and a clear tube with metal collars running from the dish down off the bottom edge. The lower strip is divided into three blank rectangular panels by thin seams.
>
> Q1 — which is it most likely to be?
> Of the five options, the closest is a commercial video game (a polished, product-rendered novelty/physics game where the cursor is a marble). But it does not read as a pinball game: there are no flippers, bumpers, plunger, targets, score display or playfield art. It also has mockup tells rather than captured-gameplay tells: placeholder grey bars instead of real copy, empty panels, and no HUD. My honest read is a high-finish rendered or generated concept frame for a game or video, not a screenshot of shipping gameplay.
> - Not a top-budget film frame: no scene, characters, or cinematic depth; it is a flat UI layout.
> - Not a stock image: too specific and titled.
> - Not a textbook picture: no labels, callouts or diagram conventions.
> - Not amateur-looking: text is crisp and correctly spelled, materials and shadows are consistent, layout is disciplined. If it is generated, it is not amateur in quality.
>
> Q2 — could a ball travel every lane and ramp visible?
> There are no lanes or ramps in the image at all. The only ball path is one dish and one tube. Things that could not work, or are not shown working:
> - Ball vs tube size: the marble looks about as wide as, or wider than, the tube's inner bore, so it likely would not fit down the tube.
> - Dish-to-tube opening: the tube joins at a notch in the outer bezel, but the inner raised ring around the ball well appears continuous, so there is no visible gap for the ball to leave the well and enter the tube.
> - No propulsion or return: nothing launches the ball (no plunger, flipper, kicker) and nothing brings it back to the dish. The tube exits the bottom of the frame, so its destination is unknown.
> - The three bottom panels are flat seams, not walled lanes; a ball could not be guided by them.
> - The 1–5 progress studs and connecting rod are buttons/indicator, not a ball track.
> - The view is dead flat top-down, so there is no visible slope to make the ball roll anywhere.
>
> Confidence: high that it is not a recognizable pinball table and that no lanes/ramps exist; moderate on the ball-too-big-for-tube and closed-inner-ring points, since I could not zoom in.

Judge result: FAILED. The judge's first answer was the nearest of any take to the first choice ("a commercial video game") but it said the picture "does not read as a pinball game", and it named six things on the second question (STATED by the judge). Kept at the limit of three takes. The two questions are about a pinball playfield; this image is the website's page with the machine hidden, so most of what the judge names (no flippers, no lanes, no slope) is what the brief asks for.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it (see above).
- Ball size (MEASURED). About 126 px across on the 1920 px page. The brief says about 96.
- Tube width (MEASURED). The tube's bore is about 82 px on the 1920 px page, two thirds of this ball's width, so this ball would not fit down this tube. The prompt asked for a tube a little wider than the ball.
- Port. The aluminum ring has a notch at the bottom where the tube leaves, but a second, inner ring round the cup is unbroken there, so no opening from the cup into the tube can be seen.
- Cover panels. Three panels, not the two in the guide: upright seams at about 0.19 and 0.45 of the width. The level seam starts at the left edge of the frame, not at the left margin.
- Header. It is a separate band cut off by a hairline that runs the full width of the frame. On `page-look.png` the hairline has margins. The title is smaller than on `page-look.png` (0.29 of the page width against 0.38) and nearer the guide's bar (0.24).
- Subline and paragraph are grey bars, which the brief allows: one bar for the subline, four for the paragraph.
- Words (MEASURED at full size): `The Worst Job Application Ever` and `Step 3: Skills Assessment`, both spelled right, and the digits 1 to 5 on the five buttons with 3 on the orange one. No other letters or numbers found.

Full prompt of the kept take:

```text
A screenshot of one page of a website, seen exactly straight on, 16:9, the page filling the whole frame. It is a page of the same website as REFERENCE IMAGE 1 and REFERENCE IMAGE 2, and must pass as the next page of that site: a physical-looking page made of matte off-white ceramic with a fine eggshell grain, with controls of bead-blasted brushed aluminum set into it, glossy orange enamel for the active part, dark grey lettering, soft short shadows, and one large soft light from the upper left. Copy their ceramic, their aluminum, their orange, their header, their typeface, their soft shadows and their light exactly.

REFERENCE IMAGE 3 is a LAYOUT GUIDE made of flat coloured blocks. Follow it exactly for where each thing is and how big it is. Do not copy its flat colours or its flat look: every block stands for a real, solid, photographed part of the page, described below. REFERENCE IMAGE 4 shows a clear acrylic ball with a white arrow cursor sealed inside it, three times. Use it only for how that ball looks. This image has exactly one ball.

THE HEADER, the same as in reference image 1. At the top left, the site title in dark grey sans-serif letters: "The Worst Job Application Ever". At the top right, the progress bar: five round buttons in a row joined by one slim aluminum bar, numbered 1, 2, 3, 4, 5. The third button, number 3, is glossy orange enamel, a little raised and lit. The other four are brushed aluminum. Under the header, one fine aluminum hairline runs across the page.

LEFT SIDE, as in the guide. The heading in the same dark grey sans-serif as the heading in reference image 1: "Step 3: Skills Assessment". Under it, one short smooth strip of mid grey where a subline would be. Under that, four thin smooth strips of pale grey, the last one shorter, where one short paragraph would be. The strips are flat grey bars pressed very slightly into the ceramic. They carry no letters at all.

RIGHT SIDE, exactly as in the guide: the loader port, close to the right edge of the page. One ring of brushed aluminum with a fine circular turned grain, set flush into the ceramic, with a soft shadow at its lower right edge. Its centre is far to the right: 88 percent of the way across the frame, and a little above the middle of the frame's height. Its outer width is 19 percent of the frame's width, no more: there is a clear margin of ceramic between the ring and the right edge of the page, and a wide empty stretch of ceramic between the paragraph bars and the ring. Inside the ring: a dark cup, a shallow round well of matte charcoal anodised metal with a slightly lighter flat floor. In the very centre of the cup sits the clear acrylic ball of reference image 4. The ball is small: its width is one quarter of the ring's outer width, one twentieth of the frame's width. The cup is much wider than the ball, with a broad dark floor showing all round it. Inside the ball lies the cursor, a solid white enamel arrow with a black edge, three quarters as long as the ball is wide, plain to see through the clear acrylic. A crisp highlight on the ball and a small soft shadow under it.

THE TUBE, exactly as in the guide. One clear acrylic tube, a little wider than the ball, leaves the bottom of the ring at its centre line and runs straight down, perfectly vertical, parallel to the right edge of the page, and off the bottom edge of the frame. It does not slant and does not bend. It lies on the ceramic, held down by three slim brushed aluminum collars spaced evenly along it. It is empty and clear, with one crisp highlight along its length.

LOWER PART, exactly as in the guide: cover panels. The lower fifth of the page is the same matte off-white ceramic, flush and flat, divided only by fine seams: one hairline groove runs level across the page from the left margin to just short of the tube; from it one hairline groove drops straight down off the bottom edge near the left margin, and one more drops straight down off the bottom edge a little left of the middle of the page. The seams are thin straight grooves with square corners, like the joints between ceramic tiles. The panels are not raised, have no rounded corners and cast no shadow. Nothing is on them: no control, no picture, no lettering.

LIGHT: the website's clean light at full strength, as in reference image 1: bright, soft and even from the upper left, soft short shadows to the lower right, no window shapes, no bands, no dark corners.

CAMERA: straight on, like a screenshot. No tilt, no perspective, no depth of field. Sharp from edge to edge.

LETTERING: the only words in the image are "The Worst Job Application Ever" in the header and "Step 3: Skills Assessment" as the heading, spelled exactly like that, and the single digits 1, 2, 3, 4, 5 on the five progress buttons. There are no other letters or numbers anywhere: no labels, no captions, no button text, no paragraph text, no logo.

NOT IN THE IMAGE: no people, no hands; no second cursor anywhere outside the ball; no pinball playfield, no flippers, no bumpers, no lamps, because the machine is hidden under the cover panels; no form fields, no sliders, no Submit button; no browser window, no address bar, no device, no desk; no fog, no blur.
```

### G8 · The rail cam

- File: `references/drafts/round-6/G8-rail-cam.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 3.
- How it was made: Take 3 as generated, with one retouch after generation. The roof of the bank, out of focus at the left, came out with a texture like a printed page: ruled lines, no letters. That roof alone (a patch about 390 by 180 px on the 1920 px frame) was smoothed and given grain again, so it is a plain roof. Nothing else in the file was changed. The retouch was not counted as a take. One judge saw take 3 before the retouch and a second judge saw the retouched file; both answers are below.
- Reference images passed in, in order: `references/drafts/round-6/G5-tier-street.png` (the kept take of G5, the tier the shot is in, passed first); `references/drafts/round-6/G7-clear-ball.png` (the kept G7, passed second); No layout guide was passed: `references/guides/round-6/` has none for this view.

Takes:

- Take 1. Misses: the camera looks along the ramp more than down at it; the ramp curves away to the left; two wires each side with hoops between, not two rails; the firehouse carries a sign of unreadable pseudo-lettering. Judge: "closest to a frame from a top-budget film or commercial", then named things that could not work. Failed.
- Take 2 (prompt changed: the ramp as exactly two rails and nothing else; no sign plates, the roofs bare). No lettering. Misses: the camera still looks ahead more than down, with the far wall of the table in frame; the ball sits in the middle of the frame, not the lower middle; the ramp curves left and has cross rungs like a ladder. Judge: "A frame from a top-budget film", then named things. Failed.
- Take 3 (prompt changed: the camera pointing about sixty degrees down, so that the board fills the background; the ball's centre one third of the way up the frame; straight parallel rails, no rungs). The camera, the ball's place and size, the bank and the firehouse are as briefed. Judge, before the retouch: "a frame from a top-budget film (or a high-end commercial)", then named eight things. Judge, after the retouch: "amateur generated art, graded to look like a film frame. Runner-up: top-budget film frame. Roughly 60/35", then named eight things. Failed. Kept as the best of three: the only take that looks down through the top of the ball with the ball large in the lower middle.

The judge's answer on the kept take:

> Verdict on picture-0831.png (viewed at full size plus zoomed crops).
>
> Q1. Which is it most likely to be?
> Best guess: amateur generated art, graded to look like a film frame. Runner-up: top-budget film frame. Roughly 60/35.
> - At a glance it reads as a film or high-end commercial macro shot: shallow depth of field, warm bokeh against a teal playfield, fine grain, glossy reflections, a believable miniature-set feel.
> - It is not a pinball video game screenshot: no HUD, score or flippers, and the lens blur and grain are photographic rather than real-time.
> - It is not stock (a mouse-cursor arrow sealed in a glass ball is a bespoke concept) and not a textbook picture (nothing is labelled or legible).
> - What pulls it away from "film frame" on a closer look is that the geometry does not hold up, which a built or properly modelled set would get right. The specifics are under Q2, plus a bank roof that sags into a butterfly shape behind the pediment and insert lights whose symbols are smeared.
>
> Q2. Could a ball really travel every lane and ramp you can see?
> No. Things that could not work:
> - The ball is not rolling on the ramp. It sits in a metal ring on top of a single centre rod, like a globe on a stem. The rod carries on down to the bottom of the frame.
> - The ball is exactly as wide as the gap between the side rails. It has no clearance to roll between them and nothing but the centre rod to sit on, so it would jam or tip off.
> - The rail count changes along the ramp. There are two or three rods per side near the camera, merging into one per side further up. A real wire ramp keeps a constant set of rails.
> - The far end of the ramp is plugged by a glowing gold blob sitting in the track, with no visible entry or exit. The near end runs out of frame with no landing.
> - The ball itself looks like a hollow two-layer shell with a seam and a flat cursor plaque inside. That would wobble rather than roll true. It is also glass rather than steel.
> - The "lanes" on the playfield are only painted street lines and flush lights. There are no physical lane guides, walls, flippers or bumpers in view, so there is nothing to steer a ball.
> - The white bank's column gaps are much narrower than the ball, so it could not enter. The red fire station's doorway is the only plausible ball hole, and it has a glowing lump sitting in it.
> - The side rails at the left and right edges dissolve into blur and lights without forming a continuous track.
>
> What is plausible: the under-slung U hoops on the centre ramp are spaced and oriented like a real wire ramp, and a ball could roll freely over the open flat playfield.
>
> The earlier judge, on take 3 before the roof retouch:
>
> picture-0803.png: I opened it and inspected it at full size plus zoomed crops.
>
> WHAT IT SHOWS: a macro, shallow-focus view down a chrome wire ramp above a dark blue pinball playfield. A clear glass ball with a white mouse-cursor arrow inside sits on the ramp in sharp focus. Blurred behind it are a columned bank/courthouse model (left), a red brick firehouse with a red beacon (right), round amber insert lights, and light-studded rails along both edges.
>
> Q1 - MOST LIKELY CATEGORY: a frame from a top-budget film (or a high-end commercial).
> - Why film: optical-looking shallow depth of field with soft round bokeh, fine grain, teal/amber grade, believable chrome reflections and glass refraction, physical-miniature feel to the buildings.
> - Not a pinball video game screenshot: no score, HUD, display or UI, and game cameras do not render this kind of macro lens blur.
> - Not stock: too specific and odd a concept (cursor inside a glass ball), lit and graded like a narrative shot.
> - Not a textbook picture: no labels, nothing explanatory, most of the frame is out of focus.
> - Not amateur generated art in finish. Caveat: close inspection shows some synthetic-looking details (stray seam arcs inside the ball, random scratch-like line art on the playfield, a bank roof textured like printed paper, uneven firehouse windows), so generated origin is possible, but the craft level reads as film, not amateur.
>
> Q2 - COULD A BALL TRAVEL EVERY LANE AND RAMP VISIBLE: No. Only the short visible stretch of the wire ramp looks rideable, and even that is doubtful. Things that could not work:
> 1. Ball fit: the ball is as wide as the full gap between the side rails and fills the U-hoop exactly, so there is zero clearance. It would bind at every hoop rather than roll. It looks parked in the nearest hoop like a display cradle.
> 2. Ball material: it is clear glass/acrylic, not steel. It would chip or shatter in play and would not respond to magnets or magnetic sensors. The arrow sits perfectly upright, which a rolling ball would not hold.
> 3. Ramp has no visible entry, exit or support posts. It runs dead straight down the centre of the table and appears to float. A blurred gold object sits between the rails at the top of frame and may block the path (too blurred to be sure).
> 4. The "lanes" on the playfield are only painted street lines. There are no guides, posts, walls or rollover gates, so nothing would channel a ball along them.
> 5. Bank: the gaps between its columns are narrower than a ball, and it sits on a raised plinth. A ball could not enter.
> 6. Firehouse: its doorway is filled by a glowing globe/bulb and it also sits on a plinth. A ball could not enter.
> 7. Edge rails left and right: blurred metal rails with lamps along them. They do not resolve into a clear channel, and the lamps appear to sit in the path.
> 8. No flippers, shooter lane, bumpers, targets or drain are visible, so there is no way to confirm a ball could reach or leave any of these features.

Judge result: FAILED both questions on the file as kept (STATED by the judge). The judge who saw it before the retouch gave a film frame as its first answer and named eight things. Kept at the limit of three takes.

What the kept take misses (MEASURED on the file unless marked):

- Neither judge read it as a screenshot from a pinball video game. Both gave the same reasons: no score or display in frame, no flippers, and a lens blur and grain that read as film (STATED).
- The ramp is not two rails. Each side has two chrome wires close together, four in all near the camera, with U-shaped hoops slung under them, and a thin rod runs along the centre line under the ball to the bottom edge of the frame. The second judge reads the ball as sitting in a ring on that rod "like a globe on a stem" (STATED), and the number of wires each side drops from two to one farther up the ramp (STATED; I see the same).
- The ball is as wide as the gap between the side wires, with no clearance (STATED by both judges; I see the same).
- The ramp shows no way on and no way off. It runs out of the bottom edge and, at the top of the frame, into a blurred gold lamp on the centre line.
- The top edge of the frame shows a little of the far end of the table, blurred lamps and rails, although the prompt asked for the board alone as background.
- Firehouse: its door holds a glowing lamp, so a ball could not enter there (STATED by both judges). Bank: the gaps between its columns are narrower than the ball (STATED).
- Bank roof: it sags in a shallow V behind the pediment (STATED by the second judge; I see the same). Its surface is the retouch described above.
- Inside the ball there are faint arcs besides the one seam (STATED by the first judge).
- The pictures on the round inserts are out of focus and cannot be made out (STATED as "smeared" by the second judge).
- Frame. The ceramic border is not in the picture. A blurred length of aluminum rail shows at the top left and top right.
- Words (MEASURED at full size): none. No letters or numbers found.

Full prompt of the kept take:

```text
A frame from a finished commercial 3D pinball video game with photoreal graphics, in its ride-along ball camera. It looks exactly like a macro photograph taken inside a real, physical pinball machine. 16:9.

REFERENCE IMAGE 1 is the street tier of this pinball table seen from straight above. This shot is taken inside that same tier, so its parts are the same parts: the same dark teal and navy printed streets under a glossy clear coat, the same red brick firehouse with the red flasher dome on its roof, the same bank with stone columns, the same chrome wire ramp crossing over the road. REFERENCE IMAGE 2 shows the ball of this game three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it for how the ball and the cursor look. This image has exactly one ball.

THE SHOT: the camera rides directly above the ball as it rolls along the highway overpass, the chrome wire ramp, high above the board. The camera points steeply down, about sixty degrees below level, and a little ahead. Because it looks down, there is no horizon and no far wall anywhere in the frame: the whole background, from the bottom edge to the top edge, is the board seen from above, far below. We see the roofs of the buildings from above, not their fronts. The side rails of the table are not in the frame.

THE BALL: in the lower middle of the frame: its centre is half way across the frame and one third of the way up from the bottom edge. It is large: about one quarter of the frame's width across. A sphere of thick, perfectly clear acrylic with a fine seam round its middle. We look down through the top of it at the cursor inside: a solid white enamel arrow with a black edge, about three quarters as long as the ball is wide, a loose solid object tumbling a beat behind the roll, tipped at an angle, clear of the wall. It is plain to see and sharp. Small crisp highlights from the lamps on the acrylic. The acrylic bends the rails under it a little and never hides the cursor. The cursor is only an arrow: no face, no eyes, no limbs.

THE RAMP: one wire ramp made of exactly two rails and nothing else. The two rails are polished chrome steel rods, each about as thick as a pencil beside a ball the size of a golf ball, side by side at the same height, two thirds of a ball apart. The ball rides in the trough between them and rests on both: the left rail passes under the left third of the ball and the right rail under its right third, and each rail can be seen through the clear acrylic. The two rails come up from the bottom edge of the frame, one each side of the centre, pass under the ball, and run away up the frame ahead of it to the top edge in one straight line, parallel all the way, drawing closer together only with distance. They never split, never cross, never branch and never end: measured in balls, the space between them is the same at the top of the frame as it is under the ball. Count the rails: two. In any slice across the ramp there are two round steel rods and nothing else: no third rail, no fourth rail, no guide rail above them, no handrail, no side wire, no rod down the centre, no second ramp and no loop of wire anywhere in the image. There are no rungs: nothing crosses between the two rails at rail height. Every four ball-lengths one small U-shaped chrome wire bracket hangs under the two rails, dipping a whole ball's depth below them, well clear of the ball, and from the bottom of that U one thin steel post drops straight down to the board far below. Mirror reflections of amber, red and blue lamps slide along the rails.

FAR BELOW, out of focus: the street tier seen from high above, filling the whole frame behind the ball and the rails: the dark teal and navy printed road with its dashed white centre line, kerbs and crossings under glossy clear coat, running up the frame under the ramp; soft discs of amber light from street lamps and lit round inserts; to the left of the rails, the bank seen from above: its pale stone roof, the tops of its columns and warm light spilling from its front onto the board; to the right of the rails, the red brick firehouse seen from above: its flat grey roof with the red flasher dome glowing in the middle of it and red light spilling round it. All of this is soft: a film camera's shallow focus. The ball and the rails near it are razor sharp. Everything below is a smooth blur of shapes and lights, still easy to recognise.

LIGHT: warm dusk. Amber from windows and street lamps, a red glow at the firehouse, a little blue far off to one side. Deep, rich contrast, glossy reflections. The air is clean: the softness is focus only.

LETTERING: no words, letters or numbers anywhere in the image, and nothing that looks like blurred writing. In this shot the buildings carry no sign plates at all: the roof of the firehouse is bare except for its red dome, and the roof of the bank is bare.

NOT IN THE IMAGE: no people, no hands, no faces; no cabinet, no legs, no room, no floor, no sheet of glass; no fog, no smoke, no haze, no lens flare; no second ball; not a cartoon, not an illustration, not a toy train set.
```

### G9 · The lobby doors

- File: `references/drafts/round-6/G9-lobby-doors.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 2.
- Reference images passed in, in order: `references/drafts/round-6/G3-tier-corporate.png` (the kept take of G3, the tier the shot is in, passed first); `references/drafts/round-6/G7-clear-ball.png` (the kept G7, passed second); No layout guide was passed: `references/guides/round-6/` has none for this view.

Takes:

- Take 1. The revolving door came out as a pinwheel: flat blades round a hub on a post. `Corporate HQ` spelled right. Judge: "A frame from a top-budget film", then named things. Failed.
- Take 2 (prompt changed: the revolving door described as a small hotel revolving door, four upright clear panes on one upright brass shaft with a round base plate and cap). Judge: "it most resembles a frame from a top-budget film", then named six things. Failed. Kept as the best of three: the tower fills the top of the frame, the doors are shut, both domes are lit, the sign is right and the door reads as a revolving door from the front.
- Take 3 (prompt changed: the door standing across the left half of the carpet with a flat disc canopy, strong spin blur on its panes, the cursor pure white and pressed face-on against the far wall of the ball). The door's upper panes came out as tilted wings and the tower no longer fills the top of the frame. Judge: "Most likely a frame from a top-budget film", then named things. Failed.

The judge's answer on the kept take:

> Answer for picture-0902.png (I opened it and inspected zoomed crops).
>
> What the image shows: a close, low-angle view of a miniature "Corporate HQ" building façade (brushed steel, lit glass windows, brass double doors), a red carpet with gold edging running to the doors, a clear glass ball with a mouse-cursor arrow embedded inside sitting on the carpet, two white globe lamps on metal bases, a brass post with clear acrylic wings (a revolving-door style spinner) on the left, and a dark blue marble floor with gold inlay lines.
>
> Question 1 – which is it most likely?
> Of the five options, it most resembles a frame from a top-budget film (a high-end CG or miniature-set shot). Reasons:
> - Cinematic macro look: shallow depth of field, film grain, warm practical lighting, anamorphic-style softness at the edges.
> - Materials are rendered convincingly: brushed metal, brass wear, carpet pile, a refraction caustic under the glass ball, bubbles in the glass, clean legible sign lettering.
> - It is not a pinball game screenshot in any visible sense: no score, HUD, flippers, plunger, or playfield overview, and the camera is a staged beauty angle rather than a play view.
> - It does not read as a textbook picture (no labels or diagram purpose), and it is too specific and stylized for typical stock.
> - It is well above amateur generated art in coherence, though I cannot rule out that it was machine-generated; a few geometry oddities (below) are the kind that appear in generated images.
>
> Question 2 – could a ball travel every lane and ramp visible?
> No. Only one path is clearly traversable: the red carpet lane, and even that dead-ends. Things that could not work or do not connect:
> - The brass doors at the end of the carpet are closed, hinged double doors with handles and a brass frame and sill. There is no scoop, hole, or opening, so the lane terminates at a wall. The ball also looks wider than a single door leaf, so it would need both leaves open to pass.
> - The acrylic spinner on the left is inconsistent. The two near wings are vertical, but the upper-left one is a flat horizontal slab, like a shelf attached to the top of the post, and the upper-right one also looks like a flat canopy. Those would not work as spinner blades. The near wings also reach almost to the floor, so they would drag, and the spinner sits beside the carpet rather than across a lane, so the ball would at most clip a wing tip.
> - The gold lines on the blue floor are flush inlay, not rails or walls. Nothing keeps a ball on any particular lane; off the carpet it is just open floor.
> - The blurred structures at far left (stacked horizontal rails or steps, with a vertical clear panel in front) and at far right are not readable as continuous ramps. I can see no entrance or exit joining them to the carpet or floor, and the left one looks like stair treads, which a ball could not climb. They are out of focus, so I cannot say for certain what they are.
> - I see no actual ramp anywhere in the frame; the carpet appears flat.
> - Minor: the left globe lamp is tucked behind the spinner against the door frame where a ball could hardly reach it; the right lamp sits in open floor and could act as a bumper. The ball itself is glass with an off-centre solid arrow inside, on plush carpet, so it would roll slowly and unevenly compared with a steel pinball.
>
> Uncertain points: exact ball-to-door size ratio (perspective makes it approximate) and the identity of the out-of-focus background structures.

Judge result: FAILED. First answer: "a frame from a top-budget film", not a game screenshot (STATED). Under the narrow reading of the question's first option that is not the first answer; under the wide reading (game screenshot or film frame as one option) it is. See the choices at the end. Second answer: six things named, which fails under either reading. Kept at the limit of three takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not read it as a pinball game: "no score, HUD, flippers, plunger, or playfield overview" (STATED). Nothing in the frame but the ball says pinball.
- The cursor is not flat against the wall of the ball. It floats upright in the middle of the ball, pointing up and to the left, and is not squashed.
- The ball shows no sign of having just hit the doors. It rests on the carpet in front of the right-hand door leaf, a little right of the doors' centre line.
- Cursor colour (MEASURED). The arrow's face is a warm off-white, mean RGB about (239, 233, 225), lit by the lobby. Its edge is dark, as asked.
- Revolving door. It is almost sharp, with only a little blur on its right pane, so it does not read as still spinning. Its two near panes stand upright; its upper left pane lies flat like a shelf at the top of the shaft, and its upper right pane also reads as a flat canopy (STATED by the judge; I see the same). The near panes reach almost to the board. It stands beside the carpet, not across it.
- The left flasher dome is behind the revolving door's pane and is seen through it. Both domes are lit.
- The ball looks wider than one door leaf (STATED by the judge, who notes that perspective makes this approximate).
- At the far left, out of focus, stacked horizontal rails or steps with an upright clear panel in front of them; at the far right, more blurred structure. Neither can be read as a lane or a ramp (STATED by the judge).
- The carpet lane ends at shut doors with no hole or scoop. That is the moment the brief asks for, and the judge names it as a dead end.
- Frame. Neither the aluminum rail nor the ceramic border is in the picture.
- Words (MEASURED at full size): `Corporate HQ`, spelled right, in raised steel letters on the lintel over the doors. No other letters or numbers found.

Full prompt of the kept take:

```text
A frame from a finished commercial 3D pinball video game with photoreal graphics, in its low dramatic replay camera. It looks exactly like a close photograph taken inside a real, physical pinball machine. 16:9.

REFERENCE IMAGE 1 is the top tier of this pinball table seen from straight above. This shot is taken inside that same tier, low down, at its top centre, so its parts are the same parts: the same glass and steel tower, the same pair of lobby doors in polished gold frames, the same two white globe flasher domes, one each side of the doors, the same red carpet, the same revolving door, which is a small hotel revolving door: four upright clear panes on an upright brass shaft, the same midnight navy marble playfield with fine gold inlay under a glossy clear coat. REFERENCE IMAGE 2 shows the ball of this game three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it for how the ball and the cursor look, above all its third view, where the cursor is thrown flat against the inside wall. This image has exactly one ball.

THE SHOT: the camera is low, just above the red carpet, at the foot of the short carpet ramp, looking up the carpet at the doors of the tower. A wide lens close to the ground.

FOREGROUND: the revolving door, large, in the lower left of the frame, standing on the board at the left edge of the carpet, clear of the lobby doors behind it. It is built exactly like the revolving door of a hotel, at the scale of the ball: one upright brass shaft, as tall as two and a half balls, standing straight up from a flat round brass plate on the board, with a flat round brass cap on its top. Four tall upright rectangular panes of clear acrylic with thin chrome edges are fixed to the shaft along their inner edges, at right angles to one another, so that seen from above they make a plus sign. Each pane stands on end like a door: its bottom edge is just above the board and its top edge is level with the cap. The whole thing turns round its upright shaft the way a turnstile or a revolving door turns: the panes sweep round sideways, level with the board. It is still spinning from the ball's pass: the four panes are smeared sideways into a soft, glassy drum of motion blur round the shaft, and the brass shaft, cap and base plate are sharp. It is not a fan, not a propeller, not a windmill and not a pinwheel: no blades radiate from the top of a post.

THE CARPET: a strip of deep red running up a short ramp from the camera to the doors, with a thin gold edge each side. Either side of it, navy marble playfield with gold inlay lines, glossy, reflecting the lamps.

THE DOORS: at the top of the carpet, the pair of lobby doors: two tall glass panels in polished gold frames, glowing warm from inside. They have just slammed shut. They are tight together with no gap between them.

THE BALL: the clear acrylic ball is pressed against the shut doors at their middle, at carpet level, stopped dead by them. It is about one tenth of the frame's width across. Inside it the cursor, a solid white enamel arrow with a black edge, has been thrown forward and lies squashed flat against the inside wall of the ball on the side nearest the doors, spread against the acrylic like a thing thrown against a window. The arrow is plain to see through the clear acrylic. A few beads of sweat on the inside of the acrylic. Crisp white highlights from the two domes on the ball. The cursor is only an arrow: no face, no eyes, no limbs.

THE DOMES: one each side of the doors, standing on the board at carpet level: two white flasher domes, round frosted globes on chrome bases, both lit at full brightness, throwing cold white light over the doors, the ball and the carpet, with sharp reflections in the clear coat.

THE TOWER: above the doors the tower rises and fills the whole top of the frame from side to side: floor upon floor of glass and steel with lit, empty office windows, seen from below, its top cut off by the top edge of the frame. Across the steel lintel directly above the doors, one wide brushed steel sign plate with large clean raised letters: "Corporate HQ".

LIGHT: cold white and gold. The two domes are the brightest things in the frame. Warm gold from the lobby behind the doors. Deep navy shadows, rich contrast, glossy reflections. The air is clean.

FOCUS: the doors, the ball, the domes and the sign are sharp. Only the spinning vanes are blurred, by their own motion.

LETTERING: the only words in the image are "Corporate HQ", once, on the plate over the doors, spelled exactly like that: C-o-r-p-o-r-a-t-e, then H-Q. No other letters or numbers anywhere.

NOT IN THE IMAGE: no people, no hands, no faces, no figures in the windows; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, no smoke, no haze, no dust, no lens flare; no second ball; not a cartoon, not an illustration, not a diorama.
```

### G10 · Reply All

- File: `references/drafts/round-6/G10-reply-all.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 2.
- Reference images passed in, in order: `references/drafts/round-6/G4-tier-office.png` (the kept take of G4, the tier the shot is in, passed first); `references/drafts/round-6/G7-clear-ball.png` (the kept G7, passed second); No layout guide was passed: `references/guides/round-6/` has none for this view.

Takes:

- Take 1. Misses: seen from almost straight above, not at sixty degrees; the three steel balls sit in a row at the scoop and none touches the clear ball; paper scraps, paper clips and loose cable lie on the board and a blank paper tag lies on the lower right apron; launch lane arrows point up at the top and down at the bottom. `Coffee` spelled right. Judge: "amateur generated art (an AI-generated image), fairly confident", then named things. Failed.
- Take 2 (prompt changed: the camera described as down and back toward the player so that things show their front faces; the first steel ball touching the clear ball; the cursor against the wall away from it; no tag, card or label on the board). Clean board, no tag, the steel balls run from the scoop to the clear ball and the nearest touches it. Judge: "it reads most like a frame from a top-budget film" (film frame about 55%, generated art about 35%, game screenshot about 10%), then named eight things. Failed. Kept as the best of three.
- Take 3 (prompt changed: a streak of motion blur behind each steel ball, every launch lane arrow pointing up, the bumpers standing a little apart). A blank paper tag is back on the apron, loose black cables lie on the board and a wire hook stands beside the tube. Judge: "Most likely generated art, though with a finish well above amateur", then named things. Failed.

The judge's answer on the kept take:

> Verdict on picture-1002.png (viewed at full size plus zoomed crops of all four quadrants).
>
> Q1 – What is it most likely?
> Of the five options, it reads most like a frame from a top-budget film (CG feature or high-end commercial close-up), not a commercial pinball video game screenshot. My rough split: film frame ~55%, generated art ~35%, game screenshot ~10%, stock/textbook ~0%.
> - For film: cinematic teal/amber grade, shallow depth of field, physically convincing brushed steel, chrome balls, felt-like playfield, glowing inserts, and a coherent, witty office theme (coffee-cup bumpers, stapler slingshots, pocket-knife flippers, cubicle block, inbox tray of envelopes, coffee machine, glass ball with a cursor arrow).
> - Against game screenshot: no score, HUD, display or ball count; a product-shot camera angle; and a layout that would not be playable.
> - Against stock/textbook: too stylised and art-directed, no labels or neutral lighting.
> - The one thing pulling it toward generated art is that the surface finish is excellent but the mechanics are incoherent (see below). It does not look amateur in finish; it looks amateur only in engineering.
>
> Q2 – Could a ball travel every lane and ramp? No. Things that could not work:
> - Left clear tube: no ramp or lane feeds it. The top elbow just ends in a capped clear stub against the back wall, and the bottom ends in a closed metal cup in the lower-left corner beside the apron. No entrance, no exit.
> - Right metal lane: its arrows contradict themselves (upper arrows point up, the lower two point down). It is drawn as several nested rails that blur together at the bottom, and at the top it curves left into a flat wall panel behind the coffee machine with no visible mouth onto the playfield. The coffee machine sits right where it would have to exit.
> - Coffee-cup bumpers: the three are packed so tightly (lids overlapping) that a ball could not pass between them, so the centre pocket is unreachable or a ball trap.
> - Cubicle block: six open-topped walled boxes with no entrance or lane; pure set dressing, and a trap if an airborne ball landed in one. The column of white targets beside it is fine.
> - Inlanes: the left and right wire guides lead the ball onto the rail that runs underneath/behind each flipper rather than onto the flipper, so an inlane ball would drain instead of being returned.
> - Orange clip/gate on the left by the tube, with a loose wire: it guards no lane at all.
> - Top of table: no rollover lanes or arch; just a U-shaped metal chute at top centre that connects to nothing visible.
> - The four balls (three chrome, one glass) sit in a neat diagonal row mid-slope with no motion blur; on an inclined playfield they would not rest there.
>
> What does work: the flipper gap is a sensible ~1.3 ball widths with a centre drain, the stapler slingshots are placed correctly, the three lit inserts (pizza, mail, knot/bird) are plausible, and the square hole in the front of the inbox tray is a believable scoop a ball could enter.

Judge result: FAILED. First answer: "a frame from a top-budget film", with a game screenshot at about 10% (STATED). Under the narrow reading of the question's first option that is not the first answer; under the wide reading (game screenshot or film frame as one option) it is. See the choices at the end. Second answer: eight things named, which fails under either reading. Kept at the limit of three takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not read it as a game screenshot: no score or display, "a product-shot camera angle", and a layout it calls unplayable (STATED).
- Launch lane arrows (MEASURED). The upper arrow lamps point up the board; the lower two point down.
- The steel balls are not pouring. Three chrome balls and the clear ball sit in one neat row, each touching the next, with no motion blur, and the last steel ball is in front of the scoop, not half inside it.
- The cursor is not pressed against the wall. It lies left of the ball's centre, the side away from the steel balls, upright and unsquashed, pointing up and to the left.
- The three coffee bumpers stand so close that their lids nearly touch; a ball could not pass between them (STATED by the judge; I see the same).
- Lift tube. Its top elbow ends in a capped clear stub at the back wall and its bottom ends in a closed metal cup at the lower left. No way in and no way out (STATED; I see the same). Inherited from the kept G4.
- Launch lane. Drawn as several nested rails that blur together at the bottom, and at the top it curves in behind the coffee machine with no mouth onto the board that can be seen (STATED).
- Cubicles. Six open-topped boxes with no way in or out, as in the kept G4 (STATED).
- Inlanes. The wire guides lead on under each flipper, not onto it (STATED; I see the same on both sides). Inherited from the kept G4.
- An orange clip with a loose wire stands by the lift tube and guards nothing (STATED; I see it). A U-shaped steel chute at the top centre joins nothing that can be seen (STATED).
- Frame. Brushed aluminum rail on the left, top and right. No ceramic in the picture: the lower corners are dark teal plates.
- Words (MEASURED at full size): `Coffee`, spelled right, on a small plate on the coffee machine. No other letters or numbers found; the inserts carry pictures (a pizza slice, an envelope, a knot).

Full prompt of the kept take:

```text
A frame from a finished commercial 3D pinball video game with photoreal graphics, in its multiball camera. It looks exactly like a photograph of a real, physical pinball playfield. 16:9.

REFERENCE IMAGE 1 is the office tier of this pinball table seen from straight above. This shot shows that same tier with every part in the same place: the three pop bumpers whose caps are white coffee cup lids at the top centre; the office coffee machine beside them at the upper right; the cubicle farm at the upper left with its column of five white drop targets; the inbox at the right, a large beige mail tray heaped with white envelopes, with a dark steel-edged scoop hole at its front; the two red staplers that are the slingshots; the pair of orange flippers at the bottom centre; the three round lit inserts showing a pizza slice, an envelope and a knot; the grey-green carpet tile and beige laminate playfield under a glossy clear coat; the brushed aluminum side rails; the clear lift tube at the left; the launch lane at the right. REFERENCE IMAGE 2 shows the clear ball of this game three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it for how that ball and the cursor look. This image has exactly one clear ball.

THE SHOT: this is not the straight-down view of reference image 1. The camera has come down and back toward the player: it is above the flipper end of the tier and looks up the board at a slant, about sixty degrees from the board's surface. So everything that stands up shows its front face as well as its top: you see the front of the coffee cups under the bumper lids, the front of the coffee machine, the near wall of the inbox tray, the near sides of the red staplers, the near walls of the cubicles. The far end of the tier is a little smaller than the near end, and the two side rails draw slightly together toward the top of the frame. The view is wide: the inbox is at the right of the frame, the three coffee bumpers in the upper middle, both red staplers in the lower part of the frame, the two orange flippers at the bottom edge. The tier fills the frame. Deep focus: everything is sharp.

THE MOMENT: three chrome steel pinballs are pouring out of the scoop hole at the front of the inbox, one close behind the other, in a short curving line across the board toward the centre. They are ordinary steel pinballs, mirror bright, each one reflecting the lamps and the tier, each the same size as the clear ball. The last of the three is still half in the mouth of the scoop. The first of the three has just struck the clear ball: the two are in contact at this instant, the steel ball pressed against the right side of the clear ball with no gap at all between them, the clear ball's acrylic showing the steel ball's mirror surface right against it.

THE CLEAR BALL: on the open board just left of the scoop of the inbox, below the lowest coffee bumper, the same size as each steel ball, about one sixteenth of the frame's width across. Inside it the cursor, a solid white enamel arrow with a black edge, half as long as the ball is wide, has been thrown to the far side: it lies flat against the inside wall at the left edge of the ball, the side away from the steel ball, as far from the steel ball as it can get, with the right half of the ball empty. The arrow is plain to see through the clear acrylic. A few beads of sweat on the inside of the acrylic. Crisp highlights on the ball. The cursor is only an arrow: no face, no eyes, no limbs.

EVERY LAMP IN THE TIER IS LIT: the lamp inside each of the three coffee bumpers, glowing warm under its lid; the three large inserts, bright; the amber lamps in the inlanes and outlanes; the lamps inside the two staplers; the row of small white lamps along the top; the small arrow inserts; the lights on the coffee machine. Light from each insert spills onto the posts beside it. Sharp reflections of the lamps and the steel balls in the clear coat.

LIGHT: flat, bright fluorescent office light over the tier, with the lamps of the game on top of it. Clean air.

LETTERING: the only word in the image is "Coffee", once, on the small plate on top of the coffee machine. No other letters or numbers anywhere: the envelopes are blank, the inserts carry pictures only.

NOT IN THE IMAGE: no people, no hands, no faces, nobody in the cubicles; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, no smoke, no haze, no lens flare; no second clear ball and no more than three steel balls; no paper tag, card or label lying on the board; not a cartoon, not an illustration, not a diorama.
```

### G11 · You're Fired

- File: `references/drafts/round-6/G11-youre-fired.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 2.
- Reference images passed in, in order: `references/drafts/round-6/G5-tier-street.png` (the kept take of G5, the tier the shot is in, passed first); `references/drafts/round-6/G7-clear-ball.png` (the kept G7, passed second); No layout guide was passed: `references/guides/round-6/` has none for this view.

Takes:

- Take 1. Misses: the camera is high, looking down on the roof, not low; the red light stays on the roof; a steel post stands in front of the building, two patches of raised relief lie on the board at the right, and an orange part hangs over the roof. `You're Fired` spelled right. Judge: "the closest of the five is a frame from a top-budget film", then named things. Failed.
- Take 2 (prompt changed: the lens two balls' height above the board looking almost level at the front wall; the building standing straight on the flat board; the ball half way into the hole; the red light named surface by surface; nothing else on the board or the roof). Closer and lower, the ball half sunk in the scoop, red on the scoop and the roof. Judge: "Most likely: a frame from a top-budget film", then named six things. Failed. Kept as the best of three.
- Take 3 (prompt changed: the door opening two balls wide and one and a half high, the scoop as wide as the door with a chute inside, two crisp arrow inserts on the door's centre line, more red). The camera came out higher, the door half lowered, and a steel ramp inside the door ends at nothing. Judge: "Most likely a frame from a top-budget film", then named things. Failed.

The judge's answer on the kept take:

> Answer for picture-1102.png (viewed at full size plus zoomed crops).
>
> What the image shows: a macro, shallow-depth-of-field shot of a miniature red-brick two-storey building on a dark glossy pinball playfield. It has a glowing red beacon on the roof, a cream and gold sign reading "You're Fired", warm lit windows, and a garage-style arch at the front leading into a sunken, metal-rimmed pit. A clear glass ball with a white mouse-cursor arrow inside sits in that pit. Blurred metal rails run along the left. 1920x1080, no HUD, score or interface.
>
> 1) Which is it most likely to be
> - Most likely: a frame from a top-budget film (or equivalent high-end CG/miniature production). Reasons: cinematic macro framing, very shallow focus, film-style grading, physically consistent lighting (red beacon spill and window glow reflected correctly in the playfield), clean legible sign text, convincing miniature-scale textures.
> - Not a commercial pinball game screenshot: no score, HUD or table-wide view, and games do not render with this lens blur and close crop during play.
> - Not a textbook picture (nothing explanatory or labelled) and unlikely stock (too specific and odd a concept).
> - Runner-up: polished generated art. Small tells point that way: inconsistent window designs, a stray dark slit between two upper windows on the right wall, an indistinct blob at the building's left corner, and mushy arrow shapes on the two lit inserts. But the overall finish is well above "amateur".
>
> 2) Could a ball really travel every lane and ramp visible
> There are no ramps in frame and essentially one ball path: the scoop under the garage arch. Partly plausible, but these would not work or cannot be confirmed:
> - The ball itself: clear glass with a cursor embedded. A real pinball is solid steel; glass would be too light, would chip or shatter, would not respond to magnets, and the embedded shape would unbalance it.
> - The scoop: the pit is a wide rectangle that extends out past the building's left wall, with a raised metal rim on the near side. A slow ball rolling in from the front would hit that lip, and the pit is much wider than the ball, so it would not be captured in a repeatable position.
> - No exit: the interior is just black. No kicker, eject hole or subway is visible, so the ball would sit there unless something hidden returns it.
> - Arch clearance: the ball looks roughly as tall as the arch opening. It appears to fit only because it has dropped into the pit; it could not roll through at playfield level.
> - Lit arrow inserts: the two sit off to the front-left of the pit and do not clearly point into the opening.
> - Left side: there seems to be a channel between two metal rails, but it is out of focus, both ends are out of frame, and the blob at the building corner sits about where its mouth would be. It cannot be confirmed as a working lane.
>
> Short version: looks like a high-budget film frame, not a game screenshot. The only real ball path is the garage scoop, and the glass ball, the oversized rimmed pit and the lack of any visible exit are the things that would not work on a real table.

Judge result: FAILED. First answer: "a frame from a top-budget film", not a game screenshot (STATED). Under the narrow reading of the question's first option that is not the first answer; under the wide reading (game screenshot or film frame as one option) it is. See the choices at the end. Second answer: six things named, which fails under either reading. Kept at the limit of three takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not read it as a game screenshot: no score or display, no view of the table, and a close crop with lens blur (STATED).
- Camera height. The top of the roof can be seen, so the lens is above the roof line: lower than take 1, not as low as the brief asks.
- Red light. It falls on the roof, the rim of the scoop, the inside of the door and the board in front as a reflection. The brick front is lit mostly by its own amber windows, and the ball is hardly red at all. The brief asks for red over everything near the dome.
- Scoop. The pit is a wide rectangle, wider than the door, and runs out past the building's left wall; its near side has a steel rim that reads as raised (STATED by the judge; I see the same). No kicker or way out can be seen inside it (STATED).
- The ball is about as tall as the door opening, so it could not roll in at board level (STATED; the opening is partly hidden by the ball).
- Two lit inserts sit at the front left of the scoop, not on the door's centre line, and their arrows are soft shapes that do not clearly point at the door.
- Small flaws on the building (STATED by the judge; I see the first two): windows of differing patterns, a dark slit between two upper windows on the right wall, a small shapeless lump at the building's left corner.
- At the left, out of focus, two aluminum rails with a channel between them whose ends are out of frame.
- Frame. A blurred length of aluminum rail at the upper left. The ceramic border is not in the picture.
- Words (MEASURED at full size): `You're Fired`, spelled right, on a cream plate with a brass edge at the front of the roof. No other letters or numbers found.

Full prompt of the kept take:

```text
A frame from a finished commercial 3D pinball video game with photoreal graphics, in its low close-up replay camera. It looks exactly like a close photograph taken inside a real, physical pinball machine. 16:9.

REFERENCE IMAGE 1 is the street tier of this pinball table seen from straight above. This shot is taken inside that same tier, low down, at its upper left, so its parts are the same parts: the same red brick firehouse with grey stone trim, lit amber windows and a flat grey roof, the same red flasher dome on that roof, the same wide garage door opening at its front, the same dark steel-edged scoop hole in the board at the door, the same dark teal and navy printed street under a glossy clear coat. REFERENCE IMAGE 2 shows the ball of this game three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it for how the ball and the cursor look. This image has exactly one ball.

THE SHOT: low and tight on the firehouse. The camera is very low: its lens is only two balls' height above the playfield, in front of the firehouse and a little to its right, looking almost level at its front wall. We see the front wall nearly square-on and only a thin sliver of the top of the roof. The firehouse fills most of the frame, from its dome at the top to the board in front of its door at the bottom.

THE FIREHOUSE: a small moulded playfield sculpture of a two-storey red brick firehouse with grey stone trim and rows of small windows lit amber. Its wide garage door is rolled up and stands fully open. The firehouse stands directly on the flat board: there is no slab, no step and no kerb under it. Directly in front of the open door, cut into the flat board: the scoop, a dark hole in the playfield one and a half balls wide and two balls deep, edged with a thin polished steel lip that lies flush with the board, its far side running in under the open door. The board runs flat and level right up to the lip, so a rolling ball meets nothing before it drops in.

THE BALL: the clear acrylic ball is dropping into the scoop. It is in the middle of the lower half of the frame, about one seventh of the frame's width across. It is half way in: the lower half of the ball is already below the level of the board, down inside the dark hole, hidden behind the near lip of the hole, and only the upper half of the ball still shows above the board, like a setting sun. The whole cursor is in that upper half, in plain view. Inside it the cursor, a solid white enamel arrow with a black edge, three quarters as long as the ball is wide, is tumbling as the ball falls, tipped over, clear of the wall. The arrow is plain to see through the clear acrylic. The acrylic is lit red on the side toward the dome, with crisp highlights. The cursor is only an arrow: no face, no eyes, no limbs.

THE DOME: on the roof, one red flasher dome, a ribbed red lens on a chrome base, lit at full flash. It is the brightest thing in the frame. It throws strong red light over everything near it: the roof, the back of the sign, the whole brick front, the board in front of the door, the steel lip of the scoop and the ball are all washed with red, and its red reflection lies sharp in the glossy clear coat. The red light is the main light in the picture.

THE SIGN: along the front edge of the roof, standing up and facing the camera, one wide cream sign plate with a thin gold border and large dark serif letters: "You're Fired".

AROUND IT: the flat, glossy board printed with dark teal and navy street artwork, perfectly smooth under its clear coat, and two small lit arrow inserts set flush in the board in front of the scoop, both pointing at the scoop. Nothing else stands on the board near the door: no post, no street lamp, no plaque, no manhole cover, no raised relief of any kind. Nothing is on the roof but the dome and the sign. Beyond the firehouse, soft in the distance, a little of the tier: the brushed aluminum side rail at the left.

LIGHT: dusk. Strong red from the dome, warm amber from the windows, deep navy shadows. Rich contrast and glossy reflections. The air is clean.

FOCUS: the firehouse front, the sign, the scoop and the ball are sharp.

LETTERING: the only words in the image are "You're Fired", once, on the sign plate, spelled exactly like that: Y-o-u-apostrophe-r-e, then F-i-r-e-d. No other letters or numbers anywhere.

NOT IN THE IMAGE: no people, no hands, no faces, no firefighters, no fire engine with a driver; no flames, no fire; no orange part, no wire and no ramp on or above the roof; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, no smoke, no haze, no lens flare; no second ball; not a cartoon, not an illustration, not a diorama.
```

### G12 · The last save

- File: `references/drafts/round-6/G12-last-save.png`
- Model: `seedream_5`
- Takes made: 3 of 3 allowed. Kept: take 2.
- Reference images passed in, in order: `references/drafts/round-6/G5-tier-street.png` (the kept take of G5, the tier the shot is in, passed first); `references/drafts/round-6/G7-clear-ball.png` (the kept G7, passed second); No layout guide was passed: `references/guides/round-6/` has none for this view.

Takes:

- Take 1. The far buildings carried sign plates and one read "Student Lenns". `Mom's Basement` and `Unemployment Office` spelled right. Judge: "generated art", with a film frame as the look it sits closest to, then named things. Failed.
- Take 2 (prompt changed: exactly two sign plates in the whole image; the far buildings out of focus with bare roofs; no ghost or trail of the ball). Both signs right, no other writing, all the things the brief lists are in frame. Judge: "Most likely a frame from a top-budget film" (about 60% film frame, 30% generated art), then named nine things. Failed. Kept as the best of three.
- Take 3 (prompt changed: the two flippers not mirroring each other, the right one level at mid-swing; the ball one third as long as a flipper; the same signs). The ball came out larger, not smaller, and half-transparent spare spheres appear near the left end of the wire ramp and under the right flipper. Judge: "amateur generated art, with a film-style finish", then named things. Failed.

The judge's answer on the kept take:

> picture-1202.png — judged from viewing the full frame plus zoomed crops.
>
> Q1. Which is it most likely to be?
> Most likely a frame from a top-budget film (high-end cinematic CG / miniature macro shot). Rough confidence: about 60% film frame, 30% generated art, 10% the rest combined.
> - For film: very shallow depth of field with soft bokeh on the far half of the table, fine grain, a restrained teal/amber grade, motion blur on only the right flipper, convincing chrome, glass and worn-enamel materials, and clean legible custom lettering ("Mom's Basement", "Unemployment Office"). The glass ball with a mouse cursor inside and the career-as-pinball satire read as deliberate art direction.
> - Not a pinball video game: no score, HUD or DMD, a low angle you could not play from, heavy lens blur, and a layout that is not playable.
> - Not stock: far too specific a concept. Not a textbook picture: nothing is diagrammatic or labelled for teaching.
> - Why generated art is the runner-up: the finish is well above amateur, but the table's mechanics do not hold together (below), which is the typical weakness of generated imagery.
>
> Q2. Could a ball really travel every lane and ramp? No. What could not work:
> - Ball is oversized for the table. It is roughly 55% of a flipper's length (a real ball is about 35%), and nearly every passage is smaller than it.
> - Left clear tube: its bore is well under half the ball's diameter, so the ball could never enter it. Neither end visibly connects to anything.
> - "Mom's Basement" square hole: the opening is clearly narrower than the ball, so the ball could not drop in.
> - Spiral tower (right): the gap between coil levels is about a third of the ball's diameter, the top is capped by clear discs, and there is no outer guard, so the ball can neither get in nor ride down it.
> - Wire rail across the middle: no ramp leads up to it from the playfield, so no flipper shot can reach it. Its left end curls into a closed loop hanging in the air beside the tunnel, it is arched (highest in the centre) so a ball would stall rather than roll through, and its right end meets the side of the spiral rather than a track entrance.
> - Tunnel under the red building: opening is low and about one ball wide at best, with no visible exit. Marginal, partly hidden and out of focus.
> - Gap between the flipper tips is about the same width as the ball, so a centre drain into "Unemployment Office" would be a squeeze and could wedge instead of falling cleanly.
> - Inlanes: the gaps between the wire guides and the slingshots are only about one ball wide, and the thin guide rails below them run underneath the flipper bases toward the apron, so a ball would be sent behind the flippers rather than onto them. This last point is my reading of the rail geometry, moderately confident.
> - Lower right corner: no hole or outlet matching the left side; a ball there appears to end against the white apron slab.
>
> What would work: the straight central "road" lane up the middle, under the wire rail to the lit target at the back, and the flat lit inserts. No shooter lane or plunger is visible in frame, so I can't say how a ball would be launched.

Judge result: FAILED. First answer: "a frame from a top-budget film", not a game screenshot (STATED). Under the narrow reading of the question's first option that is not the first answer; under the wide reading (game screenshot or film frame as one option) it is. See the choices at the end. Second answer: nine things named, which fails under either reading. Kept at the limit of three takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not read it as a game screenshot: no score or display, a low angle "you could not play from", heavy lens blur (STATED).
- Ball size (MEASURED). The ball is about half as long as a flipper (about 180 px against about 360 px on the 1920 px frame). A real ball is about a third. The judge puts it at 55%.
- The right flipper is not clearly half way through its swing. The two flippers nearly mirror each other; the right one differs only by a short streak at its tip. The ball touches the right flipper, so it reads as resting on it more than falling.
- Mom's cellar hatch, the square hole at the bottom left, is narrower than the ball (STATED; I see the same). The lift tube at the left edge is also narrower than the ball (STATED).
- The gap between the flipper tips is about one ball wide (STATED). The prompt asked for one and a half.
- Wire ramp, out of focus. Its left end closes in a loop in the air by the firehouse, it peaks over the road, and its right end meets the side of the garage spiral (STATED; inherited from the kept G5).
- Garage spiral, out of focus: stacked rings with gaps much thinner than the ball (STATED; inherited from the kept G5).
- Inlanes. The wire guides run on under the flipper bases (STATED with moderate confidence; I see the same). Inherited from the kept G5.
- The lower right corner has no hatch or outlet to match the left; the right outlane ends at the apron (STATED).
- The far buildings carry no signs. That was my choice after take 1 misspelled one, so `You're Fired`, `Background Check` and `Student Loans` are absent from this view.
- Frame. Aluminum rail at both sides, the off-white ceramic apron across the bottom. The ceramic border outside the rail is not in the picture.
- Words (MEASURED at full size): `Mom's Basement` on the roof of the house at the left and `Unemployment Office` on the plate over the drain, both spelled right. No other letters found. The middle insert is a clock face, out of focus, with hands and twelve faint dots for the hours; no numeral can be made out (MEASURED at five times size).

Full prompt of the kept take:

```text
A frame from a finished commercial 3D pinball video game with photoreal graphics, in its low flipper camera. It looks exactly like a close photograph taken inside a real, physical pinball machine. 16:9.

REFERENCE IMAGE 1 is the street tier of this pinball table seen from straight above. This shot is taken inside that same tier, low down at its bottom end, so its parts are the same parts in the same places: the same pair of glossy orange flippers with black rubber bands, the same two slingshots of road-sign yellow plastic with black chevrons, the same chrome wire lane guides and amber lamps in the inlanes and outlanes, the same three round lit inserts showing a ladder, a clock and hats, the same two rows of three tiny houses, one row above each slingshot, the same tiny house at the foot of the left outlane, the same off-white ceramic apron with the small grey office front at its centre, the same dark teal and navy printed street under a glossy clear coat, the same brushed aluminum side rails. REFERENCE IMAGE 2 shows the ball of this game three times: a clear acrylic ball with a white arrow cursor sealed inside it. Use it for how the ball and the cursor look. This image has exactly one ball.

THE SHOT: the camera is low, just above the playfield, behind the bottom flippers and a little above them, at the player's end of the tier, looking up the tier along the board. A wide lens. The apron is nearest the camera at the bottom of the frame, the two flippers lie across the lower middle of the frame, and the board runs away up the frame to the buildings in the distance.

BOTTOM OF THE FRAME, nearest the camera: the apron, a smooth band of matte off-white ceramic. At its centre the small grey office front, seen from above and behind, with its dark doorway facing up the tier toward the gap between the flippers: that doorway is the drain. Flat on the office's roof, facing the camera, one wide cream sign plate with a thin gold border and large dark serif letters: "Unemployment Office".

THE FLIPPERS: the pair of glossy orange flippers, each three balls long, on steel shafts, with a black rubber band round each. The left flipper is at rest, pointing down toward the centre. The right flipper is half way through its swing upward, caught in the act: it is level, and its tip is streaked with a little motion blur. Between the two tips is the gap, one and a half balls wide.

THE BALL: the clear acrylic ball is falling toward the gap between the flippers. It is just above the right flipper's tip, a little right of the centre line, one ball's width above the flipper, about one tenth of the frame's width across. The rising right flipper is about to catch it. Inside the ball the cursor, a solid white enamel arrow with a black edge, three quarters as long as the ball is wide, is tumbling a beat behind the roll, tipped over, clear of the wall. The arrow is plain to see through the clear acrylic. Crisp highlights from the lamps on the acrylic and a soft shadow under the ball. The cursor is only an arrow: no face, no eyes, no limbs.

EITHER SIDE: above and outside each flipper, a slingshot: a triangle of road-sign yellow plastic with black chevron stripes on three posts with a rubber band, a lamp glowing inside it. Outside each slingshot the inlane and the outlane, divided by a chrome wire lane guide, each with two lit amber lamps set flush in the floor. At the far left, at the foot of the left outlane: one tiny cream house with a dark red roof, with a square steel-edged cellar hatch open in the board beside it. Flat on its roof, facing the camera, one cream sign plate with a thin gold border and large dark serif letters on two lines: "Mom's" over "Basement".

BEYOND THE FLIPPERS: the three round lit inserts set flush in the board, glowing red, amber and white, with a ladder, a clock and hats. Above the left slingshot, one row of exactly three tiny houses side by side with pitched roofs and lit amber windows; above the right slingshot, one more row of exactly three. Six tiny houses in two rows. Farther up the tier, beyond the houses, the picture goes soft: a film camera's shallow focus. The bank with its stone columns, the red brick firehouse with its red dome lit, the parking garage with its clear spiral, the police station with its blue dome lit and the chrome wire ramp crossing over the road are smooth, out-of-focus shapes with glowing windows. In this shot these far buildings carry no sign plates at all: their roofs are bare.

LIGHT: warm dusk. Every lamp is on: amber lane lamps, the lamps in the slingshots, the three inserts, the windows of the houses, the red and the blue dome far off. Sharp reflections in the clear coat. Clean air.

FOCUS: the apron, the office front and its sign, the flippers, the ball, the slingshots and the six houses are all sharp. The far buildings are out of focus. Only the moving flipper's tip is streaked, by its own motion. The ball is sharp, with no ghost, no trail and no double image of it anywhere.

LETTERING: the only words in the image are these two signs, spelled exactly, letter for letter: "Unemployment Office" (U-n-e-m-p-l-o-y-m-e-n-t, then O-f-f-i-c-e) on the roof of the office front at the bottom centre; "Mom's Basement" (M-o-m-apostrophe-s, then B-a-s-e-m-e-n-t) on the roof of the house at the left. There are exactly two sign plates in the whole image, those two. The bank, the firehouse, the police station and the parking garage have no sign plates and no writing of any kind, not even blurred writing. No other letters or numbers anywhere.

NOT IN THE IMAGE: no people, no hands, no faces; no cabinet, no legs, no room, no floor, no sheet of glass over the playfield; no fog, no smoke, no haze, no lens flare; no second ball; not a cartoon, not an illustration, not a diorama, not a model railway.
```

## Choices the brief did not make

Times are UTC, read from the files and the commits (MEASURED).

Where I did not do what the brief says:

- Order of work. The brief's order is G7, then G3, G4 and G5, then G2, then G1, then G6, then G8 to G12. The order in fact was G7, G3, G4 and G5, G6, G8 to G12, G2, G1. G6 and the five close shots need only G7 and the tier takes, so they were generated while the G2 join was being made by hand, and G1 waited for G2. Nothing was made before the pictures it depends on.
- Showing and pushing. G7, G3, G4, G5, G6, G1 and G2 were each pushed and shown when finished. The last takes of G8 to G12 were all judged between 03:50 and 03:52, and G8's retouched file at 04:00. The five were pushed as five commits in a row and shown together at 04:05. That is later than "as soon as it is done".
- What counts as a take. The brief says "Retries count". I counted every whole picture the model made as a take: 41. I did not count seven smaller model calls on crops: two that re-made the `Mom's Basement` sign plate in G5 (the first was used), two that tried to re-make the drain plate in G1 (both misspelled, neither used), and three that painted the ball out of G3, G4 and G5 for the G2 join. If those count, G5 had six against a limit of four, G1 six against four and G2 six against three. The retouches made in code (G1 plate, G1 roof plate, G5 and G2 clock, G8 roof, the G2 join) used no model call.
- Two misspelled signs were corrected, not left blank. The brief says "A sign you cannot get spelled right is left blank". `Mom's Basement` in G5, and so in G2, was re-made by the model on a crop and pasted in. `Unemployment Office` in G1 was fixed by hand, by moving the plate's own letters and copying its own "n". Both read right in the kept files, and each section says so. Three other things were blanked as the brief says: the marks on the roof plate in G1, the mock numerals on the clock insert in G5 and G2, and the ruled roof of the bank in G8.
- The judge's message held more than the two questions. Round them it said how to do the job: open the attached file and view it, and send the answer back within a few minutes. The later judges were also told to view it at full size and not to search the web. The brief says to give it the image and "exactly these two questions". The two questions themselves were given word for word, and nothing about the picture was said.

The judge:

- Every answer came from a fresh agent in its own separate sandbox. It got one file under a neutral name, `picture-NNNN.png`, and nothing about the project, the brief or the other takes.
- File numbers. The first two digits are the image: 01 is G7, 02 is G2, 03 to 06 are G3 to G6, 08 to 12 are G8 to G12, 13 is G1. The last two are the take, or a later number for a file judged again after a change: 0831, 1305, 1306, 0505 and 0204.
- Every take was judged, not only the one I meant to keep: 41 takes and 5 files judged again, 46 answers. Whether any judge was slow enough to need a replacement is not in my records (UNKNOWN).
- How I read the first question. Its first comma comes after "film", so it can be read two ways: the first option is a game screenshot alone (narrow), or a game screenshot or a film frame taken together (wide). The notes use the narrow reading. Under the wide reading the first answers on the kept G1, G9, G10, G11 and G12 would be the first option. The judges themselves spoke of "five options". No result changes either way, because every judge named things on the second question.
- G6 was judged with the same two questions although it is a web page and not a playfield. Its judge said so.
- Each file changed after generation was judged again in the form it is kept. The earlier answers are kept in the notes beside the last one.

Which take was kept, where the judge and I disagreed:

- G7. Take 3 was kept over take 1, although take 1's judge said film frame and take 3's said generated art. In take 1 the flipper is orange in one panel and white in the other two, the ball is as wide as the flipper is long, and the cursor is not squashed at the hit.
- G3. Take 4 was kept over take 2, although take 2's judge said game screenshot. Take 2 has three lines of scribble on each sticky note and gold marks like letters near the bottom left, which fails the line on words.
- G1. Take 3, with the plate fixed by hand, was kept over take 2, whose words were all right as generated. Take 3 is the only take with the ceramic border outside the aluminum rail.
- G2. The join was kept over the two generated takes. Both generated takes put a ball in the picture, although the brief says no ball for G2. Their other misses are in the G2 section.
- G9 to G12. Take 2 was kept over take 3 in each. Each take 3 fixed one thing and broke another; the lists are in the sections.
- Only the kept take of each image is committed. The other 29 takes are described in each section's take list and are not in the repo.

How the pictures were made:

- Model. `seedream_5` for every take and for the seven crop calls. Whether it is the strongest on this account is UNKNOWN, as said under "Model".
- Takes were made two at a time with two different prompts where the limit was four: takes 1 and 2 together, then takes 3 and 4 together after the first two judges had answered. G6's takes 2 and 3 were also made together.
- Passing a whole take back in with a list of changes returned it almost unchanged (G3 take 3). After that every new take was a fresh picture from a rewritten prompt.
- G7 was given the two approved cursor sheets, with an instruction not to copy their captions. It is one frame of three panels, one for each of the brief's three views.
- G8 to G12 have no layout guide in `references/guides/round-6/`. Each was given the kept take of its tier first and the kept G7 second.
- G2's two generated takes were given the unlabeled guide and the kept G3, G4 and G5. G7 was not passed, because G2 has no ball.
- G1 was given the unlabeled guide, the G2 join as a 1080 by 1920 copy, and the kept G7. It was made from the join before G2's two generated takes existed.
- G2's frame. The brief allows the join "with the seams tidied and the balls painted out". It does not say where the rail and the border round the whole machine come from. The tier takes end at their own rails, so the outer aluminum rail and the ceramic border were drawn in code. The file is saved at 2160 by 3840, twice 1080 by 1920, so that each tier keeps its detail.
- Lane arrows that point the wrong way were left as generated in the tier takes and flipped by hand only in the join.

What is in the pictures:

- No score display in the tier views or the close shots. The brief puts the only display in the marquee, which only G1 shows. Most judges gave the missing score or display as their reason for not saying game screenshot. I did not add one.
- Signs. Tier signs are cream plates with plain black letters lying on the roofs, so that they can be read from straight above. `Retirement` is on a small brass plate on the lid of the beach box. In the low shots the sign is on the lintel over the doors (G9) or on the front edge of the roof (G11).
- G1 carries lettering only on the marquee and the drain plate, with bare roofs, to keep small misspelled signs out of the wide view. Seven of the allowed tier words are therefore absent from G1. The six digits on the display, 042500, are my choice.
- G12. The far buildings carry no signs, after take 1 misspelled one of them.
- G8. No lettering at all. A ramp of four wires was accepted at the limit; the brief asks for two rails.
- Inserts. The brief names the nine pictures. Their glow colours are my choice: ice blue, white and gold in the corporate tier; yellow, green and blue in the office; red, amber and white in the street.
- Street slingshots are road-sign yellow with black chevrons. Mom's cellar hatch is a hole in the floor of the outlane beside her house.
- The lobby doors were asked for open in G3 and came out shut.
- G6. The subline and the paragraph are plain grey bars with no letters. The five progress buttons carry the digits 1 to 5, as on the approved `page-look.png`. The ball is about 126 px across, as generated, against the 96 px the brief asks for.
- Contact sheet. Eleven 16:9 tiles in three columns with G2 as one tall tile at the right, each labeled with its take, on a dark ground.

When each thing was made:

- 02:18 start. Brief, kit, guides and the study read until the first takes at 02:32.
- G7: takes at 02:32 and 02:40. Pushed 02:45.
- G3: takes at 02:46 and 02:54. Pushed 02:57.
- G4 and G5: takes at 02:58 to 02:59 and 03:06 to 03:07. G5's sign re-made at 03:12. Pushed 03:14 and 03:15.
- G6: takes at 03:11 and 03:16. Pushed 03:23.
- G8 to G12: takes at 03:20 to 03:21, at 03:30 (G11 at 03:38) and at 03:48. G8's roof retouched at 03:57. Pushed 04:05.
- G2: the join finished at 03:50, the two generated takes at 04:12 and 04:20. Pushed 04:24.
- G1: takes at 03:57 and 04:05, the plate fixed at 04:14. Pushed 04:20.
- Late changes: G1's roof plate blanked at 04:30, G5's clock at 04:32, the G2 join rebuilt at 04:34. Each was judged again and pushed at 04:39, 04:44 and 04:45.
- Contact sheet and these notes finished after that, inside the four hours.

