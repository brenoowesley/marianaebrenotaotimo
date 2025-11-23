'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin } from 'lucide-react'

// Fix Leaflet icon issue
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

interface LocationPickerProps {
    value?: string
    onChange: (value: string, lat?: number, lng?: number) => void
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null)

    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            onLocationSelect(e.latlng.lat, e.latlng.lng)
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    )
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
                const { lat, lon, display_name } = data[0]
                // We'll let the user confirm on the map, but for now just update text
                // Ideally we'd center the map there
            }
        } catch (error) {
            console.error('Search failed:', error)
        }
    }

    const handleLocationSelect = async (lat: number, lng: number) => {
        try {
            // Reverse geocode to get address
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            )
            const data = await response.json()

            const address = data.display_name || `${lat}, ${lng}`
            setDisplayValue(address)
            onChange(address, lat, lng)
            // setIsMapOpen(false) // Keep open to allow adjustment
        } catch (error) {
            console.error('Reverse geocode failed:', error)
            const coords = `${lat}, ${lng}`
            setDisplayValue(coords)
            onChange(coords, lat, lng)
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
                    <MapContainer
                        center={[-5.12, -35.64]} // Default to São Miguel do Gostoso
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker onLocationSelect={handleLocationSelect} />
                    </MapContainer>
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
