/**
 * Builds Cloudinary-compatible transformation URLs for supported CDNs.
 * Applies balanced delivery defaults: q_auto:good, f_auto (WebP/AVIF when supported).
 */

const CLOUDINARY_PATH_MARKER = '/image/upload/'

const CLOUDINARY_HOST_SUFFIXES = [
  'res.cloudinary.com',
  'cloud-assets.orderingplus.com'
]

const TRANSFORM_PREFIX_WHITELIST = new Set([
  'a', 'ar', 'b', 'bo', 'br', 'c', 'co', 'd', 'dn', 'du', 'e', 'eo', 'f', 'fl', 'fn',
  'g', 'h', 'if', 'l', 'o', 'q', 'r', 'so', 't', 'u', 'vc', 'vs', 'w', 'x', 'y', 'z'
])

const DEFAULT_QUALITY = 'q_auto:good'
const DEFAULT_FORMAT = 'f_auto'

const normalizeUrlString = (url) => {
  if (!url || typeof url !== 'string') {
    return url
  }
  const trimmed = url.trim()
  if (!trimmed) {
    return trimmed
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }
  return trimmed
}

const isCloudinaryHost = (hostname) => {
  if (!hostname) {
    return false
  }
  const h = hostname.toLowerCase()
  return CLOUDINARY_HOST_SUFFIXES.some((suffix) => h === suffix || h.endsWith(`.${suffix}`))
}

const getLeadingTokenPrefix = (segment) => {
  if (!segment) {
    return null
  }
  const head = segment.includes(',') ? segment.split(',')[0] : segment
  const underscoreIdx = head.indexOf('_')
  if (underscoreIdx === -1) {
    return null
  }
  return head.slice(0, underscoreIdx).toLowerCase()
}

const isLikelyTransformSegment = (segment) => {
  if (!segment || segment.includes('..')) {
    return false
  }
  if (segment.includes(',')) {
    return true
  }
  if (/^v\d+$/i.test(segment)) {
    return false
  }
  const prefix = getLeadingTokenPrefix(segment)
  if (!prefix) {
    return false
  }
  return TRANSFORM_PREFIX_WHITELIST.has(prefix)
}

const parseParamsToTokens = (params) => {
  if (!params) {
    return []
  }
  if (typeof params === 'string') {
    return params.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

const getTokenFamily = (token) => {
  if (!token) {
    return ''
  }
  const base = token.split(':')[0]
  const prefix = base.includes('_') ? base.split('_')[0] : base
  return prefix.toLowerCase()
}

/**
 * Caller overrides existing; defaults (q_auto, f_auto) apply only if family missing.
 */
const mergeTransformationTokens = (existingTokens, callerTokens, fallbackTokens) => {
  const familyMap = new Map()

  const apply = (tokens, force = false) => {
    for (const token of tokens) {
      const family = getTokenFamily(token)
      if (!family) {
        continue
      }
      if (force) {
        familyMap.set(family, token)
        continue
      }
      if (!familyMap.has(family)) {
        familyMap.set(family, token)
      }
    }
  }

  apply(existingTokens)
  apply(callerTokens, true)
  apply(fallbackTokens)

  const sortRank = (family) => {
    const order = 'whrcreaxydglbtfqo'
    const idx = order.indexOf(family[0])
    return idx === -1 ? 50 : idx
  }

  return [...familyMap.entries()]
    .sort((a, b) => sortRank(a[0]) - sortRank(b[0]))
    .map(([, token]) => token)
    .join(',')
}

const applyCloudinaryTransforms = (urlObj, extraParamTokens) => {
  const pathname = urlObj.pathname
  const markerIndex = pathname.indexOf(CLOUDINARY_PATH_MARKER)
  if (markerIndex === -1) {
    return urlObj.toString()
  }

  const prefix = pathname.slice(0, markerIndex + CLOUDINARY_PATH_MARKER.length)
  const pathAfter = pathname.slice(markerIndex + CLOUDINARY_PATH_MARKER.length)
  const segments = pathAfter.split('/').filter(Boolean)

  if (segments.length === 0) {
    return urlObj.toString()
  }

  const mandatoryDefaults = [DEFAULT_QUALITY, DEFAULT_FORMAT]
  let existingTokens = []
  let contentSegments = segments

  if (isLikelyTransformSegment(segments[0])) {
    existingTokens = parseParamsToTokens(segments[0].replace(/\s/g, ''))
    contentSegments = segments.slice(1)
  }

  const merged = mergeTransformationTokens(
    existingTokens,
    extraParamTokens,
    mandatoryDefaults
  )

  urlObj.pathname = `${prefix}${merged}/${contentSegments.join('/')}`
  return urlObj.toString()
}

export const optimizeImageUrl = (url, params) => {
  const normalized = normalizeUrlString(url)
  if (!normalized) {
    return normalized
  }

  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized
  }

  try {
    const base = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ordering.local'
    const urlObj = new URL(normalized, base)

    if (urlObj.protocol === 'file:') {
      return normalized
    }

    if (!isCloudinaryHost(urlObj.hostname)) {
      return normalized
    }

    if (!urlObj.pathname.includes(CLOUDINARY_PATH_MARKER)) {
      return normalized
    }

    const tokens = parseParamsToTokens(params)
    return applyCloudinaryTransforms(urlObj, tokens)
  } catch {
    return normalized
  }
}
