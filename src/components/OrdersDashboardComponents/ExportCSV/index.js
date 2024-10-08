import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../../contexts/ApiContext'
import { useSession } from '../../../contexts/SessionContext'

export const ExportCSV = (props) => {
  const {
    UIComponent,
    filterValues,
    franchiseId
  } = props
  const [ordering] = useApi()
  const [{ token, loading }] = useSession()
  const [actionStatus, setActionStatus] = useState({ loading: false, error: null, result: null })

  /**
   * Method to get csv from API
   */
  const getCSV = async (filterApply) => {
    if (loading) return
    try {
      setActionStatus({ ...actionStatus, loading: true })
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }

      const filterConditons = []

      if (franchiseId) {
        filterConditons.push({
          attribute: 'ref_business',
          conditions: [{
            attribute: 'franchise_id',
            value: franchiseId
          }]
        })
      }

      if (filterApply) {
        if (Object.keys(filterValues).length) {
          if (filterValues.statuses !== undefined) {
            if (filterValues.statuses.length > 0) {
              filterConditons.push({ attribute: 'status', value: filterValues.statuses })
            } else {
              filterConditons.push({ attribute: 'status', value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] })
            }
          }
          if (filterValues.deliveryFromDatetime !== undefined) {
            if (filterValues.deliveryFromDatetime !== null) {
              filterConditons.push(
                {
                  attribute: 'delivery_datetime',
                  value: {
                    condition: '>=',
                    value: encodeURI(filterValues.deliveryFromDatetime)
                  }
                }
              )
            }
          }
          if (filterValues.deliveryEndDatetime !== undefined) {
            if (filterValues.deliveryEndDatetime !== null) {
              filterConditons.push(
                {
                  attribute: 'delivery_datetime',
                  value: {
                    condition: '<=',
                    value: filterValues.deliveryEndDatetime
                  }
                }
              )
            }
          }
          if (filterValues.businessIds !== undefined) {
            if (filterValues.businessIds.length !== 0) {
              filterConditons.push(
                {
                  attribute: 'business_id',
                  value: filterValues.businessIds
                }
              )
            }
          }
          if (filterValues.driverIds !== undefined) {
            if (filterValues.driverIds.length !== 0) {
              filterConditons.push(
                {
                  attribute: 'driver_id',
                  value: filterValues.driverIds
                }
              )
            }
          }
          if (filterValues.deliveryTypes !== undefined) {
            if (filterValues.deliveryTypes.length !== 0) {
              filterConditons.push(
                {
                  attribute: 'delivery_type',
                  value: filterValues.deliveryTypes
                }
              )
            }
          }
          if (filterValues.paymethodIds !== undefined) {
            if (filterValues.paymethodIds.length !== 0) {
              filterConditons.push(
                {
                  attribute: 'paymethod_id',
                  value: filterValues.paymethodIds
                }
              )
            }
          }
        }
      }
      const functionFetch = (filterApply || franchiseId)
        ? `${ordering.root}/orders.csv?mode=dashboard&orderBy=id&where=${JSON.stringify(filterConditons)}`
        : `${ordering.root}/orders.csv?mode=dashboard&orderBy=id`

      const response = await fetch(functionFetch, requestOptions)
      const { error, result } = await response.json()
      if (!error) {
        setActionStatus({
          ...actionStatus,
          loading: false,
          result
        })
      } else {
        setActionStatus({
          ...actionStatus,
          loading: true,
          error: result
        })
      }
    } catch (err) {
      setActionStatus({
        ...actionStatus,
        loading: false,
        error: err
      })
    }
  }
  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          actionStatus={actionStatus}
          getCSV={getCSV}
        />
      )}
    </>
  )
}

ExportCSV.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType
}
