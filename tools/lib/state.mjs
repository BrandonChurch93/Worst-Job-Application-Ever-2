// The frame interface without a picture: the site's own logic in Node, asked the questions the checks ask.
import { logic } from './logic.mjs'

export async function state() {
  const { load, close } = await logic()
  const { App } = await load('/src/app.ts')
  const { makeShowcase } = await load('/src/capture/showcase.ts')
  const app = new App()
  return { showcase: makeShowcase(app, Promise.resolve()), app, App, load, close }
}
