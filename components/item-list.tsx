'use client'

import { useState, useEffect } from 'react'
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
import { CheckCircle2, Circle, Star, MoreVertical, Pencil, Trash2, ExternalLink, CalendarPlus, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ItemDetail } from '@/components/item-detail'
import { EditItemDialog } from '@/components/edit-item-dialog'
import { DeleteItemDialog } from '@/components/delete-item-dialog'
import { CompleteItemModal } from '@/components/complete-item-modal'
import { StarRating } from '@/components/star-rating'

import {
    DndContext,
    DragStartEvent,
    DragEndEvent,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Filter, X } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Item {
    id: string
    title: string
    status: string
    properties_value: Record<string, any>
    notes: string
    item_photo_url: string | null
    rating: number | null
    order_index: number | null
}

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags'
    icon?: string
    options?: string[]
}

interface ItemListProps {
    items: Item[]
    templateSchema: TemplateField[]
    existingTags?: Record<string, string[]>
}

interface SortableItemProps {
    id: string
    children: React.ReactNode
}

const SortableItem = ({ id, children }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0, // Ensure dragging item is on top
        opacity: isDragging ? 0.8 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="relative group">
            {/* Drag Handle - Only this area triggers drag */}
            <div
                {...listeners}
                className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity z-10 bg-gradient-to-r from-accent/50 to-transparent"
                title="Drag to reorder"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            {/* Content - Clicks work normally here */}
            <div className="pl-2">
                {children}
            </div>
        </div>
    )
}

interface FilterPopoverProps {
    field: TemplateField
    options: string[]
    activeFilters: string[]
    toggleFilter: (fieldId: string, value: string) => void
    setFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}

