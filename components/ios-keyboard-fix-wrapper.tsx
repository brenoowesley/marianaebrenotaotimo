'use client'

import { useIOSKeyboardFix } from '@/hooks/use-ios-keyboard-fix'

interface IOSKeyboardFixWrapperProps {
    children: React.ReactNode
}

export function IOSKeyboardFixWrapper({ children }: IOSKeyboardFixWrapperProps) {
    useIOSKeyboardFix(true)
    return <>{children}</>
}
