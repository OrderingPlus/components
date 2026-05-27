/**
 * Pure product-listing pipeline shared by main thread and Web Worker.
 */

const buildSubcategoryRankMap = (parentCategory) => {
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

const sortProductsBySubcategoryRank = (products, parentCategory, sortByValue) => {
  if (!products?.length) return []
  if (!parentCategory?.subcategories?.length) return [...products]
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

export const normalizeSearchText = (value) => {
  if (!value) return ''
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const toLiteProduct = (product, categorySlug) => ({
  id: product?.id,
  name: product?.name,
  description: product?.description,
  price: product?.price,
  rank: product?.rank,
  category_id: product?.category_id,
  featured: product?.featured,
  categorySlug: categorySlug ?? product?.category?.slug ?? null
})

const toLiteSubcategories = (subs) => {
  if (!subs?.length) return []
  return subs.map((sub) => ({
    id: sub.id,
    rank: sub.rank,
    category_id: sub.category_id,
    children: (sub.children || []).map((c) => ({ id: c.id, category_id: c.category_id })),
    subcategories: toLiteSubcategories(sub.subcategories)
  }))
}

export const toLiteCategories = (categories) => {
  if (!categories?.length) return []
  return categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    category_id: cat.category_id,
    parent_category_id: cat.parent_category_id,
    rank: cat.rank,
    products: (cat.products || []).map((p) => toLiteProduct(p, cat.slug)),
    children: (cat.children || []).map((c) => ({
      id: c.id,
      category_id: c.category_id,
      parent_category_id: c.parent_category_id
    })),
    subcategories: toLiteSubcategories(cat.subcategories)
  }))
}

export const countProductsInCategories = (categories) => {
  if (!categories?.length) return 0
  return categories.reduce((acc, cat) => acc + (cat.products?.length || 0), 0)
}

export const matchesProductSearch = ({
  name,
  description,
  price,
  searchValue,
  priceFilterValues,
  isSearchByName,
  isSearchByDescription
}) => {
  if (!searchValue && !priceFilterValues?.min && !priceFilterValues?.max) return true
  const normalizedSearch = normalizeSearchText(searchValue)
  const matchesName = !searchValue || (
    isSearchByName &&
    name &&
    normalizeSearchText(name).includes(normalizedSearch)
  )
  const matchesDescription = !searchValue || (
    isSearchByDescription &&
    description &&
    normalizeSearchText(description).includes(normalizedSearch)
  )
  const matchesMin = !priceFilterValues?.min || parseFloat(price) >= parseFloat(priceFilterValues.min)
  const matchesMax = !priceFilterValues?.max || parseFloat(price) <= parseFloat(priceFilterValues.max)
  return ((matchesName && matchesMin && matchesMax) || (matchesDescription && matchesMin && matchesMax))
}

export const matchesFeaturedSearch = ({
  product,
  searchValue,
  isSearchByName,
  isSearchByDescription
}) => {
  if (!product?.featured) return false
  if (!searchValue) return true
  const normalizedSearch = normalizeSearchText(searchValue)
  return (
    (isSearchByName && product.name && normalizeSearchText(product.name).includes(normalizedSearch)) ||
    (isSearchByDescription && product.description && normalizeSearchText(product.description).includes(normalizedSearch))
  )
}

const flattenSubCategoriesList = (categories, acc = []) => {
  if (!categories?.length) return acc
  categories.forEach((category) => {
    acc.push(category)
    flattenSubCategoriesList(category.subcategories, acc)
  })
  return acc
}

const attachCategorySlug = (product, categorySlug) => {
  if (!categorySlug) return product
  return {
    ...product,
    categorySlug
  }
}

/**
 * Filter products by category selection. Returns lite product objects.
 */
