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
import { StarRating } from '@/components/star-rating'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags'
    icon?: string
    options?: string[]
}

interface CompleteItemModalProps {
    item: {
        id: string
        title: string
        properties_value: Record<string, any>
    }
    templateSchema: TemplateField[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CompleteItemModal({ item, templateSchema, open, onOpenChange }: CompleteItemModalProps) {
    const [rating, setRating] = useState(0)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [realizedDate, setRealizedDate] = useState<Date>(new Date())
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

    const handleComplete = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            let photoUrl = null
            if (photoFile) {
                photoUrl = await uploadPhoto(photoFile, user.id)
            }

            const { error } = await supabase
                .from('items')
                .update({
                    status: 'Realized',
                    rating: rating > 0 ? rating : null,
                    item_photo_url: photoUrl,
                    notes: notes || null,
                    realized_at: `${format(realizedDate, 'yyyy-MM-dd')} 12:00:00`,
                })
                .eq('id', item.id)

            if (error) throw error

            router.refresh()
            onOpenChange(false)

            // Reset form
            setRating(0)
            setPhotoFile(null)
            setPhotoPreview('')
            setNotes('')
            setRealizedDate(new Date())
        } catch (error) {
            console.error('Error completing item:', error)
            alert('Failed to complete item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item.title}</DialogTitle>
                    <DialogDescription>
                        Status: Realized
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Properties Display */}
                    <div className="space-y-2">
                        <Label>Properties</Label>
                        <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
                            {templateSchema.map((field) => {
                                const value = item.properties_value[field.id]
                                if (value === undefined || value === null || value === '') return null
                                return (
                                    <div key={field.id} className="flex justify-between">
                                        <span className="text-muted-foreground">{field.name}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Realized Date */}
                    <div className="space-y-2">
                        <Label>Realized Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !realizedDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {realizedDate ? format(realizedDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={realizedDate}
                                    onSelect={(date) => date && setRealizedDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <StarRating
                            value={rating}
                            onChange={setRating}
                            size="lg"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="photo">Add Photo</Label>
                        {photoPreview ? (
                            <div className="relative rounded-lg overflow-hidden border">
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 bg-background/80"
                                    onClick={() => {
                                        setPhotoFile(null)
                                        setPhotoPreview('')
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Max 10MB. Supported: JPEG, PNG, WebP, GIF
                                </p>
                            </>
                        )}
                    </div>

                    {/* Notes */}
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Skip
                    </Button>
                    <Button onClick={handleComplete} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
