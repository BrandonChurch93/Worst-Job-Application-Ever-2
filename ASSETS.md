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

| Sound | Kind | Made by | Takes | Record | Date |
| --- | --- | --- | --- | --- | --- |

## Third-party files

| File | What it is | Source URL | License | Date added |
| --- | --- | --- | --- | --- |
| `public/fonts/inter-400.json`, `inter-500.json`, `inter-600.json`, `inter-display-600.json` | Inter 4.1, four cuts, baked to outlines, advances and kerning by `pipeline/fonts/bake_fonts.py`. Every word of the site | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip | SIL Open Font License 1.1 | 2026-11-25 |
| `public/fonts/Inter-LICENSE.txt` | The licence text that came in that archive | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip | SIL Open Font License 1.1 | 2026-11-25 |
| `public/fonts/playfair-700.json`, `playfair-900.json` | Playfair Display, weights 700 and 900, latin, baked the same way. The signs and the marquee of the pinball machine | https://www.npmjs.com/package/@fontsource/playfair-display/v/5.3.0 | SIL Open Font License 1.1 | 2026-11-25 |
| `public/fonts/PlayfairDisplay-LICENSE.txt` | The licence text that came in that package | https://www.npmjs.com/package/@fontsource/playfair-display/v/5.3.0 | SIL Open Font License 1.1 | 2026-11-25 |
