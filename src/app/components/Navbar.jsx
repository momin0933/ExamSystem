/* eslint-disable @next/next/no-img-element */
'use client';
import { useContext, useState } from 'react';
import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { RxHamburgerMenu } from "react-icons/rx";
import { FaRegCircleUser } from "react-icons/fa6";
import dynamic from 'next/dynamic';
import { AuthContext } from '../provider/AuthProvider';
import { DataContext } from '../provider/DataProvider';

const Sidebar = dynamic(() => import("./Sidebar"));

export default function Navbar() {
  const { loginData, logout } = useContext(AuthContext);
  const { isCollapsed, setIsCollapsed } = useContext(DataContext);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="flex justify-between items-center px-4 py-2 lg:px-6 transition-all duration-300">

        {/* ===== Left: Sidebar Toggle ===== */}
        <div className="flex items-center gap-2">
          {/* Desktop Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition"
          >
            <RxHamburgerMenu className="text-2xl text-gray-700" />
          </button>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition"
          >
            <RxHamburgerMenu className="text-2xl text-gray-700" />
          </button>

          {/* Mobile Sidebar */}
          {isNavOpen && (
            <div
              data-aos="fade-right"
              className="absolute left-0 top-12 z-50 bg-gray-900 text-white w-60 rounded-md p-3 shadow-lg"
              onMouseLeave={() => setIsNavOpen(false)}
            >
              <Sidebar />
            </div>
          )}
        </div>

        {/* ===== Right: Profile and Actions ===== */}
        <div className="hidden sm:flex items-center gap-3 relative">
          {/* Notification Icon */}
          <button
            title="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Info + Image */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setDropdownOpen(!isDropdownOpen)}
          >
            <div className="hidden lg:block text-right">
              <p className="text-gray-800 text-sm font-medium">{loginData?.Name}</p>
              <p className="text-gray-500 text-xs">{loginData?.UserRole}</p>
            </div>

            <img
              src={
                loginData?.ProfilePicture
                  ? `http://erp.minglefashionbd.com${loginData?.ProfilePicture.replace('~', '')}`
                  : loginData?.Gender === 'Female'
                    ? '/images/Female.png'
                    : '/images/R.jpg'
              }
              alt="Profile"
              onError={(e) => {
                e.target.src = loginData?.Gender === 'Female'
                  ? '/images/Female.png'
                  : '/images/R.jpg';
              }}
              className="w-10 h-10 rounded-full border border-gray-300 object-cover hover:scale-105 transition"
            />
          </div>

          {/* ===== Dropdown Menu ===== */}
          {isDropdownOpen && (
            <ul
              data-aos="fade-up"
              className="absolute right-0 top-12 w-60 bg-white/70 backdrop-blur-lg shadow-2xl rounded-2xl border border-gray-200/50 p-3 transition-all duration-300 transform origin-top-right animate-fade-in"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              {/* Profile Link */}
              <li>
                <Link
                  href="/homepage"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <FaRegCircleUser className="text-lg" />
                  <span className="text-sm font-medium">View Profile</span>
                </Link>
              </li>

              <hr className="my-2 border-gray-200" />

              {/* Logout */}
              <li>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <FiLogOut className="text-lg" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
