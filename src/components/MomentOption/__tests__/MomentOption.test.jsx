import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [upm.mockOrderState, {
    changeMoment: upm.mockChangeMoment,
    addProduct: upm.mockAddProduct,
    removeProduct: upm.mockRemoveProduct
  }]
}))

import { MomentOption } from '../index'

describe('MomentOption', () => {
  const maxDate = new Date('2026-12-31T23:59:59')
  const minDate = new Date('2026-01-01T00:00:00')

  const pickScheduledDate = () => {
    const today = new Date().toISOString().slice(0, 10)
    return lastControllerProps.datesList.find((date) => date !== today) || lastControllerProps.datesList[0]
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-15T10:00:00'))
    upm.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates date list and selects ASAP by default', async () => {
    renderController(MomentOption, {
      minDate,
      maxDate,
      business: upm.businessWithSchedule,
      useOrderContext: true
    })
    await waitFor(() => {
      expect(lastControllerProps.datesList.length).toBeGreaterThan(0)
    })
    expect(lastControllerProps.isAsap).toBe(true)
  })

  it('switches to scheduled time and updates order moment', async () => {
    renderController(MomentOption, {
      minDate,
      maxDate,
      business: upm.businessWithSchedule,
      useOrderContext: true
    })
    await waitFor(() => expect(lastControllerProps.datesList.length).toBeGreaterThan(0))
    const date = pickScheduledDate()
    act(() => {
      lastControllerProps.handleChangeDate(date)
    })
    await waitFor(() => expect(lastControllerProps.hoursList.length).toBeGreaterThan(0))
    const time = lastControllerProps.hoursList[0]?.startTime || lastControllerProps.hoursList[0]?.value
    if (time) {
      act(() => {
        lastControllerProps.handleChangeTime(time)
      })
      expect(upm.mockChangeMoment).toHaveBeenCalled()
      expect(lastControllerProps.isAsap).toBe(false)
    }
  })

  it('resets to ASAP and clears moment', async () => {
    renderController(MomentOption, {
      minDate,
      maxDate,
      business: upm.businessWithSchedule,
      useOrderContext: true
    })
    await waitFor(() => expect(lastControllerProps.datesList.length).toBeGreaterThan(0))
    const date = pickScheduledDate()
    act(() => {
      lastControllerProps.handleChangeDate(date)
    })
    await waitFor(() => expect(lastControllerProps.hoursList.length).toBeGreaterThan(0))
    const time = lastControllerProps.hoursList[0]?.startTime || lastControllerProps.hoursList[0]?.value
    if (time) {
      act(() => {
        lastControllerProps.handleChangeTime(time)
      })
    }
    upm.mockChangeMoment.mockClear()
    act(() => {
      lastControllerProps.handleAsap()
    })
    expect(upm.mockChangeMoment).toHaveBeenCalledWith(null)
    expect(lastControllerProps.isAsap).toBe(true)
  })

  it('returns business schedule for selected date', async () => {
    renderController(MomentOption, {
      minDate,
      maxDate,
      business: upm.businessWithSchedule
    })
    await waitFor(() => expect(lastControllerProps.datesList.length).toBeGreaterThan(0))
    const schedule = lastControllerProps.getActualSchedule()
    expect(schedule?.enabled).toBe(true)
  })
})
