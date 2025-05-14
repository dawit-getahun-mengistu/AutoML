"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { jwtDecode } from "jwt-decode";
import {
  createProject,
  fetchProjects,
} from "@/lib/features/project/projectActions";
import { refresh, logout } from "@/lib/features/auth/authActions";
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
} from "lucide-react";
import SideBar from "../components/SideBar/SideBar";
import { Button } from "../components/NewButton";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createDataset } from "@/lib/features/data/dataActions";

type DataRow = Record<string, any>;

interface Column {
  Header: string;
  accessor: string;
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const {
    projects,
    status: projectStatus,
    error: projectError,
  } = useAppSelector((state) => state.project);
  const router = useRouter();
  const {
    status: authStatus,
    access_token,
    refresh_token,
    userInfo,
    error: authError,
  } = useAppSelector((state) => state.auth);
  const {
    status: dataStatus,
    datasets,
    error: dataError,
  } = useAppSelector((state) => state.data);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<{
    [projectId: string]: {
      [datasetId: string]: DataRow[];
    };
  }>({});
  const [pagination, setPagination] = useState<{
    [projectId: string]: {
      [datasetId: string]: { page: number; rowsPerPage: number };
    };
  }>({});
  const [columns, setColumns] = useState<{
    [projectId: string]: {
      [datasetId: string]: Column[];
    };
  }>({});

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [statuss, setStatus] = useState("ACTIVE");
  const [datasetForm, setDatasetForm] = useState<{
    [projectId: string]: {
      name: string;
      description: string;
      format: string;
      file: File | null;
    };
  }>({});
  useEffect(() => {
    console.log("datasetForm", datasetForm);
  }, [datasetForm]);
  useEffect(() => {
    // console.log("useffect is being called from dashboard page");
    if (!access_token) {
      // console.log("No access token, redirecting to login...");
      router.push("/login");
    } else if (access_token) {
      // console.log("fetching projects called from dashboard page");
      dispatch(fetchProjects())
        .unwrap()
        .then(() => {
          // console.log("the dashboard fetch projects returned successfully");
          setIsLoading(false);
          console.log(projects)
        });
    } else if (authError) {
      // console.log("authError in dashboard page",authError);
      router.push("/login");
    }
  }, [access_token, dispatch, router, authError]);

