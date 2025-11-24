'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/utils/supabase/client'
import { compressImage } from '@/utils/image-compression'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { IOSKeyboardFixWrapper } from '@/components/ios-keyboard-fix-wrapper'

export default function SettingsPage() {
    const [autoCompress, setAutoCompress] = useState(true)
    const [isScanning, setIsScanning] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const [processedItems, setProcessedItems] = useState(0)
    const [statusMessage, setStatusMessage] = useState('')
    const [itemsToProcess, setItemsToProcess] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        // Load preference from local storage (or profile if we had it there)
        const stored = localStorage.getItem('auto_compress_images')
        if (stored !== null) {
            setAutoCompress(stored === 'true')
        }
    }, [])

    const handleToggle = (checked: boolean) => {
        setAutoCompress(checked)
        localStorage.setItem('auto_compress_images', String(checked))
    }

    const scanImages = async () => {
        setIsScanning(true)
        setStatusMessage('Escaneando itens com imagens...')

        try {
            // Fetch all items with photos
            const { data: items, error } = await supabase
                .from('items')
                .select('id, title, item_photo_url')
                .not('item_photo_url', 'is', null)

            if (error) throw error

            if (items) {
                setItemsToProcess(items)
                setTotalItems(items.length)
                setStatusMessage(`Encontrados ${items.length} itens com imagens.`)
            }
        } catch (error) {
            console.error('Error scanning:', error)
            setStatusMessage('Erro ao escanear imagens.')
        } finally {
            setIsScanning(false)
        }
    }

    const processImages = async () => {
        if (itemsToProcess.length === 0) return

        setIsProcessing(true)
        setProcessedItems(0)
        setProgress(0)

        for (let i = 0; i < itemsToProcess.length; i++) {
            const item = itemsToProcess[i]
            setStatusMessage(`Processando: ${item.title} (${i + 1}/${totalItems})`)

            try {
                // 1. Fetch the image
                const response = await fetch(item.item_photo_url)
                const blob = await response.blob()
                const file = new File([blob], 'image.jpg', { type: blob.type })

                // 2. Compress
                const compressedFile = await compressImage(file)

                // 3. Upload (Overwrite)
                // Extract path from URL or assume standard structure if possible. 
                // Since we don't know the exact path structure easily from URL without parsing, 
                // we might need to rely on how we upload. 
                // Usually: public/items/{fileName}
                // Let's try to extract filename from URL
                const urlParts = item.item_photo_url.split('/')
                const fileName = urlParts[urlParts.length - 1]

                // We need to know the bucket path. Assuming 'items' bucket and root or folder.
                // If the URL is signed or complex, this might be tricky.
                // Let's assume standard Supabase public URL structure: .../storage/v1/object/public/bucket/path

                // WARNING: Overwriting might change the URL if we change extension (e.g. jpg -> webp)
                // If we change extension, we need to update the DB record too.

                const newFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('items')
                    .upload(newFileName, compressedFile)

                if (uploadError) throw uploadError

                // 4. Get new URL
                const { data: { publicUrl } } = supabase.storage
                    .from('items')
                    .getPublicUrl(newFileName)

                // 5. Update Item
                const { error: updateError } = await supabase
                    .from('items')
                    .update({ item_photo_url: publicUrl })
                    .eq('id', item.id)

                if (updateError) throw updateError

                // Optional: Delete old image if filename changed (cleanup)
                // Skipping for safety in this MVP

            } catch (error) {
                console.error(`Error processing ${item.title}:`, error)
                // Continue to next
            }

            setProcessedItems(i + 1)
            setProgress(((i + 1) / totalItems) * 100)
        }

        setIsProcessing(false)
        setStatusMessage('Otimização concluída!')
        setItemsToProcess([])
    }

    return (
        <IOSKeyboardFixWrapper>
            <div className="container mx-auto p-4 space-y-8 max-w-2xl">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
                    <p className="text-muted-foreground">
                        Gerencie as preferências do aplicativo.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Auto Compression */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Otimização de Imagens</CardTitle>
                            <CardDescription>
                                Reduzir automaticamente o tamanho das imagens ao fazer upload.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="auto-compress">Otimizar uploads futuros</Label>
                                <p className="text-sm text-muted-foreground">
                                    Converte para WebP e redimensiona para max 1200px.
                                </p>
                            </div>
                            <Switch
                                id="auto-compress"
                                checked={autoCompress}
                                onCheckedChange={handleToggle}
                            />
                        </CardContent>
                    </Card>

                    {/* Retroactive Optimization */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Manutenção de Armazenamento</CardTitle>
                            <CardDescription>
                                Otimizar imagens antigas para liberar espaço.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={scanImages}
                                    disabled={isScanning || isProcessing}
                                    variant="outline"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Escaneando...
                                        </>
                                    ) : (
                                        'Escanear Imagens'
                                    )}
                                </Button>
                                {itemsToProcess.length > 0 && !isProcessing && (
                                    <Button onClick={processImages}>
                                        Otimizar {itemsToProcess.length} Imagens
                                    </Button>
                                )}
                            </div>

                            {statusMessage && (
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {statusMessage}
                                </div>
                            )}

                            {(isProcessing || processedItems > 0) && (
                                <div className="space-y-2">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-xs text-right text-muted-foreground">
                                        {processedItems} / {totalItems}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </IOSKeyboardFixWrapper>
    )
}
