"use client";

import React, { useState } from "react";
import "./PasswordInput.module.css";
//@ts-ignore
import { UilEye, UilEyeSlash } from "@iconscout/react-unicons";

interface Props {
  id?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  className,
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  const handleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div
      className={`flex w-full items-center justify-center border rounded-xl h-14 px-4 my-2 ${
        className && className
      }`}
    >
      <input
        type={isVisible ? "text" : "password"}
        id={id}
        value={value}
        onChange={onChange}
        autoComplete="on"
        placeholder="Password"
        className="w-full text-justify bg-transparent focus-within:outline-none focus-within:border-none"
      />
      <button type="button" onClick={handleVisibility}>
        {isVisible ? (
          <UilEye className="size-6 p-0 m-0 fill-neutral-600" />
        ) : (
          <UilEyeSlash className="size-6 p-0 m-0 fill-neutral-600" />
        )}
      </button>
    </div>
  );
}
