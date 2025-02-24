import React from "react";

interface Props {
  text: string;
}

export default function Button({ text }: Props) {
  return (
    <button className="w-full font-bold text-lg rounded-xl flex items-center h-14 justify-center border my-2 bg-primary text-white">
      {text}
    </button>
  );
}
