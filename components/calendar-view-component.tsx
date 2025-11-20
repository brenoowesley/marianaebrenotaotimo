'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/star-rating'
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarItem {
    id: string
    title: string
    properties_value: Record<string, any>
    created_at: string
    item_photo_url: string | null
    rating: number | null
    categories: {
        id: string
        title: string
        icon: string
        template_schema: any[]
    }
}

interface CalendarViewComponentProps {
    items: CalendarItem[]
}

export function CalendarViewComponent({ items }: CalendarViewComponentProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const getItemDate = (item: CalendarItem): Date => {
        const dateField = item.categories.template_schema?.find((field: any) => field.type === 'date')
        if (dateField && item.properties_value[dateField.id]) {
            return new Date(item.properties_value[dateField.id])
        }
        return new Date(item.created_at)
    }

    const itemsForMonth = items.filter((item) => {
        const itemDate = getItemDate(item)
        return isSameMonth(itemDate, currentMonth)
    })

    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    return (
        <div className="space-y-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Scrapbook Grid */}
            {itemsForMonth.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    <p className="text-lg">No realized items this month</p>
                    <p className="text-sm mt-2">Items you complete will appear here as a visual scrapbook</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {itemsForMonth.map((item) => {
                        const itemDate = getItemDate(item)
                        return (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                                {/* Photo or Category Icon */}
                                {item.item_photo_url ? (
                                    <div className="h-48 w-full overflow-hidden bg-muted">
                                        <img
                                            src={item.item_photo_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                        <span className="text-6xl opacity-80">{item.categories.icon}</span>
                                    </div>
                                )}

                                {/* Info */}
                                <CardContent className="p-3 space-y-2">
                                    <h3 className="font-semibold truncate" title={item.title}>
                                        {item.title}
                                    </h3>

                                    <div className="flex items-center justify-between text-sm">
                                        <Badge variant="secondary" className="text-xs">
                                            {item.categories.icon} {item.categories.title}
                                        </Badge>
                                        {item.rating && (
                                            <StarRating value={item.rating} readonly size="sm" />
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {format(itemDate, 'MMM d, yyyy')}
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Month Summary */}
            {itemsForMonth.length > 0 && (
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                    {itemsForMonth.length} {itemsForMonth.length === 1 ? 'item' : 'items'} realized this month
                </div>
            )}
        </div>
    )
}
