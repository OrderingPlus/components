import React, { useEffect, useState } from 'react'
import PropTypes, { string } from 'prop-types'
import { useApi } from '../../contexts/ApiContext'

/**
 * Component to manage drivers behavior without UI component
 */
export const DriverList = (props) => {
  const {
    drivers,
    UIComponent,
    propsToFetch
  } = props

  const [ordering] = useApi()

  /**
   * Array to save drivers
   */
  const [driverList, setDriverList] = useState({ drivers: [], loading: true, error: null })

  /**
   * Method to get drivers from API
   */
  const getDriverList = async () => {
    try {
      setDriverList({
        ...driverList,
        loading: true
      })
      const where = [{ attribute: 'level', value: '4' }]
      const { content: { error, result } } = await ordering.users().select(propsToFetch).where(where).get()
      if (!error) {
        setDriverList({
          ...driverList,
          loading: false,
          drivers: result
        })
      } else {
        setDriverList({
          ...driverList,
          loading: false,
          error: result
        })
      }
    } catch (error) {
      setDriverList({
        ...driverList,
        loading: false,
        error: [error || error?.toString() || error?.message]
      })
    }
  }

  useEffect(() => {
    if (drivers) {
      setDriverList({ ...driverList, loading: false, drivers })
    } else {
      getDriverList()
    }
  }, [])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          driverList={driverList}
        />
      )}
    </>
  )
}

DriverList.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Array of business props to fetch
   */
  propsToFetch: PropTypes.arrayOf(string)
}

DriverList.defaultProps = {
  propsToFetch: ['name', 'lastname', 'email', 'phone', 'photo', 'cellphone', 'country_phone_code', 'city_id', 'city', 'address', 'addresses', 'address_notes', 'dropdown_option_id', 'dropdown_option', 'location', 'zipcode', 'level', 'enabled', 'middle_name', 'second_lastname']
}
