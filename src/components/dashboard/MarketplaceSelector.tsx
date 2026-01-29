'use client'

import React, { useState } from 'react'
import { ChevronDown, Globe, Lock } from 'lucide-react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

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
      {/* Region Pills - Starbucks Theme */}
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
        <div
          className="flex items-center rounded-lg p-1"
          style={{ backgroundColor: STARBUCKS.lightGreen }}
        >
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
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedRegion === region.id ? STARBUCKS.white : 'transparent',
                color: selectedRegion === region.id
                  ? STARBUCKS.darkGreen
                  : region.status === 'coming-soon'
                    ? '#9CA3AF'
                    : STARBUCKS.primaryGreen,
                boxShadow: selectedRegion === region.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: region.status === 'coming-soon' ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{region.flag}</span>
              <span className="hidden sm:inline">{region.name}</span>
              {region.status === 'coming-soon' && (
                <Lock className="w-3 h-3" style={{ color: '#9CA3AF' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Country Dropdown (only for active regions) - Starbucks Theme */}
      {currentRegion.status === 'active' && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{
              backgroundColor: STARBUCKS.white,
              border: `1px solid ${STARBUCKS.lightGreen}`
            }}
          >
            <span>{currentCountry.flag}</span>
            <span className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>{currentCountry.name}</span>
            <ChevronDown className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
          </button>

          {showDropdown && (
            <div
              className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg py-1 z-50"
              style={{
                backgroundColor: STARBUCKS.white,
                border: `1px solid ${STARBUCKS.lightGreen}`
              }}
            >
              {currentRegion.countries.map(country => (
                <button
                  key={country.id}
                  onClick={() => {
                    onCountryChange(country.id)
                    setShowDropdown(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                  style={{
                    backgroundColor: selectedCountry === country.id ? STARBUCKS.lightGreen : 'transparent',
                    color: selectedCountry === country.id ? STARBUCKS.darkGreen : STARBUCKS.primaryGreen
                  }}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  {selectedCountry === country.id && (
                    <span className="ml-auto" style={{ color: STARBUCKS.primaryGreen }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coming Soon Badge for inactive regions - Starbucks Theme */}
      {currentRegion.status === 'coming-soon' && (
        <span
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{
            backgroundColor: `${STARBUCKS.gold}20`,
            color: STARBUCKS.gold
          }}
        >
          Coming Soon
        </span>
      )}
    </div>
  )
}

export { MARKETPLACE_REGIONS }
export type { Region, Country }
