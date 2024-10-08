import React from 'react'
import PropTypes from 'prop-types'

export const ProductImages = (props) => {
  const {
    hero,
    gallery,
    UIComponent
  } = props

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          hero={hero}
          gallery={gallery}
        />
      )}
    </>
  )
}

ProductImages.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * hero, this must be contain the main product image
   */
  hero: PropTypes.string,
  /**
   * gallery, this must be contain the array of product images
   */
  gallery: PropTypes.arrayOf(PropTypes.string)
}
