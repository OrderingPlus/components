import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useConfig } from '../../contexts/ConfigContext'
import { useEvent } from '../../contexts/EventContext'

const FB_EVENTS_SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js'

const ensureFbqStub = () => {
  if (typeof window === 'undefined' || window.fbq) {
    return
  }
  const f = window
  const n = function fbqStub () {
    if (n.callMethod) {
      n.callMethod.apply(n, arguments)
    } else {
      n.queue.push(arguments)
    }
  }
  n.queue = []
  n.loaded = false
  n.version = '2.0'
  n.push = n
  f.fbq = n
  if (!f._fbq) {
    f._fbq = n
  }
}

const injectFbeventsScriptOnce = () => {
  if (typeof document === 'undefined') {
    return
  }
  const existing = document.querySelector(`script[src="${FB_EVENTS_SCRIPT_SRC}"]`)
  if (existing) {
    return
  }
  const t = document.createElement('script')
  t.async = true
  t.src = FB_EVENTS_SCRIPT_SRC
  const s = document.getElementsByTagName('script')[0]
  if (!s || !s.parentNode) {
    document.head.appendChild(t)
    return
  }
  s.parentNode.insertBefore(t, s)
}

export const FacebookPixel = (props) => {
  const {
    children,
    trackId,
    isScriptEnabled
  } = props

  const [events] = useEvent()
  const [configs] = useConfig()
  const initTrackIdRef = useRef(null)

  useEffect(() => {
    if (!trackId) {
      return
    }
    ensureFbqStub()
  }, [trackId])

  useEffect(() => {
    if (!trackId || !isScriptEnabled) {
      return
    }
    ensureFbqStub()
    injectFbeventsScriptOnce()
    if (initTrackIdRef.current === trackId) {
      return
    }
    window.fbq('init', trackId)
    window.fbq('track', 'PageView')
    initTrackIdRef.current = trackId
  }, [trackId, isScriptEnabled])

  useEffect(() => {
    if (!trackId) {
      initTrackIdRef.current = null
    }
  }, [trackId])

  const handleProductAdded = useCallback((product) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'AddToCart', {
      content_category: product?.category?.name,
      content_ids: [product?.id],
      content_name: product?.name,
      currency: configs?.stripe_currency?.value ?? 'USD',
      value: product?.total ?? product?.price,
      quantity: product?.quantity
    })
  }, [configs?.stripe_currency?.value])

  const handleProductEdited = useCallback((product) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'CustomizeProduct', {
      content_category: product?.category?.name,
      content_ids: [product?.id],
      content_name: product?.name,
      currency: configs?.stripe_currency?.value ?? 'USD',
      value: product?.total ?? product?.price,
      quantity: product?.quantity
    })
  }, [configs?.stripe_currency?.value])

  const handleOrderPlaced = useCallback((order) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'Purchase', {
      content_ids: [order.id],
      value: order?.total,
      currency: configs?.stripe_currency?.value ?? 'USD'
    })
  }, [configs?.stripe_currency?.value])

  const handleSignupUser = useCallback((user) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'Lead', {
      content_name: `${user?.name} ${user?.last_name}`,
      content_category: 'signup',
      value: user?.id
    })
  }, [])

  const handleLoginUser = useCallback((user) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'Lead', {
      content_name: `${user?.name} ${user?.last_name}`,
      content_category: 'login',
      value: user?.id
    })
  }, [])

  const handlePaymentInfo = useCallback((payment) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'AddPaymentInfo', {
      content_category: payment?.gateway,
      content_ids: payment?.id
    })
  }, [])

  const handlechangeView = useCallback((pageName) => {
    if (typeof window.fbq !== 'function') {
      return
    }
    window.fbq('track', 'ViewContent', {
      content_name: pageName?.page,
      contents: [pageName?.params]
    })
  }, [])

  useEffect(() => {
    if (!trackId) {
      return
    }

    events.on('userLogin', handleLoginUser)
    events.on('change_view', handlechangeView)
    events.on('product_added', handleProductAdded)
    events.on('product_edited', handleProductEdited)
    events.on('order_placed', handleOrderPlaced)
    events.on('singup_user', handleSignupUser)
    events.on('add_payment_option', handlePaymentInfo)

    return () => {
      events.off('userLogin', handleLoginUser)
      events.off('change_view', handlechangeView)
      events.off('product_added', handleProductAdded)
      events.off('product_edited', handleProductEdited)
      events.off('order_placed', handleOrderPlaced)
      events.off('singup_user', handleSignupUser)
      events.off('add_payment_option', handlePaymentInfo)
    }
  }, [
    trackId,
    events,
    handleLoginUser,
    handlechangeView,
    handleProductAdded,
    handleProductEdited,
    handleOrderPlaced,
    handleSignupUser,
    handlePaymentInfo
  ])

  return (
    <>
      {children}
    </>
  )
}

FacebookPixel.propTypes = {
  /**
   * Your Facebook pixels trackId
   * @see trackId What is trackID ? https://developers.google.com/analytics/devguides/collection/analyticsjs
   */
  trackId: PropTypes.string.isRequired,
  /**
   * When false, the external fbevents.js script is not loaded (only a lightweight fbq stub is installed).
   * Set true after conversion signals, user interaction, or idle (see App).
   */
  isScriptEnabled: PropTypes.bool.isRequired
}
