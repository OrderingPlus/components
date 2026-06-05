/**
 * Pure business-listing pipeline shared by main thread and Web Worker.
 */

export const toLiteBusiness = (business) => ({
  id: business?.id,
  slug: business?.slug,
  reviewsTotal: business?.reviews?.total ?? 0,
  offersLength: business?.offers?.length ?? 0
})

export const toLiteBusinesses = (businesses) => {
  if (!businesses?.length) return []
  return businesses.map(toLiteBusiness)
}

export const sortBusinessesByReview = (businesses) => {
  if (!businesses?.length) return []
  return [...businesses].sort((a, b) => (b.reviewsTotal ?? 0) - (a.reviewsTotal ?? 0))
}

export const filterBusinessesWithOffers = (businesses) => {
  if (!businesses?.length) return []
  return businesses.filter((business) => (business.offersLength ?? 0) > 0)
}

export const promoteBusinessIdsBySlug = (businesses, ids, slug) => {
  if (!ids?.length || !slug) return ids
  const slugById = new Map(businesses.map((b) => [b.id, b.slug]))
  const fromIndex = ids.findIndex((id) => slugById.get(id) === slug)
  if (fromIndex <= 0) return ids
  const next = [...ids]
  const [element] = next.splice(fromIndex, 1)
  next.unshift(element)
  return next
}

export const mergeBusinessPages = ({ resultIds, prevIds, newFetch, prepend }) => {
  if (newFetch) return resultIds
  if (prepend) return [...resultIds, ...prevIds]
  return [...prevIds, ...resultIds]
}

export const dedupeBusinessIds = (ids) => {
  if (!ids?.length) return []
  const seen = new Set()
  const result = []
  ids.forEach((id) => {
    if (id == null || seen.has(id)) return
    seen.add(id)
    result.push(id)
  })
  return result
}

export const postProcessBusinesses = ({
  businesses,
  slugSourceBusinesses,
  mode,
  newFetch,
  prevIds,
  actualSlug,
  prepend
}) => {
  let ids = businesses.map((b) => b.id)

  if (mode === 'review') {
    ids = sortBusinessesByReview(businesses).map((b) => b.id)
  } else if (mode === 'offers') {
    ids = filterBusinessesWithOffers(businesses).map((b) => b.id)
  } else {
    ids = mergeBusinessPages({ resultIds: ids, prevIds: prevIds || [], newFetch, prepend })
    ids = dedupeBusinessIds(ids)
  }

  if (actualSlug) {
    ids = promoteBusinessIdsBySlug(slugSourceBusinesses || businesses, ids, actualSlug)
  }

  return { ids }
}

export const reconcileBusinessesByIds = (businesses, ids, { prevBusinesses = [] } = {}) => {
  if (!ids?.length) return []
  const source = [...(prevBusinesses || []), ...(businesses || [])]
  const map = new Map()
  source.forEach((business) => {
    if (business?.id) map.set(business.id, business)
  })
  return ids.map((id) => map.get(id)).filter(Boolean)
}

export const runPostProcessBusinessesTask = (payload) => postProcessBusinesses(payload)
