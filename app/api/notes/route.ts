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

    const body = await request.json()
    const { courseItemId, title, content, timestampSeconds } = body

    if (!courseItemId || !content) {
      return NextResponse.json({ error: "Course item ID and content are required" }, { status: 400 })
    }

    // Get course item to verify ownership and get course_id
    const { data: courseItem } = await supabase
      .from("course_items")
      .select("course_id")
      .eq("id", courseItemId)
      .eq("user_id", user.id)
      .single()

    if (!courseItem) {
      return NextResponse.json({ error: "Course item not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("course_notes")
      .insert({
        user_id: user.id,
        course_id: courseItem.course_id,
        course_item_id: courseItemId,
        title: title || null,
        content,
        timestamp_seconds: timestampSeconds || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating note:", error)
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in notes POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseItemId = searchParams.get("courseItemId")
    const courseId = searchParams.get("courseId")

    let query = supabase.from("course_notes").select("*").eq("user_id", user.id)

    if (courseItemId) {
      query = query.eq("course_item_id", courseItemId)
    } else if (courseId) {
      query = query.eq("course_id", courseId)
    } else {
      return NextResponse.json({ error: "Course item ID or course ID is required" }, { status: 400 })
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in notes GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
