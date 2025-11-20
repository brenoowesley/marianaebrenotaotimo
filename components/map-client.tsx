'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LatLngExpression } from 'leaflet'

interface MapLocation {
    id: string
    title: string
    lat: number
    lng: number
    categoryName?: string
}

interface MapClientProps {
    locations: MapLocation[]
}

export default function MapClient({ locations }: MapClientProps) {
    // Center on Natal/RN, Brazil
    const center: LatLngExpression = [-5.79448, -35.211]
    const defaultZoom = locations.length > 0 ? 13 : 12

    return (
        <MapContainer
            center={center}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {locations.map((location) => (
                <CircleMarker
                    key={location.id}
                    center={[location.lat, location.lng]}
                    radius={8}
                    pathOptions={{
                        fillColor: '#3b82f6',
                        fillOpacity: 0.8,
                        color: '#1e40af',
                        weight: 2,
                    }}
                >
                    <Popup>
                        <div className="p-2 min-w-[150px]">
                            <h3 className="font-semibold text-sm">{location.title}</h3>
                            {location.categoryName && (
                                <p className="text-xs text-muted-foreground mt-1">{location.categoryName}</p>
                            )}
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    )
}
