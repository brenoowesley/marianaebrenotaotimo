'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues
const LocationPickerMap = dynamic(
    () => import('./location-picker-map'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[300px] bg-muted flex items-center justify-center rounded-md border">
                <p className="text-muted-foreground">Carregando mapa...</p>
            </div>
        )
    }
)

interface LocationPickerProps {
    value?: string
    onChange: (value: string, lat?: number, lng?: number) => void
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [displayValue, setDisplayValue] = useState(value || '')

    useEffect(() => {
        setDisplayValue(value || '')
    }, [value])

    const handleSearch = async () => {
        if (!searchQuery) return

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            )
            const data = await response.json()

            if (data && data.length > 0) {
                // In a real implementation we would pass this to the map to fly to
                // For now, the user can manually navigate or we can implement a map ref later
                console.log('Found:', data[0])
            }
        } catch (error) {
            console.error('Search failed:', error)
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={displayValue}
                    onChange={(e) => {
                        setDisplayValue(e.target.value)
                        onChange(e.target.value)
                    }}
                    placeholder="Endereço ou clique no mapa..."
                    className="flex-1"
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMapOpen(!isMapOpen)}
                    type="button"
                >
                    <MapPin className="h-4 w-4" />
                </Button>
            </div>

            {isMapOpen && (
                <div className="h-[300px] w-full rounded-md border overflow-hidden relative z-0">
                    <LocationPickerMap
                        onLocationSelect={(lat, lng, address) => {
                            setDisplayValue(address)
                            onChange(address, lat, lng)
                        }}
                    />

                    <div className="absolute top-2 left-2 right-2 z-[1000] flex gap-2">
                        <Input
                            className="bg-white/90 backdrop-blur-sm"
                            placeholder="Buscar cidade..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button size="sm" onClick={handleSearch}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