export const filterProductsByCategory = ({
  categories,
  categorySelectedId,
  searchValue,
  priceFilterValues,
  isSearchByName,
  isSearchByDescription,
  isUseParentCategory,
  avoidProductDuplicate
}) => {
  if (!categories?.length) return []

  const searchOpts = {
    searchValue,
    priceFilterValues,
    isSearchByName,
    isSearchByDescription
  }

  if (categorySelectedId !== 'featured' && categorySelectedId !== null && categorySelectedId !== undefined) {
    const subCategoriesList = flattenSubCategoriesList(categories)
    const categoriesList = [].concat(...categories.map((category) => category.children || []))
    const categorySource = isUseParentCategory ? categoriesList : categories
    const parentCategory = categorySource?.find((category) => category?.category_id === categorySelectedId) ?? {}
    const categoryFinded = subCategoriesList.find((subCat) => subCat.id === parentCategory.category_id) ?? {}
    const targetCategoryId = isUseParentCategory ? parentCategory?.parent_category_id : categorySelectedId
    const targetCategory = categories.find((category) => category.id === targetCategoryId)
    const products = targetCategory?.products || []

    return products.filter((product) => {
      if (isUseParentCategory) {
        const inSubcategory = categoryFinded?.children?.some((cat) => cat.category_id === product?.category_id)
        if (!inSubcategory) return false
      }
      return matchesProductSearch({
        name: product.name,
        description: product.description,
        price: product.price,
        ...searchOpts
      })
    })
  }

  if (categorySelectedId === 'featured') {
    return categories.reduce((products, category) => {
      const mapped = (category.products || [])
        .map((product) => attachCategorySlug(product, category.slug))
        .filter((product) => matchesFeaturedSearch({ product, ...searchOpts }))
      return products.concat(mapped)
    }, [])
  }

  let categoriesToUse = categories
  if (avoidProductDuplicate) {
    const customCategories = ['favorites']
    categoriesToUse = categories.filter(({ id }) => !customCategories.includes(id))
  }

  return categoriesToUse.reduce((products, category) => {
    if (!category?.products?.length) return products
    const mapped = category.products
      .map((product) => attachCategorySlug(product, category.slug))
      .filter((product) => product && matchesProductSearch({
        name: product.name,
        description: product.description,
        price: product.price,
        ...searchOpts
      }))
    return products.concat(mapped)
  }, [])
}

export const dedupeProductsById = (products) => {
  if (!products?.length) return []
  const seen = new Set()
  const result = []
  products.forEach((product) => {
    if (!product?.id || seen.has(product.id)) return
    seen.add(product.id)
    result.push(product)
  })
  return result
}

export const dedupeProductIds = (ids) => {
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

export const sortProductsList = (products, sortByValue, parentCategory) => {
  if (!products?.length) return []
  const hasSubs = parentCategory?.subcategories?.length > 0
  let sorted
  if (hasSubs) {
    sorted = sortProductsBySubcategoryRank(products, parentCategory, sortByValue)
  } else {
    sorted = [...products]
    if (sortByValue === 'rank' || sortByValue === null || sortByValue === undefined) {
      sorted.sort((a, b) => (a.rank || 0) - (b.rank || 0))
    } else if (sortByValue === 'rank_desc') {
      sorted.sort((a, b) => (b.rank || 0) - (a.rank || 0))
    } else if (sortByValue === 'a-z') {
      sorted.sort((a, b) => ((a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
    }
  }
  return sorted
}

export const mergeAndDedupeProducts = (productGroups) => {
  const merged = productGroups.reduce((acc, group) => acc.concat(group || []), [])
  return dedupeProductsById(merged)
}

/**
 * Build id -> full product map from business categories (main thread only).
 */
export const buildProductMapFromBusiness = (business) => {
  const map = new Map()
  const walk = (categories) => {
    if (!categories?.length) return
    categories.forEach((category) => {
      ;(category.products || []).forEach((product) => {
        if (product?.id) {
          const withSlug = category.slug
            ? { ...product, category: { ...product?.category, slug: category.slug } }
            : product
          map.set(product.id, withSlug)
        }
      })
      walk(category.subcategories)
    })
  }
  walk(business?.categories)
  return map
}

export const reconcileProductsByIds = (productMap, ids) => {
  if (!ids?.length) return []
  return ids.map((id) => productMap.get(id)).filter(Boolean)
}

export const reconcileLiteProductsByIds = (liteProducts, ids) => {
  if (!ids?.length || !liteProducts?.length) return []
  const map = new Map(liteProducts.map((p) => [p.id, p]))
  return ids.map((id) => map.get(id)).filter(Boolean)
}

export const toLiteParentCategory = (category) => {
  if (!category) return null
  return {
    id: category.id,
    subcategories: toLiteSubcategories(category.subcategories)
  }
}

export const runFilterProductsTask = (payload) => {
  const ids = filterProductsByCategory(payload).map((p) => p.id)
  return { ids }
}

export const runSortProductsTask = (payload) => {
  const { products, sortByValue, parentCategory } = payload
  const sorted = sortProductsList(products, sortByValue, parentCategory)
  return { ids: sorted.map((p) => p.id) }
}

export const runMergeDedupeTask = (payload) => {
  const { productGroups } = payload
  const deduped = mergeAndDedupeProducts(productGroups)
  return { ids: deduped.map((p) => p.id), products: deduped }
}
