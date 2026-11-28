# Assets

Every file in this repo that the build did not make itself, and the terms of every tool whose output ships. `kit/06-ASSETS.md` has the rules.

## Approved images

Made in six reference rounds on 2026-11-23 and 2026-11-24 with the image tool of Perplexity Computer, and approved by Brandon. `references/STATUS.md` lists them, with the round each came from. Every round's images and notes are in `references/drafts/`.

## Words

Every word the site shows is in `content/copy.json`. Most of it is Brandon's own writing from his 2025 version of this idea. The narrator's lines in `content/narration.json` are a draft for him to approve.

## Generated images

The terms of each image model, read in Phase 0.

| Model | Source of the terms | Date read | Published video | Public website |
| --- | --- | --- | --- | --- |
| OpenAI GPT Image (`gpt_image_2_6_flare`, `gpt_image_2_6_sunburst`) | https://openai.com/policies/services-agreement/ and https://openai.com/policies/terms-of-use/ . Quotes: `references/terms/images-openai.md` | 2026-11-25 | Not clearly allowed. UNKNOWN: no sentence names commercial use, video or publication, and none forbids it. STATED: the customer owns all output and OpenAI assigns its rights in it. STATED: output may not be passed off as made by a human | Not clearly allowed. UNKNOWN, for the same reason |
| Google Gemini image (`nano_banana_2_1`, `nano_banana_pro`) | https://ai.google.dev/gemini-api/terms and https://cloud.google.com/terms/service-terms . Quotes: `references/terms/images-google.md` | 2026-11-25 | Not clearly allowed. UNKNOWN: no sentence grants commercial use or publication, and none forbids it. STATED: Google will not claim ownership of the content, which is less than saying the user owns it. STATED: every image carries an invisible SynthID mark | Not clearly allowed. UNKNOWN, for the same reason |
| ByteDance Seedream 5 (`seedream_5`). It made the approved images | https://docs.byteplus.com/en/docs/legal/AI-Services-terms . Quotes: `references/terms/images-bytedance.md` | 2026-11-25 | Not clearly allowed. UNKNOWN: the terms assume publication but no sentence grants commercial use, and how these terms reach a picture made through this workspace is not known, because the workspace's list of third-party models has no row for this maker. STATED for a direct customer: the customer owns the output. STATED: AI labels in the output may not be removed or hidden | Not clearly allowed. UNKNOWN, for the same reason |
| Perplexity, the product every image model here is called through | https://www.perplexity.ai/hub/legal/enterprise-terms-of-service , https://www.perplexity.ai/hub/legal/terms-of-service and https://www.perplexity.ai/hub/legal/third-party-models . Quotes: `references/terms/images-perplexity.md` | 2026-11-25 | Not clearly allowed. UNKNOWN: no sentence in either agreement names commercial use or publication, and which agreement covers this account is not known. STATED in the Enterprise terms: the customer owns all output and Perplexity assigns its rights in it. STATED: the source of an output and the fact that AI made it may not be misrepresented, and marks that identify it as generated may not be removed | Not clearly allowed. UNKNOWN, for the same reason |

What follows from the table. No model's terms clearly allow both uses in so many words, and none forbids either. Ownership is stated most plainly for the OpenAI models, at both links of the chain (the maker's terms and the Enterprise terms of the product they are called through), so new pictures that feed shipped files are made with those models where they can do the job. Nothing approved is swapped, made again or dropped because of this. The question for the approved images is listed under "For Brandon to decide" in `kit/PROGRESS.md`.

### Generated pictures that feed shipped files

Each has its recipe, with the full prompt, beside it. None shows a person, a hand, a face, an animal, text or a logo.

| Picture | What it feeds | Model | Reference image | Takes | Recipe | Date |
| --- | --- | --- | --- | --- | --- | --- |

## Generated sounds

The terms of the sound tool, read in Phase 0. Each line is marked as stated by the terms, measured, or unknown.

| Point | What the terms say | Marked as | Source | Date read |
| --- | --- | --- | --- | --- |
| The plan | This account is on the Creator plan. Paid plans carry a commercial license, provided no beta service is used | Measured (the plan, read from the account). Stated by the terms (the license) | https://elevenlabs.io/pricing and https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform . Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |
| 1. Published inside a film and inside a website: sound effects | Allowed inside a film: output may be used "by incorporating it into films, trailers, advertising, video, games, applications, and other productions", for commercial purposes where the plan permits, and "only in respect of Output combined with other material". No page uses the word website. The nearest words are "applications, and other productions" | Stated by the terms for a film. Unknown for a website in so many words | https://elevenlabs.io/creative-terms (Exhibit 4, section 2). Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |
| 1. Published inside a film and inside a website: speech in the saved voice | No terms specific to speech or to a designed voice exist. The general rule: a paid user "may use the Services for commercial purposes", output may be used outside the service, and the user keeps all rights in it. One help article calls voice design "still experimental", and beta services may not be used commercially. No page says whether voice design is a beta service | Unknown in so many words. Stated by the terms only as the general rule | https://elevenlabs.io/terms-of-use , https://elevenlabs.io/bsa and https://elevenlabs.io/docs/help-center/product/voices/voice-design/what-is-voice-design . Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |
| 2. Kept as separate files in a public repository: sound effects | Not allowed: "you may not sell, resell, license, sublicense, distribute, or otherwise commercially exploit Output, or any part of it, on a standalone basis, or make Output available as isolated audio files or samples, or as part of any sound, sample, effects, or music library or other collection of sounds." The terms do not name repositories. The rule covers isolated audio files in general, so it also covers a site that serves each effect at an address of its own | Stated by the terms | https://elevenlabs.io/creative-terms (Exhibit 4, section 2). Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |
| 2. Kept as separate files in a public repository: speech | No rule on standalone speech files was found. Related rules: output may not be passed on to others on terms more permissive than the user's own, and may not be put in a dataset used for AI training | Unknown | https://elevenlabs.io/use-policy . Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |
| 2. Where the files live in this build | The repo was measured public, so no generated sound file is committed. The site ships its short sounds as one packed file with an index | Measured | `kit/PROGRESS.md`, "Status" | 2026-11-25 |
| 3. A video posted by a company on social media | Commercial use on a paid plan is allowed, and the terms bind a company as well as a person. Sound effects: the terms name "advertising" and "video", and paid plans need no attribution. Speech: whether attribution is needed on a paid plan is not said in so many words ("subject to the agreement you have"). Limits: no deceptive advertising, no implied endorsement, no political campaigning without consent, no use of the tool's name or marks without consent, and AI use is disclosed where the law requires it or where silence would mislead | Stated by the terms for commercial use, for sound effects and for the limits. Unknown for attribution on speech | https://elevenlabs.io/terms-of-use , https://elevenlabs.io/creative-terms , https://elevenlabs.io/sound-effects/commercial and https://elevenlabs.io/use-policy . Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |
| Music, for the record | This build generates no music with this tool. On this plan its music terms exclude film, TV and radio and are for individual use only | Stated by the terms | https://elevenlabs.io/music-terms . Quotes: `references/terms/sound-elevenlabs.md` | 2026-11-25 |

### Kept sounds

One row for each kept sound and for each sound file the site ships, copied from `audio/ASSETS-ROWS.md`, which `npm run sound` writes. The sound files themselves are not committed (see point 2 above); each record is.

| File | What it is | How it was made | Record |
| --- | --- | --- | --- |
| `audio/kept/arena-split.wav` | Sound effect `arena-split` | Generated with the sound tool, take 2 (change-002-layer) | `audio/kept/arena-split.json` |
| `audio/kept/arms-out.wav` | Sound effect `arms-out` | Generated with the sound tool, take 1 (build) | `audio/kept/arms-out.json` |
| `audio/kept/ball-drop.wav` | Sound effect `ball-drop` | Generated with the sound tool, take 1 (build) | `audio/kept/ball-drop.json` |
| `audio/kept/ball-open.wav` | Sound effect `ball-open` | Generated with the sound tool, take 1 (build) | `audio/kept/ball-open.json` |
| `audio/kept/ball-seal.wav` | Sound effect `ball-seal` | Generated with the sound tool, take 1 (build) | `audio/kept/ball-seal.json` |
| `audio/kept/big-fire.wav` | Sound effect `big-fire` | Generated with the sound tool, take 3 (change-002-layer) | `audio/kept/big-fire.json` |
| `audio/kept/bolt-fire.1.wav` | Sound effect `bolt-fire`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/bolt-fire.1.json` |
| `audio/kept/bolt-fire.2.wav` | Sound effect `bolt-fire`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/bolt-fire.2.json` |
| `audio/kept/bolt-fire.3.wav` | Sound effect `bolt-fire`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/bolt-fire.3.json` |
| `audio/kept/bolt-hit.1.wav` | Sound effect `bolt-hit`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/bolt-hit.1.json` |
| `audio/kept/bolt-hit.2.wav` | Sound effect `bolt-hit`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/bolt-hit.2.json` |
| `audio/kept/bolt-hit.3.wav` | Sound effect `bolt-hit`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/bolt-hit.3.json` |
| `audio/kept/boss-gone.wav` | Sound effect `boss-gone` | Generated with the sound tool, take 1 (change-002-layer) | `audio/kept/boss-gone.json` |
| `audio/kept/boss-heal.wav` | Sound effect `boss-heal` | Generated with the sound tool, take 2 (change-002-layer) | `audio/kept/boss-heal.json` |
| `audio/kept/boss-loop.wav` | Sound effect `boss-loop` | Generated with the sound tool, take 1 (build) | `audio/kept/boss-loop.json` |
| `audio/kept/bumper.1.wav` | Sound effect `bumper`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/bumper.1.json` |
| `audio/kept/bumper.2.wav` | Sound effect `bumper`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/bumper.2.json` |
| `audio/kept/bumper.3.wav` | Sound effect `bumper`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/bumper.3.json` |
| `audio/kept/bumper.4.wav` | Sound effect `bumper`, variant 4 | Generated with the sound tool, take 1 (build) | `audio/kept/bumper.4.json` |
| `audio/kept/button-burst.wav` | Sound effect `button-burst` | Generated with the sound tool, take 3 (change-002-layer) | `audio/kept/button-burst.json` |
| `audio/kept/button-crack.wav` | Sound effect `button-crack` | Generated with the sound tool, take 2 (build) | `audio/kept/button-crack.json` |
| `audio/kept/button-down.wav` | Sound effect `button-down` | Generated with the sound tool, take 1 (change-002-layer) | `audio/kept/button-down.json` |
| `audio/kept/button-press.wav` | Sound effect `button-press` | Generated with the sound tool, take 1 (build) | `audio/kept/button-press.json` |
| `audio/kept/cannon-fire.wav` | Sound effect `cannon-fire` | Generated with the sound tool, take 2 (change-002-layer) | `audio/kept/cannon-fire.json` |
| `audio/kept/cannon-tell.wav` | Sound effect `cannon-tell` | Generated with the sound tool, take 1 (change-002) | `audio/kept/cannon-tell.json` |
| `audio/kept/card-flip.wav` | Sound effect `card-flip` | Generated with the sound tool, take 1 (build) | `audio/kept/card-flip.json` |
| `audio/kept/carpet-roll.wav` | Sound effect `carpet-roll` | Generated with the sound tool, take 1 (build) | `audio/kept/carpet-roll.json` |
| `audio/kept/checkbox.wav` | Sound effect `checkbox` | Generated with the sound tool, take 1 (build) | `audio/kept/checkbox.json` |
| `audio/kept/coins.1.wav` | Sound effect `coins`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/coins.1.json` |
| `audio/kept/coins.2.wav` | Sound effect `coins`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/coins.2.json` |
| `audio/kept/crank-runaway.wav` | Sound effect `crank-runaway` | Generated with the sound tool, take 1 (build) | `audio/kept/crank-runaway.json` |
| `audio/kept/crank-turn.wav` | Sound effect `crank-turn` | Generated with the sound tool, take 1 (build) | `audio/kept/crank-turn.json` |
| `audio/kept/dart-fire.1.wav` | Sound effect `dart-fire`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-fire.1.json` |
| `audio/kept/dart-fire.2.wav` | Sound effect `dart-fire`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-fire.2.json` |
| `audio/kept/dart-fire.3.wav` | Sound effect `dart-fire`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-fire.3.json` |
| `audio/kept/dart-fire.4.wav` | Sound effect `dart-fire`, variant 4 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-fire.4.json` |
| `audio/kept/dart-hit.1.wav` | Sound effect `dart-hit`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-hit.1.json` |
| `audio/kept/dart-hit.2.wav` | Sound effect `dart-hit`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-hit.2.json` |
| `audio/kept/dart-hit.3.wav` | Sound effect `dart-hit`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/dart-hit.3.json` |
| `audio/kept/dart-hit.4.wav` | Sound effect `dart-hit`, variant 4 | Generated with the sound tool, take 3 (build) | `audio/kept/dart-hit.4.json` |
| `audio/kept/date-miss.wav` | Sound effect `date-miss` | Generated with the sound tool, take 1 (change-002) | `audio/kept/date-miss.json` |
| `audio/kept/dial-fling.wav` | Sound effect `dial-fling` | Generated with the sound tool, take 1 (build) | `audio/kept/dial-fling.json` |
| `audio/kept/dial-return.wav` | Sound effect `dial-return` | Generated with the sound tool, take 1 (build) | `audio/kept/dial-return.json` |
| `audio/kept/dial-wind.wav` | Sound effect `dial-wind` | Generated with the sound tool, take 1 (build) | `audio/kept/dial-wind.json` |
| `audio/kept/doors-slam.wav` | Sound effect `doors-slam` | Generated with the sound tool, take 1 (build) | `audio/kept/doors-slam.json` |
| `audio/kept/drain.wav` | Sound effect `drain` | Generated with the sound tool, take 1 (build) | `audio/kept/drain.json` |
| `audio/kept/drop-target.1.wav` | Sound effect `drop-target`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/drop-target.1.json` |
| `audio/kept/drop-target.2.wav` | Sound effect `drop-target`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/drop-target.2.json` |
| `audio/kept/finish-arms.wav` | Sound effect `finish-arms` | Generated with the sound tool, take 1 (change-002-layer) | `audio/kept/finish-arms.json` |
| `audio/kept/finish-fist.wav` | Sound effect `finish-fist` | Generated with the sound tool, take 1 (change-002-layer) | `audio/kept/finish-fist.json` |
| `audio/kept/finish-kneel.wav` | Sound effect `finish-kneel` | Generated with the sound tool, take 1 (change-002-layer) | `audio/kept/finish-kneel.json` |
| `audio/kept/finish-walk.wav` | Sound effect `finish-walk` | Generated with the sound tool, take 1 (change-002-layer) | `audio/kept/finish-walk.json` |
| `audio/kept/firehouse-take.wav` | Sound effect `firehouse-take` | Generated with the sound tool, take 1 (build) | `audio/kept/firehouse-take.json` |
| `audio/kept/flasher.wav` | Sound effect `flasher` | Generated with the sound tool, take 1 (build) | `audio/kept/flasher.json` |
| `audio/kept/flatten.wav` | Sound effect `flatten` | Generated with the sound tool, take 1 (build) | `audio/kept/flatten.json` |
| `audio/kept/flipper-save.wav` | Sound effect `flipper-save` | Generated with the sound tool, take 1 (build) | `audio/kept/flipper-save.json` |
| `audio/kept/flipper.1.wav` | Sound effect `flipper`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/flipper.1.json` |
| `audio/kept/flipper.2.wav` | Sound effect `flipper`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/flipper.2.json` |
| `audio/kept/flipper.3.wav` | Sound effect `flipper`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/flipper.3.json` |
| `audio/kept/folder-open.wav` | Sound effect `folder-open` | Generated with the sound tool, take 1 (change-002) | `audio/kept/folder-open.json` |
| `audio/kept/healthbar-drop.wav` | Sound effect `healthbar-drop` | Generated with the sound tool, take 1 (change-002) | `audio/kept/healthbar-drop.json` |
| `audio/kept/hold-music.wav` | Sound effect `hold-music` | Generated with the sound tool, take 1 (build) | `audio/kept/hold-music.json` |
| `audio/kept/inbox-take.wav` | Sound effect `inbox-take` | Generated with the sound tool, take 1 (build) | `audio/kept/inbox-take.json` |
| `audio/kept/key-press.1.wav` | Sound effect `key-press`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/key-press.1.json` |
| `audio/kept/key-press.2.wav` | Sound effect `key-press`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/key-press.2.json` |
| `audio/kept/key-press.3.wav` | Sound effect `key-press`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/key-press.3.json` |
| `audio/kept/key-press.4.wav` | Sound effect `key-press`, variant 4 | Generated with the sound tool, take 1 (build) | `audio/kept/key-press.4.json` |
| `audio/kept/key-press.5.wav` | Sound effect `key-press`, variant 5 | Generated with the sound tool, take 1 (build) | `audio/kept/key-press.5.json` |
| `audio/kept/key-press.6.wav` | Sound effect `key-press`, variant 6 | Generated with the sound tool, take 1 (build) | `audio/kept/key-press.6.json` |
| `audio/kept/key-tap.wav` | Sound effect `key-tap` | Generated with the sound tool, take 1 (build) | `audio/kept/key-tap.json` |
| `audio/kept/keyboard-rise.wav` | Sound effect `keyboard-rise` | Generated with the sound tool, take 1 (build) | `audio/kept/keyboard-rise.json` |
| `audio/kept/keys-break.wav` | Sound effect `keys-break` | Generated with the sound tool, take 3 (change-002-layer) | `audio/kept/keys-break.json` |
| `audio/kept/keys-shuffle.wav` | Sound effect `keys-shuffle` | Generated with the sound tool, take 1 (build) | `audio/kept/keys-shuffle.json` |
| `audio/kept/letter-drop.wav` | Sound effect `letter-drop` | Generated with the sound tool, take 1 (build) | `audio/kept/letter-drop.json` |
| `audio/kept/lever-pull.wav` | Sound effect `lever-pull` | Generated with the sound tool, take 1 (build) | `audio/kept/lever-pull.json` |
| `audio/kept/lift.wav` | Sound effect `lift` | Generated with the sound tool, take 1 (build) | `audio/kept/lift.json` |
| `audio/kept/lights-down.wav` | Sound effect `lights-down` | Generated with the sound tool, take 1 (build) | `audio/kept/lights-down.json` |
| `audio/kept/line.boss.unfold.0.wav` | Narrator line: The applicant / is ready to give up. / There is no salary listed. / No guarantee / their resume / makes it past the ATS. / Their hand moves / to close the Chrome tab. | Generated with the sound tool, take 1 (script-003) | `audio/kept/line.boss.unfold.0.json` |
| `audio/kept/line.boss.unfold.1.wav` | Narrator line: But then / they remember / their student loans. | Generated with the sound tool, take 1 (script-003) | `audio/kept/line.boss.unfold.1.json` |
| `audio/kept/line.boss.unfold.2.wav` | Narrator line: They turn back. / One more round. | Generated with the sound tool, take 1 (script-003) | `audio/kept/line.boss.unfold.2.json` |
| `audio/kept/line.boss.verify.0.wav` | Narrator line: They declare themselves human. / The form / takes that as a threat. | Generated with the sound tool, take 2 (script-003) | `audio/kept/line.boss.verify.0.json` |
| `audio/kept/line.decision.letter.0.wav` | Narrator line: After careful consideration, / the company / has decided / to move forward / with other candidates. | Generated with the sound tool, take 2 (script-003) | `audio/kept/line.decision.letter.0.json` |
| `audio/kept/line.decision.reset.0.wav` | Narrator line: On to / the next application. | Generated with the sound tool, take 2 (script-003) | `audio/kept/line.decision.reset.0.json` |
| `audio/kept/line.marketing.stroll.0.wav` | Narrator line: Ahh. / Here we have / another job applicant. / Desperately hoping / to pay their rent. / Poor fool. / They must have forgotten / it is 2026. | Generated with the sound tool, take 2 (script-003) | `audio/kept/line.marketing.stroll.0.json` |
| `audio/kept/line.pinball.seal.0.wav` | Narrator line: The company / gently collects / the applicant / for an unpaid assessment. | Generated with the sound tool, take 2 (script-003) | `audio/kept/line.pinball.seal.0.json` |
| `audio/kept/line.step1.firstName.0.wav` | Narrator line: The application / has sensed / a candidate. / ATS turrets rise. | Generated with the sound tool, take 2 (script-003) | `audio/kept/line.step1.firstName.0.json` |
| `audio/kept/line.step1.shredded.0.wav` | Narrator line: The applicant / need not worry / about the shredded resume. / They will have to type it all in / by hand / anyway. | Generated with the sound tool, take 1 (script-003) | `audio/kept/line.step1.shredded.0.json` |
| `audio/kept/line.step2.crank.0.wav` | Narrator line: The applicant / must turn the volume / all the way up. | Generated with the sound tool, take 4 (script-003) | `audio/kept/line.step2.crank.0.json` |
| `audio/kept/line.step2.crank.1.wav` | Narrator line: They will regret that. | Generated with the sound tool, take 1 (script-003) | `audio/kept/line.step2.crank.1.json` |
| `audio/kept/metrics-card.wav` | Sound effect `metrics-card` | Generated with the sound tool, take 1 (build) | `audio/kept/metrics-card.json` |
| `audio/kept/page-turn.wav` | Sound effect `page-turn` | Generated with the sound tool, take 2 (build) | `audio/kept/page-turn.json` |
| `audio/kept/paper-slide.wav` | Sound effect `paper-slide` | Generated with the sound tool, take 1 (build) | `audio/kept/paper-slide.json` |
| `audio/kept/paper-strain.wav` | Sound effect `paper-strain` | Generated with the sound tool, take 1 (build) | `audio/kept/paper-strain.json` |
| `audio/kept/peel-up.wav` | Sound effect `peel-up` | Generated with the sound tool, take 1 (build) | `audio/kept/peel-up.json` |
| `audio/kept/pin-bell.wav` | Sound effect `pin-bell` | Generated with the sound tool, take 1 (change-002) | `audio/kept/pin-bell.json` |
| `audio/kept/pin-bumper.wav` | Sound effect `pin-bumper` | Generated with the sound tool, take 1 (change-002) | `audio/kept/pin-bumper.json` |
| `audio/kept/pin-coins.wav` | Sound effect `pin-coins` | Generated with the sound tool, take 1 (change-002) | `audio/kept/pin-coins.json` |
| `audio/kept/pin-frenzy.wav` | Sound effect `pin-frenzy` | Generated with the sound tool, take 2 (change-002-layer) | `audio/kept/pin-frenzy.json` |
| `audio/kept/pin-kick.wav` | Sound effect `pin-kick` | Generated with the sound tool, take 1 (change-002) | `audio/kept/pin-kick.json` |
| `audio/kept/pin-target.wav` | Sound effect `pin-target` | Generated with the sound tool, take 1 (change-002) | `audio/kept/pin-target.json` |
| `audio/kept/plunger.wav` | Sound effect `plunger` | Generated with the sound tool, take 1 (build) | `audio/kept/plunger.json` |
| `audio/kept/popup-close.wav` | Sound effect `popup-close` | Generated with the sound tool, take 2 (build) | `audio/kept/popup-close.json` |
| `audio/kept/popup.1.wav` | Sound effect `popup`, variant 1 | Generated with the sound tool, take 2 (build) | `audio/kept/popup.1.json` |
| `audio/kept/popup.2.wav` | Sound effect `popup`, variant 2 | Generated with the sound tool, take 2 (build) | `audio/kept/popup.2.json` |
| `audio/kept/popup.3.wav` | Sound effect `popup`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/popup.3.json` |
| `audio/kept/power-down.wav` | Sound effect `power-down` | Generated with the sound tool, take 1 (build) | `audio/kept/power-down.json` |
| `audio/kept/power-on.wav` | Sound effect `power-on` | Generated with the sound tool, take 1 (build) | `audio/kept/power-on.json` |
| `audio/kept/power-up.wav` | Sound effect `power-up` | Generated with the sound tool, take 2 (change-002-layer) | `audio/kept/power-up.json` |
| `audio/kept/ramp-roll.wav` | Sound effect `ramp-roll` | Generated with the sound tool, take 1 (build) | `audio/kept/ramp-roll.json` |
| `audio/kept/reel-stop.wav` | Sound effect `reel-stop` | Generated with the sound tool, take 1 (change-002) | `audio/kept/reel-stop.json` |
| `audio/kept/reels-spin.wav` | Sound effect `reels-spin` | Generated with the sound tool, take 1 (build) | `audio/kept/reels-spin.json` |
| `audio/kept/room-tone.wav` | Sound effect `room-tone` | Generated with the sound tool, take 1 (build) | `audio/kept/room-tone.json` |
| `audio/kept/row-close.wav` | Sound effect `row-close` | Generated with the sound tool, take 1 (change-002) | `audio/kept/row-close.json` |
| `audio/kept/row-open.wav` | Sound effect `row-open` | Generated with the sound tool, take 1 (build) | `audio/kept/row-open.json` |
| `audio/kept/scoop-kick.wav` | Sound effect `scoop-kick` | Generated with the sound tool, take 1 (build) | `audio/kept/scoop-kick.json` |
| `audio/kept/session-expired.wav` | Sound effect `session-expired` | Generated with the sound tool, take 3 (build) | `audio/kept/session-expired.json` |
| `audio/kept/shield-glance.wav` | Sound effect `shield-glance` | Generated with the sound tool, take 1 (change-002) | `audio/kept/shield-glance.json` |
| `audio/kept/shredder.wav` | Sound effect `shredder` | Generated with the sound tool, take 1 (build) | `audio/kept/shredder.json` |
| `audio/kept/sizzle.wav` | Sound effect `sizzle` | Generated with the sound tool, take 1 (build) | `audio/kept/sizzle.json` |
| `audio/kept/skip.wav` | Sound effect `skip` | Generated with the sound tool, take 1 (build) | `audio/kept/skip.json` |
| `audio/kept/slab-drop.1.wav` | Sound effect `slab-drop`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/slab-drop.1.json` |
| `audio/kept/slab-drop.2.wav` | Sound effect `slab-drop`, variant 2 | Generated with the sound tool, take 3 (build) | `audio/kept/slab-drop.2.json` |
| `audio/kept/slab-drop.3.wav` | Sound effect `slab-drop`, variant 3 | Generated with the sound tool, take 3 (build) | `audio/kept/slab-drop.3.json` |
| `audio/kept/slab-fire.1.wav` | Sound effect `slab-fire`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/slab-fire.1.json` |
| `audio/kept/slab-fire.2.wav` | Sound effect `slab-fire`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/slab-fire.2.json` |
| `audio/kept/slab-fire.3.wav` | Sound effect `slab-fire`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/slab-fire.3.json` |
| `audio/kept/slab-slam.wav` | Sound effect `slab-slam` | Generated with the sound tool, take 3 (change-002-layer) | `audio/kept/slab-slam.json` |
| `audio/kept/sling.1.wav` | Sound effect `sling`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/sling.1.json` |
| `audio/kept/sling.2.wav` | Sound effect `sling`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/sling.2.json` |
| `audio/kept/slot-in.wav` | Sound effect `slot-in` | Generated with the sound tool, take 1 (change-002) | `audio/kept/slot-in.json` |
| `audio/kept/spinner.wav` | Sound effect `spinner` | Generated with the sound tool, take 1 (build) | `audio/kept/spinner.json` |
| `audio/kept/spiral.wav` | Sound effect `spiral` | Generated with the sound tool, take 1 (build) | `audio/kept/spiral.json` |
| `audio/kept/stamp.wav` | Sound effect `stamp` | Generated with the sound tool, take 1 (build) | `audio/kept/stamp.json` |
| `audio/kept/step.1.wav` | Sound effect `step`, variant 1 | Generated with the sound tool, take 1 (build) | `audio/kept/step.1.json` |
| `audio/kept/step.2.wav` | Sound effect `step`, variant 2 | Generated with the sound tool, take 1 (build) | `audio/kept/step.2.json` |
| `audio/kept/step.3.wav` | Sound effect `step`, variant 3 | Generated with the sound tool, take 1 (build) | `audio/kept/step.3.json` |
| `audio/kept/step.4.wav` | Sound effect `step`, variant 4 | Generated with the sound tool, take 1 (build) | `audio/kept/step.4.json` |
| `audio/kept/stop-press.wav` | Sound effect `stop-press` | Generated with the sound tool, take 1 (change-002) | `audio/kept/stop-press.json` |
| `audio/kept/strips-zip.wav` | Sound effect `strips-zip` | Generated with the sound tool, take 2 (build) | `audio/kept/strips-zip.json` |
| `audio/kept/tier-fall.wav` | Sound effect `tier-fall` | Generated with the sound tool, take 1 (build) | `audio/kept/tier-fall.json` |
| `audio/kept/tube-run.wav` | Sound effect `tube-run` | Generated with the sound tool, take 1 (build) | `audio/kept/tube-run.json` |
| `audio/kept/tug-lost.wav` | Sound effect `tug-lost` | Generated with the sound tool, take 1 (build) | `audio/kept/tug-lost.json` |
| `audio/kept/turret-cannon.wav` | Sound effect `turret-cannon` | Generated with the sound tool, take 3 (change-002-layer) | `audio/kept/turret-cannon.json` |
| `audio/kept/turret-rise.wav` | Sound effect `turret-rise` | Generated with the sound tool, take 1 (build) | `audio/kept/turret-rise.json` |
| `audio/kept/ui-send.wav` | Sound effect `ui-send` | Generated with the sound tool, take 1 (build) | `audio/kept/ui-send.json` |
| `audio/kept/ui-tick.wav` | Sound effect `ui-tick` | Generated with the sound tool, take 1 (build) | `audio/kept/ui-tick.json` |
| `audio/kept/unfold.wav` | Sound effect `unfold` | Generated with the sound tool, take 1 (build) | `audio/kept/unfold.json` |
| `audio/kept/vacuum-gulp.wav` | Sound effect `vacuum-gulp` | Generated with the sound tool, take 2 (change-002-layer) | `audio/kept/vacuum-gulp.json` |
| `audio/kept/vacuum-roar.wav` | Sound effect `vacuum-roar` | Generated with the sound tool, take 1 (change-002) | `audio/kept/vacuum-roar.json` |
| `audio/kept/vacuum-slip.wav` | Sound effect `vacuum-slip` | Generated with the sound tool, take 1 (change-002) | `audio/kept/vacuum-slip.json` |
| `audio/kept/volume-sign.wav` | Sound effect `volume-sign` | Generated with the sound tool, take 1 (change-002) | `audio/kept/volume-sign.json` |

## What the site ships

| File | What it is | How it was made | Record |
| --- | --- | --- | --- |
| `public/audio/sfx.bin` | The 135 short sounds of the site in one file | Made by `npm run sound -- --pack` from the kept sounds of `audio/kept/` named in the index | `public/audio/index.json` |
| `public/audio/boss-loop.flac` | The site's copy of `boss-loop` | Made by `npm run sound -- --pack` from `audio/kept/boss-loop.wav` | `audio/kept/boss-loop.json` |
| `public/audio/room-tone.flac` | The site's copy of `room-tone` | Made by `npm run sound -- --pack` from `audio/kept/room-tone.wav` | `audio/kept/room-tone.json` |
| `public/audio/shredder.flac` | The site's copy of `shredder` | Made by `npm run sound -- --pack` from `audio/kept/shredder.wav` | `audio/kept/shredder.json` |
| `public/audio/line.boss.unfold.0.mp3` | The site's copy of `line.boss.unfold.0` | Made by `npm run sound -- --pack` from `audio/kept/line.boss.unfold.0.wav` | `audio/kept/line.boss.unfold.0.json` |
| `public/audio/line.boss.unfold.1.mp3` | The site's copy of `line.boss.unfold.1` | Made by `npm run sound -- --pack` from `audio/kept/line.boss.unfold.1.wav` | `audio/kept/line.boss.unfold.1.json` |
| `public/audio/line.boss.unfold.2.mp3` | The site's copy of `line.boss.unfold.2` | Made by `npm run sound -- --pack` from `audio/kept/line.boss.unfold.2.wav` | `audio/kept/line.boss.unfold.2.json` |
| `public/audio/line.boss.verify.0.mp3` | The site's copy of `line.boss.verify.0` | Made by `npm run sound -- --pack` from `audio/kept/line.boss.verify.0.wav` | `audio/kept/line.boss.verify.0.json` |
| `public/audio/line.decision.letter.0.mp3` | The site's copy of `line.decision.letter.0` | Made by `npm run sound -- --pack` from `audio/kept/line.decision.letter.0.wav` | `audio/kept/line.decision.letter.0.json` |
| `public/audio/line.decision.reset.0.mp3` | The site's copy of `line.decision.reset.0` | Made by `npm run sound -- --pack` from `audio/kept/line.decision.reset.0.wav` | `audio/kept/line.decision.reset.0.json` |
| `public/audio/line.marketing.stroll.0.mp3` | The site's copy of `line.marketing.stroll.0` | Made by `npm run sound -- --pack` from `audio/kept/line.marketing.stroll.0.wav` | `audio/kept/line.marketing.stroll.0.json` |
| `public/audio/line.pinball.seal.0.mp3` | The site's copy of `line.pinball.seal.0` | Made by `npm run sound -- --pack` from `audio/kept/line.pinball.seal.0.wav` | `audio/kept/line.pinball.seal.0.json` |
| `public/audio/line.step1.firstName.0.mp3` | The site's copy of `line.step1.firstName.0` | Made by `npm run sound -- --pack` from `audio/kept/line.step1.firstName.0.wav` | `audio/kept/line.step1.firstName.0.json` |
| `public/audio/line.step1.shredded.0.mp3` | The site's copy of `line.step1.shredded.0` | Made by `npm run sound -- --pack` from `audio/kept/line.step1.shredded.0.wav` | `audio/kept/line.step1.shredded.0.json` |
| `public/audio/line.step2.crank.0.mp3` | The site's copy of `line.step2.crank.0` | Made by `npm run sound -- --pack` from `audio/kept/line.step2.crank.0.wav` | `audio/kept/line.step2.crank.0.json` |
| `public/audio/line.step2.crank.1.mp3` | The site's copy of `line.step2.crank.1` | Made by `npm run sound -- --pack` from `audio/kept/line.step2.crank.1.wav` | `audio/kept/line.step2.crank.1.json` |
| `public/audio/vacuum-roar.flac` | The site's copy of `vacuum-roar` | Made by `npm run sound -- --pack` from `audio/kept/vacuum-roar.wav` | `audio/kept/vacuum-roar.json` |

## Third-party files

| File | What it is | Source URL | License | Date added |
| --- | --- | --- | --- | --- |
| `public/fonts/inter-400.json`, `inter-500.json`, `inter-600.json`, `inter-display-600.json`, `inter-display-800.json` | Inter 4.1, five cuts, baked to outlines, advances and kerning by `pipeline/fonts/bake_fonts.py`. Every word of the site | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip | SIL Open Font License 1.1 | 2026-11-25 |
| `public/fonts/Inter-LICENSE.txt` | The licence text that came in that archive | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip | SIL Open Font License 1.1 | 2026-11-25 |
| `public/fonts/playfair-700.json`, `playfair-900.json` | Playfair Display, weights 700 and 900, latin, baked the same way. The signs and the marquee of the pinball machine | https://www.npmjs.com/package/@fontsource/playfair-display/v/5.3.0 | SIL Open Font License 1.1 | 2026-11-25 |
| `public/fonts/PlayfairDisplay-LICENSE.txt` | The licence text that came in that package | https://www.npmjs.com/package/@fontsource/playfair-display/v/5.3.0 | SIL Open Font License 1.1 | 2026-11-25 |
