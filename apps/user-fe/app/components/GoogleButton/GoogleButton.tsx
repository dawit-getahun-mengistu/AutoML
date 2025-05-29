import Image from "next/image";
import React from "react";

interface Props {
  className?: string;
}

export default function GoogleButton({ className }: Props) {
  return (
    <button
      className={`flex gap-6 lg:gap-10 h-14 rounded-xl items-center justify-center w-full border my-2 ${
        className && className
      }`}
    >
      <Image
        src="/google.svg"
        width={0}
        height={0}
        alt="Google"
        className="size-8 lg:size-11"
      />
      <span className="text-normal lg:text-lg font-medium">Google</span>
    </button>
  );
}
