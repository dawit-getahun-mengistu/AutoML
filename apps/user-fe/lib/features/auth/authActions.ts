import {  isRejectedWithValue } from "@reduxjs/toolkit";
import  {createAppAsyncThunk } from "@/lib/hooks";
import { AxiosRequestConfig, AxiosResponse } from "axios";
const axios = require("axios").default;
const backendURL = "http://localhost:3001"

//this is unecessary destructuring can be typed right there 
// interface userParams{
//   email:string,
//   password:string,
//   username:string,
// }
class signupDto{
  constructor(
    public id:string,
    public email:string,
    public username:string,
    // public createdAt:string,
  ){}
  
  static fromJson(json:any):signupDto{
    return new signupDto(json.id,json.email,json.username);
  }
}
export const signup = createAppAsyncThunk(
    "auth/signup",
    async function authsignup({email,password,username}:{email:string;password:string;username:string},{rejectWithValue}):Promise<signupDto|unknown>{
        try {
            const config:AxiosRequestConfig = {
              headers: {
                'Content-Type': 'application/json',
              },
            }
            const response:AxiosResponse = await axios.post( 
              `${backendURL}/api/user/register`,
              {email,password,username},
              config
            )
            return signupDto.fromJson(response.data); //TODO: handle case happens when mapping from json to signupDto doesnʻt match ..
          }catch(error){
          //TODO: return rejectWithValue(error.response.data);
           
          }
})
//TODO:login
//TODO:refresh
//TODO:logout
