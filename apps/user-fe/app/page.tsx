"use client"
import { PlatformInfo } from "@/components/ui/platform-info"
import { AuthForm } from "@/components/ui/auth-form"

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side - Platform info */}
      <PlatformInfo />

      {/* Right side - Sign in form */}
      <AuthForm
        mode="signin"
        onSubmit={(data) => {
          console.log("Form submitted:", data)
          // Handle authentication logic here
        }}
      />
    </div>
  )
}