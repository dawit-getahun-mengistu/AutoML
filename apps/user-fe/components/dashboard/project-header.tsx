"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { FolderIcon, PencilIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjects } from "@/lib/projects-context"
import { cn } from "@/lib/utils"

interface ProjectHeaderProps {
  projectId: string
}

export function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { projects, updateProject, deleteProject } = useProjects()
  const project = projects.find((p) => p.id === projectId)

  const [editProject, setEditProject] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "active",
  })

  const [open, setOpen] = useState(false)

  const handleUpdateProject = () => {
    if (project && editProject.name.trim()) {
      updateProject(projectId, {
        ...project,
        name: editProject.name,
        description: editProject.description,
        status: editProject.status,
        updatedAt: new Date(),
      })
      setOpen(false)
    }
  }

  const handleDeleteProject = () => {
    if (project) {
      deleteProject(projectId)
      router.push("/dashboard")
    }
  }

  if (!project) {
    return null
  }

  // Get the current section from the pathname
  const section = pathname.split("/").pop() || "data"

  const sections = [
    { name: "Data", path: "data" },
    { name: "EDA", path: "eda" },
    { name: "Data Prep", path: "data-prep" },
    { name: "Model Training", path: "model-training" },
    { name: "Deploy & Test", path: "deploy-test" },
    { name: "Predictions", path: "predictions" },
    { name: "Reports", path: "reports" },
  ]

  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center">
            <FolderIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Last updated:{" "}
            {new Date(project.updatedAt).toLocaleString(undefined, {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-600">
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input
                    id="edit-name"
                    value={editProject.name}
                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editProject.description}
                    onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editProject.status}
                    onValueChange={(value) => setEditProject({ ...editProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button onClick={handleUpdateProject}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="text-gray-700" onClick={handleDeleteProject}>
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex border-t">
        {sections.map((item) => {
          const isActive = section === item.path

          return (
            <Link
              key={item.path}
              href={`/dashboard/${projectId}/${item.path}`}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300",
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}