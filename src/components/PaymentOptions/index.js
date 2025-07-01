/* eslint-disable camelcase */
import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useOrder } from '../../contexts/OrderContext'
import { useApi } from '../../contexts/ApiContext'
import { useEvent } from '../../contexts/EventContext'
import { useSession } from '../../contexts/SessionContext'
import { useUtils } from '../../contexts/UtilsContext'

const stripeLink = 'stripe_link'
const paymethodsExisting = ['stripe', 'stripe_direct', 'stripe_connect', 'paypal', 'square']
const paymethodsNotAllowed = ['paypal_express', 'authorize']
const paymethodsCallcenterMode = ['cash', 'card_delivery', 'ivrpay', '100_coupon', stripeLink]
const redirectMethods = ['stripe_checkout', 'checkout_pro_mercadopago', 'epayco', 'interswitch', 'izipay']
const paymethodsWithAutoUpdate = ['izipay', 'globalpay']
/**
 * Component to manage payment options behavior without UI component
 */
export const PaymentOptions = (props) => {
  const {
    isLoading,
    paymethods,
    businessId,
    isCustomerMode,
    onPaymentChange,
    paymethodsCustom,
    UIComponent,
    isKiosk,
    returnUrl,
    urlscheme,
    usePaymenthodSelectedForV2
  } = props

  const fetchPaymethods = isKiosk
  const [events] = useEvent()
  const [ordering] = useApi()
  const [{ getGiftCardPaymethods }] = useUtils()
  const [orderState, { changePaymethod }] = useOrder()
  const [{ device_code, token }] = useSession()
  const orderTotal = orderState.carts?.[`businessId:${businessId}`]?.total || 0

  const [paymethodsList, setPaymethodsList] = useState({ paymethods: [], loading: true, error: null })
  const [paymethodSelected, setPaymethodsSelected] = useState(props.paySelected ?? null)
  const [paymethodData, setPaymethodData] = useState({})
  const [isOpenMethod, setIsOpenMethod] = useState({ paymethod: null })

  const requestsState = {}

  const paymethodV2Featured = useMemo(() => {
    const paymethod = paymethodsList?.paymethods?.find(p => usePaymenthodSelectedForV2 ? (p.gateway === paymethodSelected?.gateway) : p.gateway === props.paySelected?.gateway)
    return (paymethod?.version === 'v2' &&
      paymethod.featured) || ''
  }, [paymethodsList, props.paySelected, paymethodSelected?.gateway])

  const filterPaymentMethods = (paymentMethods) => {
    const validations = {
      stripe: (data) => !data?.publishable,
      paypal: (data) => !Object.keys(data).length || !data?.client_id,
      stripe_connect: (data) => !data?.stripe?.publishable,
      google_pay: (data) => !data?.publishable,
      apple_pay: (data) => !data?.publishable,
      global_google_pay: (data) => !data?.publishable,
      global_apple_pay: (data) => !data?.publishable
    }

    return paymentMethods.filter(method => {
      const validation = validations?.[method?.paymethod?.gateway]
      return validation ? !validation(method?.data) : method?.paymethod?.gateway
    })
  }

  const parsePaymethods = (paymethods) => {
    const _paymethods = paymethods &&
      filterPaymentMethods(paymethods)
        .filter(credentials => isCustomerMode
          ? !paymethodsNotAllowed.includes(credentials?.paymethod?.gateway) &&
          paymethodsCallcenterMode.includes(credentials?.paymethod?.gateway)
          : ![...paymethodsNotAllowed, stripeLink].includes(credentials?.paymethod?.gateway))
        .map(credentials => {
          return {
            ...credentials?.paymethod,
            sandbox: credentials?.sandbox,
            credentials: credentials?.data
          }
        })
    return _paymethods
  }

  /**
   * Method to get payment options from API
   */
  const getPaymentOptions = async () => {
    setPaymethodsList({ ...paymethodsList, loading: true })

    const headers = {
      'X-Physical-Device-Code-X': `${device_code}`
    }

    try {
      const { content: { error, result } } = await ordering.businesses(businessId).get(device_code ? { headers } : {})
      if (!error) {
        paymethodsList.paymethods = parsePaymethods(result.paymethods)
      }
      setPaymethodsList({
        ...paymethodsList,
        loading: false,
        error: error ? result : null,
        paymethods: error ? [] : parsePaymethods(result.paymethods)
      })
    } catch (error) {
      setPaymethodsList({
        ...paymethodsList,
        loading: false,
        error: [error.message]
      })
    }
  }

  /**
   * Method to set payment option selected by user
   * @param {Object} val object with information of payment method selected
   */
  const handlePaymethodClick = (paymethod, isPopupMethod, dataToChange = {}) => {
    const paymentsDirect = ['paypal', 'square']
    events.emit('add_payment_option', paymethod)
    if (isPopupMethod) {
      setPaymethodsSelected(paymentsDirect.includes(paymethod?.gateway) ? paymethod : null)
      setIsOpenMethod({ ...isOpenMethod, paymethod })
      handlePaymethodDataChange({})
      return
    }
    if (paymethodsCustom) {
      paymethodsCustom(paymethod)
    }
    setPaymethodsSelected(paymethod)
    setIsOpenMethod({ ...isOpenMethod, paymethod })
    handlePaymethodDataChange(dataToChange)
  }

  const handlePaymethodDataChange = (data) => {
    setPaymethodData(data)
    if (Object.keys(data).length) {
      const paymethod = (usePaymenthodSelectedForV2 ? paymethodSelected : props.paySelected || isOpenMethod.paymethod) || props.paySelected || isOpenMethod.paymethod

      setPaymethodsSelected(paymethod)
      onPaymentChange && onPaymentChange({
        paymethodId: paymethod?.id,
        id: paymethod?.id,
        gateway: paymethod?.gateway,
        paymethod: paymethod?.paymethod || paymethod,
        credentials: paymethod?.credentials ?? null,
        data
      })
      return
    }
    if (paymethodSelected) {
      onPaymentChange && onPaymentChange({
        paymethodId: paymethodSelected.id,
        id: paymethodSelected.id,
        name: paymethodSelected.name,
        gateway: paymethodSelected.gateway,
        paymethod: paymethodSelected?.paymethod || paymethodSelected,
        data
      })
    } else {
      onPaymentChange && onPaymentChange(null)
    }
  }

  useEffect(() => {
    if (paymethodSelected && (!props.disableAutoUpdate || paymethodsWithAutoUpdate.includes(paymethodSelected?.gateway))) {
      const _paymethodData = paymethodData
      if (redirectMethods.includes(paymethodSelected?.gateway)) {
        _paymethodData.success_url = returnUrl
        _paymethodData.cancel_url = returnUrl
      }
      if (urlscheme) {
        _paymethodData.urlscheme = urlscheme
      }
      changePaymethod(businessId, paymethodSelected.id, JSON.stringify(_paymethodData))
    }
  }, [paymethodSelected, paymethodData])

  useEffect(() => {
    if (
      paymethodSelected &&
      (['card_delivery', 'cash', 'stripe_redirect'].includes(paymethodSelected?.gateway) ||
        !paymethodsExisting.includes(paymethodSelected?.gateway))
    ) {
      onPaymentChange && onPaymentChange({
        paymethodId: paymethodSelected.id,
        id: paymethodSelected.id,
        name: paymethodSelected.name,
        gateway: paymethodSelected.gateway,
        paymethod: paymethodSelected?.paymethod || paymethodSelected,
        data: paymethodData
      })
    } else if (paymethodSelected === null && onPaymentChange) {
      onPaymentChange(null)
    }
  }, [paymethodSelected])

  useEffect(() => {
    if (fetchPaymethods) {
      getPaymentOptions()
      return
    }
    if (paymethods) {
      setPaymethodsList({
        ...paymethodsList,
        loading: isLoading,
        paymethods: parsePaymethods(paymethods)
      })
    } else {
      if (businessId) {
        if (businessId === -1) {
          const getPaymethods = async () => {
            const source = {}
            requestsState.list = source
            const paymethod = await getGiftCardPaymethods(token, source)
            setPaymethodsList({
              ...paymethodsList,
              loading: false,
              paymethods: paymethod
            })
          }
          getPaymethods()
        } else {
          getPaymentOptions()
        }
      }
    }
    return () => {
      if (typeof requestsState?.list?.cancel === 'function') {
        requestsState?.list?.cancel?.()
      }
    }
  }, [isLoading, businessId])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          orderTotal={orderTotal}
          isOpenMethod={isOpenMethod}
          paymethodsList={paymethodsList}
          paymethodSelected={paymethodSelected}
          paymethodData={paymethodData}
          paymethodV2Featured={paymethodV2Featured}
          setPaymethodData={setPaymethodData}
          handlePaymethodClick={handlePaymethodClick}
          handlePaymethodDataChange={handlePaymethodDataChange}
        />
      )}
    </>
  )
}

PaymentOptions.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Options, this must be containt an array of payment options
   */
  paymethods: PropTypes.array,
  /**
   * businessId, this must be contains business id to fetch business from API
   */
  businessId: PropTypes.number,
  /**
   * Get option selected
   */
  onPaymentChange: PropTypes.func
}
