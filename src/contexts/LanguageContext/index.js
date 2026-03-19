import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { useApi } from '../ApiContext'

/**
 * Create LanguageContext
 * This context will manage the current languages internally and provide an easy interface
 */
export const LanguageContext = createContext()

/**
 * Custom provider to languages manager
 * This provider has a reducer for manage languages state
 * @param {props} props
 * {restOfProps} props
 * This prop doesn't need permission from sdk put extra settings there.
 */
export const LanguageProvider = ({ settings, children, strategy, restOfProps }) => {
  const [state, setState] = useState({
    loading: true,
    dictionary: {}
  })

  const [ordering, apiHelper] = useApi()

  /**
   * Load language from localstorage and set state or load default language
   */
  const setLanguageFromLocalStorage = async () => {
    const language = await strategy.getItem('language', true)
    if (!language) {
      if (restOfProps?.use_project_domain) {
        setState((prev) => ({ ...prev, loading: false }))
        return
      }
      loadDefaultLanguage()
    } else {
      setState((prev) => ({ ...prev, language }))
      apiHelper.setLanguage(language?.code)
    }
  }

  const updateLanguageContext = async () => {
    try {
      setState((prev) => (prev.loading ? prev : { ...prev, loading: true }))
      const _language = await strategy.getItem('language', true)
      let dictionary = {}
      const { content: { error: errDict, result: resDict } } = await ordering.translations().asDictionary().get()
      dictionary = errDict ? {} : resDict

      const { content: { error, result } } = await ordering.languages().where([{ attribute: _language ? _language?.code : 'default', value: true }]).get()
      const language = { id: result[0].id, code: result[0].code, rtl: result[0].rtl }
      apiHelper.setLanguage(result[0].code)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error ? typeof result === 'string' ? result : result?.[0] : null,
        dictionary,
        language
      }))
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const refreshTranslations = useCallback(async () => {
    try {
      setState((prev) => (prev.loading ? prev : { ...prev, loading: true }))
      let params = {}
      const conditons = []
      const appInternalName = restOfProps?.app_internal_name ?? null
      if (appInternalName) {
        conditons.push({
          attribute: 'product',
          value: appInternalName
        })
        params = {
          ...params,
          version: 'v2'
        }
      }
      const { content: { error, result } } = await ordering.translations().parameters(params).where(conditons).asDictionary().get()
      setState((prev) => ({
        ...prev,
        loading: false,
        dictionary: error ? {} : result
      }))
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [ordering, restOfProps?.app_internal_name])

  const loadDefaultLanguage = useCallback(async () => {
    const _language = await strategy.getItem('language', true)
    try {
      const { content: { error, result } } = await ordering.languages().where([{ attribute: _language ? _language?.code : 'default', value: true }]).get()
      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: typeof result === 'string' ? result : result?.[0]
        }))
        return
      }
      const language = { id: result[0].id, code: result[0].code, rtl: result[0].rtl }
      apiHelper.setLanguage(result[0].code)
      setState((prev) => ({ ...prev, language }))
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [ordering, strategy, apiHelper])

  const setLanguage = useCallback(async (language) => {
    if (!language || language.id === state.language?.id) return
    const _language = { id: language.id, code: language.code, rtl: language.rtl }
    setState((prev) => ({ ...prev, loading: true, language: _language }))
    await strategy.setItem('language', _language, true)
    apiHelper.setLanguage(language?.code)
  }, [state.language?.id, strategy, apiHelper])

  /**
   * Refresh translation when change language from ordering
   */
  useEffect(() => {
    const checkLanguage = async () => {
      const isValidLanguage = !!(state?.language?.code && state?.language?.code === ordering?.language)
      const isProjectDomain = restOfProps?.use_project_domain
      if ((!isProjectDomain && isValidLanguage) || (isProjectDomain && !!ordering?.project && isValidLanguage)) {
        const token = await strategy.getItem('token')
        settings?.use_root_point && settings?.force_update_lang && !token ? updateLanguageContext() : refreshTranslations()
      }
    }

    checkLanguage()
  }, [state.language?.code, ordering])

  useEffect(() => {
    setLanguageFromLocalStorage()
  }, [])

  useEffect(() => {
    if (!restOfProps?.use_project_subdomain || !ordering?.project || ordering?.language === restOfProps?.api?.language) return
    loadDefaultLanguage()
  }, [ordering?.project])

  useEffect(() => {
    if (ordering.language !== state?.language?.code) return
    apiHelper.setLanguage(state?.language?.code)
  }, [state.language])

  const t = useCallback((key, fallback = null) => {
    let originalKey = key
    const appInternalName = restOfProps?.app_internal_name ?? null
    if (appInternalName !== null) {
      const prefix = `${appInternalName.toUpperCase()}_`
      if (!key?.startsWith || !key?.substring) return fallback ?? key
      if (!key?.startsWith(prefix)) {
        key = `${prefix}${key}`
      } else {
        originalKey = key.substring(prefix.length)
      }
    }
    const textValue = state?.dictionary?.[key] ?? state?.dictionary?.[originalKey] ?? fallback ?? key

    return textValue
  }, [state?.dictionary, restOfProps?.app_internal_name])

  const value = useMemo(
    () => [state, t, setLanguage, refreshTranslations, loadDefaultLanguage],
    [state, t, setLanguage, refreshTranslations, loadDefaultLanguage]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * Hook to get and update language state
 */
export const useLanguage = () => {
  const languageManager = useContext(LanguageContext)
  return languageManager || [{}, (key, fallback = null) => fallback || key, async () => {}, async () => {}]
}
