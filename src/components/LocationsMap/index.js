import React, { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from '../../hooks/useGoogleMaps'

export const LocationsMap = (props) => {
  const {
    apiKey,
    locations,
    mapControls,
    location,
    activeInfoWindow,
    forceCenter
  } = props

  const divRef = useRef()
  const [googleMap, setGoogleMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [boundMap, setBoundMap] = useState(null)
  const [googleReady] = useGoogleMaps(apiKey)
  const markerRef = useRef()

  const generateMarkers = (map) => {
    const bounds = new window.google.maps.LatLngBounds()
    const locationMarkers = []

    for (const business of locations) {
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(business.lat, business.lng),
        map,
        icon: {
          url: business.icon,
          scaledSize: new window.google.maps.Size(55, 55)
        }
      })

      marker.addListener('click', () => {
        if (business.markerPopup) {
          const infowindow = new window.google.maps.InfoWindow()
          infowindow.setContent(business.markerPopup)
          infowindow.open(map, marker)

          if (markerRef.current) {
            markerRef.current.close()
          }
          markerRef.current = infowindow
        }
        business.onBusinessCustomClick && business.onBusinessCustomClick()
      })

      bounds.extend(marker.position)
      locationMarkers.push(marker)
    }

    setMarkers(locationMarkers)
    setBoundMap(bounds)
    map.fitBounds(bounds)
  }

  useEffect(() => {
    if (googleReady) {
      const map = new window.google.maps.Map(divRef.current, {
        zoom: mapControls?.defaultZoom ?? 15,
        center: location,
        ...mapControls
      })
      setGoogleMap(map)
      generateMarkers(map)
    }
  }, [googleReady])

  useEffect(() => {
    if (googleMap && activeInfoWindow) {
      const { location, content } = activeInfoWindow
      const position = new window.google.maps.LatLng(location.lat, location.lng)
      const marker = markers.find(m =>
        m.getPosition().lat() === position.lat() &&
        m.getPosition().lng() === position.lng()
      )

      if (marker) {
        const infowindow = new window.google.maps.InfoWindow()
        infowindow.setContent(content)
        infowindow.open(googleMap, marker)

        if (markerRef.current) {
          markerRef.current.close()
        }
        markerRef.current = infowindow

        googleMap.setCenter(position)
        googleMap.setZoom(18)
      }
    } else if (!activeInfoWindow && markerRef.current) {
      markerRef.current.close()
      markerRef.current = null

      if (boundMap) {
        googleMap.fitBounds(boundMap)
      }
    }
  }, [activeInfoWindow, googleMap])

  useEffect(() => {
    if (googleMap && location && forceCenter) {
      googleMap.setCenter(location)
      googleMap.setZoom(18)
    }
  }, [location, forceCenter])

  return (
    googleReady && (
      <div
        id='map'
        ref={divRef}
        style={{ width: '100%', height: '100%' }}
      />
    )
  )
}
