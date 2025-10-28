'use client';

import { useRouter, useSearchParams } from "next/navigation";
import Select from "react-select";
import { AuthContext } from '../../provider/AuthProvider';
import config from '@/config';
import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useContext } from 'react';
import AOS from 'aos';


export default function SetEntryPage() {
    const { loginData } = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();

    const editIdFromQuery = searchParams.get("id");
    const [formData, setFormData] = useState({ name: "", remarks: "" });
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [questionData, setQuestionData] = useState([]);
    const [subjectData, setSubjectData] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [totalMark, setTotalMark] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [addMode, setAddMode] = useState("");
    const [questionCount, setQuestionCount] = useState("");

    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    // Fetch subject data on component mount
    const fetchSubjectData = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_QuestionManage",
                    parameters: { QueryChecker: 2 }
                })
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                const formatted = data.map(sub => ({
                    value: sub.Id,
                    label: sub.Name
                }));
                setSubjectData(formatted);
            } else toast.error("Invalid subject data format");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load subjects");
        }
    };

    const handleModeChange = (mode) => {
        setAddMode(mode);
        setSelectedQuestions([]);
        setTotalMark(0);
    };


    // Fetch questions by subject
    const fetchQuestionsBySubject = async (subId = null) => {
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_QuestionManage",
                    parameters: {
                        QueryChecker: 5,
                        SubId: subId || 0,
                    },
                }),
            });

            const data = await response.json();
            const questions = Array.isArray(data) ? data : [];
            console.log("Question by Subject ", questions)
            // setQuestionData(questions);
            // return questions;
            const merged = questions.map((q) => {
                const selected = selectedQuestions.find(s => s.QuestionId === q.QuestionId);
                return {
                    ...q,
                    Name: q.Name || q.QuestionName,
                    Mark: q.Mark || q.QuestionMark || 0,
                    QnType: q.QnType || "Descriptive",
                    isChecked: selected ? true : false,
                };
            });

            setQuestionData(merged);
            return merged;
        } catch (error) {
            console.error(error);
            toast.error("Failed to load questions");
            return [];
        }
    };

    // Fetch set data for editing
    const fetchSetDataForEdit = async (id) => {

        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_QuestionSetManage",
                    parameters: {
                        QueryChecker: 4,
                        Id: id,
                    },
                }),
            });

            const data = await response.json();
            console.log("Question data for edit", data)
            if (!Array.isArray(data) || data.length === 0) {
                toast.error("No data found for this question set!");
                return;
            }

            const master = data[0];
            setFormData({
                name: master.SetName,
                remarks: master.Remarks || "",
            });
            setTotalMark(master.TotalMark || 0);

            const details = data
                .filter(item => item.QuestionId !== null && item.SubjectId !== null)
                .map((item) => ({
                    QuestionId: item.QuestionId,
                    Name: item.QuestionName,
                    Mark: item.QuestionMark,
                    QnType: item.QnType,
                    SubjectId: item.SubjectId,
                    SubjectName: item.SubjectName,
                    isChecked: true,
                }));

            console.log("Question Details data for edit", data)

            setSelectedQuestions(details);
            const subjectIds = [...new Set(details.map(d => d.SubjectId))];

            if (subjectIds.length > 0) {
                const firstSubjectId = subjectIds[0];
                setSelectedSubject(firstSubjectId);
                // await fetchQuestionsBySubject(firstSubjectId);
                const questions = await fetchQuestionsBySubject(firstSubjectId);

                // Update questionData to show checkboxes properly
                const updatedQuestions = questions.map(q => ({
                    ...q,
                    isChecked: details.some(d => d.QuestionId === q.QuestionId)
                }));

                setQuestionData(updatedQuestions);
            } else {
                setQuestionData([]);
            }

        } catch (error) {
            console.error("Error fetching set:", error);
            toast.error("Failed to load question set for edit");
        }
    };


    const fetchRandomQuestions = async () => {
        if (!selectedSubject || !questionCount) {
            toast.warning("Please select a subject and enter number of questions!");
            return;
        }

        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_GetRandomQuestions",
                    parameters: {
                        SubId: selectedSubject,
                        NumberOfQuestions: parseInt(questionCount),
                    },
                }),
            });

            const data = await response.json();
            console.log("random Question", data)
            if (!Array.isArray(data) || data.length === 0) {
                toast.error("No random questions found!");
                return;
            }

            // Replace previous random questions (keep manual ones if needed)
            setSelectedQuestions(
                data.map(q => ({ ...q, isChecked: true }))
            );

            // Update total mark
            const total = data.reduce((sum, q) => sum + (Number(q.Mark) || 0), 0);
            setTotalMark(total);

            toast.success(`${data.length} random questions loaded!`);
        } catch (error) {
            console.error("Error fetching random questions:", error);
            toast.error("Failed to load random questions!");
        }
    };

    // Initialize component

    useEffect(() => {
        if (!loginData?.tenantId) return;

        fetchSubjectData();

        // Check if we're in edit mode
        if (editIdFromQuery) {
            setIsEdit(true);
            setEditId(editIdFromQuery);
            fetchSetDataForEdit(editIdFromQuery);
            setAddMode("manual");
        } else {
            resetForm();
        }
    }, [loginData, editIdFromQuery]);

    // Reset form function
    const resetForm = () => {
        setFormData({ name: '', remarks: '' });
        setSelectedQuestions([]);
        setTotalMark(0);
        setSelectedSubject('');
        setEditId(null);
        setIsEdit(false);
        setQuestionData([]);
        setShowPreview(false);
    };

    const handleCheckboxChange = (question) => {
        let updatedSelected = [...selectedQuestions];
        const isSelected = updatedSelected.some(q => q.QuestionId === question.QuestionId);

        if (isSelected) {
            updatedSelected = updatedSelected.filter(q => q.QuestionId !== question.QuestionId);
        } else {
            updatedSelected.push({
                QuestionId: question.QuestionId,
                Name: question.Name,
                Mark: question.Mark,
                QnType: question.QnType,
                SubjectId: question.SubjectId,
                SubjectName: question.SubjectName,
                Remarks: question.Remarks || ""
            });
        }

        setSelectedQuestions(updatedSelected);
        const total = updatedSelected.reduce((acc, q) => acc + (parseFloat(q.Mark) || 0), 0);
        setTotalMark(total);
    };

    const handleShowPreview = () => {
        if (selectedQuestions.length === 0) return toast.error("Please select at least one question!");
        setShowPreview(true);
    };




    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) return toast.error("Set Name required");
        if (selectedQuestions.length === 0) return toast.error("Select at least 1 question");

        try {
            // Normalize questions so manual and random questions have same keys
            const questionsJson = selectedQuestions.map(q => ({
                SubId: q.SubjectId || q.SubId,
                QnId: q.QuestionId || q.Id,
                Mark: q.Mark || 0,
                Remarks: q.Remarks || ''
            }));

            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionSetManage',
                    parameters: {
                        QueryChecker: isEdit ? 5 : 1,
                        Id: isEdit ? editId : undefined,
                        Name: formData.name,
                        Remarks: formData.remarks || '',
                        TotalMark: totalMark || 0,
                        TotalQn: selectedQuestions.length,
                        EntryBy: loginData.UserId,
                        Questions: JSON.stringify(questionsJson)
                    }
                })
            });

            if (!res.ok) throw new Error(`Save failed: ${res.status}`);

            toast.success(`Set ${isEdit ? 'updated' : 'saved'} successfully`);
            // Reset form or redirect
            router.push("/addSet");
        } catch (err) {
            console.error(err);
            toast.error('Failed to save set');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Check if a question is selected (for edit mode)
    const isQuestionSelected = (questionId) => {
        return selectedQuestions.some(q => q.QuestionId === questionId);
    };
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);


    return (
        <div className="overflow-x-auto p-3">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{isEdit ? "Edit Set" : "Add New Set"}</h2>
                    {!showPreview && (
                        <button
                            type="button"
                            onClick={handleShowPreview}
                            className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
                        >
                            Add (Preview)
                        </button>
                    )}
                </div>
                <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[68vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4 text-sm bg-white p-6 rounded-lg shadow">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* ---------------- SET NAME ---------------- */}
                                <div className="flex items-center gap-2 w-full sm:w-[23%]">
                                    <label className="w-1/3 text-sm font-semibold text-gray-700 text-nowrap">
                                        Set Name:
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-2/3 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        required
                                    />
                                </div>

                                {/* ---------------- SELECT SUBJECT ---------------- */}
                                <div className="flex items-center gap-2 w-full sm:w-[28%]">
                                    <label className="w-.8/3 text-sm font-semibold text-gray-700 text-nowrap">
                                        Subject:
                                    </label>
                                    <div className="w-2.2/3">
                                        {subjectData.length > 0 && (
                                            <Select
                                                name="filterSubject"
                                                value={subjectData.find((s) => s.value === selectedSubject) || null}
                                                onChange={(selected) => {
                                                    const subId = selected?.value || "";
                                                    setSelectedSubject(subId);
                                                    fetchQuestionsBySubject(subId);
                                                }}
                                                options={subjectData}
                                                placeholder="Search or choose..."
                                                className="text-sm"
                                                isClearable
                                                isSearchable

                                            />
                                        )}
                                    </div>
                                </div>

                                {/* ---------------- ADD MODE ---------------- */}
                                {!isEdit && (
                                    <div className="flex items-center gap-2 w-full sm:w-[25%]">
                                        <label className="w-1/3 text-sm font-semibold text-gray-700 text-nowrap">
                                            Add Mode:
                                        </label>
                                        <select
                                            value={addMode}
                                            onChange={(e) => handleModeChange(e.target.value)}
                                            className="w-2/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        >
                                            <option value="">-- Select Mode --</option>
                                            <option value="manual">Add Manual Question</option>
                                            <option value="random">Add Random Question</option>
                                        </select>
                                    </div>
                                )}
                                {/* ---------------- TOTAL MARK ---------------- */}
                                <div className="flex items-center gap-2 w-full sm:w-[20%]">
                                    <label className="w-1.5/3 text-sm font-semibold text-gray-700 text-nowrap">
                                        Total Mark:
                                    </label>
                                    <input
                                        name="mark"
                                        value={totalMark}
                                        readOnly
                                        className="w-1/3 border border-gray-200 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 focus:outline-none"
                                    />
                                </div>

                                {/* ---------------- TOTAL QUESTIONS ---------------- */}
                                <div className="flex items-center gap-2 w-full sm:w-[20%]">
                                    <label className="w-1.5/3 text-sm font-semibold text-gray-700 text-nowrap">
                                        Total Questions:
                                    </label>
                                    <input
                                        name="totalQuestions"
                                        value={selectedQuestions.length}
                                        readOnly
                                        className="w-1/3 border border-gray-200 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 focus:outline-none"
                                    />
                                </div>

                            </div>
                        </div>



                        {/* ---------------- CONDITIONAL BLOCKS ---------------- */}
                        {(addMode === "manual" || isEdit) && (
                            <>
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto mt-2">
                                    {questionData.length === 0 ? (
                                        <p className="text-gray-400 text-sm italic text-center py-3">
                                            {selectedSubject
                                                ? "No questions found for this subject."
                                                : "Please select a subject to view questions."}
                                        </p>
                                    ) : (
                                        <table className="w-full text-sm border-collapse">
                                            <thead className="bg-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="w-10 p-2 border-b text-left">Select</th>
                                                    <th className="p-2 border-b text-left">Question</th>
                                                    <th className="w-24 p-2 border-b text-left">Type</th>
                                                    <th className="w-20 p-2 border-b text-left">Mark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {questionData.map((q) => (
                                                    <tr
                                                        key={q.QuestionId}
                                                        className="hover:bg-gray-50 border-b last:border-0"
                                                    >
                                                        <td className="p-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isQuestionSelected(q.QuestionId)}
                                                                onChange={() => handleCheckboxChange(q)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-gray-700">{q.Name}</td>
                                                        <td className="p-2 text-gray-600">{q.QnType}</td>
                                                        <td className="p-2 text-gray-600">{q.Mark}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                            </>
                        )}

                        {addMode === "random" && !isEdit && (
                            <>
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-2">
                                    {/* ----------- INPUT + BUTTON ROW ----------- */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                        {/* Number of Questions Input */}
                                        <div className="flex items-center gap-2 w-full sm:w-[50%]">
                                            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                Number of Questions:
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={questionCount}
                                                onChange={(e) => setQuestionCount(e.target.value)}
                                                className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-32"
                                            />
                                        </div>

                                        {/* Add Random Button */}
                                        <div className="flex justify-end w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={fetchRandomQuestions}
                                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 transition-all duration-200"
                                            >
                                                Add Random Questions
                                            </button>
                                        </div>
                                    </div>

                                    {/* ----------- TABLE DISPLAY ----------- */}
                                    {selectedQuestions.length === 0 ? (
                                        <p className="text-gray-400 text-sm italic text-center py-3">
                                            No random questions added yet.
                                        </p>
                                    ) : (
                                        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                                            <table className="w-full text-sm border-collapse">
                                                <thead className="bg-gray-100 sticky top-0">
                                                    <tr>
                                                        <th className="w-10 p-2 text-left border-b">Select</th>
                                                        <th className="p-2 text-left border-b">Question</th>
                                                        <th className="w-24 p-2 text-left border-b">Type</th>
                                                        <th className="w-20 p-2 text-left border-b">Mark</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedQuestions.map((q, index) => (
                                                        <tr
                                                            key={q.QuestionId || index}
                                                            className="hover:bg-gray-50 border-b last:border-0"
                                                        >
                                                            <td className="p-2 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={q.isChecked || false}
                                                                    onChange={(e) => {
                                                                        const isChecked = e.target.checked;
                                                                        setSelectedQuestions((prev) =>
                                                                            prev.map((x) =>
                                                                                x.QuestionId === q.QuestionId
                                                                                    ? { ...x, isChecked }
                                                                                    : x
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                                                                />
                                                            </td>
                                                            <td className="p-2 text-gray-700">
                                                                {q.QuestionName || q.Name}
                                                            </td>
                                                            <td className="p-2 text-gray-600">{q.QnType}</td>
                                                            <td className="p-2 text-gray-600">{q.Mark}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Modal */}
                        {showPreview && selectedQuestions.length > 0 && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                <div
                                    className="bg-white rounded-lg shadow-lg w-11/12 max-w-4xl p-4 relative"
                                    data-aos="fade-up"
                                >
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-lg font-bold"
                                    >
                                        &times;
                                    </button>

                                    {/* Modal Header */}
                                    <h2
                                        className="text-xl font-bold mb-4 text-gray-800"
                                        data-aos="fade-up"
                                        data-aos-delay="100"
                                    >
                                        Show Selected Questions
                                    </h2>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border border-gray-300 rounded overflow-hidden">
                                            <thead className="bg-blue-50 text-gray-700">
                                                <tr>
                                                    <th className="border px-2 py-1">SL</th>
                                                    <th className="border px-2 py-1">Subject</th>
                                                    <th className="border px-2 py-1">Type</th>
                                                    <th className="border px-2 py-1">Total Qn</th>
                                                    <th className="border px-2 py-1">Mark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const grouped = selectedQuestions.reduce((acc, q) => {
                                                        if (!acc[q.SubjectName]) acc[q.SubjectName] = {};
                                                        if (!acc[q.SubjectName][q.QnType])
                                                            acc[q.SubjectName][q.QnType] = { count: 0, totalMark: 0 };
                                                        acc[q.SubjectName][q.QnType].count++;
                                                        acc[q.SubjectName][q.QnType].totalMark += Number(q.Mark) || 0;
                                                        return acc;
                                                    }, {});

                                                    const subjects = Object.entries(grouped);
                                                    let grandTotalQuestions = 0;
                                                    let grandTotalMarks = 0;

                                                    return (
                                                        <>
                                                            {subjects.map(([subject, types], idx) => {
                                                                const totalForSubject = Object.values(types).reduce(
                                                                    (acc, t) => ({ count: acc.count + t.count, totalMark: acc.totalMark + t.totalMark }),
                                                                    { count: 0, totalMark: 0 }
                                                                );
                                                                grandTotalQuestions += totalForSubject.count;
                                                                grandTotalMarks += totalForSubject.totalMark;

                                                                return (
                                                                    <React.Fragment key={idx}>
                                                                        {Object.entries(types).map(([type, data], tIdx) => (
                                                                            <tr
                                                                                key={`${subject}-${type}`}
                                                                                className="bg-white hover:bg-gray-50"
                                                                                data-aos="fade-up"
                                                                                data-aos-delay={tIdx * 50}
                                                                            >
                                                                                {tIdx === 0 && (
                                                                                    <>
                                                                                        <td className="border px-2 py-1 text-center font-medium" rowSpan={Object.keys(types).length}>
                                                                                            {idx + 1}
                                                                                        </td>
                                                                                        <td className="border px-2 py-1 font-semibold text-gray-800" rowSpan={Object.keys(types).length}>
                                                                                            {subject}
                                                                                        </td>
                                                                                    </>
                                                                                )}
                                                                                <td className="border px-2 py-1 text-center">{type}</td>
                                                                                <td className="border px-2 py-1 text-center">{data.count}</td>

                                                                                <td className="border px-2 py-1 text-center">{data.totalMark}</td>
                                                                            </tr>
                                                                        ))}
                                                                        <tr
                                                                            className="bg-blue-50 font-semibold text-gray-800"
                                                                            data-aos="fade-up"
                                                                            data-aos-delay={Object.keys(types).length * 50}
                                                                        >
                                                                            <td colSpan={2} className="border px-2 py-1 text-right">Subtotal:</td>
                                                                            <td className="border px-2 py-1 text-center">Total</td>
                                                                            <td className="border px-2 py-1 text-center">{totalForSubject.count}</td>

                                                                            <td className="border px-2 py-1 text-center">{totalForSubject.totalMark}</td>
                                                                        </tr>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <tr
                                                                className="bg-green-100 font-bold text-gray-900"
                                                                data-aos="fade-up"
                                                                data-aos-delay={subjects.length * 100}
                                                            >
                                                                <td colSpan={2} className="border px-2 py-1 text-right">Grand Total:</td>
                                                                <td className="border px-2 py-1 text-center">All Types</td>
                                                                <td className="border px-2 py-1 text-center">{grandTotalQuestions}</td>
                                                                <td className="border px-2 py-1 text-center">{grandTotalMarks}</td>
                                                            </tr>
                                                        </>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Close button at bottom */}
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                            data-aos="fade-up"
                                            data-aos-delay="200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>

                        )}


                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.push("/addSet")}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md shadow hover:bg-gray-600 transition"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
                            >
                                {isEdit ? "Update" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}