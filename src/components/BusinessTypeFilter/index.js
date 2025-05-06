import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'
import { useWebsocket } from '../../contexts/WebsocketContext'

export const BusinessTypeFilter = (props) => {
  const {
    businessTypes,
    onChangeBusinessType,
    defaultBusinessType,
    hideAllCategory,
    UIComponent
  } = props

  const [ordering] = useApi()
  const socket = useWebsocket()

  /**
   * This property is used to set in state the current value
   */
  const [typeSelected, setTypeSelected] = useState(defaultBusinessType)

  /**
   * This state save the business type info from API
   */
  const [typesState, setTypesState] = useState({ loading: true, error: null, types: [], pagination: null })

  /**
   * Handle when select value changes
   */
  const handleChangeBusinessType = (businessType) => {
    setTypeSelected(businessType)
    onChangeBusinessType(businessType)
  }

  /**
   * Method to get business types from API
   */
  const getBusinessTypes = async () => {
    try {
      const response = await fetch(`${ordering.root}/business_types?where=[{"attribute":"enabled","value":true}]`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      })
      const { error, result, pagination } = await response.json()
      if (!error) {
        if (result.length > 0 && !hideAllCategory) {
          result.unshift({ id: null, enabled: true, image: null, name: 'All' })
        }
        setTypesState({
          ...typesState,
          loading: false,
          types: result,
          pagination
        })
        return
      }
      setTypesState({
        ...typesState,
        loading: false,
        error: result
      })
    } catch (error) {
      setTypesState({
        ...typesState,
        loading: false,
        error: [error || error?.toString() || error?.message]
      })
    }
  }

  useEffect(() => {
    if (businessTypes) {
      setTypesState({
        ...typesState,
        loading: false,
        types: businessTypes
      })
    } else {
      getBusinessTypes()
    }
  }, [businessTypes])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          typesState={typesState}
          businessTypes={businessTypes}
          currentTypeSelected={typeSelected}
          handleChangeBusinessType={handleChangeBusinessType}
        />
      )}
    </>
  )
}

BusinessTypeFilter.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Array that contains business types to filter
   */
  businessTypes: PropTypes.arrayOf(PropTypes.object),
  /**
   * Default business type to show
   */
  defaultBusinessType: PropTypes.string
}
