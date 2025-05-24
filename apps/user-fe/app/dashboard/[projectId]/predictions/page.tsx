"use client"

import { useProjects } from "@/lib/projects-context"
import { use } from "react"
import { LineChart, PlayIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectHeader } from "@/components/dashboard/project-header"

type PageParams = {
  projectId: string
}

export default function PredictionsPage({ params }: { params: Promise<PageParams> }) {
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
            <LineChart className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Predictions</h1>
          </div>
          <Button size="sm">
            <PlayIcon className="h-4 w-4 mr-2" />
            Make Prediction
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Make Predictions</CardTitle>
            <CardDescription>Use your trained model to make predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <LineChart className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 text-center mb-4">Deploy a model before making predictions</p>
              <Button variant="outline" size="sm">
                Deploy Model
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}