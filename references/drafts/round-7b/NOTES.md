# Round 7b, the redo with locks
Asked for by Partner's mail for Brandon, read 2026-11-27 20:31Z (pasted word for word in `kit/PROGRESS.md` under "Round 7b from Brandon, by Partner"). Brandon's words on round 7: "the output trash they're all like hyper 3-D. They don't look like something on the application at all."
Nothing here is approved. Brandon picks by code and may mix.
## What is in this folder
- `contact-sheet-BOSS.jpg`, `contact-sheet-PAGE.jpg`: one sheet per set. The first tile is the real screenshot, labelled BASELINE. Every other tile carries its code.
- `BOSS-1.png` to `BOSS-6.png`, `PAGE-1.png` to `PAGE-4.png`: full size, 1920 by 1180. The picture is the top 1920 by 1080 and is untouched; the code is printed in a dark band of 100 rows under it, at the lower left, so that nothing of the picture is hidden. Cut the band off to have the clean picture.
- `BASELINE-BOSS.png`, `BASELINE-PAGE.png`: the two real screenshots of the build, with the same band.
## Method
- The skill's six-screenshot-variations format: every image starts from a real 1920 by 1080 screenshot of the current build as input image 1.
- The two real screenshots are film stills of main at 9053724d at the final setting: `npm run -s still -- --key boss-fight --tier final --force` (116 s) and `npm run -s still -- --key marketing-top --tier final --force` (122 s).
- Model: nano_banana_pro, 16:9, one call per image. It returns 2752 by 1536; each was cut to 16:9 at the centre and scaled to 1920 by 1080 (Lanczos).
- One take per image. No retake was needed: no lock broke. Nothing was judged for taste.
- BOSS 1 and PAGE 1 were made first and checked beside their real screenshots; the other eight were made only after both held every lock.
- Each image was looked at once, beside its real screenshot, for the locks only.
## What each input controlled
- Image 1, every image: the real screenshot. It controlled the view (straight on, flat), the page, the materials, the light, the type, the header, the step rail or navigation, the health bar, and the cursor's size and place.
- Image 2, BOSS 2 to BOSS 6: the approved `references/approved/tier-office.png`. It controlled only how depth inside the page is shown (relief, sunk parts, shadow, small lamps), the bar Partner's mail names for "a different world that still lives inside the web page". Its camera, its objects and its colours were told to be left alone.
- BOSS 1 had the real screenshot only.
- Image 2, PAGE 1 to PAGE 4: the approved `references/approved/page-look.png`. It controlled only the finish of the materials, the light and the type.
- The prompt, every image: what changes. For BOSS, the place on the line from 1 (today's page with a better boss) to 6 (the page transformed as far as it can go). For PAGE, the layout, with the words given from the locked copy.
| Code | Prompt, characters | Input images |
|---|---|---|
| BOSS 1 | 3151 | BASE-BOSS.png |
| BOSS 2 | 3810 | BASE-BOSS.png, tier-office.png |
| BOSS 3 | 4024 | BASE-BOSS.png, tier-office.png |
| BOSS 4 | 4190 | BASE-BOSS.png, tier-office.png |
| BOSS 5 | 4332 | BASE-BOSS.png, tier-office.png |
| BOSS 6 | 4299 | BASE-BOSS.png, tier-office.png |
| PAGE 1 | 3456 | BASE-PAGE.png, page-look.png |
| PAGE 2 | 3455 | BASE-PAGE.png, page-look.png |
| PAGE 3 | 3561 | BASE-PAGE.png, page-look.png |
| PAGE 4 | 3594 | BASE-PAGE.png, page-look.png |

## One line per code
- BOSS 1: today's page with the form still on it and a larger boss: a wide glass shield, a heavy cannon on its back, small cannons in the corners.
- BOSS 2: the form is gone and the page's plates begin to lift as rings round the fight; the boss gains a long back cannon. No health bar in this one.
- BOSS 3: low ceramic walls, pillars and glass slabs rise out of the page; a larger boss on clawed legs; thin orange light in the floor cracks.
- BOSS 4: the page's light drops to a warm grey brown; lamps, glass and orange strips glow; a big curved shield and a multi-barrel back cannon.
- BOSS 5: the arena is a well sunk into the page with an aluminum rim, like the pinball machine; the page round it is unchanged.
- BOSS 6: the farthest: the page broken into slabs over orange light, tall pillars with long shadows, the boss in the middle firing its back cannon through a pillar.
- PAGE 1: a glass navigation bar, a split hero with a cluster of five medals, the ticker across the full width, and the perks heading at the fold.
- PAGE 2: the real header and hero, then a proof row of five small medals under "Awards We Definitely Earned", the ticker at the foot.
- PAGE 3: a split screen: the headline large at the left, the comparison table in one glass panel at the right.
- PAGE 4: the headline across the width, the long subline with the button beside it, then a three-column index of the page's sections.

## The locks, checked as facts

The checks below are the notes written right after each look, word for word.

## BOSS 1, viewed once beside BASE-BOSS at 20:38Z (take 1, 27 s, prompt 3151 characters, one input image)
BOSS 1 beside its real screenshot (`look/BOSS-1-beside.jpg`, the screenshot above and the take below, viewed once at 1000 wide). The lock check, as facts. Straight on and flat: yes, no tilt and no perspective. Same materials and light: the same warm white ceramic, the same glass card, red slabs and orange bar, light from the upper left with short shadows to the lower right. Header, rail, heading, bar, card, slabs, hole: all kept in place; the words read the same. Cursor: same place, same size as the screenshot's by eye at this scale, with its darts. Would pass as this site: yes. What changed: the hull carries a long finned cannon on its back with an orange glow in the muzzle, the glass shield is larger and curved, cable looms and cracks in the ceramic round the legs. Not locks, said plainly: the machine is larger by about a quarter, not twice; there are five small corner cannons, not four (one extra stands at the left end of the rail), and the upper left one touches the first letter of the header title. No lock is broken, so no retake.

## PAGE 1, viewed once beside BASE-PAGE at 20:41Z (take 1, 30 s, prompt 3456 characters, two input images)
Lock facts:
- Straight on, flat to the screen: holds. No camera angle, no room, no photograph.
- Same world: ceramic page, frosted glass (now the navigation bar and the ticker strip), brushed aluminum medals, orange plastic buttons, soft light from the upper left with shadows down and right: holds.
- Same type, same header words, same hero words: holds. Header title and links read the same as the real page.
- Cursor: same size and same place as in the real screenshot: holds.
- Would pass as this site beside the real one: yes.
Not locks, said plainly:
- The five medals overlap; the front medal hides part of the words on the four behind it ("Culture", "Employer", "Human Resources", "Transparent").
- A wide empty band sits between the ticker and the "Why Join Us?" heading at the fold.
- The ticker runs the full page width and is cut at both edges of the screen, as a running strip would be.
Result: no lock broken, no retake.

## BOSS 2, viewed once beside BASE-BOSS at 20:42Z (take 1, 33 s, prompt 3810 characters, two input images)
Lock facts:
- Straight on, flat to the screen: holds. The lifted plates are ring segments in low relief seen from straight above; no vanishing point, header and rail unskewed.
- Same world: ceramic, brushed aluminum, orange plastic, the frosted glass shield, light from the upper left: holds.
- Header title and step rail: the same as the real page: holds. Cursor: same size and place: holds.
- Would pass as this site beside the real one: yes.
Not locks, said plainly:
- The boss health bar is missing. The step heading and the bar went with the form content.
- The boss is the same size as today; the new thing on it is a long cannon on its back.
- Four corner cannons, one in each corner. Form content gone. The broken plate under the shot is the arena piece the boss has broken.
Result: no lock broken, no retake.

## BOSS 3, viewed once beside BASE-BOSS at 20:42Z (take 1, 33 s, prompt 4024 characters, two input images)
Lock facts:
- Straight on: the page, the header, the rail and the health bar are flat and unskewed, with no vanishing point: holds. The walls, the pillars and three glass slabs are drawn as raised pieces that show their near sides, the same way the real page draws the boss and its shield.
- Same world: ceramic walls with aluminum caps, frosted glass slabs, aluminum and orange boss, light from the upper left: holds. Thin orange light shows in the floor cracks.
- Header title, rail, health bar with its label: holds. Cursor: same size and place: holds.
- Would pass as this site beside the real one: yes, as a page with things standing on it.
Not locks, said plainly:
- The boss is about a third larger, has a wide curved glass shield and a short heavy cannon on its back, and stands on four jointed legs with claws.
- Four corner cannons. Two pillars are broken with rubble beside them.
- One glass slab stands across the health bar and hides a short piece of it.
Result: no lock broken, no retake.

## BOSS 4, viewed once beside BASE-BOSS at 20:43Z (take 1, 33 s, prompt 4190 characters, two input images)
Lock facts:
- Straight on: the page, header, rail and health bar are flat and unskewed, no vanishing point: holds. Arena pieces are low blocks and glass panels seen from above.
- Same world: the page is the same ceramic under a dropped light, so it reads warm grey brown and not pale; aluminum, frosted glass with a green cast, orange plastic light strips at the left and right edges; shadows still fall down and to the right: holds as the brief asks ("the light drops, things glow").
- Header title, rail, health bar with its label: holds. Cursor: same size and place: holds.
- Would pass as this site beside the real one: yes, as the same page with its light turned down.
Not locks, said plainly:
- The boss is the same size as today. New on it: a wide curved glass shield in front of the old small one, and a heavy multi-barrel cannon on its back.
- Four corner cannons. Small square lamps glow white along a low wall; two glass panels are smashed.
- The step heading is gone; the health bar stays.
Result: no lock broken, no retake.

## BOSS 5, viewed once beside BASE-BOSS at 20:43Z (take 1, 32 s, prompt 4332 characters, two input images)
Lock facts:
- Straight on: the page, header, step heading, rail and health bar are flat and unskewed: holds. The arena is a well sunk into the page with an aluminum rim, seen from above the way the pinball cabinet is; its inner walls show as a sunk tray's would.
- Same world: pale ceramic page, aluminum rim and boss, frosted glass panels and shield, orange plastic button and cannon bands, light from the upper left: holds. The floor of the well is dark tile with small warm lamps.
- Header title, rail, health bar with its label: holds. Cursor: same size and place: holds.
- Would pass as this site beside the real one: yes; the page around the well is unchanged.
- Not a lock: the step heading "Step 4: Submit" is kept above the health bar.
Not locks, said plainly:
- The boss is about a third larger with a long cannon on its back; its clawed legs reach out of the well and crack the page. Its Submit button is smaller than today's.
- Four corner cannons on round bases. One glass panel in the well is smashed.
Result: no lock broken, no retake.

## BOSS 6, viewed once beside BASE-BOSS at 20:43Z (take 1, 33 s, prompt 4299 characters, two input images)
Lock facts:
- Straight on: the page, header, rail and health bar are flat and unskewed, no vanishing point: holds. The page is broken into slabs with orange light in the gaps. Tall aluminum pillars and glass panels stand on it and show their sides, the way the real page draws raised things; this is the most depth of the six.
- Same world: pale ceramic, brushed aluminum, frosted glass, orange plastic: holds. Light: shadows fall down and to the right as on the real page, but they are much longer and darker because the pillars are tall, and the cannon blast adds its own orange glow. This is the lock under the most strain; the direction holds.
- Header title and rail: holds. Health bar: there, with its label moved above the bar and the bar fuller and brighter than the real one. Cursor: same size and place: holds.
- Would pass as this site beside the real one: yes at the far end; header, rail, type, materials and cursor are the site's.
Not locks, said plainly:
- The picture is not dark. The prompt asked for the light to be at its lowest; the page stayed pale.
- The boss stands in the middle of the page, a little larger than today, and fires a wide blast from its back cannon to the right that is breaking a pillar.
- Four corner cannons. Form content gone.
Result: no lock broken, no retake.

## PAGE 2, viewed once beside BASE-PAGE at 20:43Z (take 1, 33 s, prompt 3455 characters, two input images)
Lock facts:
- Straight on, flat: holds. Same world: ceramic page, orange plastic buttons, aluminum medals, frosted glass ticker strip, light from the upper left: holds.
- Same type, header and hero words; the header is the real one unchanged: holds. Cursor: same size and place: holds.
- Would pass as this site beside the real one: yes.
Not locks, said plainly:
- The hero was asked to be centred; it stayed at the left exactly as on the real page, with the right half empty.
- Under it: the heading "Awards We Definitely Earned" and a row of five small medals, each with its name and giver below.
- The ticker is a glass strip at the foot at the page's content width, not the full width.
- The navigation is the real page's, with no new bar.
Result: no lock broken, no retake.

## PAGE 3, viewed once beside BASE-PAGE at 20:44Z (take 1, 32 s, prompt 3561 characters, two input images)
Lock facts:
- Straight on, flat: holds. Same world: ceramic page, one frosted glass panel, orange plastic buttons, glass ticker strip, light from the upper left: holds.
- Same type; the header is the real one unchanged: holds. Cursor: same size, beside the Apply button at the button's new place lower on the page: holds.
- Would pass as this site beside the real one: yes.
Not locks, said plainly:
- Split screen: the headline larger in four lines at the left with the subline, button and its small line under it; at the right the comparison table "Us vs. Functional Employers" in one glass panel, five rows.
- Words checked against the locked copy: all match but one. The table shows Flexible without the quotation marks the copy has around it.
- The ticker is a glass strip at the foot at the page's content width, not the full width. No medal on this screen.
Result: no lock broken, no retake.

## PAGE 4, viewed once beside BASE-PAGE at 20:44Z (take 1, 33 s, prompt 3594 characters, two input images)
Lock facts:
- Straight on, flat: holds. Same world: ceramic page, orange plastic buttons, three small aluminum studs, glass ticker strip, light from the upper left: holds.
- Same type; the header is the real one unchanged: holds. Cursor: same size, at the right of the Apply button, which now sits at the right of the long subline: holds.
- Would pass as this site beside the real one: yes.
Not locks, said plainly:
- The headline runs wide in two lines; under it the long subline at the left and the Apply button at the right; a thin rule; then three columns with a stud each: "Benefits That Sound Too Good To Be True", "Awards We Definitely Earned", "What They Said", each with its own subline from the locked copy.
- Words checked against the locked copy: all match.
- No glass cards and no medal on this screen. The ticker is a glass strip at the foot at the page's content width.
Result: no lock broken, no retake.

## Sum at 20:44Z
Ten images, one take each, no retake. Every lock holds in every image as a fact; BOSS 6 holds the light lock by direction only and is said so. Misses that are not locks are listed per code.