  useEffect(() => {
    if (projectError) {
      // console.log("use Effect projectError", projectError);
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError, dataError]);

  if (isLoading) return null;

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          router.push("/login");
        }
      })
      .catch((error) => {
        // console.error("Logout failed:", error);
      });
  };
  const handleFileChange = (
    file: File,
    projectId: string,
    datasetId: string
  ) => {
    if (!file) return;

    if (file.name.endsWith(".csv")) {
      handleCSVUpload(file, projectId, datasetId);
    } else if (file.name.endsWith(".xlsx")) {
      handleExcelUpload(file, projectId, datasetId);
    } else if (file.name.endsWith(".json")) {
      handleJSONUpload(file, projectId, datasetId);
    }
  };

  const handleCSVUpload = (
    file: File,
    projectId: string,
    datasetId: string
  ) => {
    Papa.parse(file, {
      complete: (result: any) => {
        const data = result.data as DataRow[];
        setData((prevData) => ({
          ...prevData,
          [projectId]: {
            ...(prevData[projectId] || {}),
            [datasetId]: data,
          },
        }));
        // Initialize pagination for the dataset
        setPagination((prev) => ({
          ...prev,
          [projectId]: {
            ...(prev[projectId] || {}),
            [datasetId]: {
              page: 0,
              rowsPerPage: 5,
            },
          },
        }));
        setColumns((prevColumns) => ({
          ...prevColumns,
          [projectId]: {
            ...(prevColumns[projectId] || {}),
            [datasetId]: Object.keys(data[0]).map((key) => ({
              Header: key,
              accessor: key,
            })),
          },
        }));
      },
      header: true,
    });
  };

  const handleExcelUpload = (
    file: File,
    projectId: string,
    datasetId: string
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ab = e.target?.result;
      if (!ab) return;
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws) as DataRow[];
      setData((prevData) => ({
        ...prevData,
        [projectId]: {
          ...(prevData[projectId] || {}),
          [datasetId]: jsonData,
        },
      }));
      // Initialize pagination for the dataset
      setPagination((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          [datasetId]: {
            page: 0,
            rowsPerPage: 5,
          },
        },
      }));
      setColumns((prevColumns) => ({
        ...prevColumns,
        [projectId]: {
          ...(prevColumns[projectId] || {}),
          [datasetId]: Object.keys(jsonData[0]).map((key) => ({
            Header: key,
            accessor: key,
          })),
        },
      }));
    };
    reader.readAsArrayBuffer(file);
  };
  //TODO: finish handleJSONUpload
  const handleJSONUpload = (
    file: File,
    projectId: string,
    datasetId: string
  ) => {
    // Implementation for handling JSON upload
  };

  // Project-specific pagination handlers
  const handleChangePage =
    (projectId: string, datasetId: string) =>
    (event: unknown, newPage: number) => {
      setPagination((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          [datasetId]: {
            ...((prev[projectId] && prev[projectId][datasetId]) || {
              rowsPerPage: 5,
            }),
            page: newPage,
          },
        },
      }));
    };

  const handleChangeRowsPerPage =
    (projectId: string, datasetId: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setPagination((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          [datasetId]: {
            page: 0,
            rowsPerPage: newRowsPerPage,
          },
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
        // console.error("Error parsing userInfo:", error);
      }
    } else {
      if (access_token && refresh_token) {
        const decoded = jwtDecode<{
          userId: string;
          userName: string;
          iat: number;
          exp: number;
        }>(access_token);
        const refresh_decoded = jwtDecode<{
          userId: string;
          userName: string;
          iat: number;
          exp: number;
        }>(refresh_token);
        userId = decoded.userId;
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
  //TODO:can't accept DatasetId as an argument because it hasn't yet been sent to backend it is still unknown
  const handleUploadData = async (projectId: string) => {
    const datasetData = datasetForm[projectId];
    console.log("Selected Format:", datasetData?.format);
    console.log("Selected File:", datasetData?.file);
    if (!datasetData || !datasetData.file) {
      alert("Please complete all fields and select a file.");
      return;
    }

    let detectedFormat = "CSV";
    const fileName = datasetData.file.name.toLowerCase();
    if (fileName.endsWith(".csv")) {
      detectedFormat = "CSV";
    } else if (fileName.endsWith(".xlsx")) {
      detectedFormat = "EXCEL";
    } else if (fileName.endsWith(".json")) {
      detectedFormat = "JSON";
    } else {
      alert("Invalid file format. Please upload a CSV or Excel or JSON file.");
      return;
    }

    try {
      // Dispatch createDataset to upload dataset info
      const result = await dispatch(
        createDataset({
          name: datasetData.name,
          description: datasetData.description,
          projectId: projectId,
          format: detectedFormat,
          file: datasetData.file,
        })
      ).unwrap();
      if (result) {
        //TODO: g the dataset id from the result(backend))
        handleFileChange(datasetData.file, projectId, result.id);
      }
    } catch (error) {
      console.error("Dataset upload failed:", error);
      alert(error);
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 max-w-full">
      {/* Header */}
      <header className="bg-white p-4 shadow-md flex justify-between items-center w-full">
        <div className="flex items-center">
          <Menu className="mx-3" />
          <h1 className="text-3xl font-extrabold px-3 text-gray-800">LOGO</h1>
        </div>
        <Button
          variant="default"
          onClick={handleLogout}
          disabled={authStatus === "loading"}
        >
          {authStatus === "loading" ? "Logging Out..." : " Logout"}
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <SideBar projects={projects}/>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {/* Project Creation Form */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Project
            </h2>
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
              {typeof projectError === "string" && (
                <p className="text-red-500">
                  {projectStatus == "failed" ? (projectError as string) : ""}
                </p>
              )}
              <Button
                variant="default"
                onClick={handleCreateProject}
                disabled={projectStatus === "loading"}
              >
                {projectStatus === "loading"
                  ? "Creating..."
                  : "✅ Create Project"}
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
                <h3 className="text-lg font-bold text-gray-900">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-800">{project.description}</p>
                <p className="text-sm font-semibold text-gray-900">
                  Status: {project.status}
                </p>

                {/* Dataset Upload Form Inside Each Project */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900">
                    Add Dataset
                  </h4>
                  <input
                    type="text"
                    placeholder="Dataset Name"
                    value={datasetForm[project.id]?.name || ""}
                    onChange={(e) =>
                      setDatasetForm((prev) => ({
                        ...prev,
                        [project.id]: {
                          ...prev[project.id],
                          name: e.target.value,
                        },
                      }))
                    }
                    className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
                  />

                  <div className="mt-2">
                    <textarea
                      placeholder="Description"
                      value={datasetForm[project.id]?.description || ""} // Bind the value to datasetForm state for this project
                      onChange={(e) =>
                        setDatasetForm((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...prev[project.id],
                            description: e.target.value, // Update description for this project
                          },
                        }))
                      }
                      className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
                    />
                  </div>

                  <div className="mt-2">
                    <select
                      value={datasetForm[project.id]?.format || "CSV"} // Bind the value to datasetForm state for this project
                      onChange={(e) => {
                        setDatasetForm((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...prev[project.id], // Preserve other data (like name, description, file)
                            format: e.target.value, // Update format for this specific project
                          },
                        }));
                        console.log(
                          `afterrrr Updating format for project ${project.id}: ${e.target.value}`
                        );
                      }}
                      className="w-full p-2 border border-gray-500 text-gray-900 rounded-md bg-white"
                    >
                      <option value="CSV">📄 CSV</option>
                      <option value="EXCEL">📊 EXCEL</option>
                      <option value="JSON">🗂️ JSON</option>
                    </select>
                  </div>

                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDatasetForm((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              file: file, // Store the selected file for this project
                            },
                          }));
                          console.log(
                            `after file upload format for project ${project.id}: ${e.target.value}`
                          );
                        }
                      }}
                      className="file:border file:border-gray-800 file:rounded-lg file:px-4 file:py-2 file:text-gray-100 file:bg-gray-900 file:hover:bg-gray-700 file:cursor-pointer"
                    />
                  </div>

                  {/* Upload Data Button */}
                  <div className="mt-4">
                    <Button
                      variant="default"
                      onClick={() => handleUploadData(project.id)}
                    >
                      ✅ Upload Data
                    </Button>
                  </div>
                </div>

                {/* Visualization Section for this Project */}
                {data[project.id] &&
                  Object.keys(data[project.id]).length > 0 && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-md font-semibold">
                        📊 Datasets & Visualizations
                      </h4>
                      {Object.entries(data[project.id]).map(
                        ([datasetId, datasetData]) => (
                          <div key={datasetId}>
                            <h5 className="text-sm font-bold">
                              Dataset ID: {datasetId}
                            </h5>
                            <TableContainer
                              component={Paper}
                              sx={{ overflowX: "auto" }}
                            >
                              <Table
                                sx={{ minWidth: 650 }}
                                aria-label="data table"
                              >
                                <TableHead>
                                  <TableRow>
                                    {columns[project.id][datasetId].map(
                                      (column) => (
                                        <TableCell
                                          key={column.Header}
                                          align="left"
                                        >
                                          {column.Header}
                                        </TableCell>
                                      )
                                    )}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {datasetData
                                    .slice(
                                      (pagination[project.id][datasetId]
                                        ?.page || 0) *
                                        (pagination[project.id][datasetId]
                                          ?.rowsPerPage || 5),
                                      (pagination[project.id][datasetId]
                                        ?.page || 0) *
                                        (pagination[project.id][datasetId]
                                          ?.rowsPerPage || 5) +
                                        (pagination[project.id][datasetId]
                                          ?.rowsPerPage || 5)
                                    )
                                    .map((row, rowIndex) => (
                                      <TableRow
                                        key={`${datasetId}-${rowIndex}`}
                                      >
                                        {columns[project.id][datasetId].map(
                                          (column) => (
                                            <TableCell
                                              key={column.accessor}
                                              align="left"
                                            >
                                              {row[column.accessor]}
                                            </TableCell>
                                          )
                                        )}
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            <TablePagination
                              component="div"
                              count={datasetData.length}
                              page={
                                pagination[project.id][datasetId]?.page || 0
                              }
                              onPageChange={handleChangePage(
                                project.id,
                                datasetId
                              )}
                              rowsPerPage={
                                pagination[project.id][datasetId]
                                  ?.rowsPerPage || 5
                              }
                              onRowsPerPageChange={handleChangeRowsPerPage(
                                project.id,
                                datasetId
                              )}
                              rowsPerPageOptions={[5, 10, 25]}
                            />
                          </div>
                        )
                      )}
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
