import React, { createContext, useContext, useEffect, useState } from 'react'
import { Ordering } from '../../sdk/lib/index'

/**
 * Create ApiContext
 * Context to use Ordering API on the app
 */
export const ApiContext = createContext()

/**
 * Api provider to manage api request
 * @param {props} props
 */
export const ApiProvider = ({ settings, children }) => {
  const [ordering, setOrdering] = useState(new Ordering(settings))
  const [language, setLanguage] = useState(settings.language)

  const _setLanguage = (languageCode) => {
    if (languageCode === language) return
    setLanguage(languageCode)
  }

  const _setOrderingState = (values) => {
    setOrdering(new Ordering({ ...values }))
  }

  useEffect(() => {
    if (ordering.language === language) return
    const _ordering = new Ordering({
      ...settings,
      ...ordering,
      language
    })
    setOrdering(_ordering)
  }, [language])

  useEffect(() => {
    _setOrderingState(settings)
  }, [settings?.project])

  const functions = {
    setLanguage: _setLanguage,
    setOrdering: _setOrderingState
  }

  return (
    <ApiContext.Provider value={[ordering, functions]}>
      {children}
    </ApiContext.Provider>
  )
}

/**
 * Hook to get api state
 */
export const useApi = () => {
  const apiManager = useContext(ApiContext)
  return apiManager || [{}]
}
