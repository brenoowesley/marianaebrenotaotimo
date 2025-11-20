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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from '@/components/star-rating'
import { X } from 'lucide-react'

interface EditItemDialogProps {
    item: {
        id: string
        title: string
        status: string
        properties_value: Record<string, any>
        notes: string
        item_photo_url: string | null
        rating: number | null
    }
    templateSchema: any[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditItemDialog({ item, templateSchema, open, onOpenChange }: EditItemDialogProps) {
    const [title, setTitle] = useState(item.title)
    const [status, setStatus] = useState(item.status)
    const [properties, setProperties] = useState(item.properties_value)
    const [notes, setNotes] = useState(item.notes || '')
    const [rating, setRating] = useState(item.rating || 0)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string>(item.item_photo_url || '')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB')
                return
            }
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${userId}/items/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('category-covers')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('category-covers')
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (error) {
            console.error('Error uploading photo:', error)
            return null
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            let photoUrl = item.item_photo_url
            if (photoFile) {
                const newUrl = await uploadPhoto(photoFile, user.id)
                if (newUrl) {
                    photoUrl = newUrl
                }
            }

            const { error } = await supabase
                .from('items')
                .update({
                    title,
                    status,
                    properties_value: properties,
                    notes,
                    rating: rating > 0 ? rating : null,
                    item_photo_url: photoUrl,
                })
                .eq('id', item.id)

            if (error) throw error

            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating item:', error)
            alert('Failed to update item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {photoPreview && (
                    <div className="h-48 w-full overflow-hidden rounded-lg -mt-6 -mx-6 mb-4 relative">
                        <img
                            src={photoPreview}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                        {photoFile && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 bg-background/80"
                                onClick={() => {
                                    setPhotoFile(null)
                                    setPhotoPreview(item.item_photo_url || '')
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                <DialogHeader>
                    <DialogTitle>Edit Item</DialogTitle>
                    <DialogDescription>
                        Update item details and properties.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Item title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="edit-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planned">Planned</SelectItem>
                                <SelectItem value="Realized">Realized</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {status === 'Realized' && (
                        <>
                            <div className="space-y-2">
                                <Label>Rating</Label>
                                <StarRating
                                    value={rating}
                                    onChange={setRating}
                                    size="lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-photo">Photo</Label>
                                <Input
                                    id="edit-photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes</Label>
                        <Textarea
                            id="edit-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
