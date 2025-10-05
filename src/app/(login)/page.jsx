'use client';
import Image from "next/image";
import { useContext, useState } from "react";
import { AuthContext } from "../provider/AuthProvider";
import config from "@/config";
const Login = () => {
  const [credentials, setCredentials] = useState({ UserId: "", password: "" });
  const [tenantId, setTenantId] = useState("");
  const { login, loading, error } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleTenantChange = (e) => {
    setTenantId(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(credentials, config.tenantId);
  };

  return (
    <div className="min-h-screen bg-gray-500 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-4xl bg-white shadow-lg rounded-md overflow-hidden">
        
        {/* Left Section - Full Background Image */}
        <div className="relative w-full lg:w-1/2 min-h-[250px] lg:min-h-[300px] bg-cover bg-center" style={{ backgroundImage: "url('/images/exam.png')" }}>
          {/* Logo Image (Absolute Centered) */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2">
            <Image
              src="/images/FashionTex-Logo.png"
              alt="Fashion Tex Logo"
              width={230}
              height={55}
              priority
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full lg:w-1/2 p-4 lg:p-6 bg-white">
          <h2 className="text-xl text-gray-700 font-semibold text-center mb-3">
            Login
          </h2>
          <form onSubmit={handleSubmit}> 
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text text-gray-700  text-sm">User ID</span>
              </label>
              <input
                id="UserId"
                name="UserId"
                type="text"
                placeholder="UserId"
                className="peer w-full rounded-md border border-gray-300 bg-gray-50 px-4 pt-5 pb-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                value={credentials.UserId}
                onChange={handleChange}
                required
              />
            </div>
            {/* Password Field */}
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text text-gray-700 text-sm">Password</span>
              </label>
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="peer w-full rounded-md border border-gray-300 bg-gray-50 px-4 pt-5 pb-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
            {/* Remember Me and Forgot Password */}
            <div className="form-control flex flex-row justify-between items-center mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="checkbox checkbox-sm" />
                Remember Me
              </label>
              <a href="#" className="text-sm text-red-500 hover:underline">
                Forgot password?
              </a>
            </div>
            {/* Display error message if any */}
            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            {/* Submit Button */}
            <div className="form-control">
              <button
                className={`w-full bg-gray-800 rounded-md px-4 py-2 text-white font-medium shadow-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;