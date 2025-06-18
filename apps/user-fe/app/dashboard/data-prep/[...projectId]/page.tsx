"use client"

import { FilterX, WandIcon, TableIcon, Link2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { use, useEffect, useState } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { createProject, fetchProjects } from "@/lib/features/project/projectActions"
import { useFeatureEngineering } from '@/lib/hooks/useFeatureEngineering';
import { useFeatureSelection } from "@/lib/hooks/useFeatureSelection"
import { fetchDatasetIdByProjectId, startFeatureSelection } from "@/lib/features/data/dataActions";
import { refresh } from "@/lib/features/auth/authActions"
import {useRouter} from "next/navigation"
type PageParams = {
  projectId: string[]
}

export default function DataPrepPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, refresh_token, error:authError } = useAppSelector((state) => state.auth)
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"))
  const projectId = unwrappedParams.projectId.join("/");
  const dispatch = useAppDispatch()
  
   const [datasetId, setDatasetId] = useState<string | null>(null);

  // Hook will only run if datasetId exists
  const {
    results,
    isLoading,
    error,
    startFeatureEng,
    stopPolling
  } = useFeatureEngineering(datasetId ?? "");
  const {selResults,isSelLoading,selError,startFeatureSel,topSelPolling} = useFeatureSelection(datasetId ?? "")
  const handleSelectionGenerate = () => {startFeatureSel()}
  const handleGenerate = () => {startFeatureEng()}
  const handleStartFeatureSelection = () => {
    console.log("feature selection start button clicked")
    console.log(dispatch(startFeatureSelection(datasetId??"")))
    // console.log(startFeatureSelection(datasetId??""))
    }
  const handleStart = () => {
    dispatch(fetchDatasetIdByProjectId(projectId))
      .unwrap()
      .then((id) => {
        if (id) {
          setDatasetId(id);
          
        }
      })
      .catch((err) => {
        console.error("Failed to fetch dataset ID", err);
      });
  };
  useEffect(()=> {
      if (!isLoading) {
        stopPolling()
      } 
    }, [isLoading])

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
    }
}, [access_token, dispatch, router, authError]);
  if (!project) {
    return <div className="p-8">Project not fouvcfxdsnd</div>
  }
  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <FilterX className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">Data Preparation</h1>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={handleStart}>
              <TableIcon className="h-4 w-4 mr-2" />
              Start REPORT
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartFeatureSelection}>
              <TableIcon className="h-4 w-4 mr-2" />
              Start Selection REPORT
            </Button>
            <Button size="sm" onClick={handleGenerate}>
              <WandIcon className="h-4 w-4 mr-2" />
              Generate REPORT
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectionGenerate}>
              <TableIcon className="h-4 w-4 mr-2" />
              Generate Selection REPORT
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
              <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Dataset Analysis</CardTitle>
            <CardDescription>
              {isLoading ? (
                <span>
                  
                </span>
              ) : "Exploratory visualization of your dataset"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center p-8">
                <div className="animate-pulse flex space-x-4 mb-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                </div>
                <p>Generating report...</p>
                
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-red-500 mb-3">{error}</p>
                
              </div>
            ) : results ? (
              <div className="p-4 border rounded-lg">
                { (
                  <iframe 
                    src={results.url} 
                    width="100%" 
                    height="500px"
                    title="EDA Visualization"
                  />
                ) }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <Link2Icon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center mb-4">
                  No visualization available
                </p>
                
              </div>
            )}
          </CardContent>
        </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outliers</CardTitle>
                  <CardDescription>Detect and handle outliers in your data</CardDescription>
                </CardHeader>
                <CardContent>
            {isSelLoading ? (
              <div className="flex flex-col items-center p-8">
                <div className="animate-pulse flex space-x-4 mb-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                </div>
                <p>Generating report...</p>
                
              </div>
            ) : selError ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-red-500 mb-3">{error}</p>
                
              </div>
            ) : selResults ? (
              <div className="p-4 border rounded-lg">
                { (
                  <iframe 
                    src={selResults.url} 
                    width="100%" 
                    height="500px"
                    title="EDA Visualization"
                  />
                ) }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <Link2Icon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center mb-4">
                  No visualization available
                </p>
                
              </div>
            )}
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