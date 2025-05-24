"use client"

import { useProjects } from "@/lib/projects-context"
import { FilterX, WandIcon, TableIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { use } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"

type PageParams = {
  projectId: string
}

export default function DataPrepPage({ params }: { params: Promise<PageParams> }) {
  const { projects } = useProjects()
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId)

  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  return (
    <>
      <ProjectHeader projectId={unwrappedParams.projectId} />
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <FilterX className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">Data Preparation</h1>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              <TableIcon className="h-4 w-4 mr-2" />
              View Data
            </Button>
            <Button size="sm">
              <WandIcon className="h-4 w-4 mr-2" />
              Auto Clean
            </Button>
          </div>
        </div>

        <Tabs defaultValue="cleaning">
          <TabsList className="mb-6">
            <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
            <TabsTrigger value="transformation">Transformations</TabsTrigger>
            <TabsTrigger value="feature-engineering">Feature Engineering</TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Missing Values</CardTitle>
                  <CardDescription>Handle missing values in your dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <FilterX className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 text-center mb-4">No datasets available for cleaning</p>
                    <Button variant="outline" size="sm">
                      Add Dataset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outliers</CardTitle>
                  <CardDescription>Detect and handle outliers in your data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <FilterX className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 text-center mb-4">No datasets available for cleaning</p>
                    <Button variant="outline" size="sm">
                      Add Dataset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transformation">
            <Card>
              <CardHeader>
                <CardTitle>Data Transformations</CardTitle>
                <CardDescription>Apply transformations to your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <FilterX className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 text-center mb-4">No datasets available for transformation</p>
                  <Button variant="outline" size="sm">
                    Add Dataset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feature-engineering">
            <Card>
              <CardHeader>
                <CardTitle>Feature Engineering</CardTitle>
                <CardDescription>Create new features from existing data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <FilterX className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 text-center mb-4">No datasets available for feature engineering</p>
                  <Button variant="outline" size="sm">
                    Add Dataset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}