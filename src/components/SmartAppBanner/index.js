import React, { useEffect } from 'react'
import { useConfig } from '../../contexts/ConfigContext'
import PropTypes from 'prop-types'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from 'styled-components'

export const SmartAppBanner = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent,
    storeAndroidId,
    storeAppleId
  } = props

  const [{ configs }] = useConfig()
  const theme = useTheme()
  const [, t] = useLanguage()

  useEffect(() => {
    if (!configs) return
    const logo = theme?.images?.logos?.isotype
    const metas = [
      { name: 'smartbanner:title', content: t('MOBILE_APPNAME', 'Mobila appname') },
      { name: 'smartbanner:author', content: t('MOBILE_APPNAME_AUTHOR', 'App name author') },
      { name: 'smartbanner:price', content: t('FREE', 'Free') },
      { name: 'smartbanner:price-suffix-apple', content: ` - ${t('ON_THE_APP_STORE', 'On the app store')}` },
      { name: 'smartbanner:price-suffix-google', content: ` - ${t('IN_GOOGLE_PLAY', 'In google play')}` },
      { name: 'smartbanner:icon-apple', content: logo },
      { name: 'smartbanner:icon-google', content: logo },
      { name: 'smartbanner:button', content: t('VIEW', 'View') },
      { name: 'smartbanner:button-url-apple', content: storeAppleId || configs?.android_app_id?.value },
      { name: 'smartbanner:button-url-google', content: storeAndroidId || configs?.ios_app_id?.value },
      { name: 'smartbanner:enabled-platforms', content: 'android,ios' },
      { name: 'smartbanner:close-label', content: t('CLOSE', 'Close') },
      { name: 'smartbanner:api', content: 'no' }
    ]
    // add metas to head
    metas.forEach(meta => {
      const metaTag = document.createElement('meta')
      metaTag.name = meta.name
      metaTag.content = meta.content
      document.head.appendChild(metaTag)
    })
  }, [configs])

  return (
    <>
      {UIComponent && (
        <UIComponent {...props} />
      )}
    </>
  )
}

SmartAppBanner.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * store android id
   */
  storeAndroidId: PropTypes.string,
  /**
   * store apple id
   */
  storeAppleId: PropTypes.string,
  /**
   * store kindle id
   */
  storeKindleId: PropTypes.string
}

const defaultProps = {
  storeAndroidId: '',
  storeAppleId: '',
  storeKindleId: ''
}
