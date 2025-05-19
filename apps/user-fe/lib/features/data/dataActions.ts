// src/lib/features/dataset/datasetActions.ts
import { createAppAsyncThunk } from "@/lib/hooks";
import axios from "axios";
import { Dataset } from "./datasetSlice";

const backendURL = "http://localhost:3001";
export const createDataset = createAppAsyncThunk<
  Dataset,
  { 
    name: string;
    description: string;
    projectId: string;
    format: string;
    file: File;
  }
>(
  "datasets",
  async ({ name, description, projectId, format, file }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("projectId", projectId);
      formData.append("format", format);
      formData.append("file", file);

      const response = await axios.post(
        `${backendURL}/datasets`,
        formData,
        config
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        return rejectWithValue(
          Array.isArray(errorMessage) 
            ? errorMessage.join(", ") 
            : errorMessage || "Dataset creation failed"
        );
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
//TODO:PATCH
//TODO:DELETE