const FilterPopover = ({ field, options, activeFilters, toggleFilter, setFilters }: FilterPopoverProps) => {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 border-dashed",
                        activeFilters.length > 0 && "bg-accent text-accent-foreground border-solid"
                    )}
                >
                    <Filter className="mr-2 h-3 w-3" />
                    {field.name}
                    {activeFilters.length > 0 && (
                        <>
                            <span className="mx-2 h-4 w-[1px] bg-border" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {activeFilters.length}
                            </Badge>
                            <div className="hidden lg:flex space-x-1">
                                {activeFilters.length > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {activeFilters.length} selected
                                    </Badge>
                                ) : (
                                    activeFilters.map(option => (
                                        <Badge
                                            key={option}
                                            variant="secondary"
                                            className="rounded-sm px-1 font-normal"
                                        >
                                            {option}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Filter ${field.name}...`} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map(option => {
                                const isSelected = activeFilters.includes(option)
                                return (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => {
                                            toggleFilter(field.id, option)
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        <span>{option}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {activeFilters.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => {
                                            setFilters(prev => {
                                                const { [field.id]: _, ...rest } = prev
                                                return rest
                                            })
                                            setOpen(false)
                                        }}
                                        className="justify-center text-center"
                                        value="clear-filters"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function ItemList({ items, templateSchema, existingTags = {} }: ItemListProps) {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Item | null>(null)
    const [deletingItem, setDeletingItem] = useState<Item | null>(null)
    const [completingItem, setCompletingItem] = useState<Item | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)

    // Filter state: fieldId -> selected values array
    const [filters, setFilters] = useState<Record<string, string[]>>({})

    // Local state for optimistic updates
    const [plannedItems, setPlannedItems] = useState<Item[]>([])
    const [realizedItems, setRealizedItems] = useState<Item[]>([])

    const supabase = createClient()
    const router = useRouter()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag, prevents accidental drags on clicks
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Initialize local state when items prop changes or filters change
    useEffect(() => {
        let filteredItems = items

        // Apply filters
        if (Object.keys(filters).length > 0) {
            filteredItems = items.filter(item => {
                return Object.entries(filters).every(([fieldId, selectedValues]) => {
                    if (selectedValues.length === 0) return true

                    const itemValue = item.properties_value[fieldId]

                    // Handle array (tags)
                    if (Array.isArray(itemValue)) {
                        return selectedValues.some(val => itemValue.includes(val))
                    }

                    // Handle single value (select)
                    return selectedValues.includes(itemValue)
                })
            })
        }

        const planned = filteredItems
            .filter((i) => i.status === 'Planned')
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

        const realized = filteredItems
            .filter((i) => i.status === 'Realized')
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

        setPlannedItems(planned)
        setRealizedItems(realized)
    }, [items, filters])

    const toggleFilter = (fieldId: string, value: string) => {
        setFilters(prev => {
            const current = prev[fieldId] || []
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value]

            if (updated.length === 0) {
                const { [fieldId]: _, ...rest } = prev
                return rest
            }

            return { ...prev, [fieldId]: updated }
        })
    }

    const clearFilters = () => setFilters({})

    const openDetail = (item: Item) => {
        setSelectedItem(item)
        setDetailOpen(true)
    }

    const toggleItemStatus = async (item: Item) => {
        const newStatus = item.status === 'Planned' ? 'Realized' : 'Planned'

        // Optimistic update
        router.refresh()

        const { error } = await supabase
            .from('items')
            .update({ status: newStatus })
            .eq('id', item.id)

        if (error) {
            console.error('Error updating status:', error)
            router.refresh()
        } else {
            router.refresh()
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over || active.id === over.id) return

        const isPlanned = plannedItems.some(i => i.id === active.id)
        const currentList = isPlanned ? plannedItems : realizedItems
        const setItems = isPlanned ? setPlannedItems : setRealizedItems

        const oldIndex = currentList.findIndex((item) => item.id === active.id)
        const newIndex = currentList.findIndex((item) => item.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
            const newItems = arrayMove(currentList, oldIndex, newIndex)

            // Optimistic update
            setItems(newItems)

            // Calculate new order_index
            let newOrderIndex: number
            const prevItem = newItems[newIndex - 1]
            const nextItem = newItems[newIndex + 1]

            if (!prevItem && !nextItem) {
                newOrderIndex = 1000
            } else if (!prevItem) {
                newOrderIndex = (nextItem.order_index || 0) / 2
            } else if (!nextItem) {
                newOrderIndex = (prevItem.order_index || 0) + 1000
            } else {
                newOrderIndex = ((prevItem.order_index || 0) + (nextItem.order_index || 0)) / 2
            }

            // Update Supabase
            const { error } = await supabase
                .from('items')
                .update({ order_index: newOrderIndex })
                .eq('id', active.id)

            if (error) {
                console.error('Error updating order:', error)
                // Revert (optional, or just refresh)
                router.refresh()
            }
        }
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
                        <Badge variant="secondary" className="font-normal text-[10px] px-1.5 h-5">
                            {value}
                        </Badge>
                    </div>
                )

            case 'tags':
                return Array.isArray(value) && value.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {icon}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {value.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="font-normal text-[10px] px-1.5 h-5">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : null

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
            <Card className="mb-3 border-border/50 bg-card/50 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-md hover:border-primary/40 cursor-pointer group touch-manipulation">
                {item.item_photo_url && (
                    <div className="h-48 w-full overflow-hidden rounded-t-xl">
                        <img
                            src={item.item_photo_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}

                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-start justify-between space-y-0 p-4">
                    <div className="flex-1 cursor-pointer" onClick={() => openDetail(item)}>
                        <CardTitle className="font-semibold text-lg leading-tight">
                            {item.title}
                        </CardTitle>
                        {item.rating && item.status === 'Realized' && (
                            <div className="mt-1.5">
                                <StarRating value={item.rating} readonly size="sm" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 ml-3 shrink-0">
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
                                        const location = encodeURIComponent('')
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
                                                onPointerDown={(e) => e.stopPropagation()}
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
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Circle className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {item.status === 'Realized' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent text-green-500"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleItemStatus(item)
                                }}
                                title="Mark as planned"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <CheckCircle2 className="h-5 w-5" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
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
                    className="p-4 pt-3 cursor-pointer"
                    onClick={() => openDetail(item)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                        {/* Left: Properties */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-2">
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

    return (
        <>
            {/* Filter Bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                {templateSchema
                    .filter(field => field.type === 'select' || field.type === 'tags')
                    .map(field => {
                        const options = field.type === 'select'
                            ? field.options || []
                            : existingTags[field.id] || []

                        if (options.length === 0) return null

                        const activeFilters = filters[field.id] || []

                        return (
                            <FilterPopover
                                key={field.id}
                                field={field}
                                options={options}
                                activeFilters={activeFilters}
                                toggleFilter={toggleFilter}
                                setFilters={setFilters}
                            />
                        )
                    })}

                {Object.keys(filters).length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
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
                        <SortableContext
                            items={plannedItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {plannedItems.map((item) => (
                                <SortableItem key={item.id} id={item.id}>
                                    <ItemCard item={item} />
                                </SortableItem>
                            ))}
                        </SortableContext>
                    </TabsContent>

                    <TabsContent value="realized" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {realizedItems.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No realized items yet.
                            </div>
                        )}
                        {/* Standard List for Realized Items */}
                        <SortableContext
                            items={realizedItems.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {realizedItems.map((item) => (
                                <SortableItem key={item.id} id={item.id}>
                                    <ItemCard item={item} />
                                </SortableItem>
                            ))}
                        </SortableContext>
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
                        existingTags={existingTags}
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
            </DndContext>
        </>
    )
}
