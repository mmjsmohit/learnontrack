"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UsePictureInPictureOptions {
  width?: number
  height?: number
  disallowReturnToOpener?: boolean
  preferInitialWindowPlacement?: boolean
}

interface PiPState {
  isSupported: boolean
  isOpen: boolean
  window: Window | null
}

export function usePictureInPicture(options: UsePictureInPictureOptions = {}) {
  const [state, setState] = useState<PiPState>({
    isSupported: false,
    isOpen: false,
    window: null,
  })

  const pipWindowRef = useRef<Window | null>(null)
  const contentElementRef = useRef<HTMLElement | null>(null)

  // Check if PiP is supported
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isSupported: 'documentPictureInPicture' in window,
    }))
  }, [])

  // Copy stylesheets to PiP window
  const copyStyleSheets = useCallback((pipWindow: Window) => {
    [...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map(rule => rule.cssText).join('')
        const style = document.createElement('style')
        style.textContent = cssRules
        pipWindow.document.head.appendChild(style)
      } catch (e) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = styleSheet.type || 'text/css'
        link.media = styleSheet.media.mediaText || 'all'
        if (styleSheet.href) {
          link.href = styleSheet.href
        }
        pipWindow.document.head.appendChild(link)
      }
    })
  }, [])

  // Open PiP window
  const openPiP = useCallback(async (contentElement: HTMLElement) => {
    if (!state.isSupported || state.isOpen) return null

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: options.width || 400,
        height: options.height || 600,
        disallowReturnToOpener: options.disallowReturnToOpener || false,
        preferInitialWindowPlacement: options.preferInitialWindowPlacement || false,
      })

      // Copy stylesheets
      copyStyleSheets(pipWindow)

      // Add meta tags for responsive design
      const metaViewport = document.createElement('meta')
      metaViewport.name = 'viewport'
      metaViewport.content = 'width=device-width, initial-scale=1'
      pipWindow.document.head.appendChild(metaViewport)

      // Clone and append the content
      const clonedContent = contentElement.cloneNode(true) as HTMLElement
      pipWindow.document.body.appendChild(clonedContent)

      // Store references
      pipWindowRef.current = pipWindow
      contentElementRef.current = contentElement

      // Listen for window close
      pipWindow.addEventListener('pagehide', () => {
        setState(prev => ({
          ...prev,
          isOpen: false,
          window: null,
        }))
        pipWindowRef.current = null
        contentElementRef.current = null
      })

      setState(prev => ({
        ...prev,
        isOpen: true,
        window: pipWindow,
      }))

      return pipWindow
    } catch (error) {
      console.error('Failed to open Picture-in-Picture window:', error)
      return null
    }
  }, [state.isSupported, state.isOpen, options, copyStyleSheets])

  // Close PiP window
  const closePiP = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close()
    }
  }, [])

  // Update content in PiP window
  const updatePiPContent = useCallback((newContent: HTMLElement) => {
    if (pipWindowRef.current && state.isOpen) {
      pipWindowRef.current.document.body.innerHTML = ''
      const clonedContent = newContent.cloneNode(true) as HTMLElement
      pipWindowRef.current.document.body.appendChild(clonedContent)
    }
  }, [state.isOpen])

  return {
    isSupported: state.isSupported,
    isOpen: state.isOpen,
    pipWindow: state.window,
    openPiP,
    closePiP,
    updatePiPContent,
  }
}
