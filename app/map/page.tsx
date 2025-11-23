import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapWrapper } from '@/components/map-wrapper'

export const revalidate = 0

export default async function MapPage() {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch realized items with coordinates
    const { data: items } = await supabase
        .from('items')
        .select(`
            id, 
            title, 
            status,
            address,
            latitude,
            longitude,
            rating,
            item_photo_url,
            categories(title)
        `)
        .eq('status', 'Realized')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('realized_at', { ascending: false })

    // Map to location format
    const realLocations = (items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        lat: item.latitude,
        lng: item.longitude,
        address: item.address || 'Local não especificado',
        categoryName: item.categories?.title,
        coverImage: item.item_photo_url,
        rating: item.rating,
    }))

    // Statistics
    const totalPlaces = realLocations.length
    const distinctCategories = new Set(realLocations.map(l => l.categoryName).filter(Boolean)).size

    return (
        <div className="relative h-[calc(100vh-4rem)]">
            {/* Map */}
            <MapWrapper locations={realLocations} />

            {/* Statistics Overlay */}
            <Card className="absolute top-4 right-4 z-[1000] w-80 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Estatísticas do Mapa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Lugares Visitados</p>
                            <p className="text-3xl font-bold text-primary">{totalPlaces}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Categorias</p>
                            <p className="text-3xl font-bold text-primary">{distinctCategories}</p>
                        </div>
                    </div>

                    {totalPlaces === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4 border-t">
                            Nenhum item realizado encontrado. Marque alguns itens como "Realized" para vê-los no mapa!
                        </div>
                    )}

                    {totalPlaces > 0 && (
                        <div className="text-xs text-muted-foreground border-t pt-3">
                            <p className="font-medium mb-1">📍 Locais Realizados</p>
                            <p>Mostrando {totalPlaces} {totalPlaces === 1 ? 'lugar' : 'lugares'} no mapa.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
