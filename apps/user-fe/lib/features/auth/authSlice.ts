import {createSlice, PayloadAction } from "@reduxjs/toolkit";
import { login, logout, signup } from "./authActions";
export interface userInfo{
    id:String,
    username:String,
    email:String
  }
interface authState{
    userInfo:userInfo | null,
    access_token:string|null ,
    refresh_token:string|null,
    status: "unauthenticated"|"loading"|"authenticated"|"failed"
    error:null|string|unknown|string[]
}
const loadState = (): authState => {
    //avoiding server side crushes
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("access_token");
      const storedRefreshToken = localStorage.getItem("refresh_token");
      return {
        userInfo: null, 
        access_token: storedToken,
        refresh_token: storedRefreshToken,
        status: storedToken ? "authenticated" : "unauthenticated",
        error: null,
      };
    }
    return {
      userInfo: null,
      access_token: null,
      refresh_token: null,
      status: "unauthenticated",
      error: null,
    };
  };
  
  const initialState: authState = loadState();
export const authSlice= createSlice({
    name:"auth",
    initialState,
    reducers:{},
    extraReducers(builder) {
        builder.addCase(signup.pending,(state,action)=>{
            state.status = "loading";
        })
        .addCase(signup.fulfilled, (state,action)=>{
            state.status = "authenticated";
            state.userInfo = action.payload;
        }).addCase(signup.rejected, (state,action)=>{
            state.status = "unauthenticated";
            state.error = action.payload;
        }).addCase(login.pending, (state,action)=>{
            state.status = "loading";
        }).addCase(login.fulfilled, (state,action)=>{
            state.status = "authenticated";
            state.access_token =action.payload.access_token;
            state.refresh_token = action.payload.refresh_token;
            localStorage.setItem("access_token", action.payload.access_token);
            localStorage.setItem("refresh_token", action.payload.refresh_token);
        }).addCase(login.rejected, (state,action)=>{
            state.status = "unauthenticated";
            state.error = action.payload;
        }).addCase(logout.pending, (state) => {
            state.status = "loading";
          })
          .addCase(logout.fulfilled, (state) => {
            state.status = "unauthenticated";
            state.access_token = null;
            state.refresh_token = null;
            state.userInfo = null;
          })
          .addCase(logout.rejected, (state, action) => {
            state.status = "failed";
            state.error = action.payload;
          });
        //TODO:REFRESH

    },

})
export default authSlice.reducer