import  {createAppAsyncThunk, useAppSelector,} from "@/lib/hooks";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { userInfo } from "./authSlice";
const axios = require("axios").default;
const backendURL = "http://localhost:3001"
const config:AxiosRequestConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
}

export const signup = createAppAsyncThunk<{ id: string; email: string; username: string },{email:string;password:string;username:string}>(
    "auth/signup",
    async function authsignup({email,password,username},{rejectWithValue}){
        try {
            const response:AxiosResponse = await axios.post( 
              `${backendURL}/auth/signup`,
              {email,password,username},
              config
            )
            //TODO:type guarding before returning to ensure api returns the type we envisioned
            return{
              id:response.data.id,
              email:response.data.email,
              username:response.data.username,
            }
          }catch(error:unknown){
            if(axios.isAxiosError(error)){
              const axiosError = error as AxiosError<{message:string|string[]; error:string; statusCode: number }>;
              const errorMessage = axiosError.response?.data?.message;
              if (Array.isArray(errorMessage)) {
                return rejectWithValue(errorMessage.join(", "));
              }
              return rejectWithValue(errorMessage|| "signup failed");
            }
            return rejectWithValue("An unknown error occured")
           
          }
})
export const login = createAppAsyncThunk<
  {access_token:string;refresh_token:string},
  { email: string; password: string; username: string } 
>(
  "auth/login",
  async function authLogin({ email, password, username }, { rejectWithValue }) {
    try {
      const response: AxiosResponse = await axios.post(
        `${backendURL}/auth/signin`,
        { email, password, username },
        config
      );
      //TODO:type guarding before returning to ensure api returns the type we envisioned
      return{
        access_token:response.data.access_token,
        refresh_token:response.data.refresh_token,
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string ; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        return rejectWithValue(errorMessage || "Login failed");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
export const logout = createAppAsyncThunk<
  void, 
  void 
>(
  "auth/logout",
  async function authLogout(_, { rejectWithValue, getState }) {
    try {
      const {access_token} = useAppSelector((state)=>state.auth);
      const accessToken = access_token || localStorage.getItem("access_token");

      if (!accessToken) {
        return rejectWithValue("No access token found.");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      await axios.post(`${backendURL}/auth/logout`, {}, config);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      return;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        return rejectWithValue(axiosError.response?.data?.message || "Logout failed");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

//TODO:refresh

