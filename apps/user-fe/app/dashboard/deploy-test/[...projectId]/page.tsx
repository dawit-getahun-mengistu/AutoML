"use client"

import { useProjects } from "@/libb/projects-context"
import { Rocket, ServerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use, useEffect} from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { createProject, fetchProjects } from "@/libb/features/project/projectActions"
import { refresh } from "@/libb/features/auth/authActions"
import {useRouter} from "next/navigation"
type PageParams = {
  projectId: string[]
}

export default function DeployTestPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, refresh_token, error:authError } = useAppSelector((state) => state.auth)
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"))
  const dispatch = useAppDispatch()
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
    return <div className="p-8">Project not found</div>
  }

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Rocket className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Deploy & Test</h1>
          </div>
          <Button size="sm">
            <ServerIcon className="h-4 w-4 mr-2" />
            Deploy Model
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deploy Your Model</CardTitle>
            <CardDescription>Deploy your trained model to production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <Rocket className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 text-center mb-4">Train a model before deploying</p>
              <Button variant="outline" size="sm">
                Train Model
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
