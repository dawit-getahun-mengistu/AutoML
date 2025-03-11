"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { createProject, fetchProjects } from "@/lib/features/project/projectActions";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import {
  Menu,
  House,
  SlidersHorizontal,
  Database,
  History,
  Info,
} from "lucide-react";
import { Button } from "../components/NewButton";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

type DataRow = Record<string, any>;

interface Column {
  Header: string;
  accessor: string;
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { projects, status, error } = useAppSelector((state) => state.project);
  const router = useRouter();
  const { access_token } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ [key: string]: DataRow[] }>({});
  const [pagination, setPagination] = useState<{ 
    [key: string]: { page: number; rowsPerPage: number } 
  }>({});
  const [columns, setColumns] = useState<Column[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [statuss, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (!access_token) {
      router.push("/login");
    } else {
      dispatch(fetchProjects());
      setIsLoading(false);
    }
  }, [access_token, dispatch, router]);

  if (isLoading) return null;

  const handleCSVUpload = (file: File, projectId: string) => {
    Papa.parse(file, {
      complete: (result: any) => {
        const data = result.data as DataRow[];
        setData((prevData) => ({
          ...prevData,
          [projectId]: data,
        }));
        // Initialize pagination for the project
        setPagination(prev => ({
          ...prev,
          [projectId]: {
            page: 0,
            rowsPerPage: 5,
          },
        }));
        setColumns(Object.keys(data[0]).map(key => ({ Header: key, accessor: key })));
      },
      header: true,
    });
  };

  const handleExcelUpload = (file: File, projectId: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ab = e.target?.result;
      if (!ab) return;
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws) as DataRow[];
      setData((prevData) => ({
        ...prevData,
        [projectId]: jsonData,
      }));
      // Initialize pagination for the project
      setPagination(prev => ({
        ...prev,
        [projectId]: {
          page: 0,
          rowsPerPage: 5,
        },
      }));
      setColumns(Object.keys(jsonData[0]).map(key => ({ Header: key, accessor: key })));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, projectId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".csv")) {
        handleCSVUpload(file, projectId);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        handleExcelUpload(file, projectId);
      }
    }
  };

  // Project-specific pagination handlers
  const handleChangePage = (projectId: string) => (event: unknown, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        page: newPage,
      },
    }));
  };

  const handleChangeRowsPerPage = (projectId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setPagination(prev => ({
      ...prev,
      [projectId]: {
        page: 0,
        rowsPerPage: newRowsPerPage,
      },
    }));
  };

  const handleCreateProject = () => {
    const userInfoString = localStorage.getItem("userInfo");
    let userId = "unknown";
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        userId = userInfo.id;
      } catch (error) {
        console.error("Error parsing userInfo:", error);
      }
    }
    dispatch(
      createProject({
        name: projectName,
        description: projectDesc,
        status: statuss,
        userId: userId,
      })
    );
    setProjectName("");
    setProjectDesc("");
    setStatus("ACTIVE");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 max-w-full">
      {/* Header */}
      <header className="bg-white p-4 shadow-md flex justify-between items-center w-full">
        <div className="flex items-center">
          <Menu className="mx-3" />
          <h1 className="text-3xl font-extrabold px-3 text-gray-800">LOGO</h1>
        </div>
        <p className="text-gray-500">Manage your data efficiently</p>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg p-4 flex flex-col justify-between">
          <nav className="space-y-4">
            <Button variant="outline" className="w-full flex items-center">
              <House className="mr-2" /> Home
            </Button>
            <Button variant="outline" className="w-full flex items-center">
              <SlidersHorizontal className="mr-2" /> Use Cases
            </Button>
            <Button variant="outline" className="w-full flex items-center">
              <Database className="mr-2" /> Dataset Storage
            </Button>
            <Button variant="outline" className="w-full flex items-center">
              <History className="mr-2" /> History
            </Button>
            <Button variant="outline" className="w-full flex items-center">
              <Info className="mr-2" /> About
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {/* Project Creation Form */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
            <div className="mt-4">
              <input
                type="text"
                placeholder=" Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
              />
            </div>
            <div className="mt-2">
              <textarea
                placeholder="Description"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
              />
            </div>
            <div className="mt-2">
              <select
                value={statuss}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
              >
                <option value="ACTIVE">🟢 Active</option>
                <option value="INACTIVE">🟡 Inactive</option>
                <option value="COMPLETED">🔵 Done</option>
              </select>
            </div>
            <div className="mt-4">
              {typeof error === "string" && (
                <p className="text-red-500">
                  {status == "failed" ? (error as string) : ""}
                </p>
              )}
              <Button
                variant="default"
                onClick={handleCreateProject}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Creating..." : "✅ Create Project"}
              </Button>
            </div>
          </div>

          {/* Project Cards with Data Upload Forms */}
          <div className="mt-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-4 rounded-lg shadow-md mt-4 border border-gray-300"
              >
                <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-800">{project.description}</p>
                <p className="text-sm font-semibold text-gray-900">Status: {project.status}</p>

                {/* Dataset Upload Form Inside Each Project */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900">Add Dataset</h4>

                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder=" Dataset Name"
                      className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
                    />
                  </div>

                  <div className="mt-2">
                    <textarea
                      placeholder="Description"
                      className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
                    />
                  </div>

                  <div className="mt-2">
                    <select className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white">
                      <option value="CSV">📄 CSV</option>
                      <option value="EXCEL">📊 EXCEL</option>
                      <option value="JSON">📜 JSON</option>
                    </select>
                  </div>

                  {/* File Upload */}
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={(e) => handleFileChange(e, project.id)}
                      className="file:border file:border-gray-800 file:rounded-lg file:px-4 file:py-2 file:text-gray-100 file:bg-gray-900 file:hover:bg-gray-700 file:cursor-pointer"
                    />
                  </div>

                  {/* Upload Data Button */}
                  <div className="mt-4">
                    <Button variant="default">✅ Upload Data</Button>
                  </div>
                </div>

                {/* Visualization Section for this Project */}
                {data[project.id] && data[project.id].length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-md font-semibold">📊 Datasets & Visualizations</h4>
                    <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                      <Table sx={{ minWidth: 650 }} aria-label="data table">
                        <TableHead>
                          <TableRow>
                            {columns.map((column) => (
                              <TableCell key={column.Header} align="left">
                                {column.Header}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data[project.id]
                            ?.slice(
                              (pagination[project.id]?.page || 0) * (pagination[project.id]?.rowsPerPage || 5),
                              (pagination[project.id]?.page || 0) * (pagination[project.id]?.rowsPerPage || 5) + 
                              (pagination[project.id]?.rowsPerPage || 5)
                            )
                            .map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {columns.map((column) => (
                                  <TableCell key={column.accessor} align="left">
                                    {row[column.accessor]}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={data[project.id]?.length || 0}
                      page={pagination[project.id]?.page || 0}
                      onPageChange={handleChangePage(project.id)}
                      rowsPerPage={pagination[project.id]?.rowsPerPage || 5}
                      onRowsPerPageChange={handleChangeRowsPerPage(project.id)}
                      rowsPerPageOptions={[5, 10, 25]}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}