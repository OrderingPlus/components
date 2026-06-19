export const collectTypeIdsFromBusinesses = (businesses = []) => {
  const ids = new Set()
  for (const business of businesses) {
    business?.types?.forEach((type) => {
      if (type?.id != null) ids.add(type.id)
    })
  }
  return ids
}

export const filterBusinessTypesByLocation = (types = [], availableTypeIds) => {
  if (!availableTypeIds?.size) return types
  return types.filter((type) =>
    type?.id == null || type?.name === 'All' || availableTypeIds.has(type.id)
  )
}

export const normalizeAvailableTypeIds = (value) => {
  if (!value) return null
  if (value instanceof Set) return value.size ? value : null
  if (Array.isArray(value)) {
    const ids = new Set(value.filter((id) => id != null))
    return ids.size ? ids : null
  }
  return null
}
