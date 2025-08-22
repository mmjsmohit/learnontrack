export interface YouTubeVideo {
  id: string
  title: string
  description: string
  duration?: string
  thumbnail?: string
  url: string
}

export interface YouTubePlaylist {
  id: string
  title: string
  description?: string
  videos: YouTubeVideo[]
  url: string
}

export function extractPlaylistId(url: string): string | null {
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/.*[?&]list=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export function extractVideoId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/, /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export function createVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function createThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

// Mock function to simulate YouTube API response
// In production, this would use the actual YouTube Data API
export async function fetchPlaylistData(playlistUrl: string): Promise<YouTubePlaylist | null> {
  const playlistId = extractPlaylistId(playlistUrl)
  if (!playlistId) {
    throw new Error("Invalid YouTube playlist URL")
  }

  // Mock data - in production, this would call the YouTube Data API
  const mockPlaylist: YouTubePlaylist = {
    id: playlistId,
    title: "Sample Course Playlist",
    description: "A comprehensive course covering various topics",
    url: playlistUrl,
    videos: [
      {
        id: "dQw4w9WgXcQ",
        title: "Introduction to the Course",
        description:
          "Welcome to this comprehensive course. In this video, we'll cover the basics and what you can expect to learn.",
        duration: "PT5M30S",
        thumbnail: createThumbnailUrl("dQw4w9WgXcQ"),
        url: createVideoUrl("dQw4w9WgXcQ"),
      },
      {
        id: "oHg5SJYRHA0",
        title: "Getting Started - Setup and Installation",
        description: "Learn how to set up your development environment and install the necessary tools.",
        duration: "PT12M45S",
        thumbnail: createThumbnailUrl("oHg5SJYRHA0"),
        url: createVideoUrl("oHg5SJYRHA0"),
      },
      {
        id: "9bZkp7q19f0",
        title: "Core Concepts and Fundamentals",
        description: "Deep dive into the core concepts that form the foundation of this subject.",
        duration: "PT18M20S",
        thumbnail: createThumbnailUrl("9bZkp7q19f0"),
        url: createVideoUrl("9bZkp7q19f0"),
      },
      {
        id: "kJQP7kiw5Fk",
        title: "Practical Examples and Use Cases",
        description: "See real-world examples and practical applications of what we've learned.",
        duration: "PT15M10S",
        thumbnail: createThumbnailUrl("kJQP7kiw5Fk"),
        url: createVideoUrl("kJQP7kiw5Fk"),
      },
      {
        id: "L_jWHffIx5E",
        title: "Advanced Techniques and Best Practices",
        description: "Explore advanced techniques and learn industry best practices.",
        duration: "PT22M35S",
        thumbnail: createThumbnailUrl("L_jWHffIx5E"),
        url: createVideoUrl("L_jWHffIx5E"),
      },
    ],
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return mockPlaylist
}

export function parseDuration(duration: string): number {
  // Parse ISO 8601 duration format (PT5M30S) to minutes
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = Number.parseInt(match[1] || "0", 10)
  const minutes = Number.parseInt(match[2] || "0", 10)
  const seconds = Number.parseInt(match[3] || "0", 10)

  return hours * 60 + minutes + Math.ceil(seconds / 60)
}
