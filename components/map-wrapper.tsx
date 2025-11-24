'use client'

import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./map-client'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
    )
})

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

interface MapWrapperProps {
    locations: MapLocation[]
}
export function MapWrapper({ locations }: MapWrapperProps) {
    return <MapClient locations={locations} />
}
