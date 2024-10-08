import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'

/**
 * Component to manage login behavior without UI component
 */
export const CmsContent = (props) => {
  const {
    UIComponent,
    pageSlug,
    onNotFound
  } = props

  /**
   * Array to save the body of the page
   */
  const [cmsState, setCmsState] = useState({ body: null, loading: false, error: null })
  const [ordering] = useApi()
  const requestsState = {}
  /**
   * Method used to get the page by slug
   */
  const getPage = async (slug) => {
    setCmsState({ ...cmsState, loading: true })
    try {
      const source = {}
      requestsState.page = source
      const { content: { error, result } } = await ordering.pages(slug).get({ cancelToken: source })
      setCmsState({ ...cmsState, loading: false })
      if (!error) {
        setCmsState({ ...cmsState, body: result.body })
      } else {
        setCmsState({ ...cmsState, error: result })
        onNotFound && onNotFound(pageSlug)
      }
    } catch (err) {
      if (err.constructor.name !== 'Cancel') {
        setCmsState({ ...cmsState, loading: false, error: [err.message] })
      }
    }
  }

  useEffect(() => {
    getPage(pageSlug)
    return () => {
      if (requestsState.page) {
        requestsState.page.cancel()
      }
    }
  }, [])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          cmsState={cmsState}
        />
      )}
    </>
  )
}

CmsContent.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType
}
