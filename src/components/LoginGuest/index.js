import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSession } from '../../contexts/SessionContext'
import { useApi } from '../../contexts/ApiContext'
import { useOrder } from '../../contexts/OrderContext'

/**
 * Component to manage Guest login behavior without UI component
 */
export const LoginGuest = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent
  } = props

  const [ordering] = useApi()
  const [{ token }] = useSession()
  const [{ options }] = useOrder()
  const [checkoutFieldsState, setCheckoutFieldsState] = useState({ fields: [], loading: false, error: null })

  const getValidationFieldOrderTypes = async () => {
    try {
      setCheckoutFieldsState({ ...checkoutFieldsState, loading: true })

      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      const where = [
        { attribute: 'order_type_id', value: options?.type },
        { attribute: 'enabled', value: true }
      ]
      const response = await fetch(`${ordering.root}/validation_field_order_types?where=${JSON.stringify(where)}`, requestOptions)
      const content = await response.json()
      if (!content?.error) {
        setCheckoutFieldsState({ fields: content?.result, loading: false })
      } else {
        setCheckoutFieldsState({ ...checkoutFieldsState, loading: false, error: content?.result })
      }
    } catch (err) {
      setCheckoutFieldsState({ ...checkoutFieldsState, loading: false, error: [err.message] })
    }
  }

  useEffect(() => {
    getValidationFieldOrderTypes()
  }, [])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          checkoutFieldsState={checkoutFieldsState}
        />
      )}
    </>
  )
}

LoginGuest.propTypes = {
  /**
   * UI Component, this must containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType
}

const defaultProps = {
}
