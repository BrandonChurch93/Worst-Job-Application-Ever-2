# Round 3, unit `step1`: the first round of the look lock

Judged commit: cacc69d (the tenth merge). Started 2026-11-25T15:44Z. Packs at the review tier. The last answer came by 16:38Z. Keys released 16:44Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the two keys beside the approved images, whole and in crops | Claude | 4 | 3 | 7 | 2 |
| R1-2 | the three cursor sheets beside the approved sheets | GLM | 5 | 8 | 15 | 0 |
| R2 | jury of 25, one picture each | GPT, Claude, GLM, Kimi | passes by the rule | | | |
| R3-1 | surface and detail, real-size crops | GPT | 6 | 1 | 6 | 0 |
| R4-1 | motion across the seven beats and the page turn | GPT | 7 | 0 | 4 | 0 |
| R4-2 | motion across four hits | Kimi | 4 | 2 | 2 | 1 |
| R8-1 | the page as a web page | Kimi | 6 | 1 | 1 | 2 |
| R9-1 | acting, one sheet a beat, read with no words | GLM | 5 | 1 | 6, and 4 "did not read" | 0 |
| R9-2 | acting, one sheet a state, read with no words | Claude | 6 | 0 | 5, and 5 "did not read" | 2 |

Measures on cacc69d: 8 green, 0 red (M2 0.0141, M3 1.1237, M4 smallest type 18 px, least contrast 4.64, M5 0 px, M6 0 px, M7 3 events and 0 misses, M9 0 px).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest scores are 4 (R1-1, R4-2).

## R2, the jury

Judged: `step1-fire` d d d d d; `step1-tug` c c c c c; the sheet `page-look` d d d d d. Controls: approved `step1-fire` c d c d c; approved `step1-tug` c c c c c. The share of (a) and (b) is 0 of 15 on the judged pictures and 0 of 10 on the controls, so R2 passes by its rule (judged share no lower than the control share less 0.2). What the rule does not see: the build's two pictures from the home camera drew (d), "a web 3D demo, a mobile game or a low-budget app", from all ten of their jurors; the approved key from the same camera drew (d) from two of five. The jurors' words on the judged pictures: a web form with a cursor, a flat interface, a stylized on-screen keyboard.

## R9, the reads against what the beats mean

Read as meant: the last name (flustered, persistent), the email (what happened; the dives read as backing away), the tug as a beat (alarmed and straining), shocked, exhausted. Did not read: confident (read as tentative, and as calm and hesitating), the hit of the first name (the burn hole is not in the read), proud (read as cautious hope, and as shaken but relieved), the reassembly (that the cursor itself was cut and zipped back is not in the read), nervous (read as panic), scared (read as wary), angry in the tug (the arms read as a cable wrapped round the arrow). One critic read the arms as bent legs with feet.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R1-1, severe: a flush slit in place of the shredder. kit/02 has things come out of the page, M9 measures it.
2. R1-1, severe: the whole page in the tug's frame. The cursor's size comes from the config and the camera pushes in (kit/02).
3. R8-1, severe, in one half: a constant page scale in the tug. The same line. Its other half, words of the field column cut at the frame's edge, is open and with the tug fixer.
4. R1-2, three severe: the captions of the approved sheets. The approved sheets' own words are not copy.
5. R9-1, severe, the fix only: "Keep the cursor appendage-free". The arms are approved and stated. The fault it names, arms that read as legs, stays open as severe.

## Where the open issues went

- The tug fixer (`/root/tug_fixer`, started 16:42Z): the resume at the cursor's scale, the slot and the shredder at that scale and seated in the page, arms that read as arms and hold only the paper, the five poses of the arms sheet, the tug's camera (strips in frame, no cut word), the strain and the anger in the tug, pride before it. R1-1 issues 3 and 4; R1-2 issues 4, 5, 9, 10 and the shadows of 11; R3-1 issues 4 and 7; R4-1 issue 3; R8-1 issue 1; R9-1 issues 1 and 6; R9-2 issue 5 and its "did not read" on B-05 and B-06.
- The acting fixer (to start when a build slot frees, at about 17:58Z): every other issue of R9-1 and R9-2 (anticipation, squash on a hit, a held reaction to each slab, the hit staged where it reads, the heap that keeps the arrow's shape, the strips of the arrow apart from the paper's, 14 to 16 strips), and R4-2 issue 2 (the hit is not legible).
- The Builder, on the page: the page's grain reads as stucco or plaster (R1-1 issue 8, R1-2 issues 1 to 3), the drop zone's glass reads as an opaque grey panel (R1-1 issue 9, R3-1 issue 1), the field wells' rims are heavy and dark (R1-1 issue 10), the Browse button has no socket (R3-1 issue 6), the orange is too glossy and red and the steel too dark (R1-1 issue 11), the missing upload icon was fixed before the round ended, the stray glyph between Q and W (R8-1 issue 2), the words on the red blocks cut by their own rock (R4-2 issue 1: fixed in e100e0f), the page turn that never seats (R4-1 issue 4: built in 662509e).
- A page and keyboard fixer when a slot frees: the key shuffle as spring launches with hard stops (R4-1 issue 1), keys that go down and spring back and a page that answers a hit (R4-1 issue 2, R4-2 issues 3 and 4), the arrow's and the keys' smudged look in the fire key (R1-1 issues 5 and 6), flying caps' shadows.
- A cursor damage fixer when a slot frees: R1-2 issues 11 to 23 and R3-1 issues 2, 3 and 5 (holes with a lit wall, cracks that split the surface, clear tape, a scorch crust, an opaque scared face, sweat on the face, a melt that slumps as one, the sidewall that reads as an outline).

## Minor issues not acted on, and why

- R1-1 issue 12 and R8-1 issue 3: Continue is grey. It is the disabled state of the page's action and turns orange when the form is complete.
- R8-1 issue 4: the keyboard covers Continue while it is up. kit/02 docks the keyboard along the bottom; Continue is disabled until the keyboard has sunk.
- R4-2 issue 5: the Enter lamp never changes. Left for the keyboard fixer if time allows.
- R9-2 issue 6: the arrow is larger in the tug's sheet than in the others. The camera pushes in for that beat.
- R9-2 issue 7: the dodging repeats. With the acting fixer.

## What the Builder saw that no critic named

- The resume is three times the arrow's height; in the approved picture it is narrower than the arrow is tall. Ruled: the sheet takes the cursor's scale (with the tug fixer).
- The far soft shadows smudge during the page turn.
- At sheet scale a hit cannot be read: the sheets of a hit are now windows of the picture round the hit at its real size (e9a4849).
- The page-turn sheet of the round showed the old eased turn.

## What changes next

The tug fixer's first version is due at about 17:50Z. The Builder works the page's surface. Round 4 judges what is merged by about 18:00Z, after `npm run clock` prints whether an extra round may start.
