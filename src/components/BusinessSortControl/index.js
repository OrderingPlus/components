import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export const BusinessSortControl = (props) => {
  const {
    orderType,
    sortOptions,
    defaultSortOption,
    onChangeSortOption,
    UIComponent
  } = props

  /**
   * This property is used to set in state the current value
   */
  const [optionSelected, setTypeSelected] = useState(defaultSortOption)
  /**
   * Filter new sort options array based in order type property
   */
  const [sortOptionsFiltered, setSortOptionsFiltered] = useState(sortOptions)

  /**
   * Handle when select value changes
   */
  const handleChangeSortOption = (val) => {
    setTypeSelected(val)
    if (onChangeSortOption) {
      onChangeSortOption(val)
    }
  }

  useEffect(() => {
    const propToDelete = orderType === 'delivery_time' ? 'Pickup time' : 'Delivery time'
    setSortOptionsFiltered(sortOptions.filter(option => option !== propToDelete))
  }, [orderType])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          orderType={orderType}
          sortOptions={sortOptionsFiltered}
          currentOptionSelected={optionSelected}
          onChangeSortOption={handleChangeSortOption}
        />
      )}
    </>
  )
}

BusinessSortControl.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Array that contains business sort options to filter
   */
  sortOptions: PropTypes.arrayOf(PropTypes.string),
  /**
   * Default business sort option to show
   */
  defaultSortOption: PropTypes.string,
  /**
   * Property to switch delivery or pickup time on sort options select
   */
  orderType: PropTypes.number,
  /**
   * onChangeSortOption, get value from UI
   */
  onChangeSortOption: PropTypes.func
}
