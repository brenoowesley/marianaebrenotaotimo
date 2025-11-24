'use client'

import { useState, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MapPin } from 'lucide-react'

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

interface MapOverlayProps {
    locations: MapLocation[]
}

export function MapOverlay({ locations }: MapOverlayProps) {
    const map = useMap()
    const [selectedMonth, setSelectedMonth] = useState<string>('all')

    // Extract unique months from realized_at dates
    const months = useMemo(() => {
        const uniqueMonths = new Set<string>()
        locations.forEach(loc => {
            if (loc.realized_at) {
                const date = new Date(loc.realized_at)
                const monthKey = format(date, 'yyyy-MM')
                uniqueMonths.add(monthKey)
            }
        })
        return Array.from(uniqueMonths).sort().reverse()
    }, [locations])

    // Filter locations based on selected month
    const filteredLocations = useMemo(() => {
        if (selectedMonth === 'all') return locations
        return locations.filter(loc => {
            if (!loc.realized_at) return false
            const date = new Date(loc.realized_at)
            return format(date, 'yyyy-MM') === selectedMonth
        })
    }, [locations, selectedMonth])

    const totalPlaces = filteredLocations.length
    const distinctCategories = new Set(filteredLocations.map(l => l.categoryName).filter(Boolean)).size

    // Calculate average rating
    const averageRating = useMemo(() => {
        const ratedLocations = filteredLocations.filter(l => l.rating && l.rating > 0)
        if (ratedLocations.length === 0) return 0
        const sum = ratedLocations.reduce((acc, curr) => acc + (curr.rating || 0), 0)
        return (sum / ratedLocations.length).toFixed(1)
    }, [filteredLocations])

    const handleLocationClick = (lat: number, lng: number) => {
        map.flyTo([lat, lng], 16, {
            duration: 1.5
        })
    }

    const formatMonthLabel = (monthKey: string) => {
        const [year, month] = monthKey.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return format(date, 'MMMM yyyy', { locale: ptBR })
    }

    return (
        <div className="absolute top-4 right-4 z-[1000] w-80 flex flex-col gap-4 pointer-events-none">
            <Card className="shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 pointer-events-auto">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>Estatísticas</span>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Filtrar mês" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os meses</SelectItem>
                                {months.map(month => (
                                    <SelectItem key={month} value={month}>
                                        {formatMonthLabel(month)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lugares</p>
                            <p className="text-2xl font-bold text-primary">{totalPlaces}</p>
                        </div>
                        <div className="space-y-1 text-center border-l border-border/50">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Categorias</p>
                            <p className="text-2xl font-bold text-primary">{distinctCategories}</p>
                        </div>
                        <div className="space-y-1 text-center border-l border-border/50">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nota Média</p>
                            <div className="flex items-center justify-center gap-1">
                                <p className="text-2xl font-bold text-primary">{averageRating}</p>
                                <span className="text-xs text-yellow-500">★</span>
                            </div>
                        </div>
                    </div>

                    {totalPlaces === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4 border-t">
                            Nenhum local encontrado para este filtro.
                        </div>
                    )}

                    {totalPlaces > 0 && (
                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                📍 Locais ({totalPlaces})
                            </p>
                            <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {filteredLocations.map(loc => (
                                    <button
                                        key={loc.id}
                                        onClick={() => handleLocationClick(loc.lat, loc.lng)}
                                        className="w-full text-left text-sm p-2 rounded-md hover:bg-accent transition-colors flex items-start gap-2 group"
                                    >
                                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground group-hover:text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{loc.title}</p>
                                            {loc.categoryName && (
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {loc.categoryName}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
