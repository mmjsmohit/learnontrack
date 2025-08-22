import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchPlaylistData, parseDuration } from "@/lib/youtube/youtube-parser"

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
    const { playlistUrl, courseId } = body

    if (!playlistUrl || !courseId) {
      return NextResponse.json({ error: "Playlist URL and course ID are required" }, { status: 400 })
    }

    // Verify course ownership
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Fetch playlist data
    const playlistData = await fetchPlaylistData(playlistUrl)

    if (!playlistData) {
      return NextResponse.json({ error: "Failed to fetch playlist data" }, { status: 400 })
    }

    // Create course items from playlist videos
    const courseItems = playlistData.videos.map((video, index) => ({
      course_id: courseId,
      user_id: user.id,
      title: video.title,
      description: video.description,
      item_type: "video" as const,
      content_url: video.url,
      duration_minutes: video.duration ? parseDuration(video.duration) : null,
      order_index: index,
      metadata: {
        youtube_video_id: video.id,
        thumbnail_url: video.thumbnail,
        playlist_id: playlistData.id,
      },
    }))

    // Insert course items
    const { data: insertedItems, error: insertError } = await supabase.from("course_items").insert(courseItems).select()

    if (insertError) {
      console.error("Error inserting course items:", insertError)
      return NextResponse.json({ error: "Failed to create course items" }, { status: 500 })
    }

    // Update course with playlist information
    await supabase
      .from("courses")
      .update({
        source_url: playlistUrl,
        description: playlistData.description || null,
      })
      .eq("id", courseId)

    return NextResponse.json({
      success: true,
      data: {
        playlist: playlistData,
        courseItems: insertedItems,
      },
    })
  } catch (error) {
    console.error("Error processing YouTube playlist:", error)
    return NextResponse.json({ error: "Failed to process playlist" }, { status: 500 })
  }
}
