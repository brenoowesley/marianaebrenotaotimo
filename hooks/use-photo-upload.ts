'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function usePhotoUpload() {
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const supabase = createClient()

    const validateFile = (file: File): boolean => {
        if (file.size > MAX_FILE_SIZE) {
            setError('File size must be less than 10MB')
            return false
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Only image files allowed (JPEG, PNG, WebP, GIF)')
            return false
        }

        setError('')
        return true
    }

    const handleFileChange = (file: File | null) => {
        if (!file) return

        if (!validateFile(file)) return

        setIsLoading(true)
        setPhotoFile(file)

        const reader = new FileReader()
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string)
            setIsLoading(false)
        }
        reader.onerror = () => {
            setError('Error reading file')
            setIsLoading(false)
        }
        reader.readAsDataURL(file)
    }

    const uploadPhoto = async (userId: string, bucket: string = 'category-covers'): Promise<string | null> => {
        if (!photoFile) return null

        try {
            const fileExt = photoFile.name.split('.').pop()
            // ✅ UUID em vez de Math.random()
            const fileName = `${crypto.randomUUID()}.${fileExt}`
            const filePath = `${userId}/items/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, photoFile)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (error) {
            console.error('Error uploading photo:', error)
            setError('Upload failed')
            return null
        }
    }

    const clearPhoto = () => {
        setPhotoFile(null)
        setPhotoPreview('')
        setError('')
    }

    return {
        photoFile,
        photoPreview,
        isLoading,
        error,
        handleFileChange,
        uploadPhoto,
        clearPhoto,
    }
}
