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
    const { courseItemId, status, progressPercentage, timeSpentMinutes } = body

    if (!courseItemId || !status) {
      return NextResponse.json({ error: "Course item ID and status are required" }, { status: 400 })
    }

    // Get course item to verify ownership
    const { data: courseItem } = await supabase
      .from("course_items")
      .select("course_id")
      .eq("id", courseItemId)
      .eq("user_id", user.id)
      .single()

    if (!courseItem) {
      return NextResponse.json({ error: "Course item not found" }, { status: 404 })
    }

    const updateData: any = {
      user_id: user.id,
      course_id: courseItem.course_id,
      course_item_id: courseItemId,
      status,
      progress_percentage: progressPercentage || 0,
      updated_at: new Date().toISOString(),
    }

    if (timeSpentMinutes !== undefined) {
      updateData.time_spent_minutes = timeSpentMinutes
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
      updateData.progress_percentage = 100
    }

    // Upsert progress record
    const { data, error } = await supabase
      .from("user_progress")
      .upsert(updateData, {
        onConflict: "user_id,course_item_id",
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating progress:", error)
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in progress API:", error)
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
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Get progress for all items in the course
    const { data, error } = await supabase
      .from("user_progress")
      .select(`
        *,
        course_items (
          id,
          title,
          item_type,
          duration_minutes,
          order_index
        )
      `)
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .order("course_items(order_index)")

    if (error) {
      console.error("Error fetching progress:", error)
      return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in progress GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
