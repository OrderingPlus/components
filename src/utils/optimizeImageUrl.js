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

/**
 * True when optimizeImageUrl can apply Cloudinary-style transforms.
 * @param {string} url
 * @returns {boolean}
 */
export const isResponsiveCloudinaryImageUrl = (url) => {
  const normalized = normalizeUrlString(url)
  if (!normalized || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return false
  }
  try {
    const base = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ordering.local'
    const urlObj = new URL(normalized, base)
    if (urlObj.protocol === 'file:') {
      return false
    }
    return isCloudinaryHost(urlObj.hostname) && urlObj.pathname.includes(CLOUDINARY_PATH_MARKER)
  } catch {
    return false
  }
}

/**
 * Build src / srcSet (w descriptors) / sizes for responsive <img>.
 * Non-Cloudinary URLs return src only (no srcSet).
 *
 * @param {string} url
 * @param {object} [options]
 * @param {number[]} [options.widths] Display widths for `Nw` descriptors
 * @param {string} [options.extraParams] Extra transform tokens (e.g. `h_86,c_limit`)
 * @param {string} [options.sizes] Value for the HTML sizes attribute
 * @param {number} [options.srcWidth] Width token for fallback `src` (defaults to largest in widths)
 * @returns {{ src: string, srcSet?: string, sizes: string }}
 */
export const getResponsiveImageProps = (url, options = {}) => {
  const {
    widths = [320, 480, 640, 768, 960],
    extraParams = 'c_limit',
    sizes = '100vw',
    srcWidth: preferredSrcWidth
  } = options

  if (!url || typeof url !== 'string') {
    return { src: url || '', sizes }
  }

  const normalized = normalizeUrlString(url)
  if (!normalized) {
    return { src: normalized, sizes }
  }

  if (!isResponsiveCloudinaryImageUrl(normalized)) {
    return { src: normalized, sizes }
  }

  const widthList = [...new Set(
    widths.filter((w) => typeof w === 'number' && Number.isFinite(w) && w > 0)
  )].sort((a, b) => a - b)

  if (widthList.length === 0) {
    const src = optimizeImageUrl(normalized, extraParams)
    return { src, sizes }
  }

  const paramsForWidth = (w) => {
    const extra = typeof extraParams === 'string' ? extraParams.trim() : ''
    if (!extra) {
      return `w_${w},c_limit`
    }
    return `w_${w},${extra}`
  }

  const srcSet = widthList
    .map((w) => `${optimizeImageUrl(normalized, paramsForWidth(w))} ${w}w`)
    .join(', ')

  const maxW = widthList[widthList.length - 1]
  const fallbackW = (typeof preferredSrcWidth === 'number' && widthList.includes(preferredSrcWidth))
    ? preferredSrcWidth
    : maxW
  const src = optimizeImageUrl(normalized, paramsForWidth(fallbackW))

  return { src, srcSet, sizes }
}
