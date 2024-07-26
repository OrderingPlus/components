import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'

export const BusinessMenuListing = (props) => {
  const {
    businessId,
    UIComponent
  } = props

  const [ordering] = useApi()
  /**
   * Object to save menus, loading and error values
   */
  const [businessMenuList, setBusinessMenuList] = useState({ menus: [], loading: true, error: false })

  /**
   * Method to get menus from API
   */
  const getBusinessMenus = async () => {
    try {
      setBusinessMenuList({
        ...businessMenuList,
        loading: true
      })
      let where = null
      if (businessId) where = [{ attribute: 'business_id', value: businessId }]
      const fetchEndpoint = where
        ? ordering.businesses(businessId).menus().where(where)
        : ordering.businesses(businessId).menus()
      const { content: { result: menus } } = await fetchEndpoint.get()

      setBusinessMenuList({
        ...businessMenuList,
        loading: false,
        menus
      })
    } catch (error) {
      setBusinessMenuList({
        ...businessMenuList,
        loading: false,
        error
      })
    }
  }

  useEffect(() => {
    getBusinessMenus()
  }, [])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          businessMenuList={businessMenuList}
        />
      )}
    </>
  )
}

BusinessMenuListing.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Businessid, this must be contains an business id for get data from API
   */
  businessId: PropTypes.number
}
