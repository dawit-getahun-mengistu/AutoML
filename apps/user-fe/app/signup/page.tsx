import React from "react";
import PasswordInput from "../components/PasswordInput";
import TextInput from "../components/TextInput";
import AuthLayout from "../layouts/authentication/layout";
import GoogleButton from "../components/GoogleButton";
import Button from "../components/Button";
import Link from "next/link";

export default function Signup() {
  return (
    <AuthLayout
      imgSrc="/signup.svg"
      imgAlt="Signup"
      header="Hello"
      subtitle="Please create your account."
    >
      <form action="" className="w-full">
        <TextInput placeholder="Email" className="rounded-xl my-6" />
        <TextInput placeholder="User name" className="my-6" />
        <PasswordInput className="my-6" />
        <div className="flex items-center mt-12 mb-6">
          <span className="border-t w-full"></span>
          <span className="w-full text-sm md:text-base text-center">
            Or Signup with
          </span>
          <span className="border-t w-full"></span>
        </div>
        <GoogleButton className="mb-14" />
        <Button text="Signup" />
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
