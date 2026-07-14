import React, { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Analytics } from '../index'
import { EventProvider, useEvent } from '../../../contexts/EventContext'

const EventProbe = ({ onReady }) => {
  const [events] = useEvent()
  useEffect(() => {
    onReady(events)
  }, [events, onReady])
  return null
}

describe('Analytics', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    delete window.gtag
    delete window.ga
    delete window.dataLayer
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children without tracking when trackId is disabled', () => {
    const { getByTestId } = render(
      <EventProvider>
        <Analytics trackId='0'>
          <span data-testid='child'>content</span>
        </Analytics>
      </EventProvider>
    )
    expect(getByTestId('child')).toBeInTheDocument()
  })

  it('loads analytics script for measurement-style track ids', async () => {
    window.ga = vi.fn()
    let eventsRef = null

    render(
      <EventProvider>
        <EventProbe onReady={(events) => { eventsRef = events }} />
        <Analytics trackId='G-TEST123'>
          <span>child</span>
        </Analytics>
      </EventProvider>
    )

    const script = document.getElementById('google-analytics-sdk')
    expect(script).toBeTruthy()
    script.onload()

    await waitFor(() => {
      expect(eventsRef).toBeTruthy()
    })

    eventsRef.emit('change_view', { page: '/menu' })
    eventsRef.emit('product_clicked', { id: 1, name: 'Burger', category_id: 2, price: 9.5 })
    eventsRef.emit('userLogin', { id: 42 })

    expect(window.ga).toHaveBeenCalledWith('set', 'page', '/menu')
    expect(window.ga).toHaveBeenCalledWith('ec:addProduct', expect.any(Object))
    expect(window.ga).toHaveBeenCalledWith('set', 'userId', 42)
  })

  it('tracks Universal Analytics events for legacy track ids', async () => {
    window.ga = vi.fn()
    let eventsRef = null

    render(
      <EventProvider>
        <EventProbe onReady={(events) => { eventsRef = events }} />
        <Analytics trackId='UA-123456-1'>
          <span>child</span>
        </Analytics>
      </EventProvider>
    )

    const script = document.getElementById('google-analytics-sdk')
    expect(script).toBeTruthy()
    script.onload()

    await waitFor(() => {
      expect(eventsRef).toBeTruthy()
    })

    eventsRef.emit('change_view', { page: '/checkout' })
    eventsRef.emit('product_clicked', { id: 5, name: 'Pizza', category_id: 1, price: 12 })
    eventsRef.emit('userLogin', { id: 7 })

    expect(window.ga).toHaveBeenCalledWith('set', 'page', '/checkout')
    expect(window.ga).toHaveBeenCalledWith('ec:addProduct', expect.any(Object))
    expect(window.ga).toHaveBeenCalledWith('set', 'userId', 7)
  })
})
