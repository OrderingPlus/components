/* eslint-disable camelcase */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useApi } from '../ApiContext'
import { useToast, ToastType } from '../ToastContext'
import { useLanguage } from '../LanguageContext'
/**
 * Create SessionContext
 * This context will manage the session internally and provide an easy interface
 */
export const SessionContext = createContext()

/**
 * Custom provider to session manager
 * This provider has a reducer for manage session state
 * @param {props} props
 */
export const SessionProvider = ({ children, strategy, checkInterval = 2000 }) => {
  const [state, setState] = useState({
    auth: null,
    token: null,
    user: null,
    loading: true,
    device_code: null
  })
  const stateRef = useRef(state)
  const [ordering] = useApi()
  const [, { showToast }] = useToast()
  const [, t] = useLanguage()

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const setValuesFromLocalStorage = async () => {
    const { auth, token, user, device_code } = await getValuesFromLocalStorage()
    console.log('auth', auth, device_code)
    setState(prevState => ({
      ...prevState,
      auth,
      token,
      user,
      loading: false,
      device_code
    }))
  }

  const getValuesFromLocalStorage = async () => {
    try {
      const auth = await strategy.getItem('token')
      const token = await strategy.getItem('token')
      const user = await strategy.getItem('user', true)
      const device_code = await strategy.getItem('device_code')
      return { auth, token, user, device_code }
    } catch (err) {
      console.log('err getValuesFromLocalStorage', err)
      setState(prevState => ({
        ...prevState,
        loading: false
      }))
    }
  }

  const login = async (values) => {
    await strategy.setItem('token', values?.token)
    await strategy.setItem('user', values?.user, true)
    if (values?.device_code) {
      await strategy.setItem('device_code', values?.device_code)
    }
    setState(prevState => ({
      ...prevState,
      auth: true,
      user: values?.user,
      token: values?.token,
      loading: false,
      device_code: values?.device_code || null
    }))
    return values?.user
  }

  const logout = async () => {
    await strategy.removeItem('token')
    await strategy.removeItem('user')
    await strategy.removeItem('device_code')
    const countryCodeFromLocalStorage = await strategy.getItem('country-code')
    if (countryCodeFromLocalStorage) {
      await strategy.removeItem('country-code')
    }
    setState(prevState => ({
      ...prevState,
      auth: false,
      user: null,
      token: null,
      loading: false,
      device_code: null
    }))
  }

  const changeUser = async (user) => {
    await strategy.setItem('user', user, true)
    setState(prevState => ({
      ...prevState,
      user,
      loading: false
    }))
  }

  const checkLocalStorage = async () => {
    try {
      const { token, user, device_code } = await getValuesFromLocalStorage()
      const currentState = stateRef.current
      // Update device_code if changed
      if (device_code && device_code !== currentState.device_code) {
        setState(prevState => ({
          ...prevState,
          device_code
        }))
      }
      if ((token || user?.session?.access_token) && !currentState.token) {
        login({
          user,
          token: token || user?.session?.access_token,
          device_code: device_code || currentState.device_code
        })
      }
      // Only logout if we had a token but now it's removed (explicit logout)
      // Don't logout if user is just not enabled - that should be handled differently
      if (!token && !user?.session?.access_token && currentState.token) {
        logout()
      }
    } catch (err) {
      console.log('err checkLocalStorage', err)
      setState(prevState => ({
        ...prevState,
        loading: false
      }))
    }
  }

  const refreshUserInfo = async () => {
    try {
      const currentState = stateRef.current
      const requestOptions = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${currentState.token}`,
          'X-App-X': ordering?.appId
        }
      }
      const response = await fetch(`${ordering.root}/users/${currentState.user?.id}`, requestOptions)
      const { result, error } = await response.json()
      if (!error) {
        setState(prevState => ({
          ...prevState,
          user: result,
          loading: false
        }))
        await strategy.setItem('user', result, true)
      } else {
        showToast(ToastType.Error, t('FAILED_TO_REFRESH_USER', 'Failed to refresh user'))
      }
    } catch (err) {
      showToast(ToastType.Error, t('FAILED_TO_REFRESH_USER', 'Failed to refresh user'))
    }
  }

  useEffect(() => {
    // Optimized for kiosk mode: check every 30 seconds instead of 2 seconds
    // to reduce disk I/O and battery drain in 24/7 operation
    const interval = setInterval(() => {
      checkLocalStorage()
    }, checkInterval)
    return () => clearInterval(interval)
  }, [checkInterval])

  useEffect(() => {
    setValuesFromLocalStorage()
  }, [])

  const functions = {
    login,
    logout,
    changeUser,
    refreshUserInfo
  }

  return (
    <SessionContext.Provider value={[state, functions]}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Hook to get and update session state
 */
export const useSession = () => {
  const sessionManager = useContext(SessionContext)
  return sessionManager || [{}, () => { }]
}
