"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AiOutlineDashboard, AiOutlineLogout } from 'react-icons/ai';
import { GoSidebarCollapse } from 'react-icons/go';
import { FaChevronDown } from "react-icons/fa";
import {
  MdOutlineQuiz,
  MdSubject,
  MdOutlineAssignmentTurnedIn,
  MdManageAccounts,
  MdWork
} from "react-icons/md";
import { BsPatchQuestion } from "react-icons/bs";
import { RiStackLine } from "react-icons/ri";
import { FaUserPlus } from "react-icons/fa";

import { AuthContext } from '../provider/AuthProvider';
import { DataContext } from '../provider/DataProvider';
import { motion } from "framer-motion";

const Sidebar = () => {
  const { loginData, logout } = useContext(AuthContext);
  const { isCollapsed, setIsCollapsed } = useContext(DataContext);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const dropdownRouteMap = {
    2: ["/addSubject", "/addQuestion", "/insertQuestion", "/addSet", "/setEntry", "/addExam", "/addCandidate"],
    3: ["/participantsList"]
  };

  useEffect(() => {
    let open = null;
    Object.entries(dropdownRouteMap).forEach(([id, paths]) => {
      if (paths.some(p => pathname.startsWith(p))) open = Number(id);
    });
    setActiveDropdown(open);
  }, [pathname]);

  const toggleDropdown = (id) => {
    if (isCollapsed) return;
    setActiveDropdown(prev => (prev === id ? null : id));
  };

  const getLinkClasses = (href) => {
    const isActive =
      pathname.startsWith(href) ||
      (href === "/addQuestion" && pathname.startsWith("/insertQuestion")) ||
      (href === "/addSet" && pathname.startsWith("/setEntry"));

    return `
      flex items-center gap-2 text-sm px-2 py-1 rounded-none transition-all duration-200
      ${isActive
        ? "bg-blue-100 text-blue-700 font-medium"
        : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"}
    `;
  };

  if (!mounted) return null;

  return (
    <div
      className={`h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col sticky top-0
      transition-all duration-300 ${isCollapsed ? "w-16" : "w-52"}`}
    >

      {/* Header */}
      <div className="hidden lg:flex items-center justify-between h-14 px-3 bg-white border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/homepage">
            <Image
              src="/images/FashionTex-Logo.png"
              alt="Logo"
              width={150}
              height={40}
              priority
            />
          </Link>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? (
            <Image src="/images/Thread.png" alt="Toggle" width={120} height={40} />
          ) : (
            <GoSidebarCollapse className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pt-3">
        <nav className={`${isCollapsed ? "flex flex-col items-center" : ""}`}>

          {/* Dashboard */}
          <Link
            href="/homepage"
            className={`
              flex items-center gap-3 px-4 py-2 rounded-none transition-all
              hover:bg-blue-50 text-gray-700
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <AiOutlineDashboard className="w-5 h-5" />
            {!isCollapsed && <span className="text-[1rem] font-medium">Dashboard</span>}
          </Link>

          {/* MANAGEMENT */}
          {loginData?.UserRole !== "Client" && (
            <div className="mt-3">
              <button
                onClick={() => toggleDropdown(2)}
                className={`
                  flex items-center justify-between w-full px-4 py-2 rounded-none 
                  hover:bg-blue-50 text-gray-700 transition-all
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <div className="flex items-center gap-3">
                  <MdManageAccounts className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">Management</span>}
                </div>

                {!isCollapsed && (
                  <FaChevronDown
                    className={`text-xs transition-all duration-300 
                      ${activeDropdown === 2 ? "rotate-180" : "rotate-0"}`}
                  />
                )}
              </button>

              {/* Dropdown Animated */}
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: activeDropdown === 2 ? "auto" : 0,
                    opacity: activeDropdown === 2 ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 ml-7.5 border-l-2 border-gray-200  space-y-1.5">
                    {[
                      { href: "/addSubject", label: "Position List", icon: <MdWork /> },
                      { href: "/addQuestion", label: "Question Bank", icon: <BsPatchQuestion /> },
                      { href: "/addSet", label: "Set List", icon: <RiStackLine /> },
                      { href: "/addExam", label: "Exam List", icon: <MdOutlineQuiz /> },
                      { href: "/addCandidate", label: "Candidate List", icon: <FaUserPlus /> },
                    ].map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={getLinkClasses(item.href)}
                      >
                        <span className="text-blue-500 ">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* RESULT */}
          {loginData?.UserRole !== "Client" && (
            <div className="mt-3">
              <button
                onClick={() => toggleDropdown(3)}
                className={`
                  flex items-center justify-between w-full px-4 py-2 rounded-none 
                  hover:bg-blue-50 text-gray-700 transition-all
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <div className="flex items-center gap-3">
                  <MdOutlineAssignmentTurnedIn className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">Result</span>}
                </div>

                {!isCollapsed && (
                  <FaChevronDown
                    className={`text-xs transition-all duration-300 
                      ${activeDropdown === 3 ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: activeDropdown === 3 ? "auto" : 0,
                    opacity: activeDropdown === 3 ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="ml-8 mt-1 border-l-2 border-gray-200 ">
                    <Link
                      href="/participantsList"
                      className={getLinkClasses("/participantsList")}
                    >
                      <span className="text-green-600"><MdSubject /></span>
                      Participate List
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          )}

        </nav>
      </div>

      {/* Logout */}
      <div className="border-t hover:bg-red-100 transition-all hover:text-red-800 border-gray-200 py-1 px-2">
        <button
          onClick={logout}
          className={`flex items-center w-full gap-3 px-4 py-2 rounded-md
            text-gray-700 
            ${isCollapsed ? "justify-center" : ""}`}
        >
          <AiOutlineLogout className="w-5 h-5" />
          {!isCollapsed && "Log Out"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
