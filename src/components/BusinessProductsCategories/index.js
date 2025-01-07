import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useOrder } from '../../contexts/OrderContext'
import { useCustomer } from '../../contexts/CustomerContext'
import { useApi } from '../../contexts/ApiContext'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export const BusinessProductsCategories = (props) => {
  const {
    categories,
    onClickCategory,
    UIComponent,
    filterByMenus,
    isCustomerMode,
    businessSingleId,
    categoriesProps,
    location
  } = props

  const [orderState] = useOrder()
  const [customerState] = useCustomer()
  const [ordering] = useApi()
  const [categoriesState, setCategoriesState] = useState({ categories: [], loading: false, error: null })
  const [featuredProducts, setFeaturedProducts] = useState(false)
  const requestsState = {}
  const isValidMoment = (date, format) => dayjs.utc(date, format).format(format) === date

  const getBusinessCategories = async () => {
    if (!businessSingleId) return
    setCategoriesState({ ...categoriesState, loading: true })
    const source = {}
    requestsState.categories = source
    const parameters = {
      version: 'v2',
      type: orderState.options?.type || 1,
      features: true,
      location: location
        ? `${location?.lat},${location?.lng}`
        : orderState.options?.address?.location
          ? `${orderState.options?.address?.location?.lat},${orderState.options?.address?.location?.lng}`
          : null,
      ...(orderState.options?.moment && isValidMoment(orderState.options?.moment, 'YYYY-MM-DD HH:mm:ss') && {
        timestamp: dayjs.utc(orderState.options?.moment, 'YYYY-MM-DD HH:mm:ss').local().unix()
      }),
      ...(filterByMenus && { menu_id: filterByMenus }),
      ...(isCustomerMode && customerState?.user?.id && { user_id: customerState?.user?.id })
    }

    try {
      const { content: { result } } = await ordering.businesses(businessSingleId).categories().select(categoriesProps).parameters(parameters).get({ cancelToken: source })
      const hasFeatured = result?.some(category => category.products?.some(product => product?.featured))
      setFeaturedProducts(hasFeatured)
      setCategoriesState({
        ...categoriesState,
        categories: result || [],
        loading: false
      })
    } catch (err) {
      setCategoriesState({
        ...categoriesState,
        loading: false,
        error: [err.message]
      })
    }
  }

  useEffect(() => {
    if (!categories && !orderState.loading && Object.keys(orderState || {})?.length > 0 && !categoriesState.loading) {
      getBusinessCategories()
    }
  }, [JSON.stringify(orderState), businessSingleId, filterByMenus])

  useEffect(() => {
    if (categories) return
    const request = requestsState.categories
    return () => {
      request && request.cancel && request.cancel()
    }
  }, [requestsState.categories])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          categories={categories}
          categoriesState={categoriesState}
          handlerClickCategory={onClickCategory}
          featuredProducts={featuredProducts}
        />
      )}
    </>
  )
}

BusinessProductsCategories.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * categories, this must be contains an array of products categories
   */
  categories: PropTypes.arrayOf(PropTypes.object)
}
