// "use client"; 
// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation"; 
// import { useAppDispatch, useAppSelector } from "@/lib/hooks";
// import { login } from "@/lib/features/auth/authActions";
// import PasswordInput from "../components/PasswordInput";
// import TextInput from "../components/TextInput";
// import AuthLayout from "../layouts/authentication/layout";
// import GoogleButton from "../components/GoogleButton";
// import Button from "../components/Button";
// import Link from "next/link";
// import { fetchProjects } from "@/lib/features/project/projectActions";

// export default function Login() {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const { access_token, status, error, refresh_token } = useAppSelector((state) => state.auth);

//   const [form, setForm] = useState({
//     identifier: "", 
//     password: "",
//   });

//   useEffect(() => {
//     if (access_token) {
//       router.push("/dashboard"); 
//     }
//   }, [access_token, router]);
  
//   useEffect(() => {
//     console.log("use effect on login page after the login the redux access_token is", access_token);
//     if(access_token && refresh_token){
//         localStorage.setItem("access_token", access_token);
//         localStorage.setItem("refresh_token", refresh_token);
//     }
//   },[access_token,refresh_token]);


//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const isEmail = (input: string) => {
//     const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/; 
//     return emailRegex.test(input);
//   };


//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const inputIsEmail = isEmail(form.identifier);

//     await dispatch(
//       login({
//         email: inputIsEmail ? form.identifier : "", 
//         username: inputIsEmail ? "" : form.identifier, 
//         password: form.password,
//       })
//     );
//   };

//   return (
//     <AuthLayout
//       imgSrc="/login.svg"
//       imgAlt="Login"
//       header="Welcome"
//       subtitle="Please login to your account."
//     >
//       <form onSubmit={handleSubmit} className="w-full">
//         <TextInput
//           name="identifier"
//           placeholder="Email or Username"
//           value={form.identifier}
//           onChange={handleChange}
//           className="rounded-xl my-6"
//         />
//         <PasswordInput
//           name="password"
//           value={form.password}
//           onChange={handleChange}
//           className="my-6"
//         />
//         <div className="w-full flex items-center justify-end">
//           <Link href={"/#"}>Forgot password?</Link>
//         </div>
//         {typeof error === "string" && <p className="text-red-500">{error as string}</p>}

//         <div className="flex items-center mt-12 mb-6 text-sm md:text-base">
//           <span className="border-t w-full"></span>
//           <span className="w-full text-center">Or Login with</span>
//           <span className="border-t w-full"></span>
//         </div>
//         <GoogleButton className="mb-14" />
        
//         <Button isDisabled={status === "loading"} loading={status === "loading"} text="Login" />
//       </form>
//       <p className="flex items-center justify-center mt-4 text-sm md:text-base">
//         Don't have an account?{" "}
//         <Link href={"/signup"} className="text-sm md:text-base text-primary ml-1">
//           Signup
//         </Link>
//       </p>
//     </AuthLayout>
//   );
// }
"use client"
import { PlatformInfo } from "@/components/ui/platform-info"
import { AuthForm } from "@/components/ui/auth-form"

export default function Signin() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side - Platform info */}
      <PlatformInfo />

      {/* Right side - Sign in form */}
      <AuthForm
        mode="signin"
      />
    </div>
  )
}