'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [inputData, setInputData] = useState({email: "", password: "", username: ""});
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [loading, setLoading] = useState(false);
  const handleChange = (event) => {
    setInputData({ ...inputData, [event.target.id]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setPopupMessage("");
    setPopupType("success");

    try {
      const response = await fetch("http://localhost:3001/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();

      if (!data) {
        setPopupMessage(data.message);
        setPopupType("error");
      } else {
        setPopupMessage(data.message);
        setPopupType("success");
        router.push("/dashboard")
      }
    } catch (error) {
      setPopupMessage("An error occurred. Please try again.");
      setPopupType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
  <div className="grid grid-cols-2 bg-white shadow-lg rounded-2xl p-8 w-[600px]">
    {/* Left Column - Image */}
    <div className="flex justify-center items-center border-r pr-4">
      <span className="text-lg font-bold">Image</span>
    </div>

    {/* Right Column - Login Form */}
    <div className="pl-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold">Hello</h2>
        <p className="text-gray-500">Please create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          id="email"
          type="email"
          placeholder="Email Address"
          value={inputData.email}
          onChange={handleChange}
          required
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
        <input
        id="username"
          type="text"
          placeholder="Username"
          value={inputData.username}
          onChange={handleChange}
          required
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
        <input
        id="password"
          type="password"
          placeholder="Password"
          value={inputData.password}
          onChange={handleChange}
          required
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-gray-950 text-white rounded-lg py-2 w-full">
          Sign Up
        </button>
        <p className="text-center text-gray-500 text-sm"> Already have an account?{" "} 
          <a href="/login" className="text-gray-900 font-semibold">Login</a>
          </p>
      </form>
    </div>
  </div>
</div>

  );
}
