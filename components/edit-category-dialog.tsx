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
import { TemplateBuilder, type TemplateField } from '@/components/template-builder'
import { X, Upload } from 'lucide-react'

interface EditCategoryDialogProps {
    category: {
        id: string
        title: string
        icon: string
        cover_image_url: string | null
        template_schema: any[]
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
    const [title, setTitle] = useState(category.title)
    const [icon, setIcon] = useState(category.icon)
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string>(category.cover_image_url || '')
    const [fields, setFields] = useState<TemplateField[]>(category.template_schema || [])
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB')
                return
            }

            setCoverImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const uploadCoverImage = async (file: File, userId: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('category-covers')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('category-covers')
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (error) {
            console.error('Error uploading image:', error)
            return null
        }
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            // Upload new cover image if selected
            let coverImageUrl = category.cover_image_url
            if (coverImage) {
                const newUrl = await uploadCoverImage(coverImage, user.id)
                if (newUrl) {
                    coverImageUrl = newUrl
                }
            }

            const { error } = await supabase
                .from('categories')
                .update({
                    title,
                    icon,
                    cover_image_url: coverImageUrl,
                    template_schema: fields,
                })
                .eq('id', category.id)

            if (error) throw error

            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating category:', error)
            alert('Failed to update category')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>
                        Update your category details and template fields.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Category Title</Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Movies, Books, Projects"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-icon">Icon (Emoji)</Label>
                        <Input
                            id="edit-icon"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            placeholder="📁"
                            maxLength={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-cover">Cover Image</Label>
                        <Input
                            id="edit-cover"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {coverImagePreview && (
                            <div className="mt-2 rounded-lg overflow-hidden border relative">
                                <img
                                    src={coverImagePreview}
                                    alt="Cover preview"
                                    className="w-full h-32 object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 bg-background/80"
                                    onClick={() => {
                                        setCoverImage(null)
                                        setCoverImagePreview('')
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Template Fields</Label>
                        <TemplateBuilder fields={fields} onChange={setFields} />
                        <p className="text-xs text-muted-foreground">
                            Note: Changing field types or deleting fields won't affect existing item data.
                        </p>
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
