export const parseUnaddressedOrderTypes = (configValue) => {
  if (!configValue) return []
  return configValue.split('|').map((value) => Number(value)).filter(Number.isFinite)
}

export const orderTypeRequiresAddress = (orderType, unaddressedTypes = []) => {
  if (!orderType) return false
  return !unaddressedTypes.includes(Number(orderType))
}

export const hasOrderAddress = (orderOptions) => {
  const address = orderOptions?.address
  if (address?.location?.lat == null || address?.location?.lng == null) return false
  return true
}

export const shouldRequireOrderAddress = (orderType, orderOptions, unaddressedTypes = []) => {
  return orderTypeRequiresAddress(orderType, unaddressedTypes) && !hasOrderAddress(orderOptions)
}
