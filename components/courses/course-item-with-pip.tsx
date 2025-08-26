"use client"

import { useEffect, useRef, useState } from "react"
import { CourseItemDetail } from "./course-item-detail"
import { CourseItemPiP } from "./course-item-pip"
import { usePictureInPicture } from "@/hooks/use-picture-in-picture"
import { useTabVisibility } from "@/hooks/use-tab-visibility"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"

interface CourseItemWithPiPProps {
  courseItem: {
    id: string
    title: string
    description?: string
    item_type: string
    content_url?: string
    duration_minutes?: number
    metadata?: any
    courses?: {
      id: string
      title: string
    }
    user_progress?: Array<{
      status: string
      progress_percentage: number
      time_spent_minutes: number
      completed_at?: string
    }>
  }
}

export function CourseItemWithPiP({ courseItem }: CourseItemWithPiPProps) {
  const router = useRouter()
  const pipContentRef = useRef<HTMLDivElement>(null)
  const [pipContentElement, setPipContentElement] = useState<HTMLElement | null>(null)

  const {
    isSupported: isPiPSupported,
    isOpen: isPiPOpen,
    pipWindow,
    openPiP,
    closePiP,
  } = usePictureInPicture({
    width: 380,
    height: 520,
    disallowReturnToOpener: false,
  })

  const { isVisible, pipTriggered, resetPipTrigger } = useTabVisibility({
    enablePiPTrigger: true,
    pipTriggerDelay: 3000, // 3 seconds after tab becomes hidden
    onTabVisible: () => {
      // Close PiP when user returns to tab
      if (isPiPOpen) {
        closePiP()
      }
      resetPipTrigger()
    },
  })

  // Check if the course item is in progress to enable PiP
  const progress = courseItem.user_progress?.[0]
  const status = progress?.status || "not_started"
  const shouldEnablePiP = status === "in_progress" && isPiPSupported

  // Trigger PiP when tab becomes hidden
  useEffect(() => {
    if (pipTriggered && shouldEnablePiP && !isPiPOpen && pipContentRef.current) {
      openPiP(pipContentRef.current)
    }
  }, [pipTriggered, shouldEnablePiP, isPiPOpen, openPiP])

  // Create hidden PiP content element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const element = document.createElement('div')
      element.style.display = 'none'
      document.body.appendChild(element)
      setPipContentElement(element)

      return () => {
        if (document.body.contains(element)) {
          document.body.removeChild(element)
        }
      }
    }
  }, [])

  const handleReturnToCourse = () => {
    // Focus the main window and close PiP
    window.focus()
    closePiP()
    // Navigate back to course overview
    router.push(`/courses/${courseItem.courses?.id}`)
  }

  const handleClosePiP = () => {
    closePiP()
    resetPipTrigger()
  }

  return (
    <>
      {/* Main course item detail */}
      <CourseItemDetail courseItem={courseItem} />

      {/* Hidden PiP content container */}
      <div ref={pipContentRef} style={{ display: 'none' }}>
        <CourseItemPiP
          courseItem={courseItem}
          onReturnToCourse={handleReturnToCourse}
          onClose={handleClosePiP}
        />
      </div>

      {/* Portal for PiP content when window is open */}
      {isPiPOpen && pipWindow && pipContentElement && createPortal(
        <CourseItemPiP
          courseItem={courseItem}
          onReturnToCourse={handleReturnToCourse}
          onClose={handleClosePiP}
        />,
        pipContentElement
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>PiP Supported: {isPiPSupported ? 'Yes' : 'No'}</div>
          <div>Tab Visible: {isVisible ? 'Yes' : 'No'}</div>
          <div>PiP Open: {isPiPOpen ? 'Yes' : 'No'}</div>
          <div>Should Enable: {shouldEnablePiP ? 'Yes' : 'No'}</div>
          <div>Status: {status}</div>
        </div>
      )}
    </>
  )
}
