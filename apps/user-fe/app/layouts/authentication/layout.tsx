import React from "react";
import Image from "next/image";

interface Props {
  imgSrc: string;
  imgAlt: string;
  children: React.ReactNode;
  header: string;
  subtitle: string;
}

export default function AuthLayout({
  imgSrc,
  imgAlt,
  children,
  header,
  subtitle,
}: Props) {
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 gap-4">
      <div className="hidden lg:flex items-center justify-center w-0 lg:w-1/2 h-full p-32">
        <Image
          className="w-0 lg:w-auto"
          src={imgSrc}
          alt={imgAlt}
          width={0}
          height={0}
        />
      </div>
      <div className="w-full lg:w-1/2 p-8 md:p-24 lg:p-32 h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center mb-12">
          <p className="text-4xl font-bold">{header}</p>
          <p className="text-lg font-normal">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
