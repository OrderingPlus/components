import React, { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'
import { useWebsocket } from '../../contexts/WebsocketContext'

const PAGE_SIZE = 20

const ALL_CATEGORY = { id: null, enabled: true, image: null, name: 'All' }

const dedupeTypes = (types) => {
  const seen = new Set()
  return types.filter((type) => {
    const key = type?.id ?? 'all'
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const formatTypes = (result, page, hideAllCategory, currentTypes = []) => {
  const merged = page === 1 ? result : [...currentTypes, ...result]
  const deduped = dedupeTypes(merged)
  if (page === 1 && deduped.length > 0 && !hideAllCategory) {
    return dedupeTypes([ALL_CATEGORY, ...deduped])
  }
  return deduped
}

const formatTypesLegacy = (result, hideAllCategory) => {
  if (result.length > 0 && !hideAllCategory) {
    return dedupeTypes([ALL_CATEGORY, ...result])
  }
  return result
}

export const BusinessTypeFilter = (props) => {
  const {
    businessTypes,
    onChangeBusinessType,
    defaultBusinessType,
    hideAllCategory,
    isPaginationEnabled = false,
    UIComponent
  } = props

  const [ordering] = useApi()
  const socket = useWebsocket()

  const [typeSelected, setTypeSelected] = useState(defaultBusinessType)

  const [typesState, setTypesState] = useState({
    loading: true,
    loadingMore: false,
    error: null,
    types: [],
    pagination: { currentPage: 0, pageSize: PAGE_SIZE, totalPages: null }
  })
  const typesStateRef = useRef(typesState)
  const fetchingRef = useRef(false)

  const hasBusinessTypesFromProps = Array.isArray(businessTypes) && businessTypes.length > 0

  useEffect(() => {
    typesStateRef.current = typesState
  }, [typesState])

  const handleChangeBusinessType = (businessType) => {
    setTypeSelected(businessType)
    onChangeBusinessType(businessType)
  }

  const getBusinessTypesLegacy = useCallback(async () => {
    if (fetchingRef.current) return

    const prev = typesStateRef.current
    fetchingRef.current = true

    setTypesState({
      ...prev,
      loading: true,
      loadingMore: false,
      error: null
    })

    try {
      const response = await fetch(`${ordering.root}/business_types?where=[{"attribute":"enabled","value":true}]`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      })
      const { error, result, pagination } = await response.json()
      if (!error) {
        setTypesState({
          loading: false,
          loadingMore: false,
          error: null,
          types: formatTypesLegacy(result, hideAllCategory),
          pagination
        })
        return
      }
      setTypesState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: result
      }))
    } catch (error) {
      setTypesState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: [error?.message || error?.toString() || String(error)]
      }))
    } finally {
      fetchingRef.current = false
    }
  }, [ordering, socket, hideAllCategory])

  const getBusinessTypesPaginated = useCallback(async (page = 1) => {
    if (fetchingRef.current) return

    const prev = typesStateRef.current
    if (
      page > 1 &&
      prev.pagination?.totalPages != null &&
      prev.pagination.currentPage >= prev.pagination.totalPages
    ) {
      return
    }

    fetchingRef.current = true

    setTypesState({
      ...prev,
      loading: page === 1,
      loadingMore: page > 1,
      error: page === 1 ? null : prev.error
    })

    try {
      const where = encodeURIComponent('[{"attribute":"enabled","value":true}]')
      const response = await fetch(
        `${ordering.root}/business_types?where=${where}&page=${page}&page_size=${PAGE_SIZE}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-App-X': ordering.appId,
            'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
            'X-Socket-Id-X': socket?.getId()
          }
        }
      )
      const { error, result, pagination } = await response.json()
      if (!error) {
        setTypesState((prev) => ({
          loading: false,
          loadingMore: false,
          error: null,
          types: formatTypes(result, page, hideAllCategory, prev.types),
          pagination: {
            currentPage: pagination?.current_page ?? page,
            pageSize: pagination?.page_size ?? PAGE_SIZE,
            totalPages: pagination?.total_pages ?? null,
            total: pagination?.total ?? null
          }
        }))
        return
      }
      setTypesState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: result
      }))
    } catch (error) {
      setTypesState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: [error?.message || error?.toString() || String(error)]
      }))
    } finally {
      fetchingRef.current = false
    }
  }, [ordering, socket, hideAllCategory])

  const getNextBusinessTypes = useCallback(() => {
    if (hasBusinessTypesFromProps || !isPaginationEnabled) return
    const prev = typesStateRef.current
    const { currentPage, totalPages } = prev.pagination || {}
    if (prev.loading || prev.loadingMore) return
    if (totalPages != null && currentPage >= totalPages) return
    getBusinessTypesPaginated((currentPage || 0) + 1)
  }, [hasBusinessTypesFromProps, isPaginationEnabled, getBusinessTypesPaginated])

  useEffect(() => {
    if (hasBusinessTypesFromProps) {
      setTypesState({
        loading: false,
        loadingMore: false,
        error: null,
        types: businessTypes,
        pagination: { currentPage: 0, pageSize: PAGE_SIZE, totalPages: null }
      })
      return
    }
    if (isPaginationEnabled) {
      getBusinessTypesPaginated(1)
    } else {
      getBusinessTypesLegacy()
    }
  }, [hasBusinessTypesFromProps, isPaginationEnabled, businessTypes, getBusinessTypesPaginated, getBusinessTypesLegacy])

  const canLoadMore = isPaginationEnabled && !hasBusinessTypesFromProps

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          typesState={typesState}
          businessTypes={businessTypes}
          currentTypeSelected={typeSelected}
          handleChangeBusinessType={handleChangeBusinessType}
          isPaginationEnabled={isPaginationEnabled}
          getNextBusinessTypes={canLoadMore ? getNextBusinessTypes : undefined}
        />
      )}
    </>
  )
}

BusinessTypeFilter.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Array that contains business types to filter
   */
  businessTypes: PropTypes.arrayOf(PropTypes.object),
  /**
   * Default business type to show
   */
  defaultBusinessType: PropTypes.string,
  /**
   * Enable paginated fetch for business types (API must support page/page_size)
   */
  isPaginationEnabled: PropTypes.bool
}
