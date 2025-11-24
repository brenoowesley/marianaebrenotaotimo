'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/star-rating'
import { X, ExternalLink, Calendar, CheckSquare, Type, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { compressImage } from '@/utils/image-compression'

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
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags'
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
            // Check auto-compression preference
            const shouldCompress = localStorage.getItem('auto_compress_images') !== 'false' // Default to true

            let fileToUpload = file
            if (shouldCompress) {
                fileToUpload = await compressImage(file)
            }

            const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${userId}/items/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('category-covers')
                .upload(filePath, fileToUpload)

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

    const renderProperty = (field: TemplateField, value: any) => {
        if (value === undefined || value === null || value === '') return null

        const icon = field.icon ? (
            <span className="mr-2">{field.icon}</span>
        ) : (
            <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
        )

        switch (field.type) {
            case 'link':
                return (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:underline"
                    >
                        {icon}
                        {value}
                        <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                )
            case 'date':
                return (
                    <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(value), 'PPP')}
                    </div>
                )
            case 'checkbox':
                return (
                    <div className="flex items-center text-muted-foreground">
                        <CheckSquare className="mr-2 h-4 w-4" />
                        {value ? 'Yes' : 'No'}
                    </div>
                )
            case 'rating':
                return (
                    <div className="flex items-center">
                        {icon}
                        <StarRating value={Number(value)} readonly size="sm" />
                    </div>
                )
            case 'select':
                return (
                    <div className="flex items-center">
                        {icon}
                        <Badge variant="secondary" className="font-normal">
                            {value}
                        </Badge>
                    </div>
                )
            case 'tags':
                return Array.isArray(value) && value.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-background/50 text-xs">
                            {field.icon}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {value.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="font-normal text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : null
            default:
                return (
                    <div className="flex items-center text-muted-foreground">
                        <Type className="mr-2 h-4 w-4" />
                        {String(value)}
                    </div>
                )
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
                        <div className="text-sm space-y-2">
                            {templateSchema.map((field) => {
                                const value = item.properties_value[field.id]
                                if (value === undefined || value === null || value === '') return null
                                return (
                                    <div key={field.id} className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {field.name}
                                        </span>
                                        {renderProperty(field, value)}
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
