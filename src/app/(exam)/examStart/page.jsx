"use client";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from '../../provider/AuthProvider';
import config from "@/config";
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ExamStartPage() {
    // Context and hooks
    const { loginData } = useContext(AuthContext);
    const router = useRouter();

    // State declarations grouped by purpose
    // Exam data states
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [participateId, setParticipateId] = useState(null);
    const [departmentContactData, setDepartmentContactData] = useState([]);
    
    // UI and navigation states
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loopCount, setLoopCount] = useState(0);
    const [highlightedQuestions, setHighlightedQuestions] = useState([]);
    
    // Modal states
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Constants
    const questionsPerPage = 3;
    
    // Computed values
    const startIndex = currentPage * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestions = questions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(questions.length / questionsPerPage);

    /**
     * Format seconds to HH:mm:ss
     */
    const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return "00:00:00";
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    /**
     * Handle answer selection for a question
     */
    const handleAnswerChange = (value, questionId) => {
        setAnswers(prev => ({ 
            ...prev, 
            [questionId]: value 
        }));
    };

    /**
     * Navigate to next page after validating all questions are answered
     */
    const handleNextPage = () => {
        // Find unanswered questions on current page
        const unanswered = currentQuestions.filter(q => !answers[q.questionId]);

        if (unanswered.length > 0) {
            // Highlight unanswered questions temporarily
            setHighlightedQuestions(unanswered.map(q => q.questionId));
            setTimeout(() => setHighlightedQuestions([]), 1000);
            return;
        }
        const nextPage = (currentPage + 1) % totalPages;
        // Track loop completion for submit button visibility
        if (nextPage === 0) {
            setLoopCount(prev => prev + 1);
        }
        setCurrentPage(nextPage);
    };

    /**
     * Skip to next page without answering all questions
     */
    const handleSkipPage = () => {
        const nextPage = (currentPage + 1) % totalPages;
        
        if (nextPage === 0) {
            setLoopCount(prev => prev + 1);
        }

        setCurrentPage(nextPage);
    };

    /**
     * Fetch question paper from API
     */
    const fetchQuestionPaper = async () => {
        if (!loginData?.tenantId || !loginData?.UserAutoId) {
            toast.error("User info missing, please login again.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: { 
                    TenantId: loginData.tenantId, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_GetQuestionPaperByParticipate",
                    parameters: { 
                        QueryChecker: 1, 
                        ParticipateId: loginData.UserAutoId 
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Format questions with options
            const formatted = Array.isArray(data) ? data.reduce((acc, item) => {
                let question = acc.find(q => q.questionId === item.QuestionId);
                if (!question) {
                    question = {
                        questionId: item.QuestionId,
                        question: item.Question,
                        qnType: item.QnType,
                        mark: item.Mark,
                        sketch: item.Sketch,
                        examName: item.ExamName,
                        examTime: item.ExamTime,
                        options: [],
                        correctOption: null,
                    };
                    acc.push(question);
                }
                
                // Safe option handling
                if (item.QnType === "MCQ" && item.Option) {
                    question.options.push(item.Option);
                }
                if (item.QnType === "MCQ" && item.Answer === true) {
                    question.correctOption = item.Option;
                }
                return acc;
            }, []) : [];

            setQuestions(formatted);

            // Initialize timer if exam time available
            if (formatted.length > 0 && formatted[0]?.examTime) {
                try {
                    const [hours, minutes, seconds] = formatted[0].examTime.split(":").map(Number);
                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                    setTimeLeft(totalSeconds);
                } catch (timeError) {
                    console.error("Error parsing exam time:", timeError);
                    toast.error("Invalid exam time format");
                }
            }

        } catch (err) {
            console.error("Failed to fetch question paper:", err);
            toast.error("Failed to load question paper");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch department contact information
     */
    const fetchDepartmentContractInfo = async () => {
        if (!loginData?.tenantId) return;

        try {
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: { 
                    TenantId: loginData.tenantId, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_GetQuestionPaperByParticipate',
                    parameters: { QueryChecker: 2 },
                }),
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            setDepartmentContactData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load department data:', err);
            toast.error('Failed to load Department data');
        }
    };

    /**
     * Submit exam answers to API
     */
    const handleSubmitExam = async (e) => {
        e?.preventDefault();
        setLoading(true);

        try {
            // Validation checks
            if (!participateId) {
                throw new Error("Participate ID is missing!");
            }
            
            if (!questions || questions.length === 0) {
                throw new Error("No questions found!");
            }

            if (!loginData?.tenantId || !loginData?.UserId) {
                throw new Error("User authentication data missing!");
            }

            // Prepare payload with safe defaults
            const payload = questions.map((q) => {
                const ansValue = answers[q.questionId] ?? "NA";
                let ansMark = 0;
                
                // Calculate marks only for answered MCQ questions
                if (q.qnType === "MCQ" && ansValue !== "NA" && ansValue === q.correctOption) {
                    ansMark = q.mark || 0;
                }
                
                return {
                    ParticipateId: participateId,
                    QnId: q.questionId,
                    Answer: ansValue,
                    QnMark: q.mark || 0,
                    AnsMark: ansMark,
                    Remarks: null,
                    EntryBy: loginData.UserId,
                    EntryDate: new Date().toISOString(),
                    IsActive: true,
                };
            });

            const response = await fetch(`${config.API_BASE_URL}api/Participate/AddParticipateAns`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    TenantId: loginData.tenantId 
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to submit exam answers");
            }

            // Show success and redirect
            setShowSuccessModal(true);
            setTimeout(() => {
                // Clear storage and redirect
                localStorage.removeItem("loginData");
                localStorage.removeItem("participateId");
                router.push("/");
            }, 3000);

        } catch (err) {
            console.error("Exam submission error:", err);
            toast.error(err.message || "Error submitting exam answers.");
        } finally {
            setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        // Load participateId from localStorage
        const id = localStorage.getItem("participateId");
        if (id) {
            setParticipateId(Number(id));
        } else {
            toast.error("Participate ID not found, please restart exam.");
            router.push("/participate");
        }
    }, []);

    useEffect(() => {
        // Fetch data when tenantId is available
        if (!loginData?.tenantId) return;
        
        fetchQuestionPaper();
        fetchDepartmentContractInfo();
    }, [loginData?.tenantId]);

    useEffect(() => {
        // Timer countdown effect
        if (timeLeft === null) return;
        
        if (timeLeft <= 0) {
            toast.error("⏰ Time's up! Auto-submitting your exam...");
            handleSubmitExam();
            return;
        }
        
        const timer = setInterval(() => {
            setTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timeLeft]);

    return (
        <div className="max-w-3xl mx-auto px-6 py-4 bg-white shadow-md rounded-sm">
            {/* Header with timer and logo */}
            <div className="relative flex flex-col items-center mb-3 px-4 sm:px-6 md:px-8 py-4 bg-white">
                {/* Timer display */}
                {timeLeft !== null && (
                    <div className="absolute top-4 right-4 sm:top-4 sm:right-6 md:top-4 md:right-8 bg-white border border-red-200 px-3 sm:px-4 py-1 sm:py-2 rounded-sm shadow-sm">
                        <p className="font-bold text-red-600 tracking-wider text-sm sm:text-base">
                            ⏰ <span className="text-red-700">{formatTime(timeLeft)}</span>
                        </p>
                    </div>
                )}

                {/* Company logo and name */}
                <img
                    src="/images/FashionTex-Logo.png"
                    alt="Logo"
                    className="w-28 h-12 sm:w-32 sm:h-12 md:w-40 md:h-12 xl:w-44 xl:h-12 object-contain drop-shadow-md mb-2"
                />
                <h1 className="text-lg sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold text-gray-800 tracking-wide text-center mb-1">
                    Fashion Tex Group Of Company
                </h1>
                <p className="text-lg text-gray-800 font-medium text-center">
                    Exam Name: <span className="text-indigo-700 font-semibold">
                        {questions[0]?.examName || "N/A"}
                    </span>
                </p>
            </div>

            {/* Questions and navigation */}
            {loading ? (
                <p className="text-center text-gray-500 text-lg">Loading questions...</p>
            ) : currentQuestions.length > 0 ? (
                <>
                    {/* Current page questions */}
                    {currentQuestions.map((q, idx) => {
                        const questionNumber = currentPage * questionsPerPage + idx + 1;
                        const isHighlighted = highlightedQuestions.includes(q.questionId);

                        return (
                            <div
                                key={q.questionId}
                                className={`mb-6 p-3 rounded-sm  transition-all duration-500 ${
                                    isHighlighted
                                        ? 'bg-red-100 border border-red-400'
                                        : 'bg-white border border-gray-300'
                                }`}
                            >
                                {/* Question header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                    <h3
                                        // className="text-xl sm:text-xl font-normal text-gray-800 select-none break-words sm:pr-4"
                                        className="text-md sm:text-md font-normal text-gray-800 select-none break-words sm:pr-4"
                                        onContextMenu={(e) => e.preventDefault()}
                                        onDragStart={(e) => e.preventDefault()}
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        {questionNumber}. {q.question}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 sm:mt-0 flex-shrink-0">
                                        Mark: <span className="font-medium">{q.mark}</span>
                                    </p>
                                </div>

                                {/* Question sketch if available */}
                                {q.sketch && (
                                    <img
                                        src={q.sketch}
                                        alt={`Sketch for question ${questionNumber}`}
                                        className="w-64 h-48 object-contain border rounded-sm shadow-sm mb-3"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}

                                {/* Answer input - MCQ or textarea */}
                                {q.qnType === "MCQ" ? (
                                    <div className="mb-1 space-y-1">
                                        {q.options.map((opt, i) => (
                                            <label
                                                key={i}
                                                className="flex items-center gap-1 p-1  hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q${q.questionId}`}
                                                    value={opt}
                                                    checked={answers[q.questionId] === opt}
                                                    onChange={() => handleAnswerChange(opt, q.questionId)}
                                                    className="w-4 h-4 accent-blue-500"
                                                />
                                                <span className="text-gray-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        rows={5}
                                        className="w-full p-3 border border-gray-200 rounded-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700"
                                        value={answers[q.questionId] || ""}
                                        onChange={(e) => handleAnswerChange(e.target.value, q.questionId)}
                                        placeholder="Type your answer here..."
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Navigation controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center w-full mt-6 gap-3">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                            disabled={currentPage === 0}
                            className={`px-4 py-2 rounded-sm border w-full sm:w-auto ${
                                currentPage === 0
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                            Previous
                        </button>

                        <h2 className="text-gray-600 text-sm mb-1 w-full text-center sm:w-auto sm:text-base">
                            Page {currentPage + 1} of {totalPages}
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleSkipPage}
                                className="px-4 py-2 rounded-sm bg-gray-500 hover:bg-gray-600 text-white font-medium w-full sm:w-auto"
                            >
                                Skip
                            </button>

                            <button
                                onClick={handleNextPage}
                                className="px-4 py-2 rounded-sm bg-blue-500 hover:bg-blue-600 text-white font-medium w-full sm:w-auto"
                            >
                                Next
                            </button>

                            {/* Show submit button after completing at least one loop or on last page */}
                            {(loopCount > 0 || currentPage === totalPages - 1) && (
                                <button
                                    onClick={() => setShowConfirmSubmit(true)}
                                    className="px-4 py-2 rounded-sm bg-green-500 hover:bg-green-600 text-white font-medium w-full sm:w-auto"
                                >
                                    Submit
                                </button>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                // No questions available message
                <p className="text-center text-gray-500 text-lg mb-6">
                    {departmentContactData[0]?.ChildName || 
                     "This exam session is closed. Please verify the exam schedule or contact the admin if needed."}
                </p>
            )}

            {/* Confirmation Modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-sm p-6   max-w-2xl text-center shadow-lg">
                        
                        <h3 className="text-xl font-semibold mb-4">Confirm Submission</h3>
                        <p className="mb-6">Are you sure you want to submit your answers?</p>
                        <div className="flex justify-around">
                            <button 
                                onClick={() => setShowConfirmSubmit(false)} 
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { 
                                    setShowConfirmSubmit(false); 
                                    handleSubmitExam(); 
                                }} 
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Yes, Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-lg">
                        <img 
                            src="/images/FashionTex-Logo.png" 
                            alt="Logo" 
                            className="w-24 h-20 mx-auto mb-4 object-contain" 
                        />
                        <h3 className="text-xl font-bold mb-2">Fashion Tex Ltd</h3>
                        <p className="text-gray-700">Thank you for completing the recruitment exam.</p>
                        <p className="text-gray-500 mt-3">You will be logged out shortly...</p>
                    </div>
                </div>
            )}
        </div>
    );
}