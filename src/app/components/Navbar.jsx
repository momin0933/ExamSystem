/* eslint-disable @next/next/no-img-element */
'use client'
import { useContext, useEffect } from 'react';
import Link from "next/link";
import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { RxHamburgerMenu } from "react-icons/rx";
import { LuUserRoundPlus } from "react-icons/lu";
import dynamic from 'next/dynamic';
import { AuthContext } from '../provider/AuthProvider';
import { AiOutlineDashboard } from 'react-icons/ai';
import { FaRegCircleUser } from 'react-icons/fa6';
import { DataContext } from '../provider/DataProvider';
const Sidebar = dynamic(() => import("./Sidebar"));
export default function Navbar() {
  const { loginData, logout } = useContext(AuthContext);
  console.log(loginData)
  const { isCollapsed, setIsCollapsed } = useContext(DataContext);
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  return (
    <div className="navbar z-50 flex font-roboto justify-between p-2 shadow-lg bg-white text-gray-50">
      <div className='hidden sm:block'>
        <div
          className="btn btn-ghost btn-circle"
          onClick={toggleSidebar}
        >
          <RxHamburgerMenu className="text-2xl text-gray-700" />
        </div>
      </div>
      <div className="navbar-start block sm:hidden">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost btn-circle"
          aria-label="Menu"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          <RxHamburgerMenu className="text-2xl text-gray-700" />
        </div>

        {isNavOpen && (
          <div
            data-aos="fade-right"
            className="menu dropdown-content bg-gray-900 rounded-none z-50 mt-4 w-52 p-2 shadow absolute left-0"
            style={{ top: '3rem' }}
            onMouseLeave={() => setIsNavOpen(false)}
          >
            <Sidebar />
          </div>
        )}
      </div>

      {/* Navbar Center */}
      <div className="navbar-center"></div>

      {/* Navbar End */}
      <div className="navbar-end flex gap-2 items-center">
        <button title="Notification" className="btn btn-ghost btn-circle" aria-label="Notifications">
          <div className="indicator">
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
            <span className="badge badge-xs badge-primary indicator-item" />
          </div>
        </button>
        <div><h1 data-aos="fade-left" className='text-xs text-gray-800 lg:text-sm'>{loginData?.Name}</h1></div>
        <div>
          <div className="flex justify-between items-center mr-4">
            <div className="w-14 rounded-full cursor-pointer">
              <img
                src={
                  loginData?.ProfilePicture
                    ? `http://erp.minglefashionbd.com${loginData?.ProfilePicture.replace('~', '')}`
                    : loginData?.Gender === 'Female'
                      ? '/images/Female.png'
                      : '/images/R.jpg'
                }
                alt="Profile"
                onError={(e) =>
                  (e.target.src = loginData?.Gender === 'Female' ? '/images/Female.png' : '/images/R.jpg')}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '100%',
                  objectFit: 'cover',
                }}
                onClick={() => setDropdownOpen(!isDropdownOpen)}
              />
            </div>
          </div>
          {isDropdownOpen && (
            <ul  data-aos="flip-up"
              className="menu dropdown-content bg-base-100 rounded z-50 mt-2 w-52 p-2 shadow absolute right-2 top-full"
              style={{ top: '3rem' }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <li className="text-start text-gray-700 text-base lg:text-lg pt-1 px-4 font-medium">{loginData?.Name}</li>
              <li className="text-start text-gray-400 text-xs lg:text-sm pb-1 px-4 font-medium border-b mb-2">{loginData?.UserRole}</li>
              <li className='space-y-2'>
                {/* <Link href='/homepage'
                  className="w-full text-start text-gray-700 rounded hover:bg-[#3498db] hover:text-gray-50  flex items-center justify-start"
                >
                  <AiOutlineDashboard /> Dashboard
                </Link> */}
                <Link href='/homepage'
                  className="w-full text-start text-gray-700 rounded hover:bg-[#3498db]  hover:text-gray-50  flex items-center justify-start"
                >
                  <FaRegCircleUser />Profile
                </Link>
                {/* {loginData?.UserRole !== "Client" && (
                  <Link href='/client-registration'
                    className="w-full text-start text-gray-700 rounded hover:bg-[#3498db] hover:text-gray-50 flex items-center justify-start"
                  >
                    <LuUserRoundPlus /> Client Registration
                  </Link>
                )} */}
                <button
                  onClick={logout}
                  className="w-full text-start text-gray-700 rounded hover:bg-[#26a0da]  hover:text-gray-50 flex items-center justify-start"
                >
                  <FiLogOut /> Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}