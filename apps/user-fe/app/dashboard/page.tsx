// "use client";
// import { useAppSelector } from "@/lib/hooks";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// import { useAppSelector } from "@/lib/hooks";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function Dashboard() {
//   const { access_token } = useAppSelector((state) => state.auth);
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     if (!access_token) {
//       router.push("/login");
//     } else {
//       setIsLoading(false); 
//     }
//   }, [access_token, router]);

//   if (isLoading) return null; 

//   return (
//     <div className="max-w-lg mx-auto mt-10 p-6 text-center">
//       <h1 className="text-3xl font-bold">Dashboard</h1>
//       <p className="mt-4">Welcome! You are successfully logged in.</p>
//     </div>
//   );
// }
"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
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
import { Menu, House, SlidersHorizontal, Database, History, Info } from "lucide-react";
import  {Button}  from "../components/NewButton";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";

type DataRow = Record<string, any>;

interface Column {
  Header: string;
  accessor: string;
}

export default function Dashboard() {
  const { access_token } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    if (!access_token) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [access_token, router]);

  if (isLoading) return null;

  // Handlers for CSV and Excel uploads
  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      complete: (result:any) => {
        const data = result.data as DataRow[];
        setData(data);
        const columnKeys = Object.keys(data[0]);
        const cols = columnKeys.map((key) => ({
          Header: key,
          accessor: key,
        }));
        setColumns(cols);
      },
      header: true,
    });
  };

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ab = e.target?.result;
      if (!ab) return;
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws) as DataRow[];
      setData(jsonData);
      const columnKeys = Object.keys(jsonData[0]);
      const cols = columnKeys.map((key) => ({
        Header: key,
        accessor: key,
      }));
      setColumns(cols);
    };
    reader.readAsArrayBuffer(file);
  };
  //TODO:json

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".csv")) {
        handleCSVUpload(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        handleExcelUpload(file);
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const currentPageData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 max-w-full">
      {/* Header */}
      <header className="bg-white p-4 shadow-md flex justify-between items-center w-full">
        <div className="flex items-center">
          <Menu className="mx-3" />
          <h1 className="text-3xl font-extrabold px-3">LOGO</h1>
          {/* <h1 className="text-3xl font-bold px-3">LOGO</h1> */}
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
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="file:border file:border-gray-800 file:rounded-lg file:px-4 file:py-2 file:text-gray-100 file:bg-gray-900 file:hover:bg-gray-700 file:cursor-pointer"
            id="file-input"
          />

          {/* Table and Pagination */}
          {data.length > 0 && (
            <>
              <div className="overflow-x-auto max-w-full">
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
                      {currentPageData.map((row, rowIndex) => (
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
              </div>

              <TablePagination
                component="div"
                count={data.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
