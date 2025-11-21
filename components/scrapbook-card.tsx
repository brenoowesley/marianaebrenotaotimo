'use client'

import { Card } from '@/components/ui/card'
import { StarRating } from '@/components/star-rating'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags'
    icon?: string
    options?: string[]
}

interface ScrapbookCardProps {
    item: {
        id: string
        title: string
        item_photo_url: string | null
        rating: number | null
        realized_at?: string | null
        notes?: string | null
        properties_value: Record<string, any>
        created_at?: string
    }
    templateSchema?: TemplateField[]
}

export function ScrapbookCard({ item, templateSchema }: ScrapbookCardProps) {
    // Extract date - prefer realized_at, fallback to date property, then created_at
    const dateField = templateSchema?.find(f => f.type === 'date')
    const dateValue = item.realized_at || (dateField ? item.properties_value[dateField.id] : null) || item.created_at

    return (
        <Card className="bg-white dark:bg-[#f5f3ed] p-3 pb-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:rotate-0 rotate-[-1deg]">
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
            <div className="space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground">
                    {item.title}
                </h3>

                {/* Metadata Row: Date (left) & Rating (right) */}
                <div className="flex justify-between items-center text-sm">
                    {/* Left: Date - DARKER for readability */}
                    {dateValue && (
                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(dateValue), 'MMM dd, yyyy')}
                        </span>
                    )}

                    {/* Right: Star Rating - DARKER for readability */}
                    {item.rating && item.rating > 0 && (
                        <div className="flex items-center gap-1">
                            <StarRating value={item.rating} readonly size="sm" />
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                {item.rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="border-b border-border/50 my-2" />

                {/* Handwritten Notes - NEAR-BLACK for maximum readability */}
                {item.notes && item.notes.trim().length > 0 && (
                    <div className="pt-1">
                        <p className="font-handwriting text-center text-lg leading-relaxed text-gray-900 dark:text-gray-100">
                            {item.notes}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    )
}
