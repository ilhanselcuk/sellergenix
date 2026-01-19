'use client'

import React, { useState } from 'react'
import { ChevronDown, Globe, Lock } from 'lucide-react'

interface Country {
  id: string
  name: string
  flag: string
}

interface Region {
  id: string
  name: string
  flag: string
  status: 'active' | 'coming-soon'
  countries: Country[]
}

const MARKETPLACE_REGIONS: Region[] = [
  {
    id: 'north-america',
    name: 'North America',
    flag: '🇺🇸',
    status: 'active',
    countries: [
      { id: 'ATVPDKIKX0DER', name: 'USA', flag: '🇺🇸' },
      { id: 'A2EUQ1WTGCTBG2', name: 'Canada', flag: '🇨🇦' },
      { id: 'A1AM78C64UM0Y8', name: 'Mexico', flag: '🇲🇽' },
    ]
  },
  {
    id: 'europe',
    name: 'Europe',
    flag: '🇪🇺',
    status: 'coming-soon',
    countries: [
      { id: 'A1F83G8C2ARO7P', name: 'UK', flag: '🇬🇧' },
      { id: 'A1PA6795UKMFR9', name: 'Germany', flag: '🇩🇪' },
      { id: 'A13V1IB3VIYBER', name: 'France', flag: '🇫🇷' },
      { id: 'APJ6JRA9NG5V4', name: 'Italy', flag: '🇮🇹' },
      { id: 'A1RKKUPIHCS9HS', name: 'Spain', flag: '🇪🇸' },
    ]
  },
  {
    id: 'far-east',
    name: 'Far East',
    flag: '🇯🇵',
    status: 'coming-soon',
    countries: [
      { id: 'A1VC38T7YXB528', name: 'Japan', flag: '🇯🇵' },
      { id: 'A39IBJ37TRP1C6', name: 'Australia', flag: '🇦🇺' },
      { id: 'A19VAU5U5O7RUS', name: 'Singapore', flag: '🇸🇬' },
      { id: 'A21TJRUUN4KGV', name: 'India', flag: '🇮🇳' },
      { id: 'A2VIGQ35RCS4UG', name: 'UAE', flag: '🇦🇪' },
    ]
  }
]

interface MarketplaceSelectorProps {
  selectedRegion: string
  selectedCountry: string
  onRegionChange: (regionId: string) => void
  onCountryChange: (countryId: string) => void
}

export default function MarketplaceSelector({
  selectedRegion,
  selectedCountry,
  onRegionChange,
  onCountryChange
}: MarketplaceSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const currentRegion = MARKETPLACE_REGIONS.find(r => r.id === selectedRegion) || MARKETPLACE_REGIONS[0]
  const currentCountry = currentRegion.countries.find(c => c.id === selectedCountry) || currentRegion.countries[0]

  return (
    <div className="flex items-center gap-4">
      {/* Region Pills */}
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {MARKETPLACE_REGIONS.map(region => (
            <button
              key={region.id}
              onClick={() => {
                if (region.status === 'active') {
                  onRegionChange(region.id)
                  onCountryChange(region.countries[0].id)
                }
              }}
              disabled={region.status === 'coming-soon'}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${selectedRegion === region.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : region.status === 'coming-soon'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <span>{region.flag}</span>
              <span className="hidden sm:inline">{region.name}</span>
              {region.status === 'coming-soon' && (
                <Lock className="w-3 h-3 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Country Dropdown (only for active regions) */}
      {currentRegion.status === 'active' && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <span>{currentCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{currentCountry.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {currentRegion.countries.map(country => (
                <button
                  key={country.id}
                  onClick={() => {
                    onCountryChange(country.id)
                    setShowDropdown(false)
                  }}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50
                    ${selectedCountry === country.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  {selectedCountry === country.id && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coming Soon Badge for inactive regions */}
      {currentRegion.status === 'coming-soon' && (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
          Coming Soon
        </span>
      )}
    </div>
  )
}

export { MARKETPLACE_REGIONS }
export type { Region, Country }
