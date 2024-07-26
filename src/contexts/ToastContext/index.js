import React, { createContext, useContext, useState } from 'react'

// Defines the three kinds of message that are displayed
export const ToastType = {
  Info: 'INFO',
  Error: 'ERROR',
  Success: 'SUCCESS'
}

// Creates the toast context
export const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  // Calls setToastConfig in order to control the toast
  // toastConfig is null by default so the toast is hidden
  const [
    toastConfig,
    setToastConfig
  ] = useState(null)

  const showToast = (type, message, duration = 3000) => {
    setToastConfig({ type, message, duration })
  }

  const hideToast = () => {
    // Sets toast config to null in order to hide the toast
    setToastConfig(null)
  }

  return (
    <ToastContext.Provider value={[toastConfig, { showToast, hideToast }]}>
      {children}
    </ToastContext.Provider>
  )
}

// hook context

export function useToast () {
  const toastManager = useContext(ToastContext)
  return toastManager || [{}, () => {}]
}
