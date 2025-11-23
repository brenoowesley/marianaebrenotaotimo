'use client'

import { useEffect } from 'react'

/**
 * Improved iOS keyboard fix with visualViewport tracking and MutationObserver
 * Handles dynamic inputs and ensures proper scrolling even with keyboard animations
 */
export function useIOSKeyboardFix(enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return

        // More robust iOS detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

        if (process.env.NODE_ENV === 'development') {
            console.log('🎯 iOS Keyboard Fix - Enabled:', enabled, 'Is iOS:', isIOS)
        }

        if (!isIOS) return

        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement

            if (process.env.NODE_ENV === 'development') {
                console.log('📱 Input focused:', target.tagName, target.id || 'no-id')
            }

            // Force scroll with multiple strategies
            const scrollIntoViewAggressively = () => {
                // Strategy 1: Native scrollIntoView
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                })

                // Strategy 2: Manual scroll using visualViewport
                if (window.visualViewport) {
                    const rect = target.getBoundingClientRect()
                    const viewportHeight = window.visualViewport.height
                    const targetTop = rect.top + window.visualViewport.pageTop

                    // Scroll so input is in upper half of visible area
                    const desiredScroll = targetTop - (viewportHeight * 0.3)
                    window.scrollTo({ top: desiredScroll, behavior: 'smooth' })
                }
            }

            // Immediate scroll
            scrollIntoViewAggressively()

            // Delayed scroll (after keyboard animation)
            setTimeout(scrollIntoViewAggressively, 300)

            // Extra delayed scroll (insurance for slow keyboards)
            setTimeout(scrollIntoViewAggressively, 600)
        }

        // Attach to existing inputs
        const attachListeners = () => {
            const inputs = document.querySelectorAll('input, textarea, select')
            if (process.env.NODE_ENV === 'development') {
                console.log('🔗 Attaching listeners to', inputs.length, 'inputs')
            }

            inputs.forEach(input => {
                input.addEventListener('focus', handleFocus, { passive: true })
            })

            return inputs
        }

        let initialInputs = attachListeners()

        // Watch for dynamically added inputs (modals render after hook runs)
        const observer = new MutationObserver(() => {
            const currentInputs = document.querySelectorAll('input, textarea, select')
            if (currentInputs.length !== initialInputs.length) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 Input count changed, reattaching listeners')
                }
                initialInputs.forEach(input => {
                    input.removeEventListener('focus', handleFocus)
                })
                initialInputs = attachListeners()
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        // Cleanup
        return () => {
            observer.disconnect()
            initialInputs.forEach(input => {
                input.removeEventListener('focus', handleFocus)
            })
        }
    }, [enabled])
}
