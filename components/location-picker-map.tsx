'use client'

import { useState } from 'react'
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
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, address: string) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null)

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

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    )
}

export default function LocationPickerMap({ onLocationSelect }: LocationPickerMapProps) {
    return (
        <MapContainer
            center={[-5.12, -35.64]} // Default to São Miguel do Gostoso
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker onLocationSelect={onLocationSelect} />
        </MapContainer>
    )
}
