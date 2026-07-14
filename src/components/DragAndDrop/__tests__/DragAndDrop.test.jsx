import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { DragAndDrop } from '../index'

describe('DragAndDrop', () => {
  it('calls onDrop with dataTransfer', () => {
    const onDrop = vi.fn()
    const { getByText } = render(
      <DragAndDrop onDrop={onDrop} className='drop-zone'>
        Drop here
      </DragAndDrop>
    )
    fireEvent.drop(getByText('Drop here'))
    expect(onDrop).toHaveBeenCalled()
  })

  it('adds dragover class on drag enter', () => {
    const { getByText, container } = render(
      <DragAndDrop onDrop={vi.fn()} className='zone'>
        Target
      </DragAndDrop>
    )
    fireEvent.dragEnter(getByText('Target'))
    expect(container.firstChild.className).toContain('dragover')
  })
})
