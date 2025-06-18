"use client"

import { FolderOpenIcon, PlusCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { createProject } from "@/libb/features/project/projectActions"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { refresh } from "@/libb/features/auth/authActions"

export function EmptyProject() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const {access_token, refresh_token } = useAppSelector((state) => state.auth)
    const {
    error: projectError,
  } = useAppSelector((state) => state.project);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
  })
  const [open, setOpen] = useState(false)

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      let userId = "unknown"
      
      // Try to get userId from localStorage first
      const userInfoString = localStorage.getItem("userInfo")
      if (userInfoString) {
        try {
          const parsedUserInfo = JSON.parse(userInfoString)
          userId = parsedUserInfo.id
        } catch (error) {
          console.error("Error parsing userInfo:", error)
        }
      } 
      // If not in localStorage, try to get from JWT tokens
      else if (access_token && refresh_token) {
        try {
          const decoded = jwtDecode<{
            userId: string
            userName: string
            iat: number
            exp: number
          }>(access_token)
          userId = decoded.userId
          localStorage.setItem("userId",userId)
         
        } catch (error) {
          console.error("Error decoding JWT:", error)
        }
      }

      dispatch(
        createProject({
          name: newProject.name,
          description: newProject.description,
          status: newProject.status,
          userId: userId,
        })
      )
      setNewProject({ name: "", description: "", status: "ACTIVE" })
      setOpen(false)
    }
  }
    useEffect(() => {
    if (projectError) {
      // console.log("use Effect projectError", projectError);
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-blue-50 rounded-full p-6 mb-4">
        <FolderOpenIcon className="h-12 w-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No Projects Yet</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Create your first project to start building, training, and deploying machine learning models with zero code.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2">
            <PlusCircleIcon className="h-5 w-5" />
            Create Your First Project
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Enter project description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newProject.status}
                onValueChange={(value) => setNewProject({ ...newProject, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateProject} className="w-full">
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}