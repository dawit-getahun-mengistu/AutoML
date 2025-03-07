"use client";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { access_token } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!access_token) {
      router.push("/login");
    } else {
      setIsLoading(false); 
    }
  }, [access_token, router]);

  if (isLoading) return null; 

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 text-center">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome! You are successfully logged in.</p>
    </div>
  );
}
