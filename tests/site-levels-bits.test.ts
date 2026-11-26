import { describe, expect, it } from 'vitest'
import type * as THREE from 'three'
import { targetKind } from '../src/core/accumulator'

function machine(names: string[]): THREE.WebGLRenderer {
  return { extensions: { has: (name: string) => names.includes(name) } } as unknown as THREE.WebGLRenderer
}

describe('which target a machine draws into', () => {
  it('falls to eight bits when both float extensions are hidden', () => {
    expect(targetKind(machine([]))).toBe('byte')
    expect(targetKind(machine(['OES_texture_float_linear', 'EXT_float_blend']))).toBe('byte')
  })

  it('takes half float when only the full float extension is hidden', () => {
    expect(targetKind(machine(['EXT_color_buffer_half_float']))).toBe('half')
  })

  it('takes float when it is there', () => {
    expect(targetKind(machine(['EXT_color_buffer_float', 'EXT_color_buffer_half_float']))).toBe('float')
  })
})
