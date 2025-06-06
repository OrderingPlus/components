import React, { useEffect, useLayoutEffect, useState } from 'react'
import PropTypes, { string } from 'prop-types'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useApi } from '../../contexts/ApiContext'
import { useOrder } from '../../contexts/OrderContext'
import { useConfig } from '../../contexts/ConfigContext'
import { useSession } from '../../contexts/SessionContext'
import { useOrderingTheme } from '../../contexts/OrderingThemeContext'
import { useWebsocket } from '../../contexts/WebsocketContext'
dayjs.extend(utc)

export const BusinessList = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent,
    initialBuisnessType,
    initialOrderType,
    initialOrderByValue,
    initialFilterKey,
    initialFilterValue,
    initialPricelevel,
    isOfferBusinesses,
    isSortByReview,
    isSearchByName,
    isSearchByDescription,
    isFeatured,
    isDoordash,
    asDashboard,
    paginationSettings,
    customLocation,
    propsToFetch,
    onBusinessClick,
    windowPathname,
    currentPageParam,
    franchiseId,
    businessId,
    cityId,
    actualSlug,
    searchValueCustom,
    isKiosk,
    isCustomerMode,
    avoidRefreshUserInfo,
    showSearchBar
  } = props

  const [businessesList, setBusinessesList] = useState({ businesses: [], loading: true, error: null })
  const [paginationProps, setPaginationProps] = useState({
    currentPage: (paginationSettings.controlType === 'pages' && paginationSettings.initialPage && paginationSettings.initialPage >= 1) ? paginationSettings.initialPage - 1 : 0,
    pageSize: paginationSettings.pageSize ?? 10,
    totalItems: null,
    totalPages: null
  })
  const [businessTypeSelected, setBusinessTypeSelected] = useState(null)
  const [priceLevelSelected, setPriceLevelSelected] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [timeLimitValue, setTimeLimitValue] = useState(null)
  const [orderByValue, setOrderByValue] = useState(initialOrderByValue ?? null)
  const [maxDeliveryFee, setMaxDeliveryFee] = useState(null)
  const [orderState] = useOrder()
  const [orderingTheme] = useOrderingTheme()
  const [ordering] = useApi()
  const socket = useWebsocket()
  const [{ auth, token, user }, { refreshUserInfo }] = useSession()
  const [requestsState, setRequestsState] = useState({})
  const [citiesState, setCitiesState] = useState({ loading: false, cities: [], error: null })
  const [{ configs }] = useConfig()
  const [franchiseEnabled, setFranchiseEnabled] = useState(false)
  const [firstLoad, setFirstLoad] = useState(false)
  const isValidMoment = (date, format) => dayjs.utc(date, format).format(format) === date
  const rex = /^[A-Za-z0-9\s]+$/g
  const advancedSearchEnabled = configs?.advanced_business_search_enabled?.value === '1' || showSearchBar
  const showCities = (!orderingTheme?.business_listing_view?.components?.cities?.hidden && orderState?.options?.type === 2 && !props.disabledCities) ?? false
  const unaddressedTypes = configs?.unaddressed_order_types_allowed?.value.split('|').map(value => Number(value)) || []
  const isAllowUnaddressOrderType = unaddressedTypes.includes(orderState?.options?.type)

  const sortBusinesses = (array, option) => {
    if (option === 'review') {
      return array.sort((a, b) => b.reviews.total - a.reviews.total)
    }
    return array
  }
  /**
   * Get businesses by params, order options and filters
   * @param {boolean} newFetch Make a new request or next page
   */
  const getBusinesses = async (newFetch, specificPagination, prev, options = {}) => {
    const prevBusinesses = businessesList.businesses
    try {
      setBusinessesList({
        ...businessesList,
        loading: true,
        businesses: newFetch ? [] : businessesList.businesses
      })

      const defaultLatitude = Number(configs?.location_default_latitude?.value)
      const defaultLongitude = Number(configs?.location_default_longitude?.value)
      const isInvalidDefaultLocation = isNaN(defaultLatitude) || isNaN(defaultLongitude)
      const defaultLocation = {
        lat: !isInvalidDefaultLocation ? defaultLatitude : 40.7744146,
        lng: !isInvalidDefaultLocation ? defaultLongitude : -73.9678064
      }

      let parameters = asDashboard
        ? {}
        : {
            location: !customLocation
              ? (isAllowUnaddressOrderType && !orderState.options?.address?.location)
                  ? defaultLocation
                  : `${orderState.options?.address?.location?.lat},${orderState.options?.address?.location?.lng}`
              : `${customLocation?.lat},${customLocation?.lng}`,
            type: !initialOrderType ? (orderState.options?.type || 1) : initialOrderType
          }
      if (isCustomerMode) {
        parameters.disabled_business = true
      }
      if (orderByValue) {
        parameters = {
          ...parameters,
          orderBy: orderByValue
        }
      }
      if (searchValue?.length >= 3 && advancedSearchEnabled) {
        parameters = {
          ...parameters,
          term: searchValue,
          order_type_id: orderState?.options?.type,
          location: JSON.stringify(
            (isAllowUnaddressOrderType && !orderState.options?.address?.location)
              ? defaultLocation
              : { lat: orderState.options?.address?.location?.lat, lng: orderState.options?.address?.location?.lng }
          )
        }
      }
      if (!isSortByReview && !isOfferBusinesses) {
        const paginationParams = {
          page: newFetch ? 1 : paginationProps.currentPage + 1,
          page_size: paginationProps.pageSize,
          version: 'v2',
          orderBy: 'distance'
        }
        parameters = { ...parameters, ...paginationParams }
      }
      if (orderState.options?.moment && isValidMoment(orderState.options?.moment, 'YYYY-MM-DD HH:mm:ss')) {
        const moment = dayjs.utc(orderState.options?.moment, 'YYYY-MM-DD HH:mm:ss').local().unix()
        parameters.timestamp = moment
      }

      let where = null
      const conditions = []
      if (initialBuisnessType || businessTypeSelected) {
        conditions.push({
          attribute: 'types',
          conditions: [{
            attribute: 'id',
            value: !initialBuisnessType ? businessTypeSelected : initialBuisnessType
          }]
        })
      }
      if (isFeatured) {
        conditions.push({ attribute: 'featured', value: true })
      }

      if (franchiseId) {
        conditions.push({ attribute: 'franchise_id', value: franchiseId })
      }

      if (priceLevelSelected || initialPricelevel) {
        conditions.push({ attribute: 'price_level', value: initialPricelevel ?? priceLevelSelected })
      }

      if (businessId) {
        conditions.push({
          attribute: typeof businessId === 'string' ? 'slug' : 'id',
          value: businessId
        })
      }

      if (timeLimitValue) {
        if (orderState.options?.type === 1) {
          conditions.push({
            attribute: 'delivery_time',
            value: {
              condition: '<=',
              value: timeLimitValue
            }
          })
        }
        if (orderState.options?.type === 2) {
          conditions.push({
            attribute: 'pickup_time',
            value: {
              condition: '<=',
              value: timeLimitValue
            }
          })
        }
      }

      if (maxDeliveryFee) {
        conditions.push({
          attribute: 'delivery_price',
          value: {
            condition: '<=',
            value: maxDeliveryFee
          }
        })
      }

      if (searchValue) {
        const searchConditions = []
        const isSpecialCharacter = rex.test(searchValue)
        if (isSearchByName) {
          searchConditions.push(
            {
              attribute: 'name',
              value: {
                condition: 'ilike',
                value: (!isSpecialCharacter || props?.isForceSearch) ? `%${searchValue}%` : encodeURI(`%${searchValue}%`)
              }
            }
          )
        }
        if (isSearchByDescription) {
          searchConditions.push(
            {
              attribute: 'description',
              value: {
                condition: 'ilike',
                value: (!isSpecialCharacter || props?.isForceSearch) ? `%${searchValue}%` : encodeURI(`%${searchValue}%`)
              }
            }
          )
        }
        conditions.push({
          conector: 'OR',
          conditions: searchConditions
        })
      }

      if (orderState?.options?.city_id || cityId) {
        conditions.push({
          attribute: 'city_id',
          value: cityId || orderState?.options?.city_id
        })
      }

      if (conditions.length) {
        where = {
          conditions,
          conector: 'AND'
        }
      }

      if (specificPagination || currentPageParam) {
        const paginationParams = {
          page: specificPagination || currentPageParam,
          page_size: paginationProps.pageSize
        }
        parameters = { ...parameters, ...paginationParams }
      }

      const source = {}
      requestsState.businesses = source
      setRequestsState({ ...requestsState })

      const fetchEndpoint = (advancedSearchEnabled && searchValue?.length >= 3) || (!where && !asDashboard)
        ? where ? ordering.businesses().select(propsToFetch).parameters(parameters).where(where) : ordering.businesses().select(propsToFetch).parameters(parameters)
        : where && asDashboard
          ? ordering.businesses().select(propsToFetch).parameters(parameters).where(where).asDashboard()
          : where && !asDashboard
            ? ordering.businesses().select(propsToFetch).parameters(parameters).where(where)
            : ordering.businesses().select(propsToFetch).parameters(parameters).asDashboard()

      const { content: { error, result, pagination } } = await fetchEndpoint.get({ cancelToken: source, advancedSearch: advancedSearchEnabled && searchValue?.length >= 3 })

      if (!error) {
        if (isSortByReview) {
          const _result = sortBusinesses(result, 'review')
          businessesList.businesses = _result
        } else if (isOfferBusinesses) {
          const offerBuesinesses = result.filter(_business => _business?.offers.length > 0)
          businessesList.businesses = offerBuesinesses
        } else {
          businessesList.businesses = newFetch ? result : (prev ? [...result, ...businessesList.businesses] : [...businessesList.businesses, ...result])
        }
        let nextPageItems = 0
        if (pagination?.current_page !== pagination?.total_pages) {
          const remainingItems = pagination.total - businessesList.businesses.length
          nextPageItems = remainingItems < pagination.page_size ? remainingItems : pagination.page_size
        }
        setPaginationProps({
          ...paginationProps,
          currentPage: pagination?.current_page,
          totalPages: pagination?.total_pages,
          totalItems: pagination?.total,
          nextPageItems
        })
      }

      const businesses = businessesList.businesses

      if (actualSlug) {
        const fromIndex = businesses.findIndex(business => business.slug === actualSlug)
        const toIndex = 0
        if (fromIndex !== toIndex) {
          const element = businesses.splice(fromIndex, 1)[0]
          businesses.splice(toIndex, 0, element)
        }
      }

      setBusinessesList({
        ...businessesList,
        loading: false,
        error,
        businesses: businesses.length ? businesses : prevBusinesses,
        result,
        fetched: true
      })
      setFirstLoad(true)
    } catch (err) {
      if (err.constructor.name !== 'Cancel') {
        setBusinessesList({
          ...businessesList,
          loading: false,
          businesses: prevBusinesses,
          error: true,
          fetched: true,
          result: [err.message]
        })
        setFirstLoad(true)
      }
    }
  }

  /**
   * Get franchise info from API
   */
  const getFranchise = async () => {
    try {
      setFranchiseEnabled(false)
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      }
      const functionFetch = `${ordering.root}/franchises/${franchiseId}`

      const response = await fetch(functionFetch, requestOptions)
      const { result } = await response.json()
      if (result?.enabled) setFranchiseEnabled(result?.enabled)
      else setBusinessesList({ ...businessesList, loading: false })
    } catch (err) {
      setBusinessesList({ ...businessesList, loading: false })
    }
  }

  const getCities = async () => {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-App-X': ordering.appId,
        'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
        'X-Socket-Id-X': socket?.getId()
      }
    }
    setCitiesState({ ...citiesState, loading: true })
    const response = await fetch(`${ordering.root}/countries`, requestOptions)
    const { result, error, pagination } = await response.json()

    if (!error) {
      setCitiesState({
        ...citiesState,
        loading: false,
        cities: result?.map(country => country?.cities).flat(),
        pagination
      })
    }
  }

  /**
   * Cancel businesses request
   */
  useEffect(() => {
    const request = requestsState.businesses
    return () => {
      request && request?.cancel()
    }
  }, [requestsState.businesses])

  /**
   * Listening order option and filter changes
   */
  useEffect(() => {
    if (
      (orderState.loading || (asDashboard && !auth) ||
        ((!orderState.options?.address?.location && !isAllowUnaddressOrderType) && !asDashboard && !customLocation)) ||
      (auth && !orderState?.options?.user_id)
    ) return

    if (!isDoordash && !franchiseId) {
      getBusinesses(true, currentPageParam)
    }
  }, [
    orderState.options?.type,
    orderState.options?.moment,
    orderState.options?.city_id,
    orderState.options?.address_id,
    orderState.options?.address?.address,
    JSON.stringify(orderState.options?.address?.location),
    ordering?.countryCode,
    orderState.loading,
    businessTypeSelected,
    priceLevelSelected,
    searchValue,
    initialPricelevel,
    initialBuisnessType,
    timeLimitValue,
    orderByValue,
    maxDeliveryFee,
    businessId
  ])

  useEffect(() => {
    if ((orderState.loading || (!orderState.options?.address?.location && !isAllowUnaddressOrderType && !asDashboard && !customLocation))) {
      setBusinessesList({ ...businessesList, loading: false })
      return
    }
    if (((isDoordash || franchiseEnabled) && !showSearchBar) || (showSearchBar && (searchValue?.length >= 3 || !searchValue))) {
      getBusinesses(true)
    }
  }, [
    JSON.stringify(orderState.options),
    franchiseEnabled,
    businessTypeSelected,
    searchValue,
    priceLevelSelected,
    timeLimitValue,
    orderByValue,
    maxDeliveryFee,
    businessId
  ])

  useLayoutEffect(() => {
    if (isDoordash) {
      getBusinesses(true)
    }
  }, [windowPathname])

  useEffect(() => {
    if (franchiseId) {
      getFranchise()
    }
  }, [franchiseId])

  /**
   * Listening initial filter
   */
  useEffect(() => {
    if (!initialFilterKey && !initialFilterValue) return
    switch (initialFilterKey) {
      case 'category':
        handleChangeBusinessType(initialFilterValue)
        break
      case 'timeLimit':
        handleChangeTimeLimit(initialFilterValue)
        break
      case 'search':
        handleChangeSearch(initialFilterValue)
        break
      case 'orderBy':
        handleChangeOrderBy(initialFilterValue)
        break
      case 'maxDeliveryFee':
        handleChangeMaxDeliveryFee(initialFilterValue)
        break
    }
  }, [initialFilterKey, initialFilterValue])

  useEffect(() => {
    if (citiesState.loading) return
    if (showCities) {
      getCities()
    }
  }, [showCities])

  useEffect(() => {
    if (firstLoad) {
      handleChangeSearch(searchValueCustom)
    }
  }, [searchValueCustom])

  /**
   * Default behavior business click
   * @param {object} business Business clicked
   */
  const handleBusinessClick = (business) => {
    onBusinessClick && onBusinessClick(business)
  }

  /**
   * Change business type
   * @param {object} businessType Business type
   */
  const handleChangeBusinessType = (businessType) => {
    if (businessType !== businessTypeSelected) {
      setBusinessesList({
        ...businessesList,
        businesses: [],
        loading: true
      })
      setBusinessTypeSelected(businessType)
    }
  }

  /**
   * Change price level
   * @param {string} priceLevel price level
   */
  const handleChangePriceLevel = (priceLevel) => {
    if (priceLevel === priceLevelSelected) {
      setPriceLevelSelected(null)
      return
    }
    setPriceLevelSelected(priceLevel)
  }

  /**
   * Change text to search
   * @param {string} search Search value
   */
  const handleChangeSearch = (search) => {
    if (!!search !== !!searchValue && !showSearchBar) {
      setBusinessesList({
        ...businessesList,
        businesses: [],
        loading: true
      })
    } else {
      setBusinessesList({
        ...businessesList,
        loading: false
      })
    }
    if (search !== undefined) {
      setSearchValue(search)
    }
  }

  /**
   * Change time limt value
   * @param {string} time time limt value (for example: 0:30)
   */
  const handleChangeTimeLimit = (time) => {
    if (!!time !== !!timeLimitValue) {
      setBusinessesList({
        ...businessesList,
        businesses: [],
        loading: true
      })
    } else {
      setBusinessesList({
        ...businessesList,
        loading: false
      })
    }
    setTimeLimitValue(time)
  }

  /**
   * Change orderBy value
   * @param {string} orderBy orderBy value
   */
  const handleChangeOrderBy = (orderBy) => {
    if (orderBy !== orderByValue) {
      setBusinessesList({
        ...businessesList,
        businesses: [],
        loading: true
      })
    } else {
      setBusinessesList({
        ...businessesList,
        loading: false
      })
    }
    setOrderByValue(orderBy)
  }

  /**
   * Change max delivery fee
   * @param {number} deliveryFee max delivery fee
   */
  const handleChangeMaxDeliveryFee = (deliveryFee) => {
    if (maxDeliveryFee !== deliveryFee) {
      setBusinessesList({
        ...businessesList,
        businesses: [],
        loading: true
      })
    } else {
      setBusinessesList({
        ...businessesList,
        loading: false
      })
    }
    setMaxDeliveryFee(deliveryFee)
  }

  /**
   * Method to update business list
   * @param {number} businessId business id
   * @param {object} changes business info
   */
  const handleUpdateBusinessList = (businessId, changes) => {
    const updatedBusinesses = businessesList?.businesses.map(business => {
      if (business?.id === businessId) {
        return {
          ...business,
          ...changes
        }
      }
      return business
    })
    setBusinessesList({
      ...businessesList,
      businesses: updatedBusinesses
    })
  }

  const getFavoriteList = async (page, pageSize = paginationSettings.pageSize) => {
    try {
      setBusinessesList({
        ...businessesList,
        loading: true
      })
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      }
      const url = `${ordering.root}/users/${user?.id}/favorite_businesses?page=${page}&page_size=${pageSize}`
      const response = await fetch(url, requestOptions)
      const content = await response.json()
      if (!content.error) {
        setPaginationProps({
          currentPage: content.pagination.current_page,
          pageSize: content.pagination.page_size || paginationSettings.pageSize,
          totalPages: content.pagination.total_pages,
          total: content.pagination.total,
          from: content.pagination.from,
          to: content.pagination.to
        })
        const idList = content?.result?.reduce((ids, product) => [...ids, product?.object_id], [])
        const conditions = []
        conditions.push({
          attribute: 'id',
          value: idList
        })
        const where = {
          conditions,
          conector: 'AND'
        }
        let fetchEndpoint = `${ordering.root}/business?where=${JSON.stringify(where)}`
        if (propsToFetch) fetchEndpoint = `${fetchEndpoint}&params=${propsToFetch}`
        fetchEndpoint = `${fetchEndpoint}&location=${`${orderState.options?.address?.location?.lat},${orderState.options?.address?.location?.lng}`}`
        fetchEndpoint = `${fetchEndpoint}&type=${orderState?.options?.type}`
        const _response = await fetch(fetchEndpoint)
        const { error, result } = await _response.json()
        setBusinessesList({
          ...businessesList,
          loading: false,
          error,
          businesses: result,
          result,
          fetched: true
        })
      } else {
        setBusinessesList({
          ...businessesList,
          loading: false,
          error: content.error,
          businesses: content?.result,
          result: content?.result,
          fetched: true
        })
      }
    } catch (error) {
      setBusinessesList({
        ...businessesList,
        loading: false,
        error: error?.message,
        result: [error.message],
        fetched: true
      })
    }
  }

  useEffect(() => {
    if (!avoidRefreshUserInfo) {
      token && !isKiosk && refreshUserInfo()
    }
  }, [token, isKiosk, avoidRefreshUserInfo])

  return (
    <>
      {
        UIComponent && (
          <UIComponent
            {...props}
            businessesList={businessesList}
            paginationProps={paginationProps}
            searchValue={searchValue}
            timeLimitValue={timeLimitValue}
            businessTypeSelected={businessTypeSelected}
            orderByValue={orderByValue}
            maxDeliveryFee={maxDeliveryFee}
            priceLevelSelected={priceLevelSelected}
            handleChangePriceLevel={handleChangePriceLevel}
            getBusinesses={getBusinesses}
            handleChangeSearch={handleChangeSearch}
            handleChangeTimeLimit={handleChangeTimeLimit}
            handleChangeOrderBy={handleChangeOrderBy}
            handleBusinessClick={handleBusinessClick}
            handleChangeBusinessType={handleChangeBusinessType}
            handleChangeMaxDeliveryFee={handleChangeMaxDeliveryFee}
            franchiseEnabled={franchiseEnabled}
            handleUpdateBusinessList={handleUpdateBusinessList}
            getCities={getCities}
            setPaginationProps={setPaginationProps}
            citiesState={citiesState}
            getFavoriteList={getFavoriteList}
          />
        )
      }
    </>
  )
}

BusinessList.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Array of business props to fetch
   */
  propsToFetch: PropTypes.arrayOf(string),
  /**
   * Function to get business clicked
   */
  onBusinessClick: PropTypes.func
}

const defaultProps = {
  propsToFetch: ['id', 'name', 'header', 'logo', 'location', 'schedule', 'open', 'ribbon', 'delivery_price', 'distance', 'delivery_time', 'pickup_time', 'reviews', 'offers', 'food', 'laundry', 'alcohol', 'groceries', 'slug', 'city', 'city_id'],
  paginationSettings: { initialPage: 1, pageSize: 10, controlType: 'infinity' }
}
