import React, { useEffect, useRef } from 'react'
import PropTypes, { string } from 'prop-types'
import { useGoogleMaps } from '../../hooks/useGoogleMaps'

/**
 * Component to make an input with Google Autocomplete
 * @param {object} props Props of AutocompleteInput component
 */
export const AutocompleteInput = (props) => {
  props = { ...defaultProps, ...props }
  const {
    apiKey,
    onChangeAddress,
    types,
    fields,
    countryCode,
    childRef
  } = props

  const [googleReady] = useGoogleMaps(apiKey)
  const inputRef = useRef()

  const inputProps = {}

  Object.entries(props).forEach(([key, value]) => {
    if (['googleReady', 'apiKey', 'onChangeAddress', 'setValue', 'childRef', 'countryCode', 'types', 'fields'].indexOf(key) === -1) {
      inputProps[key] = value
    }
  })

  const options = {
    types,
    fields
  }

  if (countryCode !== '*') {
    options.componentRestrictions = {
      country: countryCode
    }
  }

  useEffect(() => {
    if (googleReady && onChangeAddress) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options)
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const addressObj = {
          street_number: null,
          neighborhood: null,
          route: null,
          city: null,
          locality: null,
          sublocality: null,
          country: null,
          country_code: null,
          state: null,
          state_code: null,
          zipcode: null
        }
        const cityFallback = place?.address_components.find(component => component.types.includes('administrative_area_level_2'))
        if (place?.address_components) {
          for (const component of place.address_components) {
            const addressType = component.types[0]
            if (addressType === 'postal_code') {
              addressObj.zipcode = component.short_name
            }
            if (addressType === 'street_number') {
              addressObj.street_number = component.long_name
            }
            if (addressType === 'neighborhood') {
              addressObj.neighborhood = component.long_name
            }
            if (addressType === 'route') {
              addressObj.route = component.long_name
            }
            if (addressType === 'locality') {
              addressObj.city = component.long_name || cityFallback?.long_name
              addressObj.locality = component.long_name
            }
            if (component.types?.includes('sublocality')) {
              addressObj.sublocality = component.long_name
            }
            if (addressType === 'country') {
              addressObj.country = component.long_name
              addressObj.country_code = component.short_name
            }
            if (addressType === 'administrative_area_level_1') {
              addressObj.state = component.long_name
              addressObj.state_code = component.short_name
            }
          }
          const address = {
            address: place.formatted_address,
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            utc_offset: place.utc_offset_minutes,
            map_data: {
              library: 'google',
              place_id: place.place_id
            },
            ...addressObj
          }
          onChangeAddress(address)
        }
      })
    }
  }, [googleReady])

  useEffect(() => {
    const interval = setInterval(() => {
      if (inputRef.current.attributes.autocomplete &&
        inputRef.current.attributes.autocomplete.value === 'new-field'
      ) clearInterval(interval)
      inputRef.current.setAttribute('autocomplete', 'new-field')
    }, 100)
    return () => clearInterval(interval)
  })

  return (
    <input
      {...inputProps}
      autoComplete='new-field'
      disabled={!googleReady}
      ref={(e) => {
        inputRef.current = e
        childRef && childRef(e)
      }}
    />
  )
}

AutocompleteInput.propTypes = {
  /**
   * You Google Maps api key
   * @see apiKey What is Api Key ? https://developers.google.com/maps/gmp-get-started
   */
  apiKey: PropTypes.string.isRequired,
  /**
   * Fields for Google autocomplete
   * @see fields https://developers.google.com/maps/documentation/javascript/reference/places-widget#AutocompleteOptions.fields
   */
  fields: PropTypes.arrayOf(string),
  /**
   * types for Google autocomplete
   * @see types https://developers.google.com/maps/documentation/javascript/reference/places-widget#AutocompleteOptions.types
   */
  types: PropTypes.arrayOf(string),
  /**
   * types for Google autocomplete
   * @see countryCode https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#ComponentRestrictions.country
   */
  countryCode: PropTypes.string,
  /**
   * Function to get address when this changed
   * @param {object} address New address
   */
  onChangeAddress: PropTypes.func
}

const defaultProps = {
  types: [],
  fields: ['ALL'],
  countryCode: '*'
}
