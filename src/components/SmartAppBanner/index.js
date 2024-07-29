import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from 'styled-components'
import SmartBanner from 'smart-app-banner'

export const SmartAppBanner = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent,
    storeAndroidId,
    storeAppleId
  } = props

  const theme = useTheme()
  const [, t] = useLanguage()
  useEffect(() => {
    if (!storeAndroidId || !storeAppleId) return
    const logo = theme?.images?.logos?.isotype

    const metas = [
      { name: 'apple-itunes-app', content: `app-id=${storeAppleId}` },
      { name: 'google-play-app', content: `app-id=${storeAndroidId}` }
    ]
    // add metas to head
    metas.forEach(meta => {
      const metaTag = document.createElement('meta')
      metaTag.name = meta.name
      metaTag.content = meta.content
      document.head.appendChild(metaTag)
    })
    if (window.smartbanner) {
      window.smartbanner.publish()
    }
    const smartBanner = new SmartBanner({
      daysHidden: 15,
      daysReminder: 90,
      appStoreLanguage: 'us',
      title: t('MOBILE_APPNAME', 'Mobila appname'),
      author: t('MOBILE_APPNAME_AUTHOR', 'App name author'),
      button: t('VIEW', 'View'),
      store: {
        ios: t('ON_THE_APP_STORE', 'On the app store'),
        android: t('IN_GOOGLE_PLAY', 'In google play')
      },
      price: {
        ios: t('FREE', 'Free'),
        android: t('FREE', 'Free'),
        windows: t('FREE', 'Free')
      },
      icon: logo
    })
    return () => {
      metas.forEach(meta => {
        const metaTag = document.querySelector(`meta[name="${meta.name}"]`)
        metaTag && metaTag.remove()
      })
      smartBanner.hide()
    }
  }, [storeAndroidId, storeAppleId])

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
  storeAppleId: PropTypes.string
}

const defaultProps = {
  storeAndroidId: '',
  storeAppleId: ''
}
