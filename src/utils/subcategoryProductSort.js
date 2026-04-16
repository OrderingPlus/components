/**
 * Maps every subcategory id (recursive) to its rank for ordering products.
 * @param {object} parentCategory Category that owns `subcategories`
 * @returns {Record<number, number>}
 */
export const buildSubcategoryRankMap = (parentCategory) => {
  const map = {}
  const walk = (subs) => {
    if (!subs?.length) return
    subs.forEach((sub) => {
      map[sub.id] = Number(sub.rank) || 0
      walk(sub.subcategories)
    })
  }
  walk(parentCategory?.subcategories)
  return map
}

const compareProductsSecondary = (a, b, sortByValue) => {
  if (sortByValue === 'a-z') {
    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  }
  if (sortByValue === 'rank_desc') {
    return (b.rank || 0) - (a.rank || 0)
  }
  return (a.rank || 0) - (b.rank || 0)
}

/**
 * Sort products: subcategory rank first, then by sortByValue (rank / rank_desc / a-z).
 * @param {Array} products
 * @param {object} parentCategory
 * @param {string|null} sortByValue
 * @returns {Array}
 */
export const sortProductsBySubcategoryRank = (products, parentCategory, sortByValue) => {
  if (!products?.length) {
    return []
  }
  if (!parentCategory?.subcategories?.length) {
    return [...products]
  }
  const rankMap = buildSubcategoryRankMap(parentCategory)
  const parentId = parentCategory.id
  const getSubRank = (product) => {
    const cid = product?.category_id
    if (cid === parentId) return -1
    if (Object.prototype.hasOwnProperty.call(rankMap, cid)) {
      return rankMap[cid]
    }
    return Number.MAX_SAFE_INTEGER
  }
  return [...products].sort((a, b) => {
    const ar = getSubRank(a)
    const br = getSubRank(b)
    if (ar !== br) return ar - br
    return compareProductsSecondary(a, b, sortByValue)
  })
}

/**
 * Top-level subcategories sorted by rank (non-mutating).
 * @param {Array} subcategories
 * @returns {Array}
 */
export const sortSubcategoriesByRank = (subcategories) => {
  if (!subcategories?.length) return []
  return [...subcategories].sort((a, b) => (a.rank || 0) - (b.rank || 0))
}
