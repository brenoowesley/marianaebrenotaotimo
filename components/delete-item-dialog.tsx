'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteItemDialogProps {
    item: {
        id: string
        title: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteItemDialog({ item, open, onOpenChange }: DeleteItemDialogProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', item.id)

            if (error) throw error

            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error('Error deleting item:', error)
            alert('Failed to delete item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Item
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <span className="font-semibold">"{item.title}"</span>?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Item'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
