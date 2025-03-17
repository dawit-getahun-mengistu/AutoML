import  {createAppAsyncThunk} from "@/lib/hooks";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { Project } from "./projectSlice";
const axios = require("axios").default;
const backendURL = "http://localhost:3001"
const config:AxiosRequestConfig = {
  headers: {
    'Content-Type': 'application/json',
    // TODO:FIXX Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,

    // Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }
}
export const createProject= createAppAsyncThunk<
  {id:string;name:string;description:string;status:string;userId:string;createdAt:string},
  { name: string; description: string; status: string;userId:string }
>(
  "project",
  async function createProject({ name,description,status,userId}, { rejectWithValue }) {
    try {
      const response: AxiosResponse = await axios.post(
        `${backendURL}/project`,
        { name,description,status,userId },
        config
      );
      //TODO:type guarding before returning to ensure api returns the type we envisioned
      return{
        id:response.data.id,
        name:response.data.name,
        description:response.data.description,
        status:response.data.status,
        userId:response.data.userId,
        createdAt:response.data.createdAt,
      }
    } catch (error: unknown) {
        //TODO: custom user handling for better user experience
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string|string[]; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
            return rejectWithValue(errorMessage.join(", "));
          }
        return rejectWithValue(errorMessage || "create project failed");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchProjects = createAppAsyncThunk< 
Project[]>(
  "project/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const response: AxiosResponse = await axios.get(
        `${backendURL}/project`,
         config
      );
      // Assuming response.data is an array of projects
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string|string[]; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
          return rejectWithValue(errorMessage.join(", "));
        }
        return rejectWithValue(errorMessage || "Failed to fetch projects");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

//TODO:UPDATE
//TODO:DELETE
