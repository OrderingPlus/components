import { useEffect, useState } from 'react'

/**
 * Hooks to get google ready status
 * @param {string} apiKey
 */
export function useGoogleMaps (apiKey) {
  if (!apiKey) {
    console.warn('Prop `apiKey` is required to use Google Maps components.')
    return
  }
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    let checker = null

    if (window.document.getElementById('google-maps-sdk')) {
      if (typeof google !== 'undefined') {
        setGoogleReady(true)
      } else {
        checker = setInterval(() => {
          if (typeof google !== 'undefined') {
            setGoogleReady(true)
            clearInterval(checker)
          }
        }, 100)
      }
      return
    }

    window.googleAsyncInit = () => {
      setGoogleReady(true)
    }

    const js = window.document.createElement('script')
    js.id = 'google-maps-sdk'
    js.async = true
    js.defer = true
    js.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=googleAsyncInit`

    window.document.body.appendChild(js)
    return () => {
      if (checker) {
        clearInterval(checker)
      }
    }
  }, [apiKey])

  return [
    googleReady,
    setGoogleReady
  ]
}
