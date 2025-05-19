"use client";
import React, { useEffect, useState } from "react";
import PasswordInput from "../components/PasswordInput";
import TextInput from "../components/TextInput";
import AuthLayout from "../layouts/authentication/layout";
import GoogleButton from "../components/GoogleButton";
import Button from "../components/Button";
import Link from "next/link";
import { login, signup } from "@/lib/features/auth/authActions";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {status,error,access_token,userInfo} = useAppSelector((state)=>state.auth);
  const [form,setForm] = useState({
    email:"",
    username:"",
    password:"",
  });
  useEffect(() => {
    if (access_token) {
      console.log("use effect on signup page Access token detected! Redirecting...");
      router.push("/dashboard");
    }
  }, [access_token, router]);
  
  useEffect(() => {
    if(userInfo){
         localStorage.setItem("userInfo", JSON.stringify(userInfo));
    }
  }, [userInfo]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    const signupResult = await dispatch(signup(form));
    if (signup.fulfilled.match(signupResult)) {
      //redirect to login upon signup success
          await dispatch(login({ email: form.email, password: form.password, username: form.username }));

    }
  };
  return (
    <AuthLayout 
      imgSrc="/signup.svg"
      imgAlt="Signup"
      header="Hello"
      subtitle="Please create your account"
    >
      <form  onSubmit ={handleSubmit} action="" className="w-full">
        <TextInput name = "email" placeholder="Email" value = {form.email} onChange = {handleChange} className="rounded-xl my-6" />
        <TextInput name = "username" value ={form.username} placeholder="User name" className="my-6" onChange={handleChange}/>
        <PasswordInput name = "password" value ={form.password} onChange = {handleChange} className="my-6" />
        {typeof error ==="string" && <p className="text-red-500">{error as string}</p>}
        <div className="flex items-center mt-12 mb-6">
          <span className="border-t w-full"></span>
          <span className="w-full text-sm md:text-base text-center">
            Or Signup with
          </span>
          <span className="border-t w-full"></span>
        </div>
        <GoogleButton className="mb-14" />
        <Button isDisabled = {status === "loading"} loading ={status === "loading"} text="Signup" />
      </form>
      <p className="flex text-sm md:text-base items-center justify-center mt-4">
        Already have an account?{" "}
        <Link
          href={"/login"}
          className="text-sm md:text-base text-primary ml-1"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
