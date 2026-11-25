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

`seedream_5` (Seedream 5 Pro, ByteDance), the same for all twelve images. It accepts up to ten reference images and returns exact 16:9 at 2816 by 1584; every file is scaled to 1920 by 1080 (G2 to 1080 by 1920) with no other processing unless a section says so.

Whether it is the strongest photoreal model on this account that accepts references is UNKNOWN: no bake-off was run, to save takes. It was chosen because it made all fifteen approved images of this website, so the ceramic, aluminum, orange and the cursor match what is already approved.

## How each take was judged

Each take was first checked by me against "What to check". Then one fresh agent that had not seen the brief was given only a copy of the image under a neutral file name and the two questions, word for word. Its answer is quoted in each section.

## The images

In the order they were made.

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
- Words (MEASURED at full size): `Corporate HQ` and `Retirement`, both spelled right. No other letters or numbers found.

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

