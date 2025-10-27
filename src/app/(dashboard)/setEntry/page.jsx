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
            setQuestionData(questions);
            return questions;
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
                    Remarks: item.Remarks || ""
                }));

            setSelectedQuestions(details);
            const subjectIds = [...new Set(details.map(d => d.SubjectId))];

            if (subjectIds.length > 0) {
                const firstSubjectId = subjectIds[0];
                setSelectedSubject(firstSubjectId);
                await fetchQuestionsBySubject(firstSubjectId);
            } else {
                setQuestionData([]);
            }

        } catch (error) {
            console.error("Error fetching set:", error);
            toast.error("Failed to load question set for edit");
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
        } else {
            // Reset form for new entry
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
            const questionsJson = selectedQuestions.map(q => ({
                SubId: q.SubjectId,
                QnId: q.QuestionId,
                Mark: q.Mark || 0,
                Remarks: q.Remarks || ''
            }));

            const queryChecker = isEdit ? 5 : 1;
            const requestBody = {
                operation: '',
                procedureName: 'SP_QuestionSetManage',
                parameters: {
                    QueryChecker: queryChecker,
                    Name: formData.name,
                    Remarks: formData.remarks || '',
                    TotalMark: totalMark || 0,
                    EntryBy: loginData.UserId,
                    Questions: JSON.stringify(questionsJson)
                }
            };

            if (isEdit && editId) {
                requestBody.parameters.Id = editId;
            }

            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('Failed to save set');

            toast.success(`Set ${isEdit ? 'updated' : 'saved'} successfully`);
            router.push("/addSet"); // Redirect back to list page
        } catch (err) {
            toast.error(err.message);
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
                        {/* Set Name */}
                        <div className="flex items-center gap-3">
                            <label className="w-1/3 text-sm font-semibold text-gray-700">Set Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                        </div>

                        {/* Total Mark */}
                        <div className="flex items-center gap-3">
                            <label className="w-1/3 text-sm font-semibold text-gray-700">Total Mark</label>
                            <input
                                name="mark"
                                value={totalMark}
                                readOnly
                                className="w-full border border-gray-200 px-3 py-2 rounded-md bg-gray-100 text-gray-600"
                            />
                        </div>

                        {/* Subject Selection */}
                        <div className="flex items-center gap-3">
                            <label className="w-1/3 text-sm font-semibold text-gray-700">Select Subject</label>
                            <div className="w-full">
                                {subjectData.length > 0 && (
                                    <Select
                                        name="filterSubject"
                                        value={subjectData.find(s => s.value === selectedSubject) || null}
                                        onChange={(selected) => {
                                            const subId = selected?.value || "";
                                            setSelectedSubject(subId);
                                            fetchQuestionsBySubject(subId);
                                        }}
                                        options={subjectData}
                                        placeholder="Select or search subject..."
                                        className="w-full"
                                        isClearable
                                        isSearchable
                                    />
                                )}
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                            {questionData.length === 0 ? (
                                <p className="text-gray-400 text-sm italic text-center py-3">
                                    {selectedSubject ? "No questions found for this subject." : "Please select a subject to view questions."}
                                </p>
                            ) : (
                                questionData.map((q) => (
                                    <div key={q.QuestionId} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md hover:shadow-sm transition">
                                        <input
                                            type="checkbox"
                                            checked={isQuestionSelected(q.QuestionId)}
                                            onChange={() => handleCheckboxChange(q)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                                        />
                                        <label className="text-gray-700 text-sm flex-1">
                                            {q.Name}
                                            <span className="text-gray-500 ml-1">({q.QnType} - {q.Mark} Marks)</span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Preview Table */}
                        {/* {showPreview && selectedQuestions.length > 0 && (
                            <div className="mt-4 border border-gray-300 rounded-lg p-3 bg-gray-100">
                                <h4 className="font-semibold mb-2 text-gray-800">Preview Selected Questions</h4>
                                <table className="w-full text-sm border border-gray-300 rounded overflow-hidden">
                                    <thead className="bg-blue-50 text-gray-700">
                                        <tr>
                                            <th className="border px-2 py-1">SL</th>
                                            <th className="border px-2 py-1">Subject</th>
                                            <th className="border px-2 py-1">Total Qn</th>
                                            <th className="border px-2 py-1">Type</th>
                                            <th className="border px-2 py-1">Mark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const grouped = selectedQuestions.reduce((acc, q) => {
                                                if (!acc[q.SubjectName]) acc[q.SubjectName] = {};
                                                if (!acc[q.SubjectName][q.QnType]) acc[q.SubjectName][q.QnType] = { count: 0, totalMark: 0 };
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
                                                        const totalForSubject = Object.values(types).reduce((acc, t) => ({ count: acc.count + t.count, totalMark: acc.totalMark + t.totalMark }), { count: 0, totalMark: 0 });
                                                        grandTotalQuestions += totalForSubject.count;
                                                        grandTotalMarks += totalForSubject.totalMark;

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                {Object.entries(types).map(([type, data], tIdx) => (
                                                                    <tr key={`${subject}-${type}`} className="bg-white hover:bg-gray-50">
                                                                        {tIdx === 0 && (
                                                                            <>
                                                                                <td className="border px-2 py-1 text-center font-medium" rowSpan={Object.keys(types).length}>{idx + 1}</td>
                                                                                <td className="border px-2 py-1 font-semibold text-gray-800" rowSpan={Object.keys(types).length}>{subject}</td>
                                                                            </>
                                                                        )}
                                                                        <td className="border px-2 py-1 text-center">{data.count}</td>
                                                                        <td className="border px-2 py-1 text-center">{type}</td>
                                                                        <td className="border px-2 py-1 text-center">{data.totalMark}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="bg-blue-50 font-semibold text-gray-800">
                                                                    <td colSpan={2} className="border px-2 py-1 text-right">Subtotal:</td>
                                                                    <td className="border px-2 py-1 text-center">{totalForSubject.count}</td>
                                                                    <td className="border px-2 py-1 text-center">Total</td>
                                                                    <td className="border px-2 py-1 text-center">{totalForSubject.totalMark}</td>
                                                                </tr>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    <tr className="bg-green-100 font-bold text-gray-900">
                                                        <td colSpan={2} className="border px-2 py-1 text-right">Grand Total:</td>
                                                        <td className="border px-2 py-1 text-center">{grandTotalQuestions}</td>
                                                        <td className="border px-2 py-1 text-center">All Types</td>
                                                        <td className="border px-2 py-1 text-center">{grandTotalMarks}</td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )} */}
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