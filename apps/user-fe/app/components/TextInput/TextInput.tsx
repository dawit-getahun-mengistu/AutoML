"use client";

import React from "react";

interface Props {
  id?: string;
  name?:string;
  value?: string;
  onChange?: (e:React.ChangeEvent<HTMLInputElement>)=>void;
  className?: string;
  placeholder?: string;
}

export default function TextInput({
  id,
  name,
  value,
  onChange,
  className,
  placeholder,
}: Props):React.JSX.Element {
  return (
    <div
      className={`flex w-full items-center justify-center border rounded-xl h-14 px-4 my-2 ${
        className && className
      }`}
    >
      <input
        type="text"
        name ={name}
        id={id}
        value={value}
        onChange={onChange}
        autoComplete="on"
        placeholder={placeholder}
        className="w-full bg-transparent focus-within:outline-none focus-within:border-none"
      />
    </div>
  );
}
