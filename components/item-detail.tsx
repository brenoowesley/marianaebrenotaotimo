'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { StarRating } from '@/components/star-rating'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface ItemDetailProps {
    item: Item
    open: boolean
    onOpenChange: (open: boolean) => void
    templateSchema: TemplateField[]
}

export function ItemDetail({ item, open, onOpenChange, templateSchema }: ItemDetailProps) {
    const [notes, setNotes] = useState(item.notes || '')
    const [rating, setRating] = useState(item.rating || 0)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string>(item.item_photo_url || '')
    const [saving, setSaving] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        setNotes(item.notes || '')
        setRating(item.rating || 0)
        setPhotoPreview(item.item_photo_url || '')
    }, [item])

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

    const handleSave = async () => {
        setSaving(true)
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
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                {photoPreview && (
                    <div className="h-48 w-full overflow-hidden rounded-lg -mt-6 -mx-6 mb-4 relative">
                        <img
                            src={photoPreview}
                            alt={item.title}
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
                    <DialogTitle>{item.title}</DialogTitle>
                    <DialogDescription>
                        Status: {item.status}
                    </DialogDescription>
                    {item.status === 'Realized' && rating > 0 && (
                        <div className="pt-2">
                            <StarRating value={rating} readonly size="lg" />
                        </div>
                    )}
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Properties</Label>
                        <div className="text-sm space-y-1">
                            {templateSchema.map((field) => {
                                const value = item.properties_value[field.id]
                                if (value === undefined || value === null || value === '') return null
                                return (
                                    <div key={field.id} className="flex justify-between">
                                        <span className="text-muted-foreground">{field.name}:</span>
                                        <span>{String(value)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {item.status === 'Realized' && (
                        <>
                            <div className="space-y-2">
                                <Label>Rating</Label>
                                <StarRating
                                    value={rating}
                                    onChange={setRating}
                                    size="lg"
                                />
                            </div>

                            {!photoPreview && (
                                <div className="space-y-2">
                                    <Label htmlFor="photo">Add Photo</Label>
                                    <Input
                                        id="photo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max 10MB. Supported: JPEG, PNG, WebP, GIF
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes here..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
