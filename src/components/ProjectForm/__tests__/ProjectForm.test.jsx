import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [upm.mockOrdering, { setOrdering: upm.mockSetOrdering }]
}))

import { ProjectForm } from '../index'

describe('ProjectForm', () => {
  beforeEach(() => upm.reset())

  it('submits project name and emits change_project', () => {
    renderController(ProjectForm, {
      setStoreData: upm.mockSetStoreData,
      EventEmitter: upm.mockEventEmitter
    })
    act(() => {
      lastControllerProps.onSubmit({ project_name: 'demo-project' })
    })
    expect(upm.mockSetOrdering).toHaveBeenCalledWith(
      expect.objectContaining({ project: 'demo-project' })
    )
    expect(upm.mockSetStoreData).toHaveBeenCalledWith('project_name', '"demo-project"')
    expect(upm.mockEventEmitter.emit).toHaveBeenCalledWith('change_project', {
      setted: true,
      changed: true
    })
  })
})
