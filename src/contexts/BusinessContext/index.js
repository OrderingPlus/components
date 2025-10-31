import React, { createContext, useContext, useState, useEffect } from 'react'
import { useApi } from '../ApiContext'
import { useLanguage } from '../LanguageContext'

/**
 * Create BusinessContext
 * This context will manage the business internally and provide an easy interface
 */
export const BusinessContext = createContext()

/**
 * Custom provider to business manager
 * This provider has a reducer for manage business state
 * @param {props} props
 */
export const BusinessProvider = ({ children, businessId }) => {
  const [state, setState] = useState({
    business: {},
    loading: false,
    error: null
  })

  const [ordering] = useApi()
  const [, t] = useLanguage()
  const businessParams = ['header', 'logo', 'name', 'slug', 'address', 'location', 'distance', 'address_notes', 'zipcode', 'internal_number']

  const getBusiness = async (id, retries = 0) => {
    try {
      setState({ ...state, loading: true })
      const { content: { result, error } } = await ordering.businesses(id)
        .select(businessParams)
        .get()

      if (error) {
        // If there's an error and we still have retries, try again
        if (retries < 2) {
          console.log(`Retry ${retries + 1} for business ${id}`)
          setTimeout(() => getBusiness(id, retries + 1), 1000) // Wait 1 second before retrying
          return
        }
        // If retries are exhausted, show error
        const errorMessage = t('ERROR_GETTING_BUSINESS', `Could not get business with id: ${id}`)
        setState({
          ...state,
          loading: false,
          business: {},
          error: errorMessage
        })
        return
      }

      setState({
        ...state,
        loading: false,
        business: result,
        error: null
      })
    } catch (err) {
      // If there's an exception and we still have retries, try again
      if (retries < 2) {
        console.log(`Retry ${retries + 1} for business ${id}, error: ${err.message}`)
        setTimeout(() => getBusiness(id, retries + 1), 1000) // Wait 1 second before retrying
        return
      }
      // If retries are exhausted, show error
      const errorMessage = t('ERROR_GETTING_BUSINESS', `Could not get business with id: ${id}`)
      setState({
        ...state,
        loading: false,
        error: errorMessage
      })
    }
  }

  const setBusiness = async (business) => {
    setState({ ...state, business })
  }

  const functions = {
    setBusiness
  }

  useEffect(() => {
    if (businessId) {
      getBusiness(businessId)
    }
  }, [businessId])

  return (
    <BusinessContext.Provider value={[state, functions]}>
      {children}
    </BusinessContext.Provider>
  )
}

/**
 * Hook to get and update business state
 */
export const useBusiness = () => {
  const BusinessManager = useContext(BusinessContext)
  return BusinessManager || [{}, () => {}]
}
