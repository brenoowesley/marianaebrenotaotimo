'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Move } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface CoverRepositionProps {
    categoryId: string
    coverImageUrl: string
    initialPosition: number
}

export function CoverReposition({
    categoryId,
    coverImageUrl,
    initialPosition
}: CoverRepositionProps) {
    const [isRepositioning, setIsRepositioning] = useState(false)
    const [position, setPosition] = useState(initialPosition)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isRepositioning) return
        setIsDragging(true)
        updatePosition(e.clientY)
    }

    const updatePosition = (clientY: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const y = clientY - rect.top
        const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100))
        setPosition(Math.round(percentage))
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        updatePosition(e.clientY)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging])

    const savePosition = async () => {
        try {
            const { error } = await supabase
                .from('categories')
                .update({ cover_position: position })
                .eq('id', categoryId)

            if (error) throw error

            setIsRepositioning(false)
            router.refresh()
        } catch (error) {
            console.error('Error saving cover position:', error)
            alert('Failed to save cover position')
        }
    }

    const cancelReposition = () => {
        setPosition(initialPosition)
        setIsRepositioning(false)
    }

    return (
        <div className="relative group">
            <div
                ref={containerRef}
                className={`relative overflow-hidden h-60 ${isRepositioning ? 'cursor-move' : ''}`}
                onMouseDown={handleMouseDown}
            >
                <img
                    src={coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    style={{
                        objectPosition: `center ${position}%`,
                    }}
                />

                {isRepositioning && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                        <div className="text-white text-sm bg-black/60 px-3 py-1 rounded">
                            Drag to reposition
                        </div>
                    </div>
                )}
            </div>

            {!isRepositioning && (
                <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsRepositioning(true)}
                >
                    <Move className="h-4 w-4 mr-2" />
                    Reposition Cover
                </Button>
            )}

            {isRepositioning && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={cancelReposition}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={savePosition}
                    >
                        Save Position
                    </Button>
                </div>
            )}
        </div>
    )
}
