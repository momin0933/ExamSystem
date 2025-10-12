"use client";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from '../../provider/AuthProvider';
import config from "@/config";
import toast from 'react-hot-toast';

export default function ExamStartPage() {
    const { loginData } = useContext(AuthContext);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState({}); // {questionId: answerValue}



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
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_GetQuestionPaperByParticipate",
                    parameters: {
                        QueryChecker: 1,
                        ParticipateId: loginData.UserAutoId,
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch question paper");

            const data = await response.json();
            console.log("Question Data", data)

            // Format questions
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
                            options: [],
                            examName: item.ExamName,
                        };
                        acc.push(question);
                    }
                    // Only MCQ question has options
                    if (item.QnType === "MCQ" && item.Option) {
                        question.options.push(item.Option);
                    }
                    return acc;
                }, [])
                : [];

            setQuestions(formatted);
            setCurrentIndex(0);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load question paper");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchQuestionPaper();
    }, [loginData]);
    const handleAnswerChange = (value) => {
        const currentQuestion = questions[currentIndex];
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.questionId]: value
        }));
    };

    const goPrevious = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const goNext = () => {
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handleSubmitExam = () => {
        console.log("All Answers:", answers);
        toast.success("Exam submitted!");
        // TODO: call API to save answers and evaluate MCQ
    };

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
            {currentIndex === 0 && questions.length > 0 && (
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Fashion Tex Group Of Company</h1>
                    <h2 className="text-lg font-semibold text-gray-600 mt-1">
                        Recruitment Exam: {questions[0].examName || ""}
                    </h2>
                </div>
            )}

            {loading ? (
                <p className="text-center text-gray-500 text-lg">Loading questions...</p>
            ) : currentQuestion ? (
                <>
                    {/* Question Header */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">{currentQuestion.question}</h3>
                            <p className="text-sm text-gray-500">
                                Mark: <span className="font-medium">{currentQuestion.mark}</span>
                            </p>
                        </div>
                        {currentQuestion.sketch && (
                            <div className="mb-3">
                                <img
                                    src={currentQuestion.sketch}
                                    alt={`Sketch for question ${currentIndex + 1}`}
                                    className="w-64 h-48 object-contain border rounded shadow-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Options / Answer Input */}
                    {currentQuestion.qnType === "MCQ" ? (
                        <div className="mb-4 space-y-2">
                            {currentQuestion.options.map((opt, idx) => (
                                <label key={idx} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q${currentQuestion.questionId}`}
                                        value={opt}
                                        checked={answers[currentQuestion.questionId] === opt}
                                        onChange={() => handleAnswerChange(opt)}
                                        className="w-5 h-5 accent-blue-500"
                                    />
                                    <span className="text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            rows={5}
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700"
                            value={answers[currentQuestion.questionId] || ""}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Type your answer here..."
                        />
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={goPrevious}
                            disabled={currentIndex === 0}
                            className={`px-5 py-2 rounded-lg border ${currentIndex === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                        >
                            Previous
                        </button>

                           <h2 className="text-gray-600 text-sm mb-1">
                            Question {currentIndex + 1} of {questions.length}
                        </h2>

                        {currentIndex < questions.length - 1 ? (
                            <button
                                onClick={goNext}
                                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitExam}
                                className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium"
                            >
                                Submit Exam
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-500 text-lg">No questions available.</p>
            )}
        </div>

    );
}
