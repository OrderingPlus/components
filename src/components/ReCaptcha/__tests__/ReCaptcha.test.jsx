import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { ReCaptcha } from '../index'

vi.mock('react-google-recaptcha', () => ({
  default: React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({}))
    return (
      <button
        type='button'
        data-testid='recaptcha-v2'
        onClick={() => props.onChange('v2-token')}
      >
        v2
      </button>
    )
  })
}))

vi.mock('react-google-recaptcha-v3', () => ({
  GoogleReCaptchaProvider: ({ children }) => <div data-testid='recaptcha-v3-provider'>{children}</div>,
  GoogleReCaptcha: ({ onVerify }) => {
    React.useEffect(() => {
      onVerify('v3-token')
    }, [onVerify])
    return <div data-testid='recaptcha-v3' />
  }
}))

describe('ReCaptcha', () => {
  it('renders v2 widget and forwards token', () => {
    const handleReCaptcha = vi.fn()
    const { getByTestId } = render(
      <ReCaptcha
        handleReCaptcha={handleReCaptcha}
        reCaptchaVersion={{ version: 'v2', siteKey: 'site-key' }}
      />
    )
    getByTestId('recaptcha-v2').click()
    expect(handleReCaptcha).toHaveBeenCalledWith({ code: 'v2-token', version: 'v2' })
  })

  it('renders v3 provider and verifies token', async () => {
    const handleReCaptcha = vi.fn()
    const { getByTestId } = render(
      <ReCaptcha
        handleReCaptcha={handleReCaptcha}
        reCaptchaVersion={{ version: 'v3', siteKey: 'site-key' }}
      />
    )
    await waitFor(() => {
      expect(getByTestId('recaptcha-v3')).toBeInTheDocument()
    })
    expect(handleReCaptcha).toHaveBeenCalledWith({ code: 'v3-token', version: 'v3' })
  })

  it('does not render widget for unknown captcha version', () => {
    const { container } = render(
      <ReCaptcha
        handleReCaptcha={vi.fn()}
        reCaptchaVersion={{ version: 'v1', siteKey: 'site-key' }}
      />
    )
    expect(container.textContent).toBe('')
  })
})
