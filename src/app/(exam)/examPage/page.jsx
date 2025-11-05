"use client";
import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../provider/AuthProvider"; // adjust path
import toast from "react-hot-toast";
import config from "@/config";

export default function ExamLandingPage() {
  const router = useRouter();
  const { loginData } = useContext(AuthContext);
  console.log("User Login Data", loginData)

  const [examDuration, setExamDuration] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(null);
  const [totalMark, setTotalMark] = useState(null);

  const [loading, setLoading] = useState(true);

  const handleStartExam = () => {
    router.push("/examStart");
  };

  const fetchTimeAndQuestionNumber = async (userAutoId) => {
 
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
        method: "POST",
        headers: {
          TenantId: loginData?.tenantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({

          operation: "",
          procedureName: "SP_CandidateManage",
          parameters: { QueryChecker: 5, UserAccountId: userAutoId }, // pass UserAutoId here
        }),
      });
     
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch exam info");
      }
     
      const data = await response.json();
      console.log("Exam Time and Question Number", data);
    
      if (Array.isArray(data) && data.length > 0) {
        setExamDuration(data[0].ExamTime);
        setTotalMark(data[0].TotalMark);
        setTotalQuestions(data[0].TotalQn);

      }
    } catch (error) {
      console.error("fetchTimeAndQuestionNumber error:", error);
      toast.error("Failed to load exam info");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (loginData?.UserAutoId) {
      fetchTimeAndQuestionNumber(loginData.UserAutoId);
    }
  }, [loginData]);


  return (
    <div className="flex items-center justify-center p-2 min-h-screen bg-gray-50">
      <div >
        <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold mb-6 text-center text-gray-800">
          Exam Instructions
        </h1>

        <ul className="list-decimal list-inside space-y-4 text-gray-700 text-lg">
          <li>
            <span >Duration:</span>{" "}
            {loading ? (
              <span className="inline-block w-20 h-5 bg-gray-300 rounded animate-pulse"></span>
            ) : (
              <span>
                <span className="font-semibold">{examDuration} minutes</span> (make sure to finish on time)
              </span>
            )}
          </li>
          <li>
            <span >Questions:</span>{" "}
            {loading ? (
              <span className="inline-block w-10 h-5 bg-gray-300 rounded animate-pulse"></span>
            ) : (
              <span>
                <span className="font-semibold">{totalQuestions} questions</span> and <span className="font-semibold">{totalMark} Marks</span> , including multiple-choice and descriptive
              </span>
            )}
          </li>

          <li>
            <span >Navigation:</span> Use Next/Previous buttons to move between questions.
          </li>
          <li>
            <span >Time Management:</span> Keep track of the timer; exam auto-submits when time ends.
          </li>
          <li>
            <span >Answering:</span> Select options or type answers carefully; review before submitting.
          </li>
          <li>
            <span >No External Help:</span> Do not use books, notes, or online sources unless allowed.
          </li>
          <li>
            <span >Submission:</span> Click "Submit Exam" to finish; answers cannot be changed after submission.
          </li>
          <li>
            <span >Technical Issues:</span> Notify the administrator immediately; do not refresh the page.
          </li>
          <li>
            <span >Integrity:</span> Cheating is strictly prohibited and may lead to disqualification.
          </li>
          <li>
            <span >Good Luck!</span> Read all questions carefully and do your best.
          </li>
        </ul>

        <div className="mt-8 text-center">
          <button
            onClick={handleStartExam}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-sm shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
