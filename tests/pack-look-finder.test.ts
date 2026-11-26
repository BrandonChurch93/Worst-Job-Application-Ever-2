import { describe, expect, it } from 'vitest'
import { finder, momentPicks } from '../tools/lib/pack-look.mjs'

const state = {
  layout: [{ id: 'a', kind: 'stampBlock', screen: [10, 20, 300, 80] }],
  type: [],
  cursor: { screen: [900, 500, 60, 90] },
  shapes: [
    { id: 'mark-top', kind: 'box', part: 'stamp', screen: [500, 500, 300, 10] },
    { id: 'mark-left', kind: 'box', part: 'stamp', screen: [500, 500, 10, 120] },
    { id: 'far', kind: 'box', part: 'stamp', screen: [500, 3000, 100, 100] },
    { id: 'whole.stamp', kind: 'anchor', part: 'stamp', screen: [0, 0, 1920, 1080] },
    { id: 'tower', kind: 'box', part: 'model-hq', screen: [800, 100, 200, 300] }
  ]
}

describe('the names the crops of a pack are found by', () => {
  const find = finder(state, 1920, 1080)
  it('finds a kind of the layout tree as before', () => {
    expect(find('stampBlock')).toEqual([10, 20, 300, 80])
  })
  it('finds one shape of the draw list by its id', () => {
    expect(find('shape:tower')).toEqual([800, 100, 200, 300])
  })
  it('joins several shapes named together and leaves out one the still does not show', () => {
    expect(find('shape:mark-top+mark-left')).toEqual([500, 500, 300, 120])
    expect(find('shape:mark-top+far')).toEqual([500, 500, 300, 10])
  })
  it('joins the shapes of a part, without its anchors and without what lies outside the picture', () => {
    expect(find('part:stamp')).toEqual([500, 500, 300, 120])
  })
  it('gives nothing for a name the still does not show', () => {
    expect(find('shape:far')).toBeNull()
    expect(find('shape:none')).toBeNull()
    expect(find('part:none')).toBeNull()
  })
  it('reads a state that has no shapes', () => {
    expect(finder({ ...state, shapes: undefined }, 1920, 1080)('shape:tower')).toBeNull()
  })
})

describe('the crops of a moment in the surface pack', () => {
  it("puts the labelled parts of the key's approved image first, each under its own label, and each name once", () => {
    const picks = momentPicks({ paper: { box: [0, 0, 1, 1], label: 'the letter' }, stampBlock: { box: [0, 0, 1, 1], label: 'the stamp' }, cursor: { box: [0, 0, 1, 1], label: 'the arrow' } })
    expect(picks.slice(0, 3)).toEqual([['paper', 'the letter'], ['stampBlock', 'the stamp'], ['cursor', 'the arrow']])
    expect(picks.filter(([name]) => name === 'paper')).toHaveLength(1)
    expect(picks.filter(([name]) => name === 'cursor')).toHaveLength(1)
    expect(picks.some(([name]) => name === 'surface.low')).toBe(true)
  })
  it('keeps the general list for a key with no labelled parts', () => {
    expect(momentPicks(undefined)[0]).toEqual(['cursor', 'the arrow'])
    expect(momentPicks({ a: [0, 0, 1, 1] })).toEqual(momentPicks(undefined))
  })
  it('names the machine under the paper only where a shredder is drawn', () => {
    const paper = { ...state, layout: [{ id: 'p', kind: 'paper', screen: [100, 100, 400, 300] }] }
    expect(finder(paper, 1920, 1080)('paper.below')).toBeNull()
    expect(finder({ ...paper, shapes: [{ id: 'strip-0', kind: 'box', part: 'shredder', screen: [200, 400, 10, 80] }] }, 1920, 1080)('paper.below')).not.toBeNull()
  })
})
