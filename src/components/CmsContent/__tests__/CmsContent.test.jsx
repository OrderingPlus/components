import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [acms.mockOrdering]
}))

import { CmsContent } from '../index'

describe('CmsContent', () => {
  beforeEach(() => acms.reset())

  it('loads CMS page body by slug', async () => {
    renderController(CmsContent, { pageSlug: 'about-us' })
    await waitFor(() => {
      expect(lastControllerProps.cmsState.loading).toBe(false)
    })
    expect(lastControllerProps.cmsState.body).toBe('<p>CMS page</p>')
  })

  it('calls onNotFound when page fetch fails', async () => {
    acms.mockPagesGet.mockResolvedValueOnce({
      content: { error: true, result: ['Not found'] }
    })
    renderController(CmsContent, { pageSlug: 'missing', onNotFound: acms.mockOnNotFound })
    await waitFor(() => {
      expect(lastControllerProps.cmsState.error).toBeTruthy()
    })
    expect(acms.mockOnNotFound).toHaveBeenCalledWith('missing')
  })
})
