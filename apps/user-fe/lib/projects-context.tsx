"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Project {
  id: string
  name: string
  description: string
  status: any
  createdAt: Date
  updatedAt: Date
}

interface ProjectsContextType {
  projects: Project[]
  addProject: (project: Project) => void
  updateProject: (id: string, project: Project) => void
  deleteProject: (id: string) => void
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])

  // Load projects from localStorage on initial render
  useEffect(() => {
    const storedProjects = localStorage.getItem("automl-projects")
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects)
        // Convert string dates back to Date objects
        const projectsWithDates = parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        }))
        setProjects(projectsWithDates)
      } catch (error) {
        console.error("Failed to parse projects from localStorage:", error)
      }
    }
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("automl-projects", JSON.stringify(projects))
  }, [projects])

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project])
  }

  const updateProject = (id: string, updatedProject: Project) => {
    setProjects((prev) => prev.map((project) => (project.id === id ? updatedProject : project)))
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id))
  }

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProject, deleteProject }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider")
  }
  return context
}