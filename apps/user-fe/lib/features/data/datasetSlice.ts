// src/lib/features/dataset/datasetSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createDataset } from "./dataActions";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: string;
  file: string;
  format: string;
  size: number;
  rows: number | null;
  cols: number | null;
  createdAt: string;
  updatedAt: string;
}

interface DatasetState {
  datasets: Dataset[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | string[];
}

const initialState: DatasetState = {
  datasets: [],
  status: "idle",
  error: null,
};

const datasetSlice = createSlice({
  name: "dataset",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createDataset.fulfilled, (state, action: PayloadAction<Dataset>) => {
        state.status = "succeeded";
        state.datasets.push(action.payload);
      })
      .addCase(createDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
      });
  }
});

export default datasetSlice.reducer;