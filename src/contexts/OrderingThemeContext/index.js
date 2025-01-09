import React, { createContext, useState, useContext, useEffect } from 'react'
import { useApi } from '../ApiContext'
import { useOptimizationLoad } from '../OptimizationLoadContext'

/**
 * Create OrderingThemeContext
 * This context will manage the current themes and layouts
 */
export const OrderingThemeContext = createContext()

/**
 * Custom provider to ordering themes and layouts manager
 * This provider has a reducer for manage themes and layouts state
 * @param {props} props
 */
export const OrderingThemeProvider = ({ children, settings, isValidColor }) => {
  const [state, setState] = useState({
    loading: true,
    theme: {},
    error: false
  })

  const [ordering] = useApi()
  const [optimizationLoad] = useOptimizationLoad()

  const _isValidColor = (color) => {
    if (isValidColor) {
      return isValidColor?.(color)
    }
    const s = new Option().style
    s.color = color
    return s.color !== ''
  }

  const validateFixColors = (obj) => {
    const newObj = JSON.parse(JSON.stringify(obj))

    const validateColors = (currentObj) => {
      Object.keys(currentObj).forEach(key => {
        if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
          validateColors(currentObj[key])
        } else if (key.toLowerCase().includes('color') && !_isValidColor(currentObj[key])) {
          currentObj[key] = ''
        }
      })
    }

    validateColors(newObj)
    return newObj
  }

  const getThemes = async (themes = null) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        'X-App-X': settings.appId
      }
    }
    try {
      let error = themes?.error ?? null
      let result = themes?.result ?? null
      if (!themes) {
        const response = await fetch(`${ordering.root}/theme`, requestOptions)
        const res = await response.json()
        error = res?.error
        result = res?.result
      }
      if (!error) {
        result = validateFixColors(result)
        setState({
          ...state,
          theme: result.values,
          loading: false,
          error: false
        })
        return
      }
      setState({
        ...state,
        theme: {},
        loading: false,
        error: true
      })
    } catch (err) {
      setState({
        ...state,
        theme: {},
        loading: false,
        error: err
      })
    }
  }

  const refreshTheme = () => {
    getThemes()
  }

  useEffect(() => {
    if (optimizationLoad.loading || !ordering?.project) return
    const _themes = optimizationLoad.result && !!optimizationLoad.result?.theme
      ? {
          error: optimizationLoad.error,
          result: { values: optimizationLoad.result?.theme }
        }
      : null
    getThemes(_themes)
  }, [optimizationLoad, ordering?.project])

  const functions = {
    refreshTheme
  }

  return (
    <OrderingThemeContext.Provider value={[state, functions]}>
      {children}
    </OrderingThemeContext.Provider>
  )
}

/**
 * Hook to get ordering theme
 */
export const useOrderingTheme = () => {
  const orderingThemeManager = useContext(OrderingThemeContext)
  const warningMessage = () => {
    console.warn('Must use OrderingThemeProvider to wrappe the app.')
  }
  /**
   * Functions to avoid fails
   */
  const functionsPlaceholders = {
    refreshTheme: warningMessage
  }

  return orderingThemeManager || [{}, functionsPlaceholders]
}
