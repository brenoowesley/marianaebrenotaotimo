import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 1, // Max size in MB
        maxWidthOrHeight: 1200, // Max width/height
        useWebWorker: true,
        fileType: 'image/webp', // Convert to WebP for better compression
        initialQuality: 0.8,
    }

    try {
        const compressedFile = await imageCompression(file, options)
        return compressedFile
    } catch (error) {
        console.error('Error compressing image:', error)
        return file // Return original file if compression fails
    }
}
