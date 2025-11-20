"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { AiOutlineDashboard, AiOutlineLogout } from "react-icons/ai";
import { GoSidebarCollapse } from "react-icons/go";
import {
  MdManageAccounts,
  MdWork,
  MdOutlineQuiz,
  MdOutlineAssignmentTurnedIn,
  MdSubject,
} from "react-icons/md";
import { BsPatchQuestion } from "react-icons/bs";
import { RiStackLine } from "react-icons/ri";
import { FaUserPlus } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";

import { AuthContext } from "../provider/AuthProvider";
import { DataContext } from "../provider/DataProvider";

export default function Sidebar() {
  const { loginData, logout } = useContext(AuthContext);
  const { isCollapsed, setIsCollapsed } = useContext(DataContext);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => setMounted(true), []);

  // MENU ITEMS (JSX SAFE)
  const menuItems = [
    {
      type: "link",
      href: "/homepage",
      label: "Dashboard",
      icon: AiOutlineDashboard,
    },
    {
      type: "dropdown",
      label: "Management",
      icon: MdManageAccounts,
      children: [
        { href: "/addSubject", label: "Position List", icon: MdWork },
        { href: "/addQuestion", label: "Question Bank", icon: BsPatchQuestion },
        { href: "/addSet", label: "Set List", icon: RiStackLine },
        { href: "/addExam", label: "Exam List", icon: MdOutlineQuiz },
        { href: "/addCandidate", label: "Candidate List", icon: FaUserPlus },
      ],
      show: loginData?.UserRole !== "Client",
    },
    {
      type: "dropdown",
      label: "Result",
      icon: MdOutlineAssignmentTurnedIn,
      children: [
        {
          href: "/participantsList",
          label: "Participate List",
          icon: MdSubject,
        },
      ],
      show: loginData?.UserRole !== "Client",
    },
  ];

  // DETECT ACTIVE DROPDOWN
  useEffect(() => {
    menuItems.forEach((item, index) => {
      if (item.type === "dropdown") {
        const match = item.children.some((child) =>
          pathname.startsWith(child.href)
        );
        if (match) setActiveDropdown(index);
      }
    });
  }, [pathname]);

  // ACTIVE LINK STYLE
  const getLinkClasses = (href) => {
    const isActive =
      pathname.startsWith(href) ||
      (href === "/addQuestion" && pathname.startsWith("/insertQuestion")) ||
      (href === "/addSet" && pathname.startsWith("/setEntry"));

    return `
      flex items-center gap-2 text-sm px-2 py-1 rounded-none transition-all duration-200
      ${isActive
        ? "bg-blue-100 text-blue-700 font-medium"
        : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
      }
    `;
  };
  const isParentActive = (children) => {
    return children.some((child) => pathname.startsWith(child.href));
  };
  if (!mounted) return null;

  return (
    <div
      className={`h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col sticky top-0 transition-all duration-300 ${isCollapsed ? "w-16" : "w-52"
        }`}
    >
      {/* HEADER */}
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
            <Image
              src="/images/Thread.png"
              alt="Toggle"
              width={120}
              height={40}
            />
          ) : (
            <GoSidebarCollapse className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto pt-3">
        <nav className={`${isCollapsed ? "flex flex-col items-center" : ""}`}>
          {menuItems.map((item, index) => {
            // SIMPLE LINK
            if (item.type === "link") {
              const isActiveLink = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-none transition-all ${isCollapsed ? "justify-center" : ""
                    } ${isActiveLink
                      ? "bg-[#4775a0] text-gray-50 font-semibold"
                      : "hover:bg-blue-50 text-gray-700"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span className="text-[1rem] font-medium">{item.label}</span>}
                </Link>
              );
            }
            // DROPDOWN
            if (item.type === "dropdown" && item.show) {
              const isOpen = activeDropdown === index;

              return (
                <div key={index} className="mt-3">
                  <button
                    onClick={() =>
                      !isCollapsed && setActiveDropdown(isOpen ? null : index)
                    }
                    className={`flex items-center justify-between w-full px-4 py-2 rounded-none transition-all
    ${isCollapsed ? "justify-center" : ""}
    ${isParentActive(item.children)
                        ? "bg-[#4775a0] text-gray-50 font-semibold"
                        : "hover:bg-blue-50 text-gray-700"
                      }
  `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <FaChevronDown
                        className={`text-xs transition-all duration-300 ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </button>
                  {/* DROPDOWN ITEMS */}
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-7.5 border-l-2 border-gray-200 space-y-1.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={getLinkClasses(child.href)}
                          >
                            <span className="text-blue-500">
                              <child.icon />
                            </span>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>
      </div>

      {/* LOGOUT */}
      <div className="border-t border-gray-200 hover:bg-red-100 transition-all hover:text-red-800 py-1 px-2">
        <button
          onClick={logout}
          className={`flex items-center w-full gap-3 px-4 py-2 rounded-md text-gray-700 ${isCollapsed ? "justify-center" : ""
            }`}
        >
          <AiOutlineLogout className="w-5 h-5" />
          {!isCollapsed && "Log Out"}
        </button>
      </div>
    </div>
  );
}
