'use client'

import { Card } from '@/components/ui/card'
import { StarRating } from '@/components/star-rating'
import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags'
    icon?: string
    options?: string[]
}

interface PolaroidCardProps {
    item: {
        id: string
        title: string
        item_photo_url: string | null
        rating: number | null
        realized_at?: string | null
        properties_value: Record<string, any>
    }
    templateSchema: TemplateField[]
}

export function PolaroidCard({ item, templateSchema }: PolaroidCardProps) {
    // Extract date and location from template properties
    const dateField = templateSchema.find(f => f.type === 'date')
    const dateValue = dateField ? item.properties_value[dateField.id] : null

    // Try to find location name (could be in various fields)
    const locationField = templateSchema.find(f =>
        f.name.toLowerCase().includes('local') ||
        f.name.toLowerCase().includes('lugar') ||
        f.name.toLowerCase().includes('location')
    )
    const locationValue = locationField ? item.properties_value[locationField.id] : null

    // Extract just the location name (not full address)
    const locationName = locationValue ? locationValue.split(',')[0].trim() : null

    return (
        <Card className="bg-white dark:bg-[#f5f3ed] p-3 pb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group hover:rotate-0 rotate-[-1deg]">
            {/* Photo Section */}
            <div className="aspect-square w-full overflow-hidden bg-muted mb-3 rounded-sm">
                {item.item_photo_url ? (
                    <img
                        src={item.item_photo_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-sm">No photo</span>
                    </div>
                )}
            </div>

            {/* Caption Section */}
            <div className="space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground">
                    {item.title}
                </h3>

                {/* Minimal Metadata */}
                {(item.realized_at || dateValue || locationName) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {item.realized_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.realized_at), 'MMM dd')}
                            </span>
                        )}

                        {locationName && (
                            <>
                                {item.realized_at && <span>•</span>}
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {locationName}
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Handwritten Rating - Centerpiece */}
                {item.rating && item.rating > 0 && (
                    <div className="pt-2 flex items-center justify-center gap-2 border-t border-border/30">
                        <StarRating value={item.rating} readonly size="sm" />
                        <span className="font-handwriting text-2xl text-amber-600 dark:text-amber-500 font-bold">
                            {item.rating.toFixed(1)}/5
                        </span>
                    </div>
                )}
            </div>
        </Card>
    )
}
