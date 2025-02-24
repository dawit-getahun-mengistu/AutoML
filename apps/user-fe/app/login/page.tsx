import React from "react";
import PasswordInput from "../components/PasswordInput";
import TextInput from "../components/TextInput";
import AuthLayout from "../layouts/authentication/layout";
import GoogleButton from "../components/GoogleButton";
import Button from "../components/Button";
import Link from "next/link";

export default function Login() {
  return (
    <AuthLayout
      imgSrc="/login.svg"
      imgAlt="Login"
      header="Welcome"
      subtitle="Please login to your account."
    >
      <form action="" className="w-full">
        <TextInput
          placeholder="Email or User name"
          className="rounded-xl my-6"
        />
        <PasswordInput className="my-6" />
        <div className="w-full flex items-center justify-end">
          <Link href={"/#"}>Forgot password?</Link>
        </div>
        <div className="flex items-center mt-12 mb-6 text-sm md:text-base">
          <span className="border-t w-full"></span>
          <span className="w-full text-center">Or Login with</span>
          <span className="border-t w-full"></span>
        </div>
        <GoogleButton className="mb-14" />
        <Button text="Login" />
      </form>
      <p className="flex items-center justify-center mt-4 text-sm md:text-base">
        Don't have an account?{" "}
        <Link
          href={"/signup"}
          className="text-sm md:text-base text-primary ml-1"
        >
          Signup
        </Link>
      </p>
    </AuthLayout>
  );
}
