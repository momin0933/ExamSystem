"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../provider/AuthProvider";
import config from "@/config";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  HiOutlineClipboardList, 
  HiOutlineUserGroup, 
  HiOutlineQuestionMarkCircle, 
  HiOutlineUsers, 
  HiHome,
  HiOutlineClock 
} from "react-icons/hi";

export default function Homepage() {
  const { loginData } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState({
    totalExams: 0,
    totalCandidates: 0,
    totalQuestions: 0,
    totalParticipants: 0,
    activeExams: 0, // Added activeExams
  });

  const [animatedCounts, setAnimatedCounts] = useState({
    totalExams: 0,
    totalCandidates: 0,
    totalQuestions: 0,
    totalParticipants: 0,
    activeExams: 0, // Added activeExams
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loginData?.tenantId) fetchDashboardData();
  }, [loginData?.tenantId]);

  const animateCount = (start, end, duration, setter, key) => {
    const startTime = performance.now();
    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(start + (end - start) * easeOut);
      setter((prev) => ({ ...prev, [key]: currentValue }));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const startCountAnimations = (newData) => {
    const duration = 1000;
    setAnimatedCounts({
      totalExams: 0,
      totalCandidates: 0,
      totalQuestions: 0,
      totalParticipants: 0,
      activeExams: 0, // Reset activeExams to 0
    });

    setTimeout(() => {
      animateCount(0, newData.totalExams, duration, setAnimatedCounts, "totalExams");
      animateCount(0, newData.totalCandidates, duration, setAnimatedCounts, "totalCandidates");
      animateCount(0, newData.totalQuestions, duration, setAnimatedCounts, "totalQuestions");
      animateCount(0, newData.totalParticipants, duration, setAnimatedCounts, "totalParticipants");
      animateCount(0, newData.activeExams, duration, setAnimatedCounts, "activeExams"); // Added activeExams animation
    }, 100);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
        method: "POST",
        headers: {
          TenantId: loginData.tenantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "",
          procedureName: "SP_Dashboard",
          parameters: { QueryChecker: 1 },
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const newData = {
          totalExams: data[0].TotalExams || 0,
          totalCandidates: data[0].TotalCandidates || 0,
          totalQuestions: data[0].TotalQuestions || 0,
          totalParticipants: data[0].TotalParticipants || 0,
          activeExams: data[0].ActiveExams || 0, // Added ActiveExams from SP
        };
        setDashboardData(newData);
        startCountAnimations(newData);
      } else {
        toast.error("Invalid dashboard data format");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const DashboardCard = ({ title, animatedCount, color, icon, subtitle }) => (
    <div
      className={`bg-white rounded-sm shadow-md p-6 border-l-4 ${color} hover:shadow-lg transition-shadow duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="text-2xl font-bold text-gray-800 mt-2">
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            ) : (
              // Safe check for animatedCount
              (animatedCount || 0).toLocaleString()
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace("border-", "bg-").replace("-500", "-100")}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="font-roboto p-6">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {/* <p className="text-gray-600 mt-1">Welcome to your Exam Management System</p> */}
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
           <HiHome className="w-5 h-5 mb-1 text-[#4775a0]" />
          <Link href="/homepage" className="font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span className="text-gray-400">{'>'}</span>
          <span className="font-semibold text-gray-900">Dashboard</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Exams"
          animatedCount={animatedCounts.totalExams}
          color="border-blue-500"
          icon={<HiOutlineClipboardList className="w-6 h-6 text-blue-500" />}
        />

        <DashboardCard
          title="Total Candidates"
          animatedCount={animatedCounts.totalCandidates}
          color="border-green-500"
          icon={<HiOutlineUserGroup className="w-6 h-6 text-green-500" />}
        />

        <DashboardCard
          title="Total Questions"
          animatedCount={animatedCounts.totalQuestions}
          color="border-purple-500"
          icon={<HiOutlineQuestionMarkCircle className="w-6 h-6 text-purple-500" />}
        />

        <DashboardCard
          title="Total Participants"
          animatedCount={animatedCounts.totalParticipants}
          color="border-orange-500"
          icon={<HiOutlineUsers className="w-6 h-6 text-orange-500" />}
        />

        {/* Active Exams Card - Now with proper data */}
        <DashboardCard
          title="Running Exams"
          animatedCount={animatedCounts.activeExams}
          color="border-teal-500"
          icon={<HiOutlineClock className="w-6 h-6 text-teal-500" />}
        />
      </div>
    </div>
  );
}