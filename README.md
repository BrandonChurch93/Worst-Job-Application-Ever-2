# The Worst Job Application Ever

A comedy told as a job application. A cheerful careers page leads into a five-step application that fights back at every step and ends in instant rejection. Every page is a real web page made of real things, and the hero is the mouse cursor.

It is one website delivered two ways: a film in which the site plays itself, and a live site where a visitor does the application with their own mouse.

This repo holds the build kit. Perplexity Computer builds the site, the films and the portfolio card from it, with nobody watching, from one prompt.

## Status

Planning. The kit is written. The last reference round, the pinball machine, is not approved yet, so a build started now stops at once with `BLOCKED: the reference images are not approved.` `references/STATUS.md` says what is approved and what is pending.

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
