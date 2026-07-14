import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'

vi.mock('../../../hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => [true]
}))

import { AutocompleteInput } from '../index'

describe('GoogleAutocompleteInput', () => {
  it('calls onChangeAddress when a place is selected', async () => {
    const onChangeAddress = vi.fn()
    const mockGetPlace = vi.fn(() => ({
      formatted_address: '1600 Amphitheatre Pkwy',
      geometry: { location: { lat: () => 37.42, lng: () => -122.08 } },
      address_components: [
        { types: ['country'], long_name: 'United States', short_name: 'US' },
        { types: ['locality'], long_name: 'Mountain View' },
        { types: ['postal_code'], short_name: '94043' }
      ],
      place_id: 'place-1',
      utc_offset_minutes: -420
    }))

    window.google = {
      maps: {
        places: {
          Autocomplete: vi.fn(() => ({
            addListener: (event, cb) => {
              if (event === 'place_changed') cb()
            },
            getPlace: mockGetPlace
          }))
        }
      }
    }

    render(<AutocompleteInput apiKey='test-key' onChangeAddress={onChangeAddress} />)

    await waitFor(() => {
      expect(onChangeAddress).toHaveBeenCalledWith(expect.objectContaining({
        address: '1600 Amphitheatre Pkwy',
        country_code: 'US',
        location: { lat: 37.42, lng: -122.08 }
      }))
    })
  })

  it('restricts autocomplete to a specific country', async () => {
    const onChangeAddress = vi.fn()
    window.google = {
      maps: {
        places: {
          Autocomplete: vi.fn((_, options) => {
            expect(options.componentRestrictions).toEqual({ country: 'US' })
            return {
              addListener: vi.fn(),
              getPlace: vi.fn()
            }
          })
        }
      }
    }
    render(<AutocompleteInput apiKey='test-key' countryCode='US' onChangeAddress={onChangeAddress} />)
    await waitFor(() => {
      expect(window.google.maps.places.Autocomplete).toHaveBeenCalled()
    })
  })
})
