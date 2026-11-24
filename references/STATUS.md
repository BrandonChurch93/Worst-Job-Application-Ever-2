# References · what is approved, what is rejected, what is pending

Brandon approves pictures before anything is built. This file is the record. It is updated after every reference round.

When the set is complete, the approved images are copied to `references/approved/` with a `MANIFEST.sha256`. Until that folder exists, no build may start.

## Approved

| What | Image | What it settles | What it does not settle |
| --- | --- | --- | --- |
| The page look | `references/drafts/round-3/P1-soft-touch-ceramic.png` | Materials, color, type, the header and progress bar, the weight of the shadows, the straight-on view | The fields on it. Step 1 now has First name, Last name and Email, and no salary slider |
| The cursor's arms | `references/drafts/round-3/C1-arms.png` | Thin matte black rubber arms with small simple hands | The camera. The sheet was shot at an angle. And the arms appear in one beat only |
| The cursor's damage | `references/drafts/round-3/C4-damage.png` | Shredded, reassembled, scorched, punched, flattened | How long it lasts. Damage heals in seconds |
| The tug of war | `references/drafts/round-3/S1-shredder-tug-of-war.png` | The shredder slot, the pose, the paper | The cursor's size. It is larger here than on the page. The camera pushes in. The cursor does not grow |
| The cursor's acting | `references/drafts/round-4/E1-cursor-emotions.png` | Sweat, the red tip and steam, the pale stony fear, the melted exhaustion, the laser hole | The lighting. It has window shadow bands, which are not the target. "Shocked" is only a taller arrow and comes from animation |
| The three machines | `references/drafts/round-4/D1-wrong-machines.png` | The look of the rotary dial, the slot machine and the hand crank. Also the clean lighting | The layout. The machines now appear one at a time, inside the row that was clicked |

## Rejected, and why

Read this before generating or building anything. Each of these was tried.

| Round | What was tried | Why it failed | The rule that came out of it |
| --- | --- | --- | --- |
| 1 | An angled camera with depth of field on "a page made of physical objects" | It produced 3D renders of a scene, not a web page a person could use | Straight on, sharp edge to edge, a real layout. The realism lives in the controls, not in the camera |
| 2 | Four looks: tactile modern, paper and ink, dark premium, retro hardware | Modern had the right design and looked flat. Paper and ink looked real and was retro. Dark and retro were not wanted | The modern design, with what made paper and ink real: one strong key light, parts with real height, a surface with grain |
| 3 | The cursor changing into cursor hands, and a hybrid with a hand on an arm | They came out as white cartoon gloves with cuffs | Arms only, in black rubber, and only for the tug of war. No gloves |
| 3 | Aluminum and cast resin page surfaces | Aluminum was cold and heavy. Resin was the same as ceramic with less grain | The ceramic surface |
| 4 | A pinball table built out of the form's own parts, twice | Sparse and generic. Nothing like a machine in an arcade | A real arcade machine, crowded and themed, in its own palette |
| 4 | The keyboard page | The keyboard sat in the middle, one field was huge, the others were pushed below. The turrets fired beams. The keyboard had no Backspace or other normal keys | Layout first. A complete keyboard docked at the bottom. Bolts that can be dodged |
| 4 | All three machines on the page at once | No context for any of them | Plain fields first. Click one and its machine appears. Every field says why it is asking |
| 4 | The Submit button running away among decoys | Replaced by a better idea | The Submit button becomes a boss with a health bar |
| 4 | The rejection page: one line of text on a glass slab and a stamp | Empty and unbalanced. Not a good looking page | A full two-column page: the letter, the metrics, one button |
| 4 | Window light falling across the page in three images | Inconsistent, and it reads less like an interface | Clean, even light |
| Idea | Turning the cursor into a ball for the pinball scene | A ball cannot act | It stays an arrow and gets batted around as itself |
| Idea | Damage that stays on the cursor for the whole film | Brandon wants cartoon rules | Damage heals in seconds |
| Idea | A face or eyes on the cursor | Brandon said no | It acts with its body |
| Idea | A lie detector page | Hard to pull off | One checkbox on the Submit page carries the robot joke |

## Pending

Two reference rounds are running. Their prompts were given to Computer on November 24.

| Round | Folder | Images |
| --- | --- | --- |
| 5, the pages | `references/drafts/round-5/` | M1 careers page. K1 step 1. D1, D2, D3 step 2 closed and open. B1, B2, B3 the boss. R1 the decision page |
| 6, the pinball machine | `references/drafts/round-6/` | G1 the master view from above. G2 player's eye. G3 the backbox. G4 to G8 close shots inside the machine |

After Brandon approves them:

1. This file is updated.
2. The approved set is copied to `references/approved/` and hashed.
3. The rest of the build kit is written against it.

## Not pictures, but still to approve

- The sound board: every effect and every narrator line, with takes. Made at the start of the build, approved before sound is built in.
- The narrator's lines in `content/narration.json`.
