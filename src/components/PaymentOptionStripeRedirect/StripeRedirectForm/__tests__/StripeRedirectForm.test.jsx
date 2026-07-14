import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'
import { StripeRedirectForm } from '../index'

describe('StripeRedirectForm', () => {
  it('forwards stripe redirect form submission to handler', async () => {
    const handleStripeRedirect = vi.fn()
    renderController(StripeRedirectForm, { handleStripeRedirect })
    await lastControllerProps.handleSubmitPaymentMethod({
      type: 'card',
      name: 'Ada Lovelace',
      email: 'ada@test.com'
    })
    expect(handleStripeRedirect).toHaveBeenCalledWith({
      type: 'card',
      owner: { name: 'Ada Lovelace', email: 'ada@test.com' }
    })
  })
})
