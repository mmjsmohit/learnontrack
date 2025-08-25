import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

export default async function HomePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (!error && data?.user) {
    redirect("/dashboard")
  }

  // Show landing page for unauthenticated users
  return <LandingPage />
}
