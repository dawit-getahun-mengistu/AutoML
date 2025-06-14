"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderIcon, FileIcon, PlusIcon, PlusCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { createProject, fetchProjects } from "@/lib/features/project/projectActions"
import { jwtDecode } from "jwt-decode"
import { refresh } from "@/lib/features/auth/authActions"

export function ProjectsSidebar() {
  const router = useRouter();
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, refresh_token, error:authError } = useAppSelector((state) => state.auth)
  const [open, setOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
  })

  useEffect(() => {
    if (projectError) {
      // console.log("use Effect projectError", projectError);
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError]);

  useEffect(() => {
    if (access_token) {
        dispatch(fetchProjects())
            .unwrap()
            .then(() => {
               
            })
            // .catch((error) => {
            //     console.error("Error fetching projects:", error);
            //     setIsLoading(false);
            // });
    }
}, [access_token, dispatch, router, authError]);
  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      const userInfoString = localStorage.getItem("userInfo")
      let userId = "unknown"
      
      if (userInfoString) {
        try {
          const userInfo = JSON.parse(userInfoString)
          userId = userInfo.id
        } catch (error) {
          console.error("Error parsing userInfo:", error)
        }
      } else if (access_token && refresh_token) {
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

  return (
    <div className="h-screen w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Projects</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <PlusIcon className="h-4 w-4" />
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
                <Button 
                  onClick={handleCreateProject} 
                  className="w-full"
                  disabled={projectStatus === "loading"}
                >
                  {projectStatus === "loading" ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-gray-50 rounded-full p-3 mb-3">
              <FolderIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Create your first project to get started</p>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setOpen(true)}>
              <PlusCircleIcon className="h-3.5 w-3.5 mr-1" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...projects]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((project) => {
          
              const isActive = pathname.endsWith(project.id)

              return (
                <Link key={project.id} href={`/dashboard/data/${project.id}`}>
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm",
                      isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {isActive ? (
                      <FolderIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="truncate">{project.name}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <Button className="w-full" size="sm" onClick={() => setOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>
    </div>
  )
}
