import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LatLngExpression } from 'leaflet'
import { MapPopup } from '@/components/map-popup'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapOverlay } from '@/components/map-overlay'

interface MapLocation {
    id: string
    title: string
    lat: number
    lng: number
    categoryName?: string
    address: string
    coverImage?: string
    rating?: number
    notes?: string
    realized_at?: string | null
}

interface MapClientProps {
    locations: MapLocation[]
}
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

        <MapOverlay locations={locations} />

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
                    <div dangerouslySetInnerHTML={{
                        __html: renderToStaticMarkup(
                            <MapPopup
                                title={location.title}
                                coverImage={location.coverImage || null}
                                notes={location.notes}
                                rating={location.rating || null}
                            />
                        )
                    }} />
                </Popup>
            </CircleMarker>
        ))}
    </MapContainer>
)
}
