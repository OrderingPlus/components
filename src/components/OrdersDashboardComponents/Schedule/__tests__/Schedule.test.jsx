import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'
import { defaultScheduleList } from '../../../../__tests__/helpers/dashboardLogisticsTestHelpers'

import { Schedule } from '../index'

describe('Schedule', () => {
  const buildScheduleProps = () => ({
    scheduleList: defaultScheduleList(),
    handleChangeScheduleState: vi.fn()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes schedule from prop', () => {
    renderController(Schedule, buildScheduleProps())
    expect(lastControllerProps.scheduleState).toHaveLength(7)
    expect(lastControllerProps.scheduleState[0].enabled).toBe(true)
  })

  it('toggles day enabled state', () => {
    const scheduleProps = buildScheduleProps()
    renderController(Schedule, scheduleProps)
    act(() => {
      lastControllerProps.handleEnabledSchedule(1, false)
    })
    expect(lastControllerProps.scheduleState[1].enabled).toBe(false)
    expect(scheduleProps.handleChangeScheduleState).toHaveBeenCalled()
  })

  it('updates open time for a lapse', () => {
    renderController(Schedule, buildScheduleProps())
    act(() => {
      lastControllerProps.handleChangeScheduleTime('10:00', 0, 0, true)
    })
    expect(lastControllerProps.scheduleState[0].lapses[0].open).toEqual({ hour: 10, minute: 0 })
  })

  it('flags invalid close-before-open time changes', () => {
    renderController(Schedule, buildScheduleProps())
    act(() => {
      lastControllerProps.handleChangeScheduleTime('18:00', 0, 0, true)
    })
    expect(lastControllerProps.isTimeChangeError).toBe(true)
  })

  it('adds a new schedule lapse', () => {
    renderController(Schedule, buildScheduleProps())
    act(() => {
      lastControllerProps.handleOpenAddSchedule(2)
    })
    expect(lastControllerProps.openAddSchedule[2]).toBe(true)
    act(() => {
      lastControllerProps.handleChangeAddScheduleTime('18:00', true)
    })
    act(() => {
      lastControllerProps.handleChangeAddScheduleTime('20:00', false)
    })
    act(() => {
      lastControllerProps.handleAddSchedule(2)
    })
    expect(lastControllerProps.scheduleState[2].lapses).toHaveLength(2)
  })

  it('deletes a schedule lapse', () => {
    const listWithTwo = defaultScheduleList().map((day, index) => index === 0
      ? {
          ...day,
          lapses: [
            { open: { hour: 9, minute: 0 }, close: { hour: 12, minute: 0 } },
            { open: { hour: 13, minute: 0 }, close: { hour: 17, minute: 0 } }
          ]
        }
      : day)
    renderController(Schedule, {
      scheduleList: listWithTwo,
      handleChangeScheduleState: vi.fn()
    })
    act(() => {
      lastControllerProps.handleDeleteSchedule(0, 1)
    })
    expect(lastControllerProps.scheduleState[0].lapses).toHaveLength(1)
  })

  it('copies schedule times across selected days', () => {
    renderController(Schedule, buildScheduleProps())
    act(() => {
      lastControllerProps.handleSelectCopyTimes(2)
      lastControllerProps.handleSelectCopyTimes(3)
      lastControllerProps.handleApplyScheduleCopyTimes(0)
    })
    expect(lastControllerProps.scheduleState[2].lapses).toEqual(lastControllerProps.scheduleState[0].lapses)
    expect(lastControllerProps.scheduleState[3].lapses).toEqual(lastControllerProps.scheduleState[0].lapses)
  })
})
