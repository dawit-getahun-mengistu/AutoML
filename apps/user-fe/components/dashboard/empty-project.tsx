"use client"

import { FolderOpenIcon, PlusCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useProjects } from "@/lib/projects-context"

export function EmptyProject() {
  const { addProject } = useProjects()
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active",
  })
  const [open, setOpen] = useState(false)

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      addProject({
        id: `proj-${Date.now()}`,
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setNewProject({ name: "", description: "", status: "active" })
      setOpen(false)
    }
  }

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
                onChange={(e:any) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Enter project description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newProject.status}
                onValueChange={(value:any) => setNewProject({ ...newProject, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
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