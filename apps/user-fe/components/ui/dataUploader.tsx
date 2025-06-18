import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createDataset, specifyTargetColumn, startProfiling } from '@/libb/features/data/dataActions';
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, Edit, Check, ChevronLeft, ChevronRight, FileText, BookOpen } from 'lucide-react';
import { setLocalFile, setDeleted } from '@/libb/features/data/datasetSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type DataRow = Record<string, any>;
type FileType = 'csv' | 'json' | 'excel' | 'unknown';
type ColumnMeta = { description: string; isSelected: boolean };

export interface DataUploaderProps {
  projectId: string;
}

export interface DataUploaderRef {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

enum TaskType {
  CLASSIFICATION = "CLASSIFICATION",
  REGRESSION = "REGRESSION",
  CLUSTERING = "CLUSTERING",
  ANOMALY_DETECTION = "ANOMALY_DETECTION",
  TIME_SERIES_FORECASTING = "TIME_SERIES_FORECASTING"
}

function DataUploader({ projectId }: DataUploaderProps, ref: React.Ref<DataUploaderRef>) {
  const [data, setData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMetadata, setColumnMetadata] = useState<Record<string, ColumnMeta>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [datasetDescription, setDatasetDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');

  const dispatch = useAppDispatch();
  const { datasets, deleted, status, hasLocalFile } = useAppSelector((state) => state.data);

  const pageOptions = [5, 10, 20, 50, 100];
  const availableColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const canStartProfiling = taskType && targetColumn && datasets.length > 0;

  const handleSubmit = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dispatch(
        createDataset({
          name: fileName,
          description: datasetDescription,
          projectId,
          format: fileType.toUpperCase(),
          file,
          start_profiling: false
        })
      ).unwrap();

      console.log('Upload successful:', result);
      dispatch(setLocalFile(true));
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError(
        err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        'Failed to upload dataset'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecifyTarget = async () => {
    if (!datasets.length || !taskType || !targetColumn) return;

    try {
      await dispatch(specifyTargetColumn({
        datasetId: datasets[0].id,
        taskType,
        targetColumnName: targetColumn
      })).unwrap();
      
      alert("Target column specified successfully!");
    } catch (error) {
      alert("Failed to specify target column");
      console.error("Target specification error:", error);
    }
  };

  const handleStartProfiling = async () => {
    if (!datasets.length) return;

    try {
      await dispatch(startProfiling(datasets[0].id)).unwrap();
      alert("Profiling started successfully!");
    } catch (error) {
      alert("Failed to start profiling");
      console.error("Profiling error:", error);
    }
  };

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const newData = results.data as DataRow[];
        setData(newData);
        if (newData.length > 0) {
          const initialMetadata: Record<string, ColumnMeta> = {};
          Object.keys(newData[0]).forEach(key => {
            initialMetadata[key] = { description: '', isSelected: false };
          });
          setColumnMetadata(initialMetadata);
        }
        setIsLoading(false);
        setCurrentPage(1);
        setFileName(file.name);
        setFile(file);
        dispatch(setLocalFile(true));
      },
      error: (error) => { 
        setError(`Error parsing CSV: ${error.message}`); 
        setIsLoading(false);  
      },
    });
  }, []);

  const parseJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (Array.isArray(jsonData)) {
          setData(jsonData);
          if (jsonData.length > 0) {
            const initialMetadata: Record<string, ColumnMeta> = {};
            Object.keys(jsonData[0]).forEach(key => {
              initialMetadata[key] = { description: '', isSelected: false };
            });
            setColumnMetadata(initialMetadata);
          }
        } else { 
          setError('JSON file should contain an array of objects'); 
        }
      } catch (err) { 
        setError(`Error parsing JSON: ${err instanceof Error ? err.message : String(err)}`); 
      } finally { 
        setIsLoading(false); 
        setCurrentPage(1);  
        setFileName(file.name); 
        setFile(file); 
        dispatch(setLocalFile(true));  
      }
    };
    reader.readAsText(file);
  }, []);

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet);
        setData(jsonData);
        if (jsonData.length > 0) {
          const initialMetadata: Record<string, ColumnMeta> = {};
          Object.keys(jsonData[0]).forEach(key => {
            initialMetadata[key] = { description: '', isSelected: false };
          });
          setColumnMetadata(initialMetadata);
        }
      } catch (err) { 
        setError(`Error parsing Excel file: ${err instanceof Error ? err.message : String(err)}`); 
      } finally {
        setFileName(file.name); 
        setFile(file);  
        dispatch(setLocalFile(true)); 
        setIsLoading(false); 
        setCurrentPage(1);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDeleted(false));
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'csv') { setFileType('csv'); parseCSV(file); }
    else if (fileExtension === 'json') { setFileType('json'); parseJSON(file); }
    else if (['xlsx', 'xls'].includes(fileExtension || '')) { setFileType('excel'); parseExcel(file); }
    else { 
      setError('Unsupported file type. Please upload CSV, JSON, or Excel file.'); 
      setIsLoading(false);
      setFile(null);
    }
  }, [parseCSV, parseJSON, parseExcel]);

  useImperativeHandle(ref, () => ({
    handleFileUpload,
  }));

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  useEffect(() => { 
    if (data.length > 0 && currentPage > totalPages) setCurrentPage(totalPages); 
  }, [data.length, currentPage, totalPages]);

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {(!data.length || deleted) && (
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 mb-8 transition-all hover:border-blue-400">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-700">Upload your data file</h2>
              <p className="text-sm text-gray-500 mt-1">Supports CSV, JSON, and Excel formats</p>
            </div>
            <label className="cursor-pointer">
              <span className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Choose File
              </span>
              <input 
                type="file" 
                accept=".csv,.json,.xlsx,.xls" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
          </div>
        </div>
      )}

      {(isLoading || status === "loading") && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Processing your file...</p>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100 flex items-start">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-1 text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {(data.length > 0 && !deleted) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                <span className="font-medium text-gray-500">File:</span> {fileName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {data.length} rows × {Object.keys(data[0]).length} columns
              </p>
            </div>
          </div>

          {/* Task Type and Target Column Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Task Type</Label>
                <Select 
                  value={taskType || ""}
                  onValueChange={(value: TaskType) => setTaskType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Column</Label>
                <Select
                  value={targetColumn || ""}
                  onValueChange={(value: string) => setTargetColumn(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleSpecifyTarget}
                disabled={!taskType || !targetColumn || status === "loading"}
              >
                Set Target
              </Button>
              <Button
                onClick={handleStartProfiling}
                disabled={!canStartProfiling || status === "loading"}
              >
                Start Profiling
              </Button>
            </div>
          </div>

          {/* Data Table and other existing components */}
          {/* ... (keep your existing table and pagination code) ... */}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="px-6 py-2 bg-green-600 text-white hover:bg-green-700"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit Data'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const DataUploaderr = forwardRef(DataUploader);
export default DataUploaderr;