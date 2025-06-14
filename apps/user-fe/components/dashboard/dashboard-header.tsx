"use client"

import Link from "next/link"
import { BellIcon, HelpCircleIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function DashboardHeader() {
  return (
    <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
      <div className="flex items-center">
        <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
          AutoML Dashboard
        </Link>
        <div className="ml-3 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">v2.5</div>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="text-gray-500">
          <BellIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-500">
          <HelpCircleIcon className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8 bg-blue-100">
          <AvatarFallback className="text-blue-600">
            <UserIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
