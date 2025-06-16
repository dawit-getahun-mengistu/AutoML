// src/lib/features/data/datasetSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createDataset, deleteDataset,startProfiling, specifyTargetColumn, fetchDatasetIdByProjectId, fetchDatasetById, fetchEDAByDatasetId } from "./dataActions";

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
  taskType?: "CLASSIFICATION" | "REGRESSION" | null;
  edaReport?: string;
  targetColumnName?: string | null;
  columnsMetadata?: Array<{
    name: string;
    dataType: string;
    isTarget?: boolean;
  }>;
}

interface DatasetState {
  datasets: Dataset[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | string[];
  hasLocalFile:boolean;
  deleted:boolean
}

const initialState: DatasetState = {
  datasets: [],
  status: "idle",
  error: null,
  hasLocalFile:false,
  deleted:false
};


export interface TargetColumn {
  id: string;
  taskType?: "CLASSIFICATION" | "REGRESSION" | null;
  targetColumnName?: string | null;
}

export interface EDAReport {
  profilingStatus: string;
  profilingError: string;
  EDAFileViz: string | null; // Assuming this is a URL or base64 encoded data
}


const datasetSlice = createSlice({
  name: "dataset",
  initialState,
  reducers: {
    setLocalFile: (state, action: PayloadAction<boolean>) => {
      state.hasLocalFile = action.payload;
    },
    clearLocalFile: (state) => {
      state.hasLocalFile = false;
    },
    //TODO: for mocking integration
    setDeleted: (state, action) => {
      state.deleted = action.payload;
      state.status = "idle"
    }
  },
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
      })
      .addCase(deleteDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteDataset.fulfilled, (state) => {
        state.status = "succeeded";
        state.datasets = [];
      })
      .addCase(deleteDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
        //TODO:CHANGGEE FOR TESTINGONKY
        state.deleted = true

      }) .addCase(startProfiling.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(startProfiling.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(startProfiling.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
      })
       .addCase(specifyTargetColumn.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(specifyTargetColumn.fulfilled, (state, action) => {
      state.status = "succeeded";
      const { datasetId, taskType, targetColumnName } = action.payload;
      
      // Find and update just the target columns for this dataset
      const dataset = state.datasets.find(d => d.id === datasetId);
      if (dataset) {
        dataset.taskType = taskType;
        dataset.targetColumnName = targetColumnName;
        
        // Also update the columns metadata if it exists
        if (dataset.columnsMetadata) {
          dataset.columnsMetadata = dataset.columnsMetadata.map(col => ({
            ...col,
            isTarget: col.name === targetColumnName
          }));
        }
      }
    })
    .addCase(specifyTargetColumn.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload as string;
    })



    .addCase(fetchDatasetIdByProjectId.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(fetchDatasetIdByProjectId.fulfilled, (state, action: PayloadAction<string>) => {
      // Store the ID - we'll use it to fetch the full dataset
      if (state.datasets.length > 0) {
        state.datasets[0].id = action.payload;
      } else {
        state.datasets.push({
          id: action.payload,
          name: "",
          description: "",
          projectId: "",
          status: "",
          file: "",
          format: "",
          size: 0,
          rows: null,
          cols: null,
          createdAt: "",
          updatedAt: ""
        });
      }
    })
    
    // Fetch Dataset by ID
    .addCase(fetchDatasetById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(fetchDatasetById.fulfilled, (state, action: PayloadAction<Dataset>) => {
      state.status = "succeeded";
      if (state.datasets.length > 0) {
        // Replace existing dataset
        state.datasets[0] = action.payload;
      } else {
        // Add new dataset
        state.datasets.push(action.payload);
      }
      state.hasLocalFile = true;
    })

    // Add this to your extraReducers in datasetSlice.ts
.addCase(fetchEDAByDatasetId.pending, (state) => {
  state.status = "loading";
  state.error = null;
})
.addCase(fetchEDAByDatasetId.fulfilled, (state, action: PayloadAction<Dataset>) => {
  state.status = "succeeded";
  // You might want to store the EDA report in your state
  // Here I'm assuming you want to attach it to the dataset
  console.log("fetch eda sucess",action.payload)
  console.log("state for eda",state.datasets )
  // use action.payload.EDAFileViz

  const dataset = state.datasets;
  console.log("dataset in eda", dataset)

  state.datasets[0].edaReport = action.payload.EDAFileViz;
  console.log("what fetch eda sends in state",state.datasets[0].edaReport)
  
})
.addCase(fetchEDAByDatasetId.rejected, (state, action) => {
  state.status = "failed";
  state.error = action.payload as string;
});
  }
});

export default datasetSlice.reducer;
export const { setLocalFile, clearLocalFile,setDeleted } = datasetSlice.actions;