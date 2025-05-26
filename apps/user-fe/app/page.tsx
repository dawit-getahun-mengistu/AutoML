// "use client"
// import { PlatformInfo } from "@/components/ui/platform-info"
// import { AuthForm } from "@/components/ui/auth-form"
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/signin");
  // return (
  //   <div className="flex min-h-screen bg-slate-50">
  //     {/* Left side - Platform info */}
  //     <PlatformInfo />

  //     {/* Right side - Sign in form */}
  //     <AuthForm
  //       mode="signin"
  //       onSubmit={(data) => {
  //         console.log("Form submitted:", data)
  //         // Handle authentication logic here
  //       }}
  //     />
  //   </div>
  // )
}