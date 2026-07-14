import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ExamineClick } from '../index'

describe('ExamineClick', () => {
  it('calls onFiles when file input changes', () => {
    const onFiles = vi.fn()
    const { container } = render(
      <ExamineClick onFiles={onFiles} accept='image/*'>
        <span>Pick</span>
      </ExamineClick>
    )
    const input = container.querySelector('input[type="file"]')
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFiles).toHaveBeenCalledTimes(1)
    expect(onFiles.mock.calls[0][0]).toHaveLength(1)
  })
})
