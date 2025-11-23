import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
    id: string
    children: React.ReactNode
}

export function SortableItemWrapper({ id, children }: SortableItemProps) {
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
        zIndex: isDragging ? 10 : 0,
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
