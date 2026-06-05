import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useOrder } from '../../contexts/OrderContext'
import { useConfig } from '../../contexts/ConfigContext'

const getTipCents = (value) => Math.round(Number(value || 0) * 100)

const centsToAmount = (cents) => Number((cents / 100).toFixed(2))

const splitFixedTipByBusiness = (driverTip, businessCount) => {
  const totalCents = getTipCents(driverTip)
  const baseCents = Math.trunc(totalCents / businessCount)
  const correctionCents = totalCents - baseCents * businessCount

  return { baseCents, correctionCents }
}

/**
 * Component to manage driver tips behavior without UI component
 */
export const DriverTips = (props) => {
  props = { ...defaultProps, ...props }
  const {
    UIComponent,
    businessId,
    businessIds,
    useOrderContext
  } = props

  if (useOrderContext && !businessId && !businessIds) {
    throw new Error('`businessId` is required when `useOrderContext` is true.')
  }

  /**
   * Order context
   */
  const [orderState, { changeDriverTip }] = useOrder()
  /**
   * Config context
   */
  const [{ configs }] = useConfig()
  /**
   * Save percentage selected by user
   */
  const [optionSelected, setOptionSelected] = useState(0)
  /**
   * Amount of driver tip, calculate with order.total and optionSelected
   */
  const [driverTipAmount, setDriverTipAmount] = useState(0)

  /**
   * handler when user change driver tip option
   * @param {number} val
   */
  const handlerChangeOption = (driverTip, isFixedPrice = props.isFixedPrice) => {
    driverTip = typeof driverTip === 'string' ? parseFloat(driverTip) : driverTip
    if (useOrderContext) {
      if (businessIds) {
        const { baseCents, correctionCents } = !isFixedPrice
          ? { baseCents: 0, correctionCents: 0 }
          : splitFixedTipByBusiness(driverTip, businessIds.length)

        const tipsPerCart = businessIds.map((bid, idx) => {
          const value = !isFixedPrice
            ? driverTip
            : centsToAmount(baseCents + (idx === 0 ? correctionCents : 0))

          return { bid, value }
        })

        Promise.all(tipsPerCart.map(tip => changeDriverTip(tip.bid, tip.value, isFixedPrice)))
      } else {
        changeDriverTip(businessId, driverTip, isFixedPrice)
      }
    } else {
      setOptionSelected(driverTip)
    }
    props.handlerChangeDriverOption && props.handlerChangeDriverOption(driverTip)
  }

  useEffect(() => {
    const orderDriverTipRate = orderState.carts?.[`businessId:${businessId ?? businessIds?.[0]}`]?.driver_tip_rate || 0
    const orderDriverTip = orderState.carts?.[`businessId:${businessId ?? businessIds?.[0]}`]?.driver_tip || 0
    const isFixedPrice = parseInt(configs?.driver_tip_type?.value, 10) === 1 || !!parseInt(configs?.driver_tip_use_custom?.value, 10) // 1 - fixed, 2 - percentage

    setOptionSelected(isFixedPrice ? orderDriverTip : orderDriverTipRate)
    setDriverTipAmount(orderDriverTip)
  }, [orderState])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          driverTipAmount={driverTipAmount}
          optionSelected={optionSelected}
          handlerChangeOption={handlerChangeOption}
        />
      )}
    </>
  )
}

DriverTips.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Cart business id
   */
  businessId: PropTypes.number,
  /**
   * Switch to use order context
   */
  useOrderContext: PropTypes.bool,
  /**
   * driver tips options
   */
  driverTipsOptions: PropTypes.arrayOf(PropTypes.number),
  /**
   * method to get option selected
   */
  handlerChangeDriverOption: PropTypes.func
}

const defaultProps = {
  useOrderContext: true
}
