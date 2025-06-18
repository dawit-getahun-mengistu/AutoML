"use client";

import { Database, UploadIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { use, useEffect, useRef, useState } from "react";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import {
  createProject,
  fetchProjects,
} from "@/libb/features/project/projectActions";
import { refresh } from "@/libb/features/auth/authActions";
import { createDataset, deleteDataset } from "@/libb/features/data/dataActions";
import { useRouter } from "next/navigation";
import DataUploader, { DataUploaderRef } from "@/components/ui/dataUploader";

type PageParams = {
  projectId: string[];
};

export default function DataPage({ params }: { params: Promise<PageParams> }) {
  const uploaderRef = useRef<DataUploaderRef>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();
  
  const {
    projects,
    status: projectStatus,
    error: projectError,
  } = useAppSelector((state) => state.project);
  
  const {
    datasets,
    status,
    error: datasetsError,
    hasLocalFile
  } = useAppSelector((state) => state.data); // Using state.data as requested
  
  const {
    access_token,
    refresh_token,
    error: authError,
  } = useAppSelector((state) => state.auth);
  
  const unwrappedParams = use(params);
  const project = projects.find(
    (p) => p.id === unwrappedParams.projectId.join("/")
  );
  
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (projectError === "Unauthorized") {
      dispatch(refresh());
    }
  }, [projectError, dispatch]);

  useEffect(() => {
    if (access_token) {
      dispatch(fetchProjects());
    }
  }, [access_token, dispatch]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const triggerUpload = async () => {
    if (!selectedFile || !project) return;

    try {
      await dispatch(createDataset({
        name: selectedFile.name,
        description: `Dataset uploaded from ${selectedFile.name}`,
        projectId: project.id,
        format: selectedFile.name.split('.').pop() || '',
        file: selectedFile,
        start_profiling: false
      })).unwrap();

      alert("Dataset uploaded successfully!");
      setSelectedFile(null);
      
      // Reset file input
      if (uploaderRef.current) {
        uploaderRef.current.reset();
      }
    } catch (error) {
      alert("Failed to upload dataset");
      console.error("Upload error:", error);
    }
  };

  const handleDeleteDataset = () => {
    if (!datasets.length) return;
    
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      const datasetToDelete = datasets[0];
      dispatch(deleteDataset(datasetToDelete.id))
        .unwrap()
        .then(() => {
          alert("Dataset deleted successfully");
        })
        .catch((error) => {
          alert("Failed to delete dataset");
          console.error('Delete error:', error);
        });
    }
  };

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Data</h1>
          </div>
          <div className="flex space-x-2">
            {!hasLocalFile && (
              <>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    Choose File
                  </span>
                  <input 
                    type="file" 
                    accept=".csv,.json,.xlsx,.xls" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
                {selectedFile && (
                  <Button onClick={triggerUpload}>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload {selectedFile.name}
                  </Button>
                )}
              </>
            )}
            {hasLocalFile && datasets.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteDataset}
                disabled={status === "loading"}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {status === "loading" ? "Deleting..." : "Delete Dataset"}
              </Button>
            )}
          </div>
        </div>

        <div>
          <Card>
            <DataUploader 
              ref={uploaderRef}
              projectId={project.id}
            />
          </Card>
        </div>
      </div>
    </>
  );
}