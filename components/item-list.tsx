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
import { CheckCircle2, Circle, Calendar as CalendarIcon, Link as LinkIcon, Star, MoreVertical, Pencil, Trash2 } from 'lucide-react'
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
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating'
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

    const renderProperty = (field: TemplateField, value: any) => {
        if (value === undefined || value === null || value === '') return null

        switch (field.type) {
            case 'checkbox':
                return value ? <Badge variant="outline">{field.name}</Badge> : null
            case 'date':
                return (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {format(new Date(value), 'MMM d')}
                    </div>
                )
            case 'link':
                return (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        <LinkIcon className="h-4 w-4" />
                    </a>
                )
            case 'rating':
                return (
                    <div className="flex items-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="text-sm">{value}</span>
                    </div>
                )
            default:
                return <span className="text-sm text-muted-foreground">{value}</span>
        }
    }

    const ItemCard = ({ item }: { item: Item }) => (
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors mb-4 overflow-hidden group relative">
            {item.item_photo_url && (
                <div className="h-32 w-full overflow-hidden">
                    <img
                        src={item.item_photo_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <CardHeader className="pb-2" onClick={() => openDetail(item)}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        {item.rating && item.status === 'Realized' && (
                            <div className="mt-1">
                                <StarRating value={item.rating} readonly size="sm" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {item.status === 'Planned' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCompletingItem(item)
                                }}
                            >
                                <Circle className="h-4 w-4" />
                            </Button>
                        )}
                        {item.status === 'Realized' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent onClick={() => openDetail(item)}>
                <div className="flex flex-wrap gap-2">
                    {templateSchema.map((field) => (
                        <div key={field.id}>
                            {renderProperty(field, item.properties_value[field.id])}
                        </div>
                    ))}
                </div>
            </CardContent>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
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
        </Card>
    )

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
