"use client"

import { CurrentUserAvatar } from "@/components/current-user-avatar"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Edit } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface ProfileHeaderProps {
  user: SupabaseUser
  profile: any
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const displayName = profile?.full_name || user.user_metadata?.full_name || "User"
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <CurrentUserAvatar className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">Member since {joinDate}</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>
    </div>
  )
}
