'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon issue
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

interface LocationPickerMapProps {
    onLocationSelect: (lat: number, lng: number, address: string) => void
    initialPosition?: { lat: number; lng: number } | null
}

function LocationMarker({
    onLocationSelect,
    initialPosition
}: {
    onLocationSelect: (lat: number, lng: number, address: string) => void
    initialPosition?: { lat: number; lng: number } | null
}) {
    const [position, setPosition] = useState<L.LatLng | null>(
        initialPosition ? new L.LatLng(initialPosition.lat, initialPosition.lng) : null
    )

    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())

            // Reverse geocode
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    const address = data.display_name || `${e.latlng.lat}, ${e.latlng.lng}`
                    onLocationSelect(e.latlng.lat, e.latlng.lng, address)
                })
                .catch(() => {
                    const coords = `${e.latlng.lat}, ${e.latlng.lng}`
                    onLocationSelect(e.latlng.lat, e.latlng.lng, coords)
                })
        },
    })

    // Fly to initial position if it changes
    useEffect(() => {
        if (initialPosition) {
            const newPos = new L.LatLng(initialPosition.lat, initialPosition.lng)
            setPosition(newPos)
            map.flyTo(newPos, 16) // Zoom in closer when searching
        }
    }, [initialPosition, map])

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    )
}

export default function LocationPickerMap({ onLocationSelect, initialPosition }: LocationPickerMapProps) {
    return (
        <MapContainer
            center={initialPosition ? [initialPosition.lat, initialPosition.lng] : [-5.12, -35.64]}
            zoom={initialPosition ? 16 : 13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker onLocationSelect={onLocationSelect} initialPosition={initialPosition} />
        </MapContainer>
    )
}
