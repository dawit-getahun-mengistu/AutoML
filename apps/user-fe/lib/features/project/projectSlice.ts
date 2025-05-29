import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createProject, fetchProjects, patchProject,deleteProject } from "./projectActions"; // Import your createProject thunk
import { AxiosError } from "axios";

// Define the shape of a Project
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: null|string|unknown|string[]
}

// For now, we won't persist projects to localStorage; we'll initialize it empty.
const initialState: ProjectState = {
  projects: [],
  status: "idle",
  error: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
   
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.status = "succeeded";
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      }) 
      // Fetch projects handlers
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.status = "succeeded";
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;

      }).addCase(patchProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(patchProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.status = "succeeded";
        state.projects = state.projects.map(project => 
          project.id === action.payload.id ? action.payload : project
        );
      })
      .addCase(patchProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        
      }).addCase(deleteProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.status = "succeeded";
      state.projects = state.projects.filter(project => project.id !== action.payload.id);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        
      })
      
  },
});

export default projectSlice.reducer;
