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
import { CheckCircle2, Circle, Star, MoreVertical, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
    icon?: string  // Custom emoji/icon
    options?: string[]  // Options for select type
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

    // Get icon for a property field - custom icon or fallback to type-based
    const getPropertyIcon = (field: TemplateField) => {
        if (field.icon) return field.icon

        // Fallback icons based on type
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
        return (
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-border/40 shadow-sm mb-4 group">
                {item.item_photo_url && (
                    <div className="h-40 w-full overflow-hidden">
                        <img
                            src={item.item_photo_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 p-5">
                    <div className="flex-1" onClick={() => openDetail(item)}>
                        <CardTitle className="font-semibold text-lg leading-none tracking-tight">
                            {item.title}
                        </CardTitle>
                        {item.rating && item.status === 'Realized' && (
                            <div className="mt-2">
                                <StarRating value={item.rating} readonly size="sm" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {item.status === 'Planned' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCompletingItem(item)
                                }}
                            >
                                <Circle className="h-4 w-4" />
                            </Button>
                        )}
                        {item.status === 'Realized' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
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

                <CardContent className="grid gap-2.5 p-5 pt-0" onClick={() => openDetail(item)}>
                    {templateSchema.map((field) => (
                        <div key={field.id}>
                            {renderProperty(field, item.properties_value[field.id])}
                        </div>
                    ))}
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
                <TabsContent value="planned" className="mt-4">
                    {plannedItems.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            No planned items.
                        </div>
                    )}
                    {plannedItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </TabsContent>
                <TabsContent value="realized" className="mt-4">
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
