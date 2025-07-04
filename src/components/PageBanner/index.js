import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useApi } from '../../contexts/ApiContext'
import { useWebsocket } from '../../contexts/WebsocketContext'
import { useConfig } from '../../contexts/ConfigContext'
import { useOrder } from '../../contexts/OrderContext'
dayjs.extend(utc)

export const PageBanner = (props) => {
  const {
    UIComponent,
    position,
    businessId,
    isProjectChange
  } = props

  const [ordering] = useApi()
  const socket = useWebsocket()
  const [{ configs }] = useConfig()
  const [orderState] = useOrder()

  const [pageBannerState, setPageBannerState] = useState({ loading: true, banner: null, error: null })

  const unaddressedTypes = configs?.unaddressed_order_types_allowed?.value.split('|').map(value => Number(value)) || []
  const isAllowUnaddressOrderType = unaddressedTypes.includes(orderState?.options?.type)
  const isValidMoment = (date, format) => dayjs.utc(date, format).format(format) === date

  /**
   * Method to get the page banner from API
   */
  const handleGetPageBanner = async () => {
    try {
      setPageBannerState({ ...pageBannerState, loading: true })
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      }
      let fetchEndpoint = `${ordering.root}/banner?position=${position}`
      if (position === 'web_business_listing' || position === 'app_business_listing') {
        const defaultLatitude = Number(configs?.location_default_latitude?.value)
        const defaultLongitude = Number(configs?.location_default_longitude?.value)
        const isInvalidDefaultLocation = isNaN(defaultLatitude) || isNaN(defaultLongitude)
        const defaultLocation = {
          lat: !isInvalidDefaultLocation ? defaultLatitude : 40.7744146,
          lng: !isInvalidDefaultLocation ? defaultLongitude : -73.9678064
        }
        const location = (isAllowUnaddressOrderType && !orderState.options?.address?.location)
          ? defaultLocation
          : orderState.options?.address?.location
        const type = orderState.options?.type || 1
        fetchEndpoint = `${ordering.root}/banner?position=${position}&location=${JSON.stringify(location)}&order_type_id=${type}`
      }
      if (position === 'web_business_page' || position === 'app_business_page') {
        fetchEndpoint = `${ordering.root}/banner?position=${position}&business_id=${businessId}`
      }
      if (position === 'app_home_page') {
        fetchEndpoint = `${ordering.root}/banner?position=${position}`
      }
      if (orderState.options?.moment && isValidMoment(orderState.options?.moment, 'YYYY-MM-DD HH:mm:ss')) {
        const moment = dayjs.utc(orderState.options?.moment, 'YYYY-MM-DD HH:mm:ss').local().unix()
        fetchEndpoint += `&timestamp=${moment}`
      }
      const response = await fetch(fetchEndpoint, requestOptions)
      const { error, result } = await response.json()
      const totalItems = result.reduce((items, banner) => [...items, ...banner?.items], [])
      setPageBannerState({
        loading: false,
        banner: error ? null : { items: totalItems },
        result,
        error: error ? result : null
      })
    } catch (error) {
      setPageBannerState({
        ...pageBannerState,
        loading: false,
        error: [error.message]
      })
    }
  }

  useEffect(() => {
    if (!position) return
    handleGetPageBanner()
  }, [position, businessId, JSON.stringify(orderState.options?.address?.location), orderState?.options?.type, orderState.options?.moment, ordering?.project])

  useEffect(() => {
    if (!position) return
    if (isProjectChange) {
      handleGetPageBanner()
    }
  }, [ordering?.project, isProjectChange])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          pageBannerState={pageBannerState}
        />
      )}
    </>
  )
}

PageBanner.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Callback function called when project changes and loading starts
   */
  isProjectChange: PropTypes.bool
}
