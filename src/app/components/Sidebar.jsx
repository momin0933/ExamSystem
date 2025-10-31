"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AiOutlineDashboard, AiOutlineLogout } from 'react-icons/ai';
import { GoSidebarCollapse } from 'react-icons/go';
import { FaChevronDown } from "react-icons/fa";
import { MdOutlineQuiz, MdSubject, MdOutlineAssignmentTurnedIn, MdManageAccounts,MdWork  } from "react-icons/md";
import { BsPatchQuestion } from "react-icons/bs";
import { RiStackLine } from "react-icons/ri";
import { FaUserPlus } from "react-icons/fa";

import { AuthContext } from '../provider/AuthProvider';
import { DataContext } from '../provider/DataProvider';

const Sidebar = () => {
  const { loginData, logout } = useContext(AuthContext);
  const { isCollapsed, setIsCollapsed } = useContext(DataContext);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Map dropdown IDs to their route paths
  const dropdownRouteMap = {
    2: ["/addSubject", "/addQuestion", "/addSet", "/addExam", "/addCandidate"], // Management
    3: ["/participantsList"], // Result
  };

  const toggleDropdown = (index) => {
    if (!isCollapsed) setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto open dropdowns based on current pathname
  useEffect(() => {
    let matchedDropdown = null;
    Object.entries(dropdownRouteMap).forEach(([dropdownId, paths]) => {
      if (paths.some(path => pathname.startsWith(path))) {
        matchedDropdown = Number(dropdownId);
      }
    });
    setActiveDropdown(matchedDropdown);
  }, [pathname]);

  if (!isMounted) return null;

  // Highlight active link
  // const getLinkClasses = (href, baseClasses = "") => {
  //   const isActive = pathname.startsWith(href);
  //   return `${baseClasses} ${
  //     isActive
  //       ? "bg-gray-50/25 text-[#1cefff] font-medium"
  //       : "text-gray-100 hover:text-[#1cefff] hover:bg-gray-50/25"
  //   } px-2 py-1 rounded transition-colors duration-200`;
  // };

const getLinkClasses = (href, baseClasses = "") => {
  const isActive = pathname.startsWith(href);
  return `${baseClasses} ${
    isActive
      ? "bg-blue-100 text-blue-700 font-medium"
      : "text-black hover:text-blue-800 hover:bg-blue-50"
  } px-2 py-1 rounded transition-colors duration-200`;
};



  return (
    <div className={`min-h-screen font-roboto bg-white-900 z-50 flex flex-col sticky top-0 ${isCollapsed ? "w-16" : "w-44 lg:w-56"} transition-all duration-300 ease-in-out`}>
      
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between h-14 bg-white p-3">
        {!isCollapsed && (
          <Link href="/homepage">
            <Image
              src="/images/FashionTex-Logo.png"
              alt="FashionTex Logo"
              width={190}
              height={34}
              priority
            />
          </Link>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-300 focus:outline-none">
          {isCollapsed
            ? <Image src="/images/Thread.png" alt="FashionTex Logo" width={190} height={35} priority />
            : <GoSidebarCollapse className="text-gray-300 hidden hover:text-orange-500 transition ease-in-out" size={24} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 mt-4 space-y-2 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
        
        {/* Dashboard */}
        <Link
          href="/homepage"
          prefetch={true}
          // className={`flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition ${isCollapsed ? "justify-center" : ""}`}
          className={`flex items-center gap-3 px-4 py-2 rounded-none  hover:bg-blue-50 transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
        >
          <AiOutlineDashboard className="w-5 h-5" />
          {!isCollapsed && <span className="text-[1rem] font-medium text-gray-700">Dashboard</span>}
        </Link>

        {/* Management Dropdown */}
        {loginData?.UserRole !== "Client" && (
          <div className="mb-3">
            <button
              onClick={() => toggleDropdown(2)}
              className={`flex items-center justify-between w-full px-4 py-2 rounded-none  hover:bg-blue-50 transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
            >
              <div className="flex items-center gap-3">
                <MdManageAccounts className="w-5 h-5 text-gray-700" />
                {!isCollapsed && <span className="text-[1rem] font-medium text-gray-700">Management</span>}
              </div>
              {!isCollapsed && (
                <FaChevronDown className={`text-sm text-gray-500 duration-600 transition-transform ${activeDropdown === 2 ? "rotate-180" : ""}`} />
              )}
            </button>

            {!isCollapsed && activeDropdown === 2 && (
              <div className="ml-8 mt-2  space-y-1.5 border-l-2  border-gray-200 ">
                {[
                  { href: "/addSubject", label: "Position List", icon: <MdWork  /> },
                  { href: "/addQuestion", label: "Question Bank", icon: <BsPatchQuestion /> },
                  { href: "/addSet", label: "Set List", icon: <RiStackLine /> },
                  { href: "/addExam", label: "Exam List", icon: <MdOutlineQuiz /> },
                  { href: "/addCandidate", label: "Candidate List", icon: <FaUserPlus /> },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={getLinkClasses(item.href, "flex items-center rounded-none gap-2 text-sm")}
                  >
                    <span className="text-blue-400 w-4 h-4">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Result Dropdown */}
        {loginData?.UserRole !== "Client" && (
          <div className="mb-3">
            <button
              onClick={() => toggleDropdown(3)}
              // className={`flex items-center justify-between w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-white shadow hover:shadow-md transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
              className={`flex items-center justify-between w-full px-4 py-2 rounded-none  hover:bg-blue-50 transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
            >
              <div className="flex items-center gap-3">
                <MdOutlineAssignmentTurnedIn className="w-5 h-5 text-gray-700" />
                {!isCollapsed && <span className="text-[1rem] font-medium text-gray-700">Result</span>}
              </div>
              {!isCollapsed && (
                <FaChevronDown className={`text-sm text-gray-500 duration-600 transition-transform ${activeDropdown === 3 ? "rotate-180" : ""}`} />
              )}
            </button>

            {!isCollapsed && activeDropdown === 3 && (
              <div className="ml-8 mt-2 space-y-3 border-l-2 border-green-100 ">
                {[{ href: "/participantsList", label: "Participate List", icon: <MdSubject /> }].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={getLinkClasses(item.href, "flex items-center gap-2 text-sm")}
                  >
                    <span className="w-4 h-4 text-green-400">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto mb-6">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-gray-700 hover:bg-red-100 hover:text-red-600 transition ${isCollapsed ? "justify-center" : ""}`}
        >
          <AiOutlineLogout className="w-5 h-5" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
