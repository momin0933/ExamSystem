import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "../provider/AuthProvider";
import DataProvider from "../provider/DataProvider";
import Navbar from "../components/Navbar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <title>Fashion Tex - Exam</title>
        {/* <link rel="shortcut icon" href="/favicon.ico" type="image/png" /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-800`}
      >
        <AuthProvider>
          <DataProvider>
            <div className="flex min-h-screen">
              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {/* Navbar */}
                <header className="sticky top-0 z-40 bg-white shadow-sm rounded-none">
                  <Navbar />
                </header>

                {/* Page Content */}
                {/* <main className="flex-1 bg-gray-100 p-6 md:p-10 min-h-[calc(100vh-80px)]">
                  {children}
                </main> */}
                {/* <main className="flex-1 bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-50 p-6 md:p-10 min-h-[calc(100vh-80px)]">
                  {children}
                </main> */}
                {/* 
                <main className="flex-1 bg-gradient-to-br from-purple-100 via-purple-200 to-purple-50 p-6 md:p-10 min-h-[calc(100vh-80px)]">
                  {children}
                </main> */}
                <main className="flex-1 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 p-6 md:p-10 min-h-[calc(100vh-80px)] rounded-none">
                  {children}
                </main>


              </div>
            </div>
          </DataProvider>
        </AuthProvider>
        {/* Toast Notifications */}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
