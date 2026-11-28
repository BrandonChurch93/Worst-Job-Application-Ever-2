// The visitor of the strip: ticks the box, waits at the button, presses once while the boss forms, then keeps under the bar.
export const policy = (k) => (time, hint0, socket) => {
  if (time < 0.8) return { x: hint0.x, y: hint0.y, down: false }
  if (time < 0.9) return { x: hint0.x, y: hint0.y, down: true }
  if (time < 10) return { x: socket.x, y: socket.y, down: time >= 7.5 && time < 7.6 }
  const leg = Math.floor(time / 1.5)
  return { x: 600 + ((k * 97 + leg * 211) % 720), y: 180 + ((k * 31 + leg * 17) % 90), down: Math.floor(time * 12) % 2 === 0 }
}
