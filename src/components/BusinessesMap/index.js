import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useEvent } from '../../contexts/EventContext'

export const BusinessesMap = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent,
    businessList,
    userLocation,
    setErrors,
    onBusinessCustomClick,
    conserveAllBusinessProps
  } = props

  const [events] = useEvent()
  const [businessLocations, setBusinessLocations] = useState([])

  /**
   * Getting necessary info for locate business on the map
   */
  const getBusinessListLocations = () => {
    setBusinessLocations(businessList?.filter(business => business?.location?.lat && business?.location?.lng).map(business => {
      return {
        ...(conserveAllBusinessProps ? business : {}),
        lat: business?.location?.lat,
        lng: business?.location?.lng,
        icon: business.logo,
        slug: business.slug
      }
    }))
  }

  /**
   * @param {business_slug} slug
   * handler event when clicks business on the map
   */
  const onBusinessClick = (slug, business) => {
    if (onBusinessCustomClick) {
      return onBusinessCustomClick(slug, business)
    }
    events.emit('go_to_page', { page: 'business', params: { store: slug } })
  }

  useEffect(() => {
    getBusinessListLocations()
  }, [businessList])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          businessLocations={businessLocations}
          userLocation={userLocation}
          onBusinessClick={onBusinessClick}
          setErrors={setErrors}
        />
      )}
    </>
  )
}

BusinessesMap.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   *  Business list must contain location
   */
  businessList: PropTypes.array.isRequired,
  /**
    * User location is used for place center of the map
    */
  userLocation: PropTypes.object,
  /**
   * setter for map errors
   */
  setErrors: PropTypes.func,
  /**
   * handleCustomClick, function to get click event and return business slug without default behavior
   */
  onBusinessCustomClick: PropTypes.func
}

const defaultProps = {
  businessList: []
}
