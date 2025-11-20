'use client';
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../provider/AuthProvider";
import config from "@/config";
import { FiUser, FiLock } from "react-icons/fi";

const Login = () => {
  const [credentials, setCredentials] = useState({ UserId: "", password: "" });
  const { login, loading, error } = useContext(AuthContext);
  const [isClient, setIsClient] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(credentials, config.tenantId);
  };
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl bg-white shadow-2xl rounded-sm overflow-hidden">

        {/* Left Section - Modern Image with Overlay */}
        <div className="relative w-full lg:w-1/2 min-h-[300px]">
          <Image
            src="/images/exam.png"
            alt="Exam Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-center text-white px-4">
            <Image
              src="/images/FashionTex-Logo.png"
              alt="Fashion Tex Logo"
              width={230}
              height={55}
              priority
            />
            <h3 className="mt-6 text-2xl font-bold drop-shadow-lg">
              Welcome to the Exam Portal
            </h3>
            <p className="mt-2 text-sm text-gray-200">
              Focus, Perform, and Achieve your best!
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <h2 className="text-3xl text-gray-800 font-bold text-center mb-6">
            Welcome Back
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* User ID */}
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                id="UserId"
                name="UserId"
                type="text"
                placeholder="User ID"
                className="w-full pl-10 pr-4 py-3 rounded-sm border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-sm"
                value={credentials.UserId}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-sm border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-sm"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="checkbox checkbox-sm" />
                Remember Me
              </label>
              <a href="#" className="text-blue-500 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Error Message */}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-sm text-white font-semibold shadow-sm transition-all duration-300 transform ${loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 "
                }`}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-6">
            &copy; 2025 Fashion Tex. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
