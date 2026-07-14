import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { sampleMenus } from '../../../__tests__/helpers/menuListingTestHelpers'
import { MenuControl } from '../index'

describe('MenuControl', () => {
  const menu = sampleMenus[0]
  const selectableSaturday = '2026-07-18'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes schedule helpers for the selected menu', async () => {
    const handleMenuInfo = vi.fn()
    const handlerSelectDate = vi.fn()
    renderController(MenuControl, {
      maxPreoderDays: 3,
      handleMenuInfo,
      handlerSelectDate
    })
    lastControllerProps.handleMenuSelected(menu)
    await waitFor(() => {
      expect(lastControllerProps.menuSelected).toBe(1)
    })
    expect(Array.isArray(lastControllerProps.menuLapsesList())).toBe(true)
    expect(Array.isArray(lastControllerProps.futureDaysToShow())).toBe(true)
  })

  it('disables invalid weekdays and selects a valid date', async () => {
    const handleMenuInfo = vi.fn()
    const handlerSelectDate = vi.fn()
    renderController(MenuControl, {
      maxPreoderDays: 3,
      handleMenuInfo,
      handlerSelectDate
    })
    lastControllerProps.handleMenuSelected(menu)
    await waitFor(() => expect(lastControllerProps.menuSelected).toBe(1))
    expect(lastControllerProps.isDisabledDay(selectableSaturday)).toBe(false)
    lastControllerProps.handleDate(selectableSaturday)
    await waitFor(() => {
      expect(handlerSelectDate).toHaveBeenCalled()
    })
    expect(lastControllerProps.dateSelected).toContain('2026-07-18')
  })

  it('sends menu info when schedule and date are set', async () => {
    const handleMenuInfo = vi.fn()
    const handlerSelectDate = vi.fn()
    renderController(MenuControl, {
      maxPreoderDays: 3,
      handleMenuInfo,
      handlerSelectDate
    })
    lastControllerProps.handleMenuSelected(menu)
    await waitFor(() => expect(lastControllerProps.menuSelected).toBe(1))
    lastControllerProps.handleDate(selectableSaturday)
    await waitFor(() => expect(lastControllerProps.dateSelected).toBeTruthy())
    lastControllerProps.onSendMenuInfo()
    expect(handleMenuInfo).toHaveBeenCalledWith(expect.objectContaining({
      menuId: 1,
      date: expect.any(Date)
    }))
  })
})
