"use client"
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/libb/hooks';
import { specifyTargetColumn } from '@/libb/features/data/dataActions';

interface TargetSpecificationFormProps {
  datasetId: string;
  availableColumns: string[];
  onSuccess?: () => void;
}

const TargetSpecificationForm: React.FC<TargetSpecificationFormProps> = ({
  datasetId,
  availableColumns,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector(state => state.data);
  const [taskType, setTaskType] = useState<"CLASSIFICATION" | "REGRESSION">("CLASSIFICATION");
  const [targetColumnName, setTargetColumnName] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColumnName) return;
    
    try {
      await dispatch(specifyTargetColumn({
        datasetId,
        taskType,
        targetColumnName
      })).unwrap(); // unwrap() throws if the action was rejected
      
      onSuccess?.();
    } catch (error) {
      // Error is already handled by the slice
      console.error("Failed to set target:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="taskType" className="block text-sm font-medium text-gray-700">
          Task Type
        </label>
        <select
          id="taskType"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as "CLASSIFICATION" | "REGRESSION")}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="CLASSIFICATION">Classification</option>
          <option value="REGRESSION">Regression</option>
        </select>
      </div>

      <div>
        <label htmlFor="targetColumn" className="block text-sm font-medium text-gray-700">
          Target Column
        </label>
        <select
          id="targetColumn"
          value={targetColumnName}
          onChange={(e) => setTargetColumnName(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          required
        >
          <option value="">Select a target column</option>
          {availableColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Saving..." : "Save Target Column"}
      </button>
    </form>
  );
};

export default TargetSpecificationForm;