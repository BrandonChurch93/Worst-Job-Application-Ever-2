# NEEDS: the arena's sounds for the sound batch

From b_arena_builder. Times are seconds of `view.time` (0 is `button-crack`, the Submit button breaking out); frames are film frames at 60 a second, counted from that 0. Who emits each event is STATED from the fight helper's code on agent/b-boss (`src/pages/step4/index.ts`, `src/boss/fight.ts`, `src/boss/tune.ts` CHANGE); what the picture does at each frame is MEASURED from `src/arena/layout.ts` (ARENA) and `src/arena/change.ts`.

## The scene change

| event | time | frame | what the picture does | the sound, and its length |
| --- | --- | --- | --- | --- |
| `page-crack` (the fight's `button-crack`) | 0.00 | 0 | Hairline cracks shoot out of the socket (done by 0.30) and race over the whole page along the lines of the seams (all drawn by 0.62, frame 37). | Dry ceramic cracking that runs away from the listener, no boom. 0.9 s, loudest in its first 0.15 s. |
| `arena-split` | 0.70 | 42 | The page's own ground is gone and the nine slabs lie there; the seams open from 0.70 to 1.15 (frame 69); dust jumps up along every seam within 6 frames and hangs to 2.6; the light from below surges. The strongest knock of the shake is on this frame. | A deep stone crack with a low thud under it and a hiss of dust after. 1.2 s, the hit on its first frame. |
| `arena-rise` | 1.00 | 60 | Pillars, panes and corner guns rise, each over 0.42 s, started one after another between 1.00 and 1.48; the last lands at 1.90 (frame 114). Each landing is a small knock of the shake. | Heavy metal sliding up out of stone, with a row of short locks as each thing seats. 1.0 s, the locks spread from 0.4 s to 0.9 s into the sound. |
| `healthbar-drop` | 2.10 | 126 | The bolted frame of the health bar falls from above the screen from 1.70 (frame 102) and lands at 2.12 (frame 127). The event marks the landing, not the start of the fall. | One metal clank with a short ring. 0.5 s, the hit on its first frame. If the batch wants the fall heard too, the event has to move to 1.70 and the hit sits 0.42 s into the sound: say which. |

The change is over at 2.40 (frame 144): from there the pillars and panes stop shots.

## The big cannon

| event | when | what the picture does | the sound, and its length |
| --- | --- | --- | --- |
| `cannon-warn` (the fight's `big-tell`) | when `boss.big.tell` starts to rise; the tell lasts 1.6 s (STATED, BIG.tell in the fight's tune.ts) | A line of light lies on the ground where the blast will go. It narrows from 195 px to 62 px and brightens with the tell, and it pulses faster toward the end. | A rising whine with a quickening tick. The brief names 0.8 s; the tell is 1.6 s, so either the sound is 1.6 s long or it starts 0.8 s before `big-fire`: the sound batch decides, the picture reads with both. |
| `arena-break` | at each blast (`breaks[].at`, the same step as `big-fire`) | Flash along the line for 0.24 s, the burst at its far end, sparks for 0.7 s, the trench with its embers, the slab's edge broken through at the far end, smoke for 1.7 s. | The blast's hit on the ground: a crack and a boom with falling grit. 1.3 s, the hit on its first frame. |
| `pane-shatter` | same step as its `arena-break`, once for each pane the blast breaks | The pane bursts: shards fly for 0.55 s and lie still after. | Sheet glass bursting, then pieces ringing on stone. 1.4 s, the burst on its first frame, the last piece down by 0.6 s. |
| `pillar-break` | same step as its `arena-break`, once for each pillar the blast breaks | The pillar snaps to a stump; rubble flies for 0.55 s; four of the eight pillars drop their upper part, which lies flat by 0.55 s. | Metal sheared through and a heavy piece hitting stone. 1.1 s, the shear on its first frame, the thud near 0.5 s. |

A shot stopped by a pillar or a pane (`hits` of kind `solid`) shows a glint for 0.18 s. It needs no sound of the arena: the fight's own `cover-hit` covers it (STATED, seen in the film's event list).

No `slab-break` event: no slab breaks as a whole by a rule the fight could compute.
