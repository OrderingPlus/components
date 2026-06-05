/**
 * True when running inside a native app (React Native) or a non-website build.
 * Used to skip web-only URL transforms (CDN base, Cloudinary params, etc.).
 */
export const isAppContext = (options = {}) => {
  if (typeof options.isApp === 'boolean') {
    return options.isApp
  }

  if (typeof window !== 'undefined' && window.__CONFIG__) {
    const internalName = window.__CONFIG__.app_internal_name
    if (internalName && internalName !== 'website') return true
    if (window.__CONFIG__.isApp === true) return true
  }

  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true
  }

  return false
}
