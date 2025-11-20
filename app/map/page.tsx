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

    // Fetch realized items
    const { data: items } = await supabase
        .from('items')
        .select('id, title, status, categories(title)')
        .eq('status', 'Realized')
        .order('created_at', { ascending: false })

    const realizedItems = items || []

    // MOCK LOCATIONS IN NATAL/RN FOR MVP
    const mockLocations = realizedItems.slice(0, 4).map((item: any, index: number) => {
        const natalLocations = [
            { lat: -5.79448, lng: -35.211, place: 'Ponta Negra' },
            { lat: -5.7945, lng: -35.1994, place: 'Forte dos Reis Magos' },
            { lat: -5.7805, lng: -35.1995, place: 'Praia do Meio' },
            { lat: -5.7733, lng: -35.2058, place: 'Genipabu' },
        ]

        const location = natalLocations[index] || natalLocations[0]

        return {
            id: item.id,
            title: item.title,
            lat: location.lat,
            lng: location.lng,
            categoryName: item.categories?.title,
        }
    })

    // Statistics
    const totalPlaces = mockLocations.length
    const distinctCategories = new Set(mockLocations.map(l => l.categoryName).filter(Boolean)).size

    return (
        <div className="relative h-[calc(100vh-4rem)]">
            {/* Map */}
            <MapWrapper locations={mockLocations} />

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
                            <p className="font-medium mb-1">📍 Locais em Natal/RN</p>
                            <p>Demonstração com {totalPlaces} {totalPlaces === 1 ? 'lugar' : 'lugares'}.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
