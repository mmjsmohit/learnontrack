"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface PiPItem {
  id: string
  title: string
  courseTitle?: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress: number
  courseId: string
  itemId: string
}

interface PiPContextType {
  isSupported: boolean
  isOpen: boolean
  currentItem: PiPItem | null
  pipWindow: Window | null
  openPiP: (item: PiPItem) => Promise<void>
  closePiP: () => void
  updateProgress: (status: string, progress: number) => void
  returnToMain: () => void
}

export function usePictureInPicture(): PiPContextType {
  const [isSupported, setIsSupported] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<PiPItem | null>(null)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const pipWindowRef = useRef<Window | null>(null)

  // Check if Document PiP is supported
  useEffect(() => {
    setIsSupported('documentPictureInPicture' in window)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close()
      }
    }
  }, [])

  const openPiP = useCallback(async (item: PiPItem) => {
    if (!isSupported || isOpen) return

    try {
      // Request user permission for Document PiP
      // @ts-ignore - Document PiP API
      if (!window.documentPictureInPicture) {
        throw new Error('Document Picture-in-Picture not supported')
      }

      // @ts-ignore - Document PiP API
      const newPipWindow = await window.documentPictureInPicture.requestWindow({
        width: 380,
        height: 200,
        preferInitialWindowPlacement: false
      })

      pipWindowRef.current = newPipWindow
      setPipWindow(newPipWindow)
      setCurrentItem(item)
      setIsOpen(true)

      // Copy styles to PiP window
      const styleSheets = Array.from(document.styleSheets)
      styleSheets.forEach((styleSheet) => {
        try {
          const cssRules = Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('')
          const style = newPipWindow.document.createElement('style')
          style.textContent = cssRules
          newPipWindow.document.head.appendChild(style)
        } catch (e) {
          // Handle cross-origin stylesheets
          const link = newPipWindow.document.createElement('link')
          link.rel = 'stylesheet'
          link.type = styleSheet.type
          link.media = styleSheet.media
          link.href = styleSheet.href
          newPipWindow.document.head.appendChild(link)
        }
      })

      // Handle window close
      newPipWindow.addEventListener('pagehide', () => {
        setIsOpen(false)
        setCurrentItem(null)
        setPipWindow(null)
        pipWindowRef.current = null
      })

      // Create PiP content
      createPiPContent(newPipWindow, item)

    } catch (error) {
      console.error('Failed to open Picture-in-Picture window:', error)
    }
  }, [isSupported, isOpen])

  const closePiP = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close()
    }
    setIsOpen(false)
    setCurrentItem(null)
    setPipWindow(null)
    pipWindowRef.current = null
  }, [])

  const updateProgress = useCallback((status: string, progress: number) => {
    if (currentItem && currentItem.id) {
      const updatedItem = { ...currentItem, status: status as any, progress }
      setCurrentItem(updatedItem)
      
      // Update PiP content if window is open
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        updatePiPContent(pipWindowRef.current, updatedItem)
      }
    }
  }, [currentItem?.id]) // Only depend on the ID, not the whole currentItem object

  const returnToMain = useCallback(() => {
    if (currentItem) {
      // Navigate back to the course item page
      const returnUrl = `/courses/${currentItem.courseId}/items/${currentItem.itemId}`
      window.location.href = returnUrl
      closePiP()
    }
  }, [currentItem, closePiP])

  return {
    isSupported,
    isOpen,
    currentItem,
    pipWindow,
    openPiP,
    closePiP,
    updateProgress,
    returnToMain
  }
}

