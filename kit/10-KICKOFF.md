# 10 · Kickoff

For Brandon. The Builder does not act on this file.

The reference rounds are done and their approved images are in `references/approved/`. This is the build. It runs start to finish with one stop: when the whole site is playable with sound, it shows you everything, lets you play it and plays you every line and every effect. You can send notes as many times as you like. When you approve, it finishes the films and delivers.

## Before you start

1. Make the repo private, in its settings on GitHub. The sound tool's terms do not allow its sound effects to sit as loose files in a public repo. With a private repo every sound is saved with the build. With a public one the build still runs, and the sounds are kept out of the repo and attached to the thread for you.
2. In Computer, check that the GitHub connector and the ElevenLabs connector are still connected, and that the narrator voice is still saved in ElevenLabs under the name `Worst-Job-Application-Ever`.
3. Use your highest effort setting with Multiagent on.

## Start the build

Paste this prompt.

```
BUILD MODE.

Repo: https://github.com/BrandonChurch93/Worst-Job-Application-Ever-2

Pull the repo. Read AGENTS.md, then kit/00-README.md, then the kit in its reading order. Build the whole thing from the kit: work every phase in kit/08-BUILD-ORDER.md in order, close every gate by passing it or by reaching its limit, run the critic rounds inside their limits and the clock, and log everything in kit/PROGRESS.md.

Run this as one continuous task. Do not ask me questions. Decide, log the decision and continue. Stop only at the review stop, the budget report, BUILD COMPLETE or a blocker as AGENTS.md defines one.

Show your work as you go, as AGENTS.md says: statuses with pictures displayed inline in this thread at the rhythm it sets, and the site published as it grows so I can play it myself. If I write in this thread, apply it and carry on.

Use supporting agents wherever the kit calls for them. Do not lower the bar to finish sooner.
```

## What you will see, in order

1. A first status showing your approved images, proving pictures show up inline.
2. A link to the site, and a review page at the same address under `review.html`. Everything the build shows you is also there.
3. A status with pictures at least every half hour, and one at the end of every round and every finished unit.
4. A rough cut of the film made from your approved images. The build does not wait for you.
5. The blockout: the whole application working with grey placeholder shapes and your real text. You can already click through all five steps, play the pinball scene and fight the boss.
6. Step 1, finished first, with the cursor. The page look, the type, the light and the cursor's acting are proven there. The pinball machine's parts start being built at the same time.
7. The pinball machine, the boss, step 2, the careers page and the decision page, built side by side. The pinball machine gets the most rounds.
8. The whole site, polished, with the narrator and every sound. Then `REVIEW`, the one stop.
9. After you approve: the films, the prompt opening of film A, the card loop, a draft of the post, and `BUILD COMPLETE`.

If the time you allowed runs out first, you get `BUDGET REPORT` instead, with what is done and what is left.

## Steering while it runs

- If a status shows something going the wrong way, say so in the Computer thread in plain words. The Builder applies it and carries on.
- For anything bigger, bring it to the planning chat. It goes into the repo as a numbered addendum, and the build picks it up at its next phase or its next push.
- If you want the build to differ from one of your approved pictures on purpose, bring that to the planning chat too. It is added as a settled difference, so the critics stop asking for the picture on that point.

## The review stop

When the site is finished the task ends with a block headed `REVIEW`. It gives you links to the site and to the review page.

1. Open the site on your Mac and play it from the careers page to the rejection. Turn the sound on.
2. Open the review page and go to Sound board. The review cut of the film plays there with sound. Under it every narrator line and every effect can be played on its own.
3. If you like, open the speed page on any machine you care about and copy what it shows.

### If you want changes

Send this as many times as you like. Each one is a bounded piece of work that ends with the `REVIEW` block again.

```
BUILD MODE.

Review notes.

Pull https://github.com/BrandonChurch93/Worst-Job-Application-Ever-2 and continue from kit/PROGRESS.md. Read AGENTS.md and kit/addenda/ first. Same rules.

What to change:
<your notes, in plain words. To reword a narrator line, name its beat and write the new line. To change a sound, name it and say what is wrong with it>
```

### When the site and the sound are right

Replace the lines in angle brackets.

```
BUILD MODE.

The review is done.

Pull https://github.com/BrandonChurch93/Worst-Job-Application-Ever-2 and continue from kit/PROGRESS.md. Read AGENTS.md and kit/addenda/ first. Same rules.

Portfolio link: <the address of your portfolio's all work page>

Anything else to change:
<your notes, or "Nothing">

Speed results, if you ran the speed page:
<paste them, or leave this out>
```

