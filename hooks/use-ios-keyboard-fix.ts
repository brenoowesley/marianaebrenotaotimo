'use client'

import { useEffect } from 'react'

/**
 * Hook to fix iOS keyboard overlapping input fields in modals
 * Automatically scrolls focused inputs into view when keyboard appears
 * @param enabled - Whether the fix should be active (e.g., when modal is open)
 */
export function useIOSKeyboardFix(enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return

        // Detect iOS device
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
        if (!isIOS) return

        const inputs = document.querySelectorAll('input, textarea, select')

        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement

            // Delay allows keyboard to fully appear before scrolling
            setTimeout(() => {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                })
            }, 300)
        }

        inputs.forEach(input => {
            input.addEventListener('focus', handleFocus)
        })

        return () => {
            inputs.forEach(input => {
                input.removeEventListener('focus', handleFocus)
            })
        }
    }, [enabled])
}
