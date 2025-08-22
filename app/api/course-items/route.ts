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
    const { title, description, item_type, content_url, duration_minutes, course_id } = body

    if (!title || !item_type || !course_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the next order index
    const { data: lastItem } = await supabase
      .from("course_items")
      .select("order_index")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = (lastItem?.order_index || 0) + 1

    // Insert the new course item
    const { data: courseItem, error } = await supabase
      .from("course_items")
      .insert({
        title,
        description,
        item_type,
        content_url,
        duration_minutes: duration_minutes ? Number.parseInt(duration_minutes) : null,
        course_id,
        user_id: user.id,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating course item:", error)
      return NextResponse.json({ error: "Failed to create course item" }, { status: 500 })
    }

    return NextResponse.json({ courseItem })
  } catch (error) {
    console.error("Error in course items API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
