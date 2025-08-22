import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseDocumentContent, parseImageContent } from "@/lib/ai/content-parser"

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

    const body = await request.json()
    const { content, type, courseId } = body

    if (!content || !type) {
      return NextResponse.json({ error: "Content and type are required" }, { status: 400 })
    }

    let parsedContent

    if (type === "document") {
      parsedContent = await parseDocumentContent(content)
    } else if (type === "image") {
      parsedContent = await parseImageContent(content)
    } else {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // If courseId is provided, save the parsed items to the database
    if (courseId && parsedContent.items.length > 0) {
      const courseItems = parsedContent.items.map((item) => ({
        course_id: courseId,
        user_id: user.id,
        title: item.title,
        description: item.description,
        item_type: item.item_type,
        content_url: item.content_url,
        duration_minutes: item.duration_minutes,
        order_index: item.order_index,
        metadata: item.metadata || {},
      }))

      const { error: insertError } = await supabase.from("course_items").insert(courseItems)

      if (insertError) {
        console.error("Error saving course items:", insertError)
        return NextResponse.json({ error: "Failed to save course items" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedContent,
      itemsCount: parsedContent.items.length,
    })
  } catch (error) {
    console.error("Error parsing content:", error)
    return NextResponse.json({ error: "Failed to parse content" }, { status: 500 })
  }
}
