'use client';
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiEye, FiX } from "react-icons/fi";
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
// import Select from 'react-select';
import { useRouter } from 'next/navigation'; 
import Select, { components } from "react-select";

export default function AddQuestion() {
    const { loginData } = useContext(AuthContext);
    const router = useRouter(); // Add this

    // State Declaration 
    const [questionData, setQuestionData] = useState([]);
    const [filteredQuestion, setFilteredQuestion] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");
    const [subjectData, setSubjectData] = useState([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState("");

    // Remove these states as they are not needed anymore
    // const initialFormData = {
    //     id: 0,
    //     subId: "",
    //     qnTypeId: "",
    //     name: "",
    //     mark: 0,
    //     remarks: "",
    //     sketch: null,
    //     options: [{ optionText: "", isCorrect: false }],
    // };
    // const [formData, setFormData] = useState({ ...initialFormData });

    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    // Fetch data when tenantId is available
    useEffect(() => {
        if (!loginData?.tenantId) return;
        fetchSubjectData();
        fetchQuestionsBySubject();
    }, [loginData?.tenantId]);

    // Filter questions based on search query
    useEffect(() => {
        const lowerSearch = searchQuery.toLowerCase();
        const filtered = questionData.filter(q => {
            const matchesQuestion = q?.Name?.toLowerCase().includes(lowerSearch);
            const matchesType = q?.QnType?.toLowerCase().includes(lowerSearch);
            const matchesSubject = q?.SubjectName?.toLowerCase().includes(lowerSearch);
            return matchesQuestion || matchesType || matchesSubject;
        });
        setFilteredQuestion(filtered);
    }, [searchQuery, questionData]);

    // API functions
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
            } else {
                toast.error("Invalid subject data format");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load subjects");
        }
    };

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
            setFilteredQuestion(questions);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load questions");
        }
    };

    const fetchQuestionById = async (questionId) => {
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionManage',
                    parameters: {
                        QueryChecker: 6,
                        Id: questionId,
                    },
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            const question = data.length ? {
                QuestionId: data[0].QuestionId,
                Name: data[0].Name,
                Mark: data[0].Mark,
                QnType: data[0].QnType,
                Remarks: data[0].Remarks,
                SubjectId: data[0].SubjectId,
                SubjectName: data[0].SubjectName,
                Sketch: data[0].Sketch,
                IsActive: data[0].IsActive,
                Options: data.filter(d => d.OptionText).map(d => ({
                    optionText: d.OptionText,
                    isCorrect: d.Answer
                })),
            } : null;

            setViewData(question);
        } catch (err) {
            console.error(`Error fetching question:`, err);
            toast.error('Failed to load question data');
            setViewData(null);
        }
    };

    // Modal handlers - SIMPLIFIED openEditModal
    const openEditModal = (question) => {
        debugger;
        if (!question?.QuestionId) return console.error("Invalid question ID");

        // Redirect to insertQuestion page with edit mode
        router.push(`/insertQuestion?editId=${question.QuestionId}`);
    };

    const openViewModal = async (question) => {
        if (!question?.QuestionId) return;
        await fetchQuestionById(question.QuestionId);
        setIsViewModalOpen(true);
    };

    const openDeleteModal = (question) => {
        if (!question?.QuestionId) return;
        setSelectedId(question.QuestionId);
        setDeleteSuccessMsg("");
        setIsDeleteModalOpen(true);
    };

    const handleDownloadExcel = () => {
        if (filteredQuestion.length === 0) return alert('No data available to export!');
        const worksheet = XLSX.utils.json_to_sheet(filteredQuestion);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
        XLSX.writeFile(workbook, 'Questions_Report.xlsx');
    };

    const handleConfirmDelete = async () => {
        if (!selectedId) return;

        try {
            const response = await fetch(`${config.API_BASE_URL}api/Question/Delete/${selectedId}`, {
                method: 'DELETE',
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json'
                },
            });

            const responseText = await response.text();

            if (!response.ok) {
                if (responseText.includes("used in a question set")) {
                    const message = "This question cannot be deleted because it is already used in a question set.";
                    setDeleteSuccessMsg(message);

                    setTimeout(() => {
                        setIsDeleteModalOpen(false);
                        setDeleteSuccessMsg("");
                    }, 2000);
                    return;
                } else if (responseText.includes("Question not found")) {
                    const message = "Question not found.";
                    toast.error(message);
                    return;
                }

                // Default error
                toast.error("Delete failed. Please try again.");
                return;
            }

            // Success
            setDeleteSuccessMsg("Item deleted successfully.");
            setTimeout(() => {
                setIsDeleteModalOpen(false);
                setDeleteSuccessMsg("");
            }, 2000);

            if (selectedSubject && selectedSubject !== "") {
                await fetchQuestionsBySubject(selectedSubject);
            } else {
                await fetchQuestionsBySubject();
            }

        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.message || "Delete failed. Please try again.");
            setIsDeleteModalOpen(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="overflow-x-auto p-2">
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .fixed-table { table-layout: fixed; width: 100%; }
                .fixed-table th, .fixed-table td {
                    padding: 10px; text-align: center; white-space: nowrap;
                    overflow: hidden; text-overflow: ellipsis; min-width: 100px;
                }
                .fixed-table th { padding: 12px; white-space: nowrap; overflow: hidden; }
                @media (max-width: 768px) {
                    .fixed-table { display: block; width: 100%; }
                    .fixed-table thead { display: none; }
                    .fixed-table tbody { display: block; width: 100%; }
                    .fixed-table tr {
                        display: block; margin-bottom: 10px;
                        border: 1px solid #ddd; border-radius: 5px;
                    }
                    .fixed-table td {
                        display: flex; justify-content: space-between;
                        align-items: center; padding: 8px; text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    .fixed-table td::before {
                        content: attr(data-label); font-weight: bold;
                        margin-right: 10px; flex: 1;
                    }
                    .fixed-table td:last-child { border-bottom: none; }
                }
            `}</style>
            <div className="mb-1">
                <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
            </div>
            <div className="rounded-sm font-roboto overflow-hidden">
                <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">
                    <div className="px-3 py-2 flex flex-wrap justify-between items-center gap-2">
                        <div className='flex items-center gap-3'>
                            <div className="relative flex items-center w-full sm:w-auto min-w-[180px] max-w-[300px]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-[6px] border border-gray-300 rounded-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm"
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="w-full sm:w-auto min-w-[180px] max-w-[280px]">
                                {subjectData.length > 0 && (
                                <Select
                                    name="filterSubject"
                                    value={
                                        selectedSubject === ""
                                            ? { value: "", label: "All Position" }
                                            : subjectData.find((s) => s.value === selectedSubject) || null
                                    }
                                    onChange={(selected) => {
                                        const subId = selected?.value || "";
                                        setSelectedSubject(subId);
                                        fetchQuestionsBySubject(subId);
                                    }}
                                    options={[{ value: "", label: "All Position" }, ...subjectData]}
                                    placeholder="Select or search position..."
                                    className="w-full  text-gray-800"
                                    classNamePrefix="custom-select"
                                    isClearable
                                    isSearchable
                                    menuPortalTarget={document.body}
                                    components={{
                                        ClearIndicator: (props) => {
                                            // Hide clear indicator if the selected value is "All Position"
                                            if (props.getValue()[0]?.value === "") return null;
                                            return <components.ClearIndicator {...props} />;
                                        },
                                    }}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            minHeight: "34px",
                                            height: "28px",
                                            borderColor: "#D1D5DB",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                            "&:hover": {
                                                borderColor: "#3B82F6",
                                            },
                                        }),
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 9999,
                                        }),
                                    }}
                                />

                                )}
                            </div>
                        </div>

                        <div className='flex items-center gap-3'>
                            <Link
                                href="/insertQuestion"
                                className="text-lg text-gray-50 cursor-pointer flex items-center"

                            >
                                <IoMdAddCircle className="text-xl" />
                            </Link>
                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>
                    <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[64vh] overflow-y-auto">
                        <table className="min-w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-800 sticky top-0">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-center">SL</th>
                                    <th className="px-4 py-2">Position</th>
                                    <th className="px-4 py-2">Question</th>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2">Mark</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-xs text-gray-800">
                                {filteredQuestion.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">No data found</td>
                                    </tr>
                                ) : (
                                    filteredQuestion.map((question, index) => (
                                        <tr key={index} className="border-b border-gray-300 hover:bg-[#4775a0] hover:text-white">
                                            <td data-label="SL" className="px-4 py-1.5 text-center">{index + 1}</td>
                                            <td data-label="Subject" className="px-4 py-1.5">{question.SubjectName}</td>
                                            <td data-label="Question" className="px-4 py-1.5">{question.Name}</td>
                                            <td data-label="Type" className="px-4 py-1.5">{question.QnType}</td>
                                            <td data-label="Mark" className="px-4 py-1.5 text-center">{question.Mark}</td>
                                            <td data-label="Actions" className="px-4 py-1.5 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => openViewModal(question)}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiEye className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(question)}
                                                        title="Edit"
                                                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiEdit className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(question)}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiTrash2 className="text-base" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                statusMessage={deleteSuccessMsg}
            />

            {isViewModalOpen && viewData && (
               <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                    <div data-aos="zoom-in" className="bg-white rounded-sm shadow-xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
                        >
                            <FiX className="w-4 h-4" />
                        </button>

                        {/* Header */}
                        <div className="border-b border-gray-200 pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Question Details</h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            {/* Position */}
                            <div className="flex items-center gap-2">
                                <span className="w-32 font-semibold text-gray-800">Position</span>:
                                <span className="flex-1 text-gray-900">{subjectData.find(s => s.value === viewData.SubjectId)?.label || "-"}</span>
                            </div>

                            {/* Question Type */}
                            <div className="flex items-center gap-2">
                                <span className="w-32 font-semibold text-gray-800">Question Type</span>:
                                <span className="flex-1 text-gray-800">{viewData.QnType}</span>
                            </div>

                            {/* Question */}
                            <div className="flex items-start gap-2">
                                <span className="w-32 font-semibold text-gray-800">Question</span>:
                                <p className="flex-1 text-gray-800">{viewData.Name}</p>
                            </div>

                            {/* Mark */}
                            <div className="flex items-center gap-2">
                                <span className="w-32 font-semibold text-gray-800">Mark</span>:
                                <span className="flex-1 text-gray-800">{viewData.Mark}</span>
                            </div>

                            {/* MCQ Options */}
                            {viewData.QnType === "MCQ" && (
                                <div className="mt-2">
                                    <span className="block font-semibold text-gray-800 mb-1">Options</span>
                                    <div className="space-y-1">
                                        {viewData.Options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                                                <span className="w-6 font-semibold text-gray-800">{String.fromCharCode(65 + idx)})</span>
                                                <span className="flex-1">{opt.optionText}</span>
                                                <input type="checkbox" checked={opt.isCorrect} readOnly className="ml-2 w-4 h-4 accent-blue-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sketch/Image */}
                            {viewData.Sketch && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="w-32 font-semibold text-gray-800">Image</span>
                                    <img src={viewData.Sketch} alt="Sketch" className="max-w-[150px] max-h-[150px] rounded border border-gray-200" />
                                </div>
                            )}

                            {/* Close Button */}
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}