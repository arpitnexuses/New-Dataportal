"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  type: "login" | "signup";
  isAdmin?: boolean;
  showSignup?: boolean;
  variant?: "default" | "admin";
}

export function AuthForm({
  type,
  isAdmin = false,
  showSignup = false,
  variant = "default",
}: AuthFormProps) {
  const router = useRouter();
  const [formType, setFormType] = useState<"login" | "signup">(type);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    default: {
      primary: "#1D9EE3",
      gradient: "from-[#1D9EE3] to-[#60a5fa]",
      ring: "ring-[#1D9EE3]/20",
      hover: "hover:bg-[#1D9EE3]/90",
    },
    admin: {
      primary: "#0D9488",
      gradient: "from-[#0D9488] to-[#2DD4BF]",
      ring: "ring-[#0D9488]/20",
      hover: "hover:bg-[#0D9488]/90",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isAdmin
        ? formType === "login"
          ? "/api/admin/login"
          : "/api/admin/signup"
        : "/api/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect based on user role
      console.log("Redirecting to dashboard...");
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleFormType = () => {
    setFormType(formType === "login" ? "signup" : "login");
    setError("");
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image covers the whole page */}
      <Image
        src="/Login_img.png"
        alt="Background visual"
        fill
        className="object-cover z-0"
        priority
      />

      {/* Main content containers */}
      <div className="relative z-20 flex w-full max-w-7xl min-h-[80vh] rounded-3xl overflow-hidden">
        {/* Left side - Transparent container with border */}
        <div className="w-3/5 hidden md:flex flex-col justify-between p-10 bg-transparent border-t-2 border-r-2 border-b-2 border-l-0 border-white rounded-l-3xl">
          {/* Left container is now empty as requested */}
        </div>
        {/* Right side - Form container */}
        <div className="w-full md:w-2/5 flex items-center justify-center px-12 py-10 bg-white rounded-r-3xl">
          <div className="w-full max-w-[360px] font-sans">
            {/* Heading Section */}
            <div className="flex flex-col items-center mb-10">
              <Image
                src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses_logo_blue_(2)_3_721ee160-2cac-429c-af66-f55b7233f6ed.png"
                alt="Nexuses Logo"
                width={180}
                height={45}
                className="object-contain mb-2"
                priority
              />
              <span className="text-2xl font-black text-black mb-1">Login</span>
              <span className="text-gray-500 text-base mb-2 text-center">Welcome back! Please enter your details to sign in.</span>
              <div className="w-16 h-1 bg-[#2196f3] rounded-full mb-2" />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  className="block text-sm text-gray-600 font-semibold"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1" /></svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="workmateuser@nexuses.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2196f3]/20 focus:border-[#2196f3] text-gray-700 transition-all duration-200 hover:bg-gray-100"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label
                  className="block text-sm text-gray-600 font-semibold"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 4v4" /></svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2196f3]/20 focus:border-[#2196f3] text-gray-700 transition-all duration-200 hover:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-bold text-white uppercase bg-gradient-to-r from-[#2196f3] to-[#6dd5fa] shadow-sm transition-all duration-300 hover:from-[#1e88e5] hover:to-[#42a5f5] focus:outline-none focus:ring-2 focus:ring-[#2196f3]/50 hover:shadow-md transform hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  formType === "login" ? "LOGIN" : "SIGN UP"
                )}
              </button>
            </form>

            {showSignup && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {formType === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={toggleFormType}
                    className="font-medium text-[#1D9EE3] hover:underline"
                  >
                    {formType === "login" ? "Sign up" : "Login"}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
