import { openSession, stillFrom } from '../../../tools/lib/capture.mjs'
const session = await openSession({ format: 'hd' })
for (const key of ['reply-all','youre-fired','rail-cam','tier-office','last-save','lobby-doors','tier-street']) {
  const { spec } = stillFrom({ key, tier: 'draft' })
  const st = await session.page.evaluate((s) => window.showcase.stillState(s), spec)
  const c = st.cursor
  console.log(key, JSON.stringify({acting:c.acting, reaction:c.reaction, damage:c.damage, ball:[Math.round(c.ballX),Math.round(c.ballY),Math.round(c.ballScreenPx)], h:Math.round(c.screenHeightPx)}))
}
await session.close()
