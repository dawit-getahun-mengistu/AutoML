import {createSlice, PayloadAction } from "@reduxjs/toolkit";
import { signup } from "./authActions";
interface userInfo{
    id:String,
    username:String,
    email:String
  }
interface authState{
    userInfo:userInfo | null,
    access_token:string|null,
    refresh_token:string|null,
    status: "unauthenticated"|"loading"|"authenticated"|"failed"
    error:null|string
}
const initialState: authState={
    userInfo:null,
    access_token:null,
    refresh_token:null,
    status: "unauthenticated",
    error:null,
}
export const authSlice= createSlice({
    name:"auth",
    initialState,
    reducers:{},
    extraReducers(builder) {
        //TODO: reducers for signup, login, refresh, logout
    },

})
export default authSlice.reducer