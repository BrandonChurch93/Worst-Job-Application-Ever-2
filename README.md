# The Worst Job Application Ever

A comedy told as a job application. A cheerful careers page leads into a five-step application that fights back at every step and ends in instant rejection. Every page is a real web page made of real things, and the hero is the mouse cursor.

It is one website delivered two ways: a film in which the site plays itself, and a live site where a visitor does the application with their own mouse.

This repo holds the build kit. Perplexity Computer builds the site, the films and the portfolio card from it, with nobody watching, from one prompt.

## Status

The build is running. `kit/PROGRESS.md` is its log: the phase, the clock, every decision and every measurement.

- The site as it stands: https://www.perplexity.ai/computer/a/the-worst-job-application-ever-PX4JqBxjQQOurzN2dfCrOg
- The review page, where everything plays: https://www.perplexity.ai/computer/a/the-worst-job-application-ever-11C.YCwbSEaDnRs_ar70Dw

Both addresses are on the build workspace's hosting and open for Brandon only, until he shares them. They are updated in place as the build goes on.

The kit is written and every reference image is approved. `references/STATUS.md` is the record of what was approved, what was rejected and why. `kit/10-KICKOFF.md` has the prompt that starts the build.

## Where things are

| Path | What it is |
| --- | --- |
| `AGENTS.md` | The Builder's rules |
| `kit/` | The build kit, in reading order from `kit/00-README.md` |
| `kit/10-KICKOFF.md` | For Brandon: how to start the build, every prompt, and the limits |
| `config/showcase.json` | Every number |
| `content/copy.json` | Every word the site shows |
| `content/narration.json` | The narrator's lines |
| `references/approved/` | The images Brandon approved. The target |
| `references/STATUS.md` | What was approved, what was rejected and why |
| `references/drafts/` | Every reference round |

The Builder rewrites this file at the end of the build with the site's address, how to play it, how to render the films and how to deploy it.
