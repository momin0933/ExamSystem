import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "../provider/AuthProvider";
import DataProvider from "../provider/DataProvider";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <DataProvider>
            <section className="flex">
              <aside className="hidden sm:block">
                <Sidebar />
              </aside>
              <div className="flex-1">
                <header className="sticky top-0 z-50">
                  <Navbar />
                </header>
                <main className="bg-[#ECF0F4] min-h-[calc(120vh-232px)] ">
                  {children}
                </main>
                <footer>
                  <Footer />
                </footer>
              </div>
            </section>
          </DataProvider>
        </AuthProvider>
          <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}