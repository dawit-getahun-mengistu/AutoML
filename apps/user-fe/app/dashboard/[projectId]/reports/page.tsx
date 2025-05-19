"use client"

import { useProjects } from "@/lib/projects-context"
import { FileBarChart, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage({ params }: { params: { projectId: string } }) {
  const { projects } = useProjects()
  const project = projects.find((p) => p.id === params.projectId)

  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileBarChart className="h-5 w-5 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <Button size="sm">
          <BarChart className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Reports</CardTitle>
          <CardDescription>View insights and performance metrics for your models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <FileBarChart className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center mb-4">Train and deploy a model to generate reports</p>
            <Button variant="outline" size="sm">
              Train Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}