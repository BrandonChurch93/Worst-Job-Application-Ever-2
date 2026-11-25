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
- How it was made: Take 3 as generated, with one retouch after generation: the sign on the house at the bottom left came out as "Mom's" over a second word of malformed letters, roughly "Baskutt". The 512 px square round that house was cut out, sent back to the same model with the instruction to change only the lettering to `Mom's Basement` (prompt: `Reproduce this photograph exactly ... Change one thing only: the dark serif lettering on the cream sign plate. It now reads, on two lines, exactly: Mom's / Basement`), made twice, both spelled right, and the sign plate alone (148 by 92 px of the 2816 px original, feathered) was pasted back from the first one. Nothing else in the file was changed. The judge saw the retouched file. The retouch was not counted as a take.
- Reference images passed in, in order: `references/guides/round-6/guide-tier-street.png` (the unlabeled guide); `references/drafts/round-6/G7-clear-ball.png` (the kept G7); `references/drafts/round-6/G3-tier-corporate.png` (the kept G3).

Takes:

- Take 1. Misses: seen at a steep angle with dark margins, so the tier does not fill the frame; signs wrong: "You're Fire-" (cut off), "Student Loan", an unreadable "Mom's ..."; two tiny houses only. Judge: "amateur generated art", then named eight things. Failed.
- Take 2 (made at the same time; same prompt plus a paragraph naming the routes). Seen from straight above. `You're Fired`, `Background Check`, `Student Loans` spelled right. Misses: "Mom's Ekōaier" and "Unemployment Offier"; four tiny houses near the top and none above the slingshots, five houses in all, not seven; no spinner to be seen; lift tube ends in a cap at the apron. Judge: "amateur generated (AI) art", then named seven things. Failed.
- Take 3 (prompt rewritten for every fault the two judges named: two rows of three houses, large cream signs spelled letter by letter, cellar hatch as a hole in the outlane, office doorway two balls wide, plunger tip in the lane, wire ramp as two rails side by side with a stated way on and off, spiral as a wide clear half-pipe, straight lift tube, every launch lane arrow up). Seen from straight above, all counts right, four of five signs spelled right, the fifth wrong ("Mom's" over roughly "Baskutt") and retouched as described above. Judge (on the retouched file): "Generated art (AI image), of the five options. Fairly confident, not certain", then named nine things. Failed. Kept as the best of four: the only take with every count right and every sign right after the retouch.
- Take 4 (made at the same time as take 3; the take 3 prompt plus the routes paragraph). Misses: seen at an angle with dark margins; "Enemployment Offer" and "Mom's Basenen"; houses scattered over the upper board. Judge: "amateur generated art (AI-generated)", then named ten things. Failed.

The judge's answer on the kept take:

> picture-0503.png — I opened it at full size and zoomed into each region.
>
> What it shows: a top-down, photoreal 16:9 view of a satirical "job hunt" pinball table. Labels read "You're Fired", "Student Loans", "Background Check", "Mom's Basement" and "Unemployment Office" (on the drain). The ball is a clear glass sphere with a mouse-cursor arrow inside it.
>
> Q1 — Which is it most likely?
> Generated art (AI image), of the five options. Fairly confident, not certain.
> - Not a commercial pinball video game screenshot: no score, HUD, ball count or display, and the look is photographic (shallow depth of field, grime, scratches) rather than a game render.
> - Not a textbook picture or stock image: too specific and jokey, with no instructional or generic purpose.
> - Top-budget film frame is the only real rival, because lighting, materials and legible text are polished. What tips it away: small parts dissolve into nonsense on close inspection, which a built prop or a modelled CG asset would not do. Examples: a melted, squiggly street lamp and a loose hex nut lying on the playfield near the spiral; the lit arrow inserts along the top arch are scribbled glyphs pointing in inconsistent directions; the lowest arrow in the shooter lane points down while the rest point up; rails at the top overlap and merge ambiguously.
> - Caveat: "amateur" undersells the finish. It is a high-quality generation, but the mechanical incoherence is the signature of an image model, not of a design that anyone had to make work.
>
> Q2 — Could a ball travel every lane and ramp? No. Things that could not work:
> - Wire ramp across the middle: it is just two rails with rungs, like a ladder or handrail, with no guard rails. Its left end is a closed loop sitting at playfield level with no entry flap, so a ball cannot get onto it, and it has a sharp peak in the middle that the ball would fly off. Its right end butts into the outside wall of the spiral beside a support post rather than feeding a trough.
> - Spiral "parking garage" ramp: the lower levels are stacked separate rings, not a continuous helix, and the gaps between floors are roughly a quarter to a third of the ball's diameter. The clear top level is a closed loop around a hole. The exit at the bottom is a thin metal tongue narrower than the ball.
> - Plunger: the knob and spring sit inside the cabinet on the playfield, at the bottom of the shooter lane, under where the glass would be. Nobody could pull it.
> - Left clear tube: about ball width, but its top entry is an orange funnel that connects to no lane, and its bottom ends in a chrome elbow at the apron with no visible exit back to the playfield. At best it goes under the table; as drawn it is a dead end.
> - Top arch: a lit box sits in the top centre and splits the arch in two, and the left half appears to end in a capped rail, so there is no continuous orbit.
> - Inlanes: the guide rails below each inlane run underneath the flippers toward the drain instead of ending at the flipper pivot, so a ball coming down an inlane would be delivered under the flipper, not onto it. (Moderate confidence; the geometry there is a little ambiguous.)
> - Building targets: "Background Check" has its doorway blocked by the spiral and a little windmill; "Student Loans" is a solid columned facade with no opening. Only "You're Fired" has a usable scoop mouth.
> - Left outlane: the "Mom's Basement" house sits in the lane; the square hole beside it could work as a sink, but the house itself blocks the path.
> - Minor: the ball is clear glass with a cursor inside, not steel.
>
> What does look workable: the two flippers (correct pivots, a normal-sized gap, sensible size against the ball), the slingshots, the centre "road" lane, the "You're Fired" scoop, and the drain slot.

Judge result: FAILED both questions (STATED by the judge). Kept at the limit of four takes.

What the kept take misses (MEASURED on the file unless marked):

- The judge did not pass it: it called it generated art ("fairly confident, not certain"; a film frame was "the only real rival") and named nine things that could not work.
- `Mom's Basement` was not spelled right by the model in the full picture. The sign in the file is a retouch (see "How it was made").
- Wire ramp. Two chrome rails with rungs on thin posts, more like a handrail than a track a ball rides. It has a peak over the road. Its left end is a closed loop near the bank with no flap, and its right end meets the outside of the spiral beside a post. So the way on and the way off are not clear (STATED by the judge; I see the same).
- Parking garage spiral. The three levels are stacked rings, not one continuous ramp, and the clear half-pipe on the roof is a closed loop round a hole. The way off is a thin metal tongue at the lower right corner of the garage, narrower than the ball.
- Police station door. The spiral and the spinner stand directly in front of it.
- Spinner. It came out as a small pinwheel on a post beside the police station, not a flat flag hanging between two posts across the lane.
- Launch lane arrows (MEASURED). Five arrow inserts: the top four point up, the lowest one points down.
- Top edge. Arrow lamps along the top left point right and those along the top right point left; a lit box at the top centre is the chute. The prompt asked for no lane along the top; the lamps and rails there read as one.
- Lift tube. It runs straight up the left side to an orange funnel at the top left corner, not to a door between the firehouse and the bank, and at the bottom it ends in a chrome elbow at the apron.
- Plunger. The spring and the orange knob are inside the frame at the foot of the launch lane, a little left of the lane's centre line.
- Inlanes. The wire guides below each inlane run on under the flippers toward the drain (STATED by the judge with moderate confidence; I see the same on both sides).
- Mom's house stands in the left outlane beside its hatch and takes about half of the outlane's width.
- Insert pictures. The left one is a ladder and the middle one a clock face (with twelve small marks that could be read as numerals; too small to tell, UNKNOWN). The right one shows one hat with a brim, perhaps two, not a stack of three.
- Stray small things on the board near the spiral: a bent street lamp and a loose nut (STATED by the judge; I see a bent lamp post and a small ring).
- Ball size (MEASURED). About 100 px across on the 1920 px frame, so the tier is about 19 balls wide. A flipper is about 3 balls long.
- Ceramic border. The apron along the bottom is ceramic as asked. The border on the other sides is not in frame; the edge of the picture is the aluminum rail, as in the guide for the tier views.
- Words (MEASURED at full size): `You're Fired`, `Background Check`, `Student Loans`, `Unemployment Office`, all spelled right by the model; `Mom's Basement`, spelled right by the retouch. No other letters or numbers found, with the clock face above as the one UNKNOWN.

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

