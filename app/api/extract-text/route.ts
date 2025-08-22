import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // For now, we'll handle text files and basic image descriptions
    // In a production app, you'd use OCR services for images
    let extractedText = ""

    if (file.type.startsWith("text/")) {
      extractedText = await file.text()
    } else if (file.type.startsWith("image/")) {
      // For images, we'll create a basic description
      // In production, you'd use OCR or vision APIs
      extractedText = `Image file uploaded: ${file.name}. This appears to be a course-related image that may contain syllabus information, assignment lists, or course materials. Please provide a description of what you see in this image for better parsing.`
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileType: file.type,
    })
  } catch (error) {
    console.error("Error extracting text:", error)
    return NextResponse.json({ error: "Failed to extract text from file" }, { status: 500 })
  }
}
