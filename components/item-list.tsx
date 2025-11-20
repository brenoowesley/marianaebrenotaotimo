'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CheckCircle2, Circle, Star, MoreVertical, Pencil, Trash2, ExternalLink, CalendarPlus } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ItemDetail } from '@/components/item-detail'
import { EditItemDialog } from '@/components/edit-item-dialog'
import { DeleteItemDialog } from '@/components/delete-item-dialog'
import { CompleteItemModal } from '@/components/complete-item-modal'
import { StarRating } from '@/components/star-rating'

interface Item {
    id: string
    title: string
    status: string
    properties_value: Record<string, any>
    notes: string
    item_photo_url: string | null
    rating: number | null
}

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select'
    icon?: string
    options?: string[]
}

interface ItemListProps {
    items: Item[]
    templateSchema: TemplateField[]
}

export function ItemList({ items, templateSchema }: ItemListProps) {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Item | null>(null)
    const [deletingItem, setDeletingItem] = useState<Item | null>(null)
    const [completingItem, setCompletingItem] = useState<Item | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const openDetail = (item: Item) => {
        setSelectedItem(item)
        setDetailOpen(true)
    }

    const getPropertyIcon = (field: TemplateField) => {
        if (field.icon) return field.icon

        switch (field.type) {
            case 'date': return '📅'
            case 'link': return '🔗'
            case 'checkbox': return '☑️'
            case 'rating': return '⭐'
            case 'select': return '👤'
            default: return '📝'
        }
    }

    const renderProperty = (field: TemplateField, value: any) => {
        if (value === undefined || value === null || value === '') return null

        const icon = getPropertyIcon(field)

        switch (field.type) {
            case 'checkbox':
                return value ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <Badge variant="outline" className="text-xs font-normal">{field.name}</Badge>
                    </div>
                ) : null

            case 'date':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <span>{format(new Date(value), 'MMM d, yyyy')}</span>
                    </div>
                )

            case 'link':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-primary flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span>Link</span>
                            <ExternalLink size={12} />
                        </a>
                    </div>
                )

            case 'rating':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${i < value ? 'fill-yellow-500 text-yellow-500' : 'fill-muted text-muted'}`}
                                />
                            ))}
                        </div>
                    </div>
                )

            case 'select':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <Badge variant="secondary" className="font-normal text-xs">
                            {value}
                        </Badge>
                    </div>
                )

            default:
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <span className="font-medium text-foreground">{value}</span>
                    </div>
                )
        }
    }

    const ItemCard = ({ item }: { item: Item }) => {
        const hasNotes = item.notes && item.notes.trim().length > 0
        const noteSnippet = hasNotes ? item.notes.slice(0, 100) + (item.notes.length > 100 ? '...' : '') : null

        return (
            <Card className="mb-3 border-border/50 bg-card/50 shadow-sm hover:bg-accent/20 active:scale-[0.98] transition-all duration-200 group">
                {item.item_photo_url && (
                    <div className="h-48 w-full overflow-hidden">
                        <img
                            src={item.item_photo_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}

                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 p-5">
                    <div className="flex-1 cursor-pointer" onClick={() => openDetail(item)}>
                        <CardTitle className="font-semibold text-lg leading-tight mb-2">
                            {item.title}
                        </CardTitle>
                        {item.rating && item.status === 'Realized' && (
                            <div className="mt-2">
                                <StarRating value={item.rating} readonly size="sm" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                        {item.status === 'Planned' && (
                            <>
                                {(() => {
                                    const dateField = templateSchema.find(f => f.type === 'date')
                                    const dateValue = dateField ? item.properties_value[dateField.id] : null

                                    if (dateValue) {
                                        const date = new Date(dateValue)
                                        const formattedDate = date.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0]
                                        const nextDay = new Date(date)
                                        nextDay.setDate(date.getDate() + 1)
                                        const formattedNextDay = nextDay.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0]

                                        const details = encodeURIComponent(`${item.notes || ''}\n\nGenerated by NotionClone`)
                                        const location = encodeURIComponent('') // Could add location field support later
                                        const text = encodeURIComponent(item.title)

                                        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${formattedDate}/${formattedNextDay}`

                                        return (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(googleCalendarUrl, '_blank')
                                                }}
                                                title="Add to Google Calendar"
                                            >
                                                <CalendarPlus className="h-4 w-4" />
                                            </Button>
                                        )
                                    }
                                    return null
                                })()}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-accent"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setCompletingItem(item)
                                    }}
                                    title="Mark as complete"
                                >
                                    <Circle className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {item.status === 'Realized' && (
                            <div className="h-8 w-8 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingItem(item)
                                }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Item
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setDeletingItem(item)
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Item
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent
                    className="p-5 pt-0 cursor-pointer"
                    onClick={() => openDetail(item)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                        {/* Left: Properties */}
                        <div className="flex flex-wrap gap-2">
                            {templateSchema.map((field) => (
                                <div key={field.id}>
                                    {renderProperty(field, item.properties_value[field.id])}
                                </div>
                            ))}
                        </div>

                        {/* Right: Note Snippet (Desktop Only) */}
                        {noteSnippet && (
                            <div className="hidden md:block min-w-[200px] max-w-[300px]">
                                <div className="text-xs text-muted-foreground border-l-2 border-border/50 pl-3">
                                    <div className="font-medium mb-1">Notes</div>
                                    <div className="line-clamp-3">{noteSnippet}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const plannedItems = items.filter((i) => i.status === 'Planned')
    const realizedItems = items.filter((i) => i.status === 'Realized')

    return (
        <>
            <Tabs defaultValue="planned" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="planned">Planned ({plannedItems.length})</TabsTrigger>
                    <TabsTrigger value="realized">Realized ({realizedItems.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="planned" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {plannedItems.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            No planned items.
                        </div>
                    )}
                    {plannedItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </TabsContent>
                <TabsContent value="realized" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {realizedItems.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            No realized items yet.
                        </div>
                    )}
                    {realizedItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </TabsContent>
            </Tabs>

            {selectedItem && (
                <ItemDetail
                    item={selectedItem}
                    open={detailOpen}
                    onOpenChange={setDetailOpen}
                    templateSchema={templateSchema}
                />
            )}

            {editingItem && (
                <EditItemDialog
                    item={editingItem}
                    templateSchema={templateSchema}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            {deletingItem && (
                <DeleteItemDialog
                    item={deletingItem}
                    open={!!deletingItem}
                    onOpenChange={(open) => !open && setDeletingItem(null)}
                />
            )}

            {completingItem && (
                <CompleteItemModal
                    item={completingItem}
                    templateSchema={templateSchema}
                    open={!!completingItem}
                    onOpenChange={(open) => !open && setCompletingItem(null)}
                />
            )}
        </>
    )
}
