import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'
import { useSession } from '../../contexts/SessionContext'
import { useWebsocket } from '../../contexts/WebsocketContext'

/**
 * Component to manage paymethods behavior without UI component
 */
export const PaymethodList = (props) => {
  const {
    paymethods,
    UIComponent
  } = props

  const [ordering] = useApi()
  const socket = useWebsocket()
  const [{ token, loading }] = useSession()

  /**
   * Array to save paymethods
   */
  const [paymethodList, setPaymethodList] = useState({ paymethods: [], loading: true, error: null })

  /**
   * Method to get paymethods from API
   */
  const getPaymethods = async () => {
    if (loading) return
    try {
      setPaymethodList({ ...paymethodList, loading: true })
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      }
      const functionFetch = `${ordering.root}/paymethods`

      const response = await fetch(functionFetch, requestOptions)
      const { error, result } = await response.json()
      if (!error) {
        setPaymethodList({
          ...paymethodList,
          loading: false,
          paymethods: result
        })
      } else {
        setPaymethodList({
          ...paymethodList,
          loading: false,
          error: result
        })
      }
    } catch (err) {
      setPaymethodList({
        ...paymethodList,
        loading: false,
        error: err
      })
    }
  }

  useEffect(() => {
    if (paymethods) {
      setPaymethodList({ ...paymethodList, loading: false, paymethods })
    } else {
      getPaymethods()
    }
  }, [])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          paymethodList={paymethodList}
        />
      )}
    </>
  )
}

PaymethodList.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType
}
