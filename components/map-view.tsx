'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
})

interface MapLocation {
    id: string
    title: string
    address: string
    lat: number
    lng: number
    categoryName?: string
}

interface MapViewProps {
    locations: MapLocation[]
}

export function MapView({ locations }: MapViewProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Carregando mapa...</p>
            </div>
        )
    }

    // Default center (Brazil - approximate center)
    const defaultCenter: LatLngExpression = [-14.235, -51.9253]
    const center = locations.length > 0
        ? [locations[0].lat, locations[0].lng] as LatLngExpression
        : defaultCenter

    return (
        <MapContainer
            center={center}
            zoom={locations.length > 0 ? 12 : 4}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {locations.map((location) => (
                <Marker key={location.id} position={[location.lat, location.lng]}>
                    <Popup>
                        <div className="p-2">
                            <h3 className="font-semibold">{location.title}</h3>
                            {location.categoryName && (
                                <p className="text-xs text-muted-foreground">{location.categoryName}</p>
                            )}
                            <p className="text-sm mt-1">{location.address}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
