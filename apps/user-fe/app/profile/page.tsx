"use client"

import { UserIcon, Mail, Key, Bell, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { logout } from "@/libb/features/auth/authActions"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { status: authStatus } = useAppSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          router.push("/")
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error)
      })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={authStatus === "loading"}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {authStatus === "loading" ? "Logging Out..." : "Logout"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 bg-blue-100 mb-4">
                  <AvatarFallback className="text-blue-600 text-2xl">U</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold mb-1">User Name</h2>
                <p className="text-gray-500 mb-4">user@example.com</p>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="account">
            <TabsList className="mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-gray-500">user@example.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Password</p>
                      <p className="text-gray-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-gray-500">Receive notifications about your projects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}