"use client";
import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import config from "@/config";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [loginData, setLoginData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const savedLoginData = localStorage.getItem("loginData");
    if (savedLoginData) {
      setLoginData(JSON.parse(savedLoginData));
    }
  }, []);
  const login = async (credentials, tenantId) => {
    setLoading(true);
    setError("");
    if (!credentials.UserId || !credentials.password || !tenantId) {
      setError("User ID, Password, and Tenant ID are required");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${config.API_BASE_URL}api/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          TenantId: tenantId,
        },
        body: JSON.stringify({
          UserId: credentials.UserId,
          password: credentials.password,
        }),
      });
      if (!response.ok) throw new Error("Invalid login credentials");
      const data = await response.json()
      const { accessToken: token, userData } = data;
      // Update the loginData state
      const updatedLoginData = { ...userData, tenantId, token };
      setLoginData(updatedLoginData);
      // Save login data to local storage
      localStorage.setItem("loginData", JSON.stringify(updatedLoginData));
      // Set auth token in cookies
      //document.cookie = `authToken=${token}; Path=/; Secure; SameSite=Strict`;
      document.cookie = `authToken=${token}; Path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      // Navigate to the homepage
      // router.push("/homepage");

      // Conditional navigation based on UserRole
      if (userData.UserRole?.trim() === "Participate") {
        router.push("/participate"); // Navigate to Participate page
      } else {
        router.push("/homepage"); // Admins or others
      }
    } catch (err) {
      setError(err.message || "Invalid credentials, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoginData(null);
    localStorage.removeItem("loginData");
    document.cookie = "authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };
  const data = {
    loginData,
    login,
    logout,
    loading,
    error
  };
  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};
