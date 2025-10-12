"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function ExamLandingPage() {
  const router = useRouter();

  const handleStartExam = () => {
    router.push("/examStart");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Exam Instructions</h1>
        <ul className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Duration:</strong> 60 minutes (make sure to finish on time).</li>
          <li><strong>Questions:</strong> 20 questions, including multiple-choice and descriptive.</li>
          <li><strong>Navigation:</strong> Use Next/Previous buttons to move between questions.</li>
          <li><strong>Time Management:</strong> Keep track of the timer; exam auto-submits when time ends.</li>
          <li><strong>Answering:</strong> Select options or type answers carefully; review before submitting.</li>
          <li><strong>No External Help:</strong> Do not use books, notes, or online sources unless allowed.</li>
          <li><strong>Submission:</strong> Click "Submit Exam" to finish; answers cannot be changed after submission.</li>
          <li><strong>Technical Issues:</strong> Notify the administrator immediately; do not refresh the page.</li>
          <li><strong>Integrity:</strong> Cheating is strictly prohibited and may lead to disqualification.</li>
          <li><strong>Good Luck!</strong> Read all questions carefully and do your best.</li>
        </ul>
        <div className="mt-6 text-center">
          <button
            onClick={handleStartExam}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
