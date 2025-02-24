"use client";

import React from "react";

interface Props {
  id?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  placeholder?: string;
}

export default function TextInput({
  id,
  value,
  onChange,
  className,
  placeholder,
}: Props) {
  return (
    <div
      className={`flex w-full items-center justify-center border rounded-xl h-14 px-4 my-2 ${
        className && className
      }`}
    >
      <input
        type="text"
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
