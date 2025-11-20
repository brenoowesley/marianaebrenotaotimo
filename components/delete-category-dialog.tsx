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
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'

interface DeleteCategoryDialogProps {
    category: {
        id: string
        title: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({ category, open, onOpenChange }: DeleteCategoryDialogProps) {
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (confirmText !== category.title) {
            alert('Please type the category name correctly to confirm deletion')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id)

            if (error) throw error

            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error('Error deleting category:', error)
            alert('Failed to delete category')
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
                        Delete Category
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete the category
                        <span className="font-semibold"> "{category.title}" </span>
                        and all its items.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Type <span className="font-bold">{category.title}</span> to confirm:
                        </label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={category.title}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading || confirmText !== category.title}
                    >
                        {loading ? 'Deleting...' : 'Delete Category'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
