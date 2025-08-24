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

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY environment variable")
  }

  // 1) Fetch playlist metadata (title, description)
  const playlistParams = new URLSearchParams({
    part: "snippet",
    id: playlistId,
    key: apiKey,
  })
  const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlists?${playlistParams.toString()}`)
  if (!playlistResponse.ok) {
    throw new Error(`Failed to fetch playlist: ${playlistResponse.status} ${playlistResponse.statusText}`)
  }
  const playlistJson = (await playlistResponse.json()) as {
    items?: Array<{ snippet?: { title?: string; description?: string } }>
  }
  const playlistInfo = playlistJson.items && playlistJson.items[0]
  if (!playlistInfo) {
    return null
  }

  const playlistTitle = playlistInfo.snippet?.title || ""
  const playlistDescription = playlistInfo.snippet?.description || ""

  // 2) Fetch all playlist items (video IDs) with pagination
  const collectedVideoIds: string[] = []
  let nextPageToken: string | undefined = undefined
  do {
    const itemsParams = new URLSearchParams({
      part: "contentDetails,snippet",
      maxResults: "50",
      playlistId,
      key: apiKey,
    })
    if (nextPageToken) itemsParams.set("pageToken", nextPageToken)

    const itemsResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${itemsParams.toString()}`)
    if (!itemsResponse.ok) {
      throw new Error(`Failed to fetch playlist items: ${itemsResponse.status} ${itemsResponse.statusText}`)
    }
    const itemsJson = (await itemsResponse.json()) as {
      nextPageToken?: string
      items?: Array<{
        contentDetails?: { videoId?: string }
        snippet?: { resourceId?: { videoId?: string } }
      }>
    }

    for (const item of itemsJson.items || []) {
      const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
      if (videoId) collectedVideoIds.push(videoId)
    }
    nextPageToken = itemsJson.nextPageToken
  } while (nextPageToken)

  // Deduplicate while preserving order
  const seenVideoIds = new Set<string>()
  const orderedUniqueVideoIds = collectedVideoIds.filter((id) => {
    if (seenVideoIds.has(id)) return false
    seenVideoIds.add(id)
    return true
  })

  if (orderedUniqueVideoIds.length === 0) {
    return {
      id: playlistId,
      title: playlistTitle,
      description: playlistDescription,
      url: playlistUrl,
      videos: [],
    }
  }

  // 3) Batch fetch video details (snippet + contentDetails for duration)
  const videos: YouTubeVideo[] = []
  type VideoListItem = {
    id: string
    snippet?: {
      title?: string
      description?: string
      thumbnails?: {
        maxres?: { url?: string }
        standard?: { url?: string }
        high?: { url?: string }
        medium?: { url?: string }
        default?: { url?: string }
      }
    }
    contentDetails?: { duration?: string }
  }
  for (let start = 0; start < orderedUniqueVideoIds.length; start += 50) {
    const batchIds = orderedUniqueVideoIds.slice(start, start + 50)
    const videosParams = new URLSearchParams({
      part: "snippet,contentDetails",
      id: batchIds.join(","),
      key: apiKey,
    })
    const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`)
    if (!videosResponse.ok) {
      throw new Error(`Failed to fetch video details: ${videosResponse.status} ${videosResponse.statusText}`)
    }
    const videosJson = (await videosResponse.json()) as { items?: VideoListItem[] }

    // Index by id for ordered assembly
    const idToVideoData = new Map<string, VideoListItem>()
    for (const item of videosJson.items || []) {
      idToVideoData.set(item.id, item)
    }

    for (const id of batchIds) {
      const data = idToVideoData.get(id)
      if (!data) {
        videos.push({
          id,
          title: "Unavailable video",
          description: "",
          url: createVideoUrl(id),
          thumbnail: createThumbnailUrl(id),
        })
        continue
      }

      const snippet = data.snippet || {}
      const contentDetails = data.contentDetails || {}
      const thumbnails = snippet.thumbnails || {}
      const thumbnailUrl =
        thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        createThumbnailUrl(id)
      console.log(snippet.description)
      videos.push({
        id,
        title: snippet.title || "",
        description: snippet.description || "",
        duration: contentDetails.duration,
        thumbnail: thumbnailUrl,
        url: createVideoUrl(id),
      })
    }
  }

  return {
    id: playlistId,
    title: playlistTitle,
    description: playlistDescription,
    url: playlistUrl,
    videos,
  }
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
