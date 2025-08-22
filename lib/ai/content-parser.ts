import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export interface ParsedCourseItem {
  title: string
  description: string
  item_type: "video" | "reading" | "assignment" | "quiz" | "other"
  content_url?: string
  duration_minutes?: number
  order_index: number
  metadata?: Record<string, any>
}

export interface ParsedCourseContent {
  course_title?: string
  course_description?: string
  items: ParsedCourseItem[]
}

export async function parseDocumentContent(content: string): Promise<ParsedCourseContent> {
  const prompt = `
Analyze the following course content and extract structured information about individual course components.

Content to analyze:
${content}

Please identify and extract:
1. Course title (if mentioned)
2. Course description (if available)
3. Individual course items such as:
   - Videos (lectures, tutorials, demonstrations)
   - Readings (articles, chapters, documents)
   - Assignments (homework, projects, exercises)
   - Quizzes (tests, assessments, evaluations)
   - Other learning materials

For each item, provide:
- Title
- Brief description
- Type (video, reading, assignment, quiz, or other)
- Estimated duration in minutes (if mentioned or can be reasonably estimated)
- Any relevant URLs or references
- Order/sequence information

Return the response as a JSON object with this structure:
{
  "course_title": "string or null",
  "course_description": "string or null", 
  "items": [
    {
      "title": "string",
      "description": "string",
      "item_type": "video|reading|assignment|quiz|other",
      "content_url": "string or null",
      "duration_minutes": "number or null",
      "order_index": "number",
      "metadata": {}
    }
  ]
}

Focus on extracting actionable learning components that a student would need to complete.
`

  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt,
      temperature: 0.3,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response")
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedCourseContent

    // Validate and clean the response
    if (!parsed.items || !Array.isArray(parsed.items)) {
      parsed.items = []
    }

    // Ensure proper order indexing
    parsed.items = parsed.items.map((item, index) => ({
      ...item,
      order_index: item.order_index || index,
      item_type: validateItemType(item.item_type),
    }))

    return parsed
  } catch (error) {
    console.error("Error parsing content with AI:", error)
    throw new Error("Failed to parse course content")
  }
}

export async function parseImageContent(imageDescription: string): Promise<ParsedCourseContent> {
  const prompt = `
Analyze the following description of an image/screenshot that contains course content and extract structured information.

Image description:
${imageDescription}

The image likely contains:
- Course syllabus
- Assignment list
- Video playlist
- Reading list
- Course schedule
- Learning materials overview

Please identify and extract individual course components such as:
- Videos (lectures, tutorials)
- Readings (articles, chapters, books)
- Assignments (homework, projects)
- Quizzes (tests, assessments)
- Other learning materials

For each item, provide:
- Title
- Brief description based on what's visible
- Type (video, reading, assignment, quiz, or other)
- Estimated duration if mentioned
- Order/sequence information
- Any dates or deadlines mentioned

Return as JSON with the same structure as document parsing.
Focus on extracting specific, actionable learning components.
`

  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt,
      temperature: 0.3,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response")
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedCourseContent

    if (!parsed.items || !Array.isArray(parsed.items)) {
      parsed.items = []
    }

    parsed.items = parsed.items.map((item, index) => ({
      ...item,
      order_index: item.order_index || index,
      item_type: validateItemType(item.item_type),
    }))

    return parsed
  } catch (error) {
    console.error("Error parsing image content with AI:", error)
    throw new Error("Failed to parse image content")
  }
}

function validateItemType(type: string): "video" | "reading" | "assignment" | "quiz" | "other" {
  const validTypes = ["video", "reading", "assignment", "quiz", "other"]
  return validTypes.includes(type) ? (type as any) : "other"
}

export async function generateCourseDescription(title: string, items: ParsedCourseItem[]): Promise<string> {
  const itemsSummary = items.map((item) => `- ${item.title} (${item.item_type})`).join("\n")

  const prompt = `
Generate a concise, engaging course description based on the following course information:

Course Title: ${title}

Course Items:
${itemsSummary}

Create a 2-3 sentence description that:
- Explains what students will learn
- Highlights the key topics covered
- Mentions the types of learning materials included
- Sounds professional and engaging

Keep it concise and focused on learning outcomes.
`

  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt,
      temperature: 0.7,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating course description:", error)
    return "A comprehensive course covering various learning materials and activities."
  }
}
