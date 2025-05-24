"use client"

import { useProjects } from "@/lib/projects-context"
import { Brain, PlayIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"

type PageParams = {
  projectId: string
}

export default function ModelTrainingPage({ params }: { params: Promise<PageParams> }) {
  const { projects } = useProjects()
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId)

  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  return (
    <>
      <ProjectHeader projectId={unwrappedParams.projectId} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Model Training</h1>
          </div>
          <Button size="sm">
            <PlayIcon className="h-4 w-4 mr-2" />
            Train Model
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Train a Model</CardTitle>
            <CardDescription>Select algorithms and train your machine learning model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <Brain className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 text-center mb-4">Prepare your data before training a model</p>
              <Button variant="outline" size="sm">
                Prepare Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}