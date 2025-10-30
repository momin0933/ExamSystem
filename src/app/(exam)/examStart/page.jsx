"use client";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from '../../provider/AuthProvider';
import config from "@/config";
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ExamStartPage() {
    const { loginData } = useContext(AuthContext);
    const router = useRouter();

    /** States */
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [participateId, setParticipateId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [hasLooped, setHasLooped] = useState(false);
    const [passCount, setPassCount] = useState(1);

    /** Modal states */
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    /** Format seconds → HH:mm:ss */
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    /** Fetch question paper from API */
    const fetchQuestionPaper = async () => {
        if (!loginData?.tenantId || !loginData?.UserAutoId) {
            toast.error("User info missing, please login again.");
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: { TenantId: loginData.tenantId, "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_GetQuestionPaperByParticipate",
                    parameters: { QueryChecker: 1, ParticipateId: loginData.UserAutoId },
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch question paper");
            const data = await response.json();

            // Format questions with options
            const formatted = Array.isArray(data)
                ? data.reduce((acc, item) => {
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
                    if (item.QnType === "MCQ" && item.Option) question.options.push(item.Option);
                    if (item.QnType === "MCQ" && item.Answer === true) question.correctOption = item.Option;
                    return acc;
                }, [])
                : [];
            setQuestions(formatted);
            setCurrentIndex(0);

            // Initialize timer if available
            if (formatted.length > 0 && formatted[0].examTime) {
                const [hours, minutes, seconds] = formatted[0].examTime.split(":").map(Number);
                setTimeLeft(hours * 3600 + minutes * 60 + seconds);
            }

        } catch (err) {
            console.error(err);
            toast.error("Failed to load question paper");
        } finally {
            setLoading(false);
        }
    };

    /** Load participateId from localStorage */
    useEffect(() => {
        const id = localStorage.getItem("participateId");
        if (id) setParticipateId(Number(id));
        else {
            toast.error("Participate ID not found, please restart exam.");
            router.push("/participate");
        }
    }, []);

    /** Fetch questions after loginData available */
    useEffect(() => { fetchQuestionPaper(); }, [loginData]);

    /** Timer countdown effect */
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            toast.error("⏰ Time’s up! Auto-submitting your exam...");
            handleSubmitExam();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    /** Handle answer selection */
    const handleAnswerChange = (value) => {
        const currentQuestion = questions[currentIndex];
        setAnswers(prev => ({ ...prev, [currentQuestion.questionId]: value }));
    };

    /** Navigate to previous question */
    const goPrevious = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

    /** Navigate to next question */
    const goNext = () => {
        const question = questions[currentIndex];
        if (!answers[question.questionId] || answers[question.questionId] === "NA") {
            alert("Please answer the question before moving to next.");
            return;
        }
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
        else { // Last question → start next pass
            setHasLooped(true);
            setPassCount(prev => prev + 1);
            setCurrentIndex(0);
        }
    };

    /** Skip current question */
    const skipQuestion = () => {
        const question = questions[currentIndex];
        if (!answers[question.questionId]) setAnswers(prev => ({ ...prev, [question.questionId]: "NA" }));
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
        else { // Last question → start next pass
            setHasLooped(true);
            setPassCount(prev => prev + 1);
            setCurrentIndex(0);
        }
    };

    /** Submit exam answers */
    const handleSubmitExam = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            if (!participateId) throw new Error("Participate ID is missing!");
            if (!questions || questions.length === 0) throw new Error("No questions found!");

            const payload = questions.map((q) => {
                const ansValue = answers[q.questionId] ?? "NA";
                let ansMark = (q.qnType === "MCQ" && ansValue !== "NA" && ansValue === q.correctOption) ? q.mark || 0 : 0;
                return {
                    ParticipateId: participateId,
                    QnId: q.questionId,
                    Answer: ansValue,
                    QnMark: q.mark || 0,
                    AnsMark: ansMark,
                    Remarks: null,
                    EntryBy: loginData?.UserId,
                    EntryDate: new Date().toISOString(),
                    IsActive: true,
                };
            });

            const response = await fetch(`${config.API_BASE_URL}api/Participate/AddParticipateAns`, {
                method: "POST",
                headers: { "Content-Type": "application/json", TenantId: loginData?.tenantId },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to submit exam answers");
            }

            // Show success modal and auto-logout
            setShowSuccessModal(true);
            setTimeout(() => {
                localStorage.removeItem("loginData");
                localStorage.removeItem("participateId");
                router.push("/");
            }, 3000);

        } catch (err) {
            console.error(err);
            toast.error(err.message || "Error submitting exam answers.");
        } finally {
            setLoading(false);
        }
    };

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto px-6 py-4 bg-white shadow-md rounded-lg">
            {/* Header with timer */}
            <div className="relative flex justify-center items-center mb-6 px-6 py-4 bg-white">
                <div className="flex flex-col items-center text-center">
                    <img src="/images/FashionTex-Logo.png" alt="Logo" className="w-24 h-20 object-contain drop-shadow-md" />
                    <h1 className="text-2xl font-extrabold text-gray-800 tracking-wide mt-2">Fashion Tex Group Of Company</h1>
                    <h2 className="text-lg font-medium text-gray-600 mt-1">
                        <span className="text-indigo-700 font-semibold">{questions[0]?.examName || ""}</span>
                    </h2>
                </div>
                {timeLeft !== null && (
                    <div className="absolute top-0 right-0 mt-4 mr-6 bg-white border border-red-200 px-4 py-2 rounded-xl shadow-sm">
                        <p className="font-bold text-red-600 tracking-wider">⏰ <span className="text-red-700">{formatTime(timeLeft)}</span></p>
                    </div>
                )}
            </div>

            {loading ? (
                <p className="text-center text-gray-500 text-lg">Loading questions...</p>
            ) : currentQuestion ? (
                <>
                    {/* Question */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3
                                className="text-xl font-semibold text-gray-800 select-none"
                                onContextMenu={(e) => e.preventDefault()}  // disable right-click
                                onDragStart={(e) => e.preventDefault()}    // disable drag
                                onMouseDown={(e) => e.preventDefault()}    // disable text selection
                            >
                                {currentQuestion.question}
                            </h3>
                            <p className="text-sm text-gray-500">Mark: <span className="font-medium">{currentQuestion.mark}</span></p>
                        </div>
                        {currentQuestion.sketch && <img src={currentQuestion.sketch} alt={`Sketch ${currentIndex + 1}`} className="w-64 h-48 object-contain border rounded shadow-sm mb-3" />}
                    </div>

                    {/* Answer input */}
                    {currentQuestion.qnType === "MCQ" ? (
                        <div className="mb-4 space-y-2">
                            {currentQuestion.options.map((opt, idx) => (
                                <label key={idx} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="radio" name={`q${currentQuestion.questionId}`} value={opt} checked={answers[currentQuestion.questionId] === opt} onChange={() => handleAnswerChange(opt)} className="w-5 h-5 accent-blue-500" />
                                    <span className="text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <textarea rows={5} className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700" value={answers[currentQuestion.questionId] || ""} onChange={(e) => handleAnswerChange(e.target.value)} placeholder="Type your answer here..." />
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-6">
                        <button onClick={goPrevious} disabled={currentIndex === 0 && passCount === 1} className={`px-5 py-2 rounded-lg border ${currentIndex === 0 && passCount === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>Previous</button>

                        <h2 className="text-gray-600 text-sm mb-1">Question {currentIndex + 1} of {questions.length}</h2>

                        <div className="flex gap-2">
                            <button onClick={skipQuestion} className="px-5 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium">Skip</button>
                            <button onClick={goNext} className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium">Next</button>
                            {(passCount > 1 || (passCount === 1 && currentIndex === questions.length - 1)) && (
                                <button onClick={() => setShowConfirmSubmit(true)} className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium">Submit</button>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-500 text-lg">No questions available.</p>
            )}

            {/* Confirm Submit Modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Confirm Submission</h3>
                        <p className="mb-6">Are you sure you want to submit your answers?</p>
                        <div className="flex justify-around">
                            <button onClick={() => setShowConfirmSubmit(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={() => { setShowConfirmSubmit(false); handleSubmitExam(); }} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Yes, Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
               <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-lg">
                        <img src="/images/FashionTex-Logo.png" alt="Logo" className="w-24 h-20 mx-auto mb-4 object-contain" />
                        <h3 className="text-xl font-bold mb-2">Fashion Tex Ltd</h3>
                        <p className="text-gray-700">Thank you for completing the recruitment exam.</p>
                        <p className="text-gray-500 mt-3">You will be logged out shortly...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