- If the repo is still public, the `REVIEW` message has one archive of the sounds attached. Attach that same file to this prompt, and to any review notes prompt, so the build works with the sounds you heard.
- There is no second stop. Anything in your notes that cannot be done inside the limits is listed at the end.

## The limits you have

| What | Value | Config key |
| --- | --- | --- |
| The most the build may run before the review stop | 36 hours | `budget.runHours` |
| The most it may run after you approve | 12 hours | `budget.afterReviewHours` |
| Those two together | 48 hours | |
| The most each round of review notes may run | 3 hours | `budget.reviewRoundHours` |
| Extra time each time you say continue | 12 hours | `budget.continueHours` |
| Longest gap between statuses | 30 minutes | `budget.statusMaxGapMinutes` |
| Pictures per status | up to 4 | `status.maxPictures` |
| Rounds on step 1 and the cursor | up to 5 | `quality.lookLockMaxRounds` |
| Rounds on the pinball machine | up to 5 | `quality.pinballMaxRounds` |
| Rounds on each other page | up to 3 | `quality.maxRoundsPerUnit` |
| Rounds on the whole site | up to 2 | `quality.siteMaxRounds` |
| Polish rounds before the review | up to 2 | `quality.polishMaxRounds` |
| Rounds on the films | up to 2 | `quality.filmMaxRounds` |
| The score a part needs to pass | 9 out of 10 | `quality.passScore` |
| Takes of one narrator line or one sound, and again each time you name it in review notes | up to 3 | `audio.narratorMaxTakesPerLine`, `audio.maxTakesPerCue` |
| The length of film B | 151 seconds as planned, never over 165 | `film.units`, `film.maxSeconds` |
| The most the hosted site may weigh | 95 MB | `host.maxShippedMb` |

- The time counted is working time. Time when no task is running, and time you spend playing and listening, is not counted.
- These are caps, not forecasts.

## If the build reports at the budget

`BUDGET REPORT` lists what is done, what is left and what it looks like now. To carry on, start a new task with:

```
BUILD MODE.

Continue past the budget.

Pull https://github.com/BrandonChurch93/Worst-Job-Application-Ever-2 and continue from kit/PROGRESS.md. Read AGENTS.md and kit/addenda/ first. Same rules.
```

## If a task ends early for any other reason

```
BUILD MODE.

Pull https://github.com/BrandonChurch93/Worst-Job-Application-Ever-2 and continue from kit/PROGRESS.md. Read AGENTS.md and kit/addenda/ first. Same rules.
```

If the task that ended early was an extension, send the extension prompt again in place of this one.

## To ask for a status at any time

```
Post a status now: the phase, the unit and the round, what changed, what is next, the time used, and the current pictures shown inline. Do not stop working.
```

## After BUILD COMPLETE

Bring it back to the planning chat. Three things happen there:

1. Film B, film A and the card loop are rendered on your Mac, frame by frame at 4K and 60 frames a second, with the sound laid in. The commands are in `README.md`, and the first one renders a ten second test for you to look at before the full render.
2. The repo is connected to Vercel, and the address opens the application for anyone to try.
3. The card still and the loop in `deliver/` go onto your portfolio card, and the post draft in `deliver/POST.md` is yours to edit.

## If you want more polish after it completes

Each of these buys one more bounded polish pass on the open items. Add notes under the last line if you have any.

```
BUILD MODE.

Extension.

Pull https://github.com/BrandonChurch93/Worst-Job-Application-Ever-2. Read AGENTS.md, kit/PROGRESS.md and kit/addenda/. Run one extension as AGENTS.md and kit/08-BUILD-ORDER.md define it, and end with the BUILD COMPLETE block again.
```

## Things only you can decide

- The length. Film B is planned at 151 seconds, and film A adds up to 12 more. A standard account on X can post 140 seconds. A Premium account can post far longer, so the team's account is fine. If it ever has to go out from a standard account, tell the planning chat and the film is tightened in an addendum.
- The narrator's lines. `content/narration.json` is a draft in the voice you described: slow, smug, looking down on the applicant. You hear every line at the review and can rewrite any of them there.
- The defaults listed under "Decisions waiting on Brandon" in `kit/01-FILM.md`: the employer's name, the rejection line, the typed prompt, the applicant's name in the film. Each stands unless you change it.
- The repo being public or private, as the first step above explains.