function createPiPContent(pipWindow: Window, item: PiPItem) {
  const doc = pipWindow.document
  
  // Set page title
  doc.title = `Learning: ${item.title}`
  
  // Add meta viewport for responsive design
  const viewport = doc.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1'
  doc.head.appendChild(viewport)

  // Create main container
  const container = doc.createElement('div')
  container.className = 'pip-container'
  container.style.cssText = `
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `

  // Create header with title
  const header = doc.createElement('div')
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  `

  const icon = doc.createElement('div')
  icon.textContent = '📚'
  icon.style.fontSize = '20px'

  const titleContainer = doc.createElement('div')
  titleContainer.style.flex = '1'

  const title = doc.createElement('h1')
  title.textContent = item.title
  title.style.cssText = `
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `

  if (item.courseTitle) {
    const courseTitle = doc.createElement('p')
    courseTitle.textContent = item.courseTitle
    courseTitle.style.cssText = `
      margin: 0;
      font-size: 12px;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `
    titleContainer.appendChild(courseTitle)
  }

  titleContainer.appendChild(title)
  header.appendChild(icon)
  header.appendChild(titleContainer)

  // Create progress section
  const progressSection = doc.createElement('div')
  progressSection.className = 'progress-section'
  progressSection.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `

  // Status indicator
  const statusContainer = doc.createElement('div')
  statusContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `

  const statusIcon = doc.createElement('span')
  const statusText = doc.createElement('span')
  statusText.style.cssText = `
    font-size: 14px;
    font-weight: 500;
  `

  updateStatusDisplay(statusIcon, statusText, item.status)

  statusContainer.appendChild(statusIcon)
  statusContainer.appendChild(statusText)

  // Progress bar
  const progressBarContainer = doc.createElement('div')
  progressBarContainer.style.cssText = `
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    height: 8px;
    overflow: hidden;
  `

  const progressBar = doc.createElement('div')
  progressBar.className = 'progress-bar'
  progressBar.style.cssText = `
    height: 100%;
    background: #10B981;
    border-radius: 8px;
    width: ${item.progress}%;
    transition: width 0.3s ease;
  `

  progressBarContainer.appendChild(progressBar)

  // Progress text
  const progressText = doc.createElement('div')
  progressText.className = 'progress-text'
  progressText.textContent = `${item.progress}% complete`
  progressText.style.cssText = `
    font-size: 12px;
    text-align: center;
    opacity: 0.9;
  `

  progressSection.appendChild(statusContainer)
  progressSection.appendChild(progressBarContainer)
  progressSection.appendChild(progressText)

  // Create action buttons
  const buttonContainer = doc.createElement('div')
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
  `

  // Return to tracker button
  const returnButton = doc.createElement('button')
  returnButton.textContent = '← Back to Course'
  returnButton.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  `

  returnButton.addEventListener('mouseenter', () => {
    returnButton.style.background = 'rgba(255, 255, 255, 0.3)'
  })

  returnButton.addEventListener('mouseleave', () => {
    returnButton.style.background = 'rgba(255, 255, 255, 0.2)'
  })

  returnButton.addEventListener('click', () => {
    // Trigger return to main
    const returnEvent = new CustomEvent('returnToMain')
    pipWindow.dispatchEvent(returnEvent)
  })

  // Complete button (only show when in progress)
  let completeButton: HTMLButtonElement | null = null
  if (item.status === 'in_progress') {
    completeButton = doc.createElement('button')
    completeButton.textContent = '✓ Complete'
    completeButton.style.cssText = `
      padding: 8px 12px;
      background: #10B981;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `

    completeButton.addEventListener('mouseenter', () => {
      completeButton!.style.background = '#059669'
    })

    completeButton.addEventListener('mouseleave', () => {
      completeButton!.style.background = '#10B981'
    })

    completeButton.addEventListener('click', () => {
      const completeEvent = new CustomEvent('completeProgress')
      pipWindow.dispatchEvent(completeEvent)
    })

    buttonContainer.appendChild(completeButton)
  }

  buttonContainer.appendChild(returnButton)

  // Assemble everything
  container.appendChild(header)
  container.appendChild(progressSection)
  container.appendChild(buttonContainer)

  doc.body.appendChild(container)

  // Set body styles
  doc.body.style.cssText = `
    margin: 0;
    padding: 0;
    overflow: hidden;
  `
}

function updatePiPContent(pipWindow: Window, item: PiPItem) {
  const doc = pipWindow.document
  
  // Update progress bar
  const progressBar = doc.querySelector('.progress-bar') as HTMLElement
  if (progressBar) {
    progressBar.style.width = `${item.progress}%`
  }

  // Update progress text
  const progressText = doc.querySelector('.progress-text') as HTMLElement
  if (progressText) {
    progressText.textContent = `${item.progress}% complete`
  }

  // Update status display
  const statusIcon = doc.querySelector('.progress-section span:first-child') as HTMLElement
  const statusText = doc.querySelector('.progress-section span:last-child') as HTMLElement
  if (statusIcon && statusText) {
    updateStatusDisplay(statusIcon, statusText, item.status)
  }
}

function updateStatusDisplay(iconElement: HTMLElement, textElement: HTMLElement, status: string) {
  switch (status) {
    case 'completed':
      iconElement.textContent = '✅'
      textElement.textContent = 'Completed'
      break
    case 'in_progress':
      iconElement.textContent = '⏱️'
      textElement.textContent = 'In Progress'
      break
    default:
      iconElement.textContent = '⭕'
      textElement.textContent = 'Not Started'
  }
}
