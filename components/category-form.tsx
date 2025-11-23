'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TemplateBuilder, type TemplateField } from '@/components/template-builder'
import { DrawerClose, DrawerFooter } from '@/components/ui/drawer'
import { X, Upload } from 'lucide-react'

interface CategoryFormProps {
    onSuccess?: () => void
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
    const [title, setTitle] = useState('')
    const [icon, setIcon] = useState('📁')
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string>('')
    const [fields, setFields] = useState<TemplateField[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const validateFile = (file: File): boolean => {
        // Check file size (10MB)
        if (file.size > MAX_FILE_SIZE) {
            alert('File size must be less than 10MB')
            return false
        }

        // Check file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert('Only image files are allowed (JPEG, PNG, WebP, GIF)')
            return false
        }

        return true
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && validateFile(file)) {
            setCoverImage(file)
            // Create preview
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

            // Get public URL
            const { data } = supabase.storage
                .from('category-covers')
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (error) {
            console.error('Error uploading image:', error)
            return null
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('User not found')

            // Upload cover image if selected
            let coverImageUrl = null
            if (coverImage) {
                coverImageUrl = await uploadCoverImage(coverImage, user.id)
                if (!coverImageUrl) {
                    throw new Error('Failed to upload cover image')
                }
            }

            const { error } = await supabase.from('categories').insert({
                user_id: user.id,
                title,
                icon,
                cover_image_url: coverImageUrl,
                template_schema: fields,
            })

            if (error) throw error

            setTitle('')
            setIcon('📁')
            setCoverImage(null)
            setCoverImagePreview('')
            setFields([])
            router.refresh()
            onSuccess?.()
        } catch (error) {
            console.error('Error creating category:', error)
            alert('Failed to create category')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Category Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Movies, Books, Projects"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="icon">Icon (Emoji)</Label>
                    <Input
                        id="icon"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="📁"
                        maxLength={2}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="coverImage">Cover Image (Optional)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="coverImage"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Max 10MB. Supported: JPEG, PNG, WebP, GIF
                    </p>
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
                                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
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
                </div>
            </div>

            <DrawerFooter className="px-0">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Category'}
                </Button>
                <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DrawerClose>
            </DrawerFooter>
        </form>
    )
}
