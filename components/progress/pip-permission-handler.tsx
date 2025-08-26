"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PictureInPicture, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PiPPermissionHandlerProps {
  children: React.ReactNode
  onPermissionGranted?: () => void
}

export function PiPPermissionHandler({ children, onPermissionGranted }: PiPPermissionHandlerProps) {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const [isSupported, setIsSupported] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    // Check if Document PiP is supported
    const supported = 'documentPictureInPicture' in window
    setIsSupported(supported)
    
    if (supported) {
      setPermissionStatus('prompt') // Initially assume we need to prompt
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    setIsRequesting(true)
    try {
      // @ts-ignore - Document PiP API
      const testWindow = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 150
      })
      
      // If we get here, permission was granted
      setPermissionStatus('granted')
      onPermissionGranted?.()
      
      // Close the test window immediately
      testWindow.close()
    } catch (error) {
      console.error('PiP permission denied:', error)
      setPermissionStatus('denied')
    } finally {
      setIsRequesting(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="text-sm text-amber-700">
          Picture-in-Picture requires Chrome 116+ or a compatible browser
        </span>
      </div>
    )
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">
            Picture-in-Picture permission was denied. Please enable it in your browser settings.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={requestPermission}
          disabled={isRequesting}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // Default case
  return <div>{children}</div>
}
