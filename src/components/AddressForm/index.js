import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { v4 } from 'uuid'
import { useSession } from '../../contexts/SessionContext'
import { useApi } from '../../contexts/ApiContext'
import { useOrder } from '../../contexts/OrderContext'
import { useValidationFields } from '../../contexts/ValidationsFieldsContext'
import { useCustomer } from '../../contexts/CustomerContext'
import { useConfig } from '../../contexts/ConfigContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { ToastType, useToast } from '../../contexts/ToastContext'

dayjs.extend(utc)

export const AddressForm = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent,
    addressId,
    address,
    useValidationFileds,
    onSaveAddress,
    isSelectedAfterAdd,
    onSaveCustomAddress,
    franchiseId,
    handleGoToLogin,
    avoidRefreshUserInfo
  } = props

  const [ordering] = useApi()
  const [validationFields] = useValidationFields()
  const [{ configs }] = useConfig()
  const [addressState, setAddressState] = useState({ loading: false, error: null, address: address || {} })
  const [formState, setFormState] = useState({ loading: false, changes: {}, error: null })
  const [userByToken, setUserByToken] = useState(null)
  const [mapBoxSuggestCount, setMapBoxSuggestCount] = useState(0)
  const [uuidv4, setUuidv4] = useState(v4())
  const [mapBoxSuggests, setMapBoxSuggest] = useState([])
  const [{ auth, user, token }, { refreshUserInfo }] = useSession()
  const requestsState = {}
  const [{ options }, { changeAddress }] = useOrder()
  const [languageState, t] = useLanguage()
  const [, { showToast }] = useToast()
  const userId = props.userId || user?.id
  const accessToken = props.accessToken || token
  const [, { setUserCustomer }] = useCustomer()

  const [isEdit, setIsEdit] = useState(false)
  const [businessesList, setBusinessesList] = useState({ businesses: [], loading: true, error: null })
  const [businessNearestState, setBusinessNearestState] = useState({ business: null, loading: false, error: null })

  const isValidMoment = (date, format) => dayjs.utc(date, format).format(format) === date
  const useAlternativeMap = configs?.use_alternative_to_google_maps?.value === '1'

  /**
   * Load an address by id
   * @param {number} userId User id for address user
   * @param {number} addressId Address id for address
   */
  const loadAddress = async (userId, addressId) => {
    try {
      setAddressState({ ...addressState, loading: true })
      const source = {}
      requestsState.address = source
      const { content } = await ordering.users(userId).addresses(addressId).get({ accessToken, cancelToken: source })
      setAddressState({
        loading: false,
        error: content.error ? content.result : null,
        address: content.error ? {} : content.result
      })
    } catch (err) {
      if (err.constructor.name !== 'Cancel') {
        setAddressState({
          loading: false,
          error: [err.message],
          address: {}
        })
      }
    }
  }

  /**
   * Update address data
   * @param {EventTarget} e Related HTML event
   */
  const handleChangeInput = (e) => {
    updateChanges({ [e.target.name]: e.target.value })
  }

  /**
   * Update address data
   * @param {object} changes object with changes
   */
  const updateChanges = (changes) => {
    setFormState({
      ...formState,
      changes: {
        ...formState.changes,
        ...changes
      }
    })
  }

  /**
   * Check if field should be show
   * @param {string} fieldName Field name
   */
  const showField = (fieldName) => {
    return !useValidationFileds ||
      (!validationFields.loading && !validationFields.fields?.address?.[fieldName]) ||
      (!validationFields.loading && validationFields.fields?.address?.[fieldName] &&
        validationFields.fields?.address?.[fieldName]?.enabled)
  }

  /**
   * Check if field is required
   * @param {string} fieldName Field name
   */
  const isRequiredField = (fieldName) => {
    return useValidationFileds &&
      !validationFields.loading &&
      validationFields.fields?.address?.[fieldName] &&
      validationFields.fields?.address?.[fieldName]?.enabled &&
      validationFields.fields?.address?.[fieldName]?.required
  }

  /**
   * Function to save current changes
   * Update if address id exist or create if not
   */
  const saveAddress = async (values, userCustomerSetup) => {
    if (onSaveCustomAddress) {
      onSaveCustomAddress(values)
      return
    }
    if (!auth && !userByToken?.session?.token) {
      changeAddress(
        { ...values, ...formState.changes },
        { country_code: values?.country_code ?? formState.changes?.country_code }
      )
      onSaveAddress && onSaveAddress(formState.changes)
      return
    }

    setFormState({ ...formState, loading: true })
    try {
      const { content } = await ordering
        .users(userByToken?.id || userId)
        .addresses(addressState.address?.id)
        .save({ ...values, ...formState.changes }, { accessToken: userByToken?.session?.token || accessToken })
      setFormState({
        ...formState,
        loading: false,
        error: content.error ? content.result : null,
        changes: content.error ? formState.changes : {}
      })
      if (!content.error) {
        setAddressState({
          ...addressState,
          address: content.result
        })
        if (isSelectedAfterAdd) {
          await changeAddress(content.result.id, {
            address: isEdit ? null : content.result,
            country_code: content.result?.country_code,
            type: options?.type,
            isEdit
          })
        }
        onSaveAddress && onSaveAddress(content.result)
      }
      if (userCustomerSetup) {
        await setUserCustomer(userCustomerSetup, true)
      }
      if (!avoidRefreshUserInfo) {
        refreshUserInfo()
      }
    } catch (err) {
      setFormState({
        ...formState,
        loading: false,
        error: [err.message],
        address: {}
      })
    }
  }

  const getBusinessDeliveryZones = async (location) => {
    if (!location) return
    try {
      setBusinessesList({
        ...businessesList,
        loading: true,
        businesses: []
      })
      let where = null
      const conditions = []
      const parameters = {
        location: `${location?.lat},${location?.lng}`,
        type: 2,
        page: 1,
        page_size: 20
      }
      if (franchiseId) {
        conditions.push({ attribute: 'franchise_id', value: franchiseId })
      }
      where = {
        conditions,
        conector: 'AND'
      }
      const source = {}
      requestsState.businesses = source
      const fetchEndpoint = ordering
        .businesses()
        .select(['delivery_zone', 'name', 'id', 'location', 'logo', 'slug', 'zones'])
        .parameters(parameters)
        .where(where)
      const { content: { error, result } } = await fetchEndpoint.get({ cancelToken: source })
      setBusinessesList({
        ...businessesList,
        loading: false,
        error,
        businesses: result.map(business => ({
          ...business?.location,
          icon: business?.logo,
          slug: business?.slug,
          zones: business?.zones
        })),
        result,
        fetched: true
      })
      return result
    } catch (err) {
      if (err.constructor.name !== 'Cancel') {
        setBusinessesList({
          ...businessesList,
          loading: false,
          error: true,
          fetched: true,
          result: [err.message]
        })
      }
    }
  }

  const getNearestBusiness = async (location, callback) => {
    try {
      setBusinessNearestState({
        ...businessNearestState,
        loading: true
      })
      const defaultLatitude = Number(configs?.location_default_latitude?.value)
      const defaultLongitude = Number(configs?.location_default_longitude?.value)
      const isInvalidDefaultLocation = isNaN(defaultLatitude) || isNaN(defaultLongitude)
      const defaultLocation = {
        lat: !isInvalidDefaultLocation ? defaultLatitude : 40.7744146,
        lng: !isInvalidDefaultLocation ? defaultLongitude : -73.9678064
      }
      let where = null
      let parameters = {
        location: location || defaultLocation,
        type: options?.type || 1,
        orderBy: 'distance'
      }
      const conditions = []
      const propsToFetch = ['name', 'address', 'location', 'distance', 'open', 'schedule', 'slug']
      const paginationParams = {
        page: 1,
        page_size: 5
      }

      if (options?.moment && isValidMoment(options?.moment, 'YYYY-MM-DD HH:mm:ss')) {
        const moment = dayjs.utc(options?.moment, 'YYYY-MM-DD HH:mm:ss').local().unix()
        parameters.timestamp = moment
      }
      parameters = { ...parameters, ...paginationParams }

      if (franchiseId) {
        conditions.push({ attribute: 'franchise_id', value: franchiseId })
      }
      if (conditions.length > 0) {
        where = {
          conditions,
          conector: 'AND'
        }
      }
      const source = {}
      requestsState.businesses = source
      const { content: { error, result } } = await ordering.businesses().select(propsToFetch).parameters(parameters).where(where).get({ cancelToken: source })
      if (!error) {
        const firstNearestOpenBusiness = result?.find(business => business?.open)
        setBusinessNearestState({
          business: firstNearestOpenBusiness,
          error: firstNearestOpenBusiness ? null : t('NO_BUSINESS_NEAR_LOCATION', 'No business near of you location') || error,
          loading: false
        })
        callback && callback(firstNearestOpenBusiness)
        return
      }
      setBusinessNearestState({
        business: null,
        error,
        loading: false
      })
    } catch (err) {
      setBusinessNearestState({
        ...businessNearestState,
        error: err?.message,
        loading: false
      })
    }
  }

  const getUserByToken = async () => {
    try {
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${props.accessToken}`
        }
      }
      const response = await fetch(`${ordering.root}/users/me`, requestOptions)
      const { error, result } = await response.json()
      if (!error) {
        setUserByToken(result)
        return
      }
      handleGoToLogin && handleGoToLogin()
    } catch (err) {
      handleGoToLogin && handleGoToLogin()
    }
  }

  const getSuggestedResult = async (search) => {
    if (!search) return
    try {
      const mapBoxToken = configs?.map_box_token?.value
      const params = {
        q: search,
        limit: 5,
        language: languageState?.language?.code?.slice?.(0, 2),
        access_token: mapBoxToken,
        session_token: uuidv4
      }

      let paramsFormatted = ''
      Object.keys(params)?.map((param, i, hash) => {
        (i + 1) === hash?.length
          ? paramsFormatted = paramsFormatted + `${param}=${params[param]}`
          : paramsFormatted = paramsFormatted + `${param}=${params[param]}&`
      })
      const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${paramsFormatted}`)
      const result = await response.json()
      if (result?.suggestions) {
        setMapBoxSuggest(result?.suggestions?.filter(suggest => suggest?.context?.address?.address_number))
      }
      setMapBoxSuggestCount((count) => count + 1)
    } catch (err) {
      showToast(ToastType.error, err?.message)
    }
  }

  const retrieveSuggestResult = async (mapboxId, callback) => {
    if (!mapboxId) return
    const mapBoxToken = configs?.map_box_token?.value
    const params = {
      language: languageState?.language?.code?.slice?.(0, 2),
      access_token: mapBoxToken,
      session_token: uuidv4
    }

    let paramsFormatted = ''
    Object.keys(params)?.map((param, i, hash) => {
      (i + 1) === hash?.length
        ? paramsFormatted = paramsFormatted + `${param}=${params[param]}`
        : paramsFormatted = paramsFormatted + `${param}=${params[param]}&`
    })
    const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?${paramsFormatted}`)
    const result = await response.json()
    const firstRetrieve = result?.features?.[0]
    const coordinates = firstRetrieve?.geometry?.coordinates
    const properties = firstRetrieve?.properties
    const location = { lat: coordinates?.[1], lng: coordinates?.[0] }
    const address = {
      location,
      address: properties?.full_address || properties?.address || properties?.name,
      country: properties?.context?.country?.name,
      country_code: properties?.context?.country?.country_code,
      locality: properties?.context?.locality?.name,
      region: properties?.context?.region?.name,
      state: properties?.context?.region?.name,
      state_code: properties?.context?.region?.region_code,
      street: properties?.context?.street?.name,
      mapbox_id: properties?.mapbox_id,
      zipcode: properties?.context?.postcode?.name,
      neighborhood: properties?.context?.neighborhood?.name,
      street_number: properties?.context?.address?.address_number,
      city: properties?.context?.place?.name,
      route: properties?.context?.street?.name || properties?.context?.street_name,
      map_data: {
        library: 'mapbox',
        place_id: properties?.mapbox_id
      }
    }
    callback && callback(address)
  }

  const resetMapBoxSessionToken = () => {
    if (!v4) return
    setUuidv4(v4())
    setMapBoxSuggestCount(0)
  }

  useEffect(() => {
    if (mapBoxSuggestCount >= 50 && useAlternativeMap) {
      resetMapBoxSessionToken()
    }
  }, [mapBoxSuggestCount, useAlternativeMap])

  useEffect(() => {
    if (formState?.changes?.location?.lat && useAlternativeMap) {
      resetMapBoxSessionToken()
    }
  }, [JSON.stringify(formState?.changes?.location), useAlternativeMap])

  useEffect(() => {
    setAddressState({
      ...addressState,
      address: address || {}
    })
  }, [address])

  useEffect(() => {
    if (addressId && !address) {
      loadAddress(userId, addressId)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (requestsState.address) {
        requestsState.address.cancel()
      }
    }
  }, [])

  /**
 * Cancel businesses request
 */
  useEffect(() => {
    const request = requestsState.businesses
    return () => {
      request && request.cancel()
    }
  }, [requestsState.businesses])

  useEffect(() => {
    if (props.confirmAddress) {
      getUserByToken()
    }
  }, [])

  return (
    <>
      {
        UIComponent && (
          <UIComponent
            {...props}
            formState={formState}
            showField={showField}
            updateChanges={updateChanges}
            handleChangeInput={handleChangeInput}
            isRequiredField={isRequiredField}
            saveAddress={saveAddress}
            addressState={addressState}
            setIsEdit={(val) => setIsEdit(val)}
            businessesList={businessesList}
            getBusinessDeliveryZones={getBusinessDeliveryZones}
            getNearestBusiness={getNearestBusiness}
            getSuggestedResult={getSuggestedResult}
            retrieveSuggestResult={retrieveSuggestResult}
            businessNearestState={businessNearestState}
            mapBoxSuggests={mapBoxSuggests}
          />
        )
      }
    </>
  )
}

AddressForm.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Prop to set address after add
   */
  isSelectedAfterAdd: PropTypes.bool,
  /**
   * Enable to get checkout fields to show/hide fields from Ordering API
   */
  useValidationFileds: PropTypes.bool,
  /**
   * Address object to edit
   */
  address: PropTypes.object,
  /**
   * User id of the address to load from Ordering API
   * Omit if you use a SessionProvier context and the address is of the logged user
   */
  userId: PropTypes.number,
  /**
   * Address id to edit and load from Ordering API
   */
  addressId: PropTypes.number,
  /**
   * Address id to edit and load from Ordering API
   */
  onSaveAddress: PropTypes.func,
  /**
   * Custom function
   */
  onSaveCustomAddress: PropTypes.func
}

const defaultProps = {
  useValidationFileds: false
}
