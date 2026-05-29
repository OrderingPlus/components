import { isAppContext } from './isAppContext'

/**
 * Prefix root-relative public URLs with Vite `base` (subpath / CDN deploys).
 * Leaves absolute (http/https), data:, and blob: URLs unchanged.
 * In native apps, returns the root-relative path without the CDN base.
 */
export const publicAssetUrl = (path, options = {}) => {
  if (path == null || path === '') return path
  const s = String(path).trim()
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s

  const rel = s.replace(/^\//, '')

  if (isAppContext(options)) {
    return `/${rel}`
  }

  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  if (!base || base === '/') return `/${rel}`
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${rel}`
}
