import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { login, signup, refresh, logout } from "./authActions";
import { useAppSelector } from "@/libb/hooks";
import { userInfo } from "os";
export interface userInfo {
  id: String;
  username: String;
  email: String;
}
interface authState {
  userInfo: userInfo | null | string;
  access_token: string | null;
  refresh_token: string | null;
  status: "unauthenticated" | "loading" | "authenticated" | "failed";
  error: null | string | unknown | string[];
}
//TODO: use redux persist instead
const loadState = (): authState => {
  //avoiding server side crushes
  if (typeof window !== "undefined") {
    console.log("auth slice entering window!==undefined code block");
    const storedToken = localStorage.getItem("access_token");
    console.log("auth slice storedToken", storedToken);
    const storedRefreshToken = localStorage.getItem("refresh_token");
    console.log("auth slice  storedRefreshToken", storedRefreshToken);
    const storedUserInfo = localStorage.getItem("userInfo");
    console.log("auth slice  storedUserInfo", storedUserInfo);

    return {
      userInfo: storedUserInfo,
      access_token: storedToken,
      refresh_token: storedRefreshToken,
      status: storedToken ? "authenticated" : "unauthenticated",
      //will error be null when a state reloads is that a problem?
      error: null,
    };
  } else {
    //it looks like this else block is never entered
    console.log(
      "auth sliceentering else block where everything will be set to null and the status will be unauthenticated"
    );
    return {
      userInfo: null,
      access_token: null,
      refresh_token: null,
      status: "unauthenticated",
      error: null,
    };
  }
};

const initialState: authState = loadState();
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(signup.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.userInfo = action.payload;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload;
      })
      .addCase(login.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.userInfo = state.userInfo;
        state.access_token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload;
      })
      .addCase(refresh.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(refresh.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.access_token = action.payload.access_token;
      })
      .addCase(refresh.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload;
      })
      .addCase(logout.pending, (state) => {
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
  },
});
export default authSlice.reducer;
