# Addendum 001 · The sound budget and the narrator

From Brandon, November 25. He has added ElevenLabs credits, so sound work can start. This addendum beats every kit file on its two topics: how many credits sound may use, and what the narrator says and when.

## 1. The credit cap

Another build of Brandon's used a whole month of credits in one day. This build has a hard cap.

- This build may spend at most `audio.creditCap` ElevenLabs credits in all, on every call of every kind: tests, narrator lines, effects, retakes, review rounds and extensions.
- The account is shared with other builds that are running now. So the cap is counted from this build's own calls, never from how much the account has left.
- Keep a ledger at `audio/CREDITS.md`. One row for every call, written before the next call is made: the time, the endpoint, the line or cue, the characters or seconds asked for, what it cost, and the running total. Commit it with each status.
- What a call cost: use the cost the response reports if it reports one. If it does not, measure the rate once for speech and once for effects by reading the account's usage straight before and straight after one call, and use that rate from then on. Write both rates at the top of the ledger.
- Before every call, check that the running total plus that call's cost stays at or under the cap. If it would not, the call is not made.
- Every sound effect call sets the length it wants. Never leave the length for the tool to choose. A call with no length is billed a flat amount that is many times higher for a short effect.
- Ask for each effect at the length in `audio.sfx`, or at the endpoint's shortest length if that is longer. A variant is its own call.
- The take limits in the kit still hold: `audio.narratorMaxTakesPerLine` and `audio.maxTakesPerCue`. The cap comes on top of them.
- Hold back `audio.creditReserveAfterReview` credits for what Brandon asks for at the review. Before the review, stop at the cap less that reserve.
- Order of spending: first the pause and speed tests, then one take of every narrator line under `film`, then one take of every effect, then the `liveOnly` lines, then second and third takes where a first take failed its checks, then anything extra.
- Once the running total passes `audio.creditExtrasStopFraction` of the cap, make nothing that section 2 calls extra.
- When the cap is reached: make no more calls, keep the best take of everything that exists, let every moment without a sound play without it, log each as an open item, and say so in the first line of the `REVIEW` block with the ledger's total. This is not a stop. The build goes on.
- Put the ledger's total in every status that follows sound work, in the `REVIEW` block and in the `BUILD COMPLETE` block.

## 2. Room to add what the build turns out to need

Brandon wants the build to have room for sounds nobody listed.

- You may add up to `audio.extraCuesMax` effect cues that are not in `audio.sfx`, where a visible contact in the finished site has no sound. Add each to `audio.sfx` and to the cue table of `kit/03-METHOD.md` section 12 in your own log, with its prompt, and list them in the `REVIEW` block.
- One new cue is already added: `boss-loop`, a short loop of tense, slightly silly fight music under the boss battle, from `boss.unfold` to `boss.collapse`. Make it with the sound effect endpoint, as the hold music is made. It sits low under the effects and ducks under the narrator. If the sound effect endpoint cannot make something that loops cleanly, leave the fight without it and list it under "For Brandon to decide". Do not use the music endpoint.
- There is still no music score anywhere else.

## 3. The narrator

`content/narration.json` is rewritten. Read its `direction` and `rules` again. They replace what you read before.

- The voice: a dry, slow, slightly bored wildlife narrator. Condescending, and funny first. It pities the applicant. It is never cruel and never rude for the sake of it. The joke is on the job hunt and the company.
- It is not constant. Twenty lines across the film, and most beats have none. Do not fill the gaps.
- Brandon approved this voice from samples. The lines are still a draft and he hears them all at the review.

What you may change, to fit what the site and the film turn into:

- You may reword up to `audio.narratorRewordMaxLines` lines where a line no longer matches what the picture shows at that moment.
- You may add up to `audio.narratorExtraLinesMax` new lines at moments that turned out to deserve one, and you may drop any line that crowds an effect or a gag.
- Every changed or new line follows the `direction` and the `rules` in the file, is no longer than the longest line already there, and is written into `content/narration.json` with the old text logged under "Decisions made by the Builder". The `REVIEW` block lists each one, old beside new.
- You may move a line's `at` so that it lands on its moment.
- You may not change the voice, speed it up, or make it speak over another line.

## 4. The narrator on the live site

On the live site the narrator is talking about the visitor, and a line plays because of something the visitor did.

- Every line under `film` now has a `live` entry: the thing the visitor does that plays that line on the live site. For example, the line "First name. / Under fire. / Standard onboarding." plays when the visitor clicks the First name field.
- Tie each to the event the stage already reports for it. Where no event exists yet, add one.
- A `film` line plays once in a visit, the first time its trigger happens. The `liveOnly` lines follow the rules in the file's own `about`.
- A line never interrupts a line. If its trigger comes while another line is speaking, or inside `audio.liveNarratorMinGapSeconds` of the last one, it waits until it can play, and if its moment has passed by then it is dropped.
- A visitor who skips a step does not hear that step's lines afterwards.
- Film mode is unchanged: a line plays at its `at` in its beat.
- If your loader of `content/narration.json` rejects the new `live` field, change the loader. Startup validation still requires the beats in the file to match the config's beats exactly. A beat may hold no lines.

## 5. What to do now

1. Read the account's quota. Start the ledger.
2. Run the pause and speed tests that Phase 0 could not run, and record what they found under "Tool record".
3. Carry on with sound work in the order section 1 gives, wherever the build is, without holding up the unit in hand.
4. Log how you applied this addendum in `kit/PROGRESS.md`.
