# Voice test 006: line 1 after Brandon's words on the voiceover

Brandon, in the Builder's chat, about 10:50 PM MT November 27, 2026: "We have a major problem with the voiceover on this one. There's all these pauses on sentences? I didn't intend for there to be like huge pauses throughout the sentence. It's kind of annoying? The voice is also way too deep and doesn't sound right"

Two clips of line 1, both set to the same loudness for listening. Neither is in the kept set.

| File | What it is | Credits | Length | Middle pitch | Longest gap |
| --- | --- | --- | --- | --- | --- |
| `line1-new-take-saved-settings.mp3` | a new take: plain sentences, no pause marks, no settings sent, so the voice's saved settings apply (speed 1.0, stability 0.5) | 55 (ledger row 213) | 7.80 s | 98.9 Hz | 0.20 s |
| `line1-old-take-free-mend.mp3` | the kept take 2 (speed 0.7, a break at each mark), mended for free: the seven pauses cut to 0.30 s after a full stop and 0.10 s inside a sentence (`cutpauses.py`), then made 0.7 times as long and 1.43 times as high with the mouth's resonances left where they were (`psola.py`, Praat's overlap-add) | 0 | 8.90 s | 102.6 Hz | 0.20 s |

For comparison, the kept take as recorded: 19.46 s, 71.3 Hz, seven pauses of 1.11 to 1.23 s.

All figures MEASURED with `pitch.py` and `formants.py` (Praat by parselmouth). A model cannot hear: Brandon's ear decides.
