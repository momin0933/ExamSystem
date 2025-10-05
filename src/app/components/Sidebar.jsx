"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AiOutlineDashboard, AiOutlineLogout } from 'react-icons/ai';
import { GoSidebarCollapse } from 'react-icons/go';
import { FaChevronDown } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";

import { AuthContext } from '../provider/AuthProvider';
import { DataContext } from '../provider/DataProvider';
import { MdOutlineQuiz, MdSubject } from "react-icons/md";
import { BsPatchQuestion } from "react-icons/bs";
import { RiStackLine } from "react-icons/ri"

const Sidebar = () => {
  const { loginData, logout } = useContext(AuthContext);
  const { isCollapsed, setIsCollapsed } = useContext(DataContext);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const toggleDropdown = (index) => {
    if (!isCollapsed) setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Active link style helper
  const getLinkClasses = (href, baseClasses = "") => {
    return `${baseClasses} ${
      pathname === href
        ? "bg-gray-50/25 text-[#1cefff]"
        : "text-gray-100 hover:text-[#1cefff] hover:bg-gray-50/25"
    }`;
  };

  return (
    <div className={`min-h-screen font-roboto bg-white-900 z-50 flex flex-col sticky top-0 ${isCollapsed ? "w-16" : "w-44 lg:w-56"} transition-all duration-300 ease-in-out`}>
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between h-16 bg-gray-700 p-4">
        {!isCollapsed && (
          <Link href="/homepage">
            <Image
              src="/images/FashionTex-Logo.png"
              alt="FashionTex Logo"
              width={190}
              height={35}
              priority
            />
          </Link>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-300 focus:outline-none">
          {isCollapsed ?
            <Image
              src="/images/Thread.png"
              alt="FashionTex Logo"
              width={190}
              height={35}
              priority
            />
            : <GoSidebarCollapse className="text-gray-300 hidden hover:text-orange-500 transition ease-in-out" size={24} />}
        </button>
      </div>

      {/* Navigation */}
      <nav
  className={`flex-1 mt-4 space-y-2 ${
    isCollapsed ? "flex flex-col items-center" : ""
  }`}
>
  {/* Dashboard */}
  <Link
    href="/homepage"
    prefetch={true}
    className={`flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition ${
      isCollapsed ? "justify-center" : ""
    }`}
  >
    <AiOutlineDashboard className="w-5 h-5" />
    {!isCollapsed && (
      <span className="text-[0.9rem] font-medium">Dashboard</span>
    )}
  </Link>

  {/* Management */}
  {loginData?.UserRole !== "Client" && (
    <div>
      <button
        onClick={() => toggleDropdown(2)}
        className={`flex items-center justify-between w-full px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <GrProjects className="w-5 h-5" />
          {!isCollapsed && (
            <span className="text-[0.9rem] font-medium">Management</span>
          )}
        </div>
        {!isCollapsed && (
          <FaChevronDown
            className={`text-xs transition-transform ${
              activeDropdown === 2 ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {!isCollapsed && activeDropdown === 2 && (
       <div className="ml-10 mt-1 space-y-1">
          <Link
            href="/addSubject"
            prefetch={true}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <MdSubject className="w-4 h-4" /> Add Subject
          </Link>
          <Link
            href="/addQuestion"
            prefetch={true}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <BsPatchQuestion className="w-4 h-4" /> Add Question
          </Link>
          <Link
            href="/addSet"
            prefetch={true}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <RiStackLine className="w-4 h-4" /> Add Set
          </Link>
          <Link
            href="/addExam"
            prefetch={true}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <MdOutlineQuiz className="w-4 h-4" /> Add Exam
          </Link>
        </div>
      )}
    </div>
  )}
</nav>

{/* Footer */}
<div className="mt-auto mb-6">
  <button
    onClick={handleLogout}
    className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-gray-700 hover:bg-red-100 hover:text-red-600 transition ${
      isCollapsed ? "justify-center" : ""
    }`}
  >
    <AiOutlineLogout className="w-5 h-5" />
    {!isCollapsed && <span>Log Out</span>}
  </button>
</div>

    </div>
  );
};

export default Sidebar;
