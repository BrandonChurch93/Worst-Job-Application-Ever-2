// What the page says to a screen reader: every message once a step, in the order it came on the page, and no faster than a voice can take.

// The time a message has the live region to itself before the next takes its place: a base and a part for each letter, never more than the cap.
export const SAY = { baseSeconds: 0.6, secondsPerLetter: 0.03, capSeconds: 3 }

export const sayTime = (text: string): number => Math.min(SAY.capSeconds, SAY.baseSeconds + SAY.secondsPerLetter * text.length)

interface Words { kind: string; words?: string; text?: string }

// The messages in a drawn frame, oldest first: the runs of copy that were not on the page when it came.
export function messagesOf(list: Words[], atRest: Set<string>, words: (key: string, runtime?: string) => string): string[] {
  const out: string[] = []
  for (const s of list) {
    if (s.kind !== 'text' || !s.words || !s.words.startsWith('copy:') || atRest.has(s.words)) continue
    const text = words(s.words, s.text)
    if (text && !out.includes(text)) out.push(text)
  }
  return out
}

export interface Said {
  // Called once a drawn frame with the step and the messages on the page now. Gives the words to write into the live region, or null to leave what is there.
  // New words join the line and each is given its time alone. Words that joined before in this step are not said again.
  // At a new step what still waits is said together at once, so no message is lost, and the line starts empty.
  frame(step: number, messages: string[], seconds: number): string | null
  waiting(): number
}

export function makeSaid(): Said {
  const heard = new Set<string>()
  let line: string[] = []
  let free = -Infinity
  let at: number | null = null
  const hear = (messages: string[]) => {
    for (const m of messages) {
      if (!m || heard.has(m)) continue
      heard.add(m)
      line.push(m)
    }
  }
  return {
    frame(step, messages, seconds) {
      if (step !== at) {
        const first = at === null
        at = step
        const rest = line.join(' ')
        heard.clear()
        line = []
        hear(messages)
        free = rest ? seconds + sayTime(rest) : -Infinity
        return first && !rest ? null : rest
      }
      hear(messages)
      const m = line[0]
      if (m === undefined || seconds < free) return null
      line.shift()
      free = seconds + sayTime(m)
      return m
    },
    waiting: () => line.length
  }
}
