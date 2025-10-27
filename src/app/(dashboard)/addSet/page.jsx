'use client';
import config from '@/config';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import { FaFileExcel } from 'react-icons/fa';
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import { useState, useEffect, useContext } from 'react';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { AuthContext } from '../../provider/AuthProvider';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function AddSet() {
    const { loginData } = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [setData, setSetData] = useState([]);
    const [filteredSet, setFilteredSet] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');
    const [subjectData, setSubjectData] = useState([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Form/Edit/View States
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', remarks: '' });
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [totalMark, setTotalMark] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [questionData, setQuestionData] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [viewData, setViewData] = useState(null);

    const fetchSetData = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionSetManage',
                    parameters: { QueryChecker: 2 },
                })
            });
            const data = await response.json();
            setSetData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load Set data');
        }
    };
    // Set View
    // const fetchSetById = async (Id) => {
    //     try {
    //         const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
    //             method: 'POST',
    //             headers: {
    //                 TenantId: loginData.tenantId,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 operation: '',
    //                 procedureName: 'SP_QuestionSetManage',
    //                 parameters: {
    //                     QueryChecker: 3,
    //                     Id: Id
    //                 },
    //             }),
    //         });

    //         if (!response.ok) throw new Error(await response.text());

    //         const data = await response.json();
    //         if (data.length === 0) {
    //             toast.error("No data found for this set");
    //             setViewData(null);
    //             return;
    //         }

    //         const set = {
    //             Id: data[0].Id,
    //             SetName: data[0].SetName,
    //             TotalMark: data[0].TotalMark,
    //             TotalQuestions: data[0].TotalQuestions,
    //             Questions: data.map((q) => ({
    //                 SubjectName: q.SubjectName,
    //                 QuestionName: q.Question,
    //                 QnType: q.QnType,
    //                 Mark: q.Mark,
    //             })),
    //         };
    //         setViewData(set);
    //     } catch (err) {
    //         console.error('Error fetching set:', err);
    //         toast.error('Failed to load set data');
    //         setViewData(null);
    //     }
    // };

    const fetchSetById = async (Id) => {
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData?.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_QuestionSetManage",
                    parameters: { QueryChecker: 3, Id: Id },
                }),
            });

            const data = await response.json();
            console.log("Fetched Set Data", data);

            if (Array.isArray(data) && data.length > 0) {
                // Use a Map to group questions by Question text
                const questionMap = new Map();

                data.forEach((item) => {
                    const key = item.QuestionId; 
                    if (!questionMap.has(key)) {
                        questionMap.set(key, {
                             qnId: item.QuestionId,
                            id: item.Id,
                            subjectName: item.SubjectName,
                            // qnId:item.QuestionId,
                            question: item.Question || "No Question Text",
                            qnType: item.QnType,
                            qnMark: item.Mark,
                            qnImage: item.Sketch || null,
                            options: item.OptionText ? [{ text: item.OptionText, isCorrect: item.isCorrect }] : [],
                        });
                    } else {
                        // Add option to existing question
                        const existing = questionMap.get(key);
                        if (item.OptionText && !existing.options.some(o => o.text === item.OptionText)) {
                            existing.options.push({ text: item.OptionText, isCorrect: item.isCorrect });
                        }
                    }
                });

                const set = {
                    Id: data[0].Id,
                    SetName: data[0].SetName,
                    TotalMark: data[0].TotalMark,
                    TotalQuestions: questionMap.size,
                    Questions: Array.from(questionMap.values()),
                };

                console.log("Grouped Set Data", set);
                setViewData(set);
            } else {
                toast.error("No data found for this set");
                setViewData(null);
            }
        } catch (error) {
            console.error("Error fetching set:", error);
            toast.error("Failed to load set data");
            setViewData(null);
        }
    };



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
                setSubjectData(data.map(sub => ({ value: sub.Id, label: sub.Name })));
            } else toast.error("Invalid subject data format");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load subjects");
        }
    };

    useEffect(() => {
        if (!loginData?.tenantId) return;
        fetchSetData();
        fetchSubjectData();
    }, [loginData?.tenantId]);

    useEffect(() => {
        const id = searchParams?.get("id");
        if (id) openEditModalById(id);
    }, [searchParams]);

    useEffect(() => {
        let filtered = setData;
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(set => set.Name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredSet(filtered);
    }, [searchQuery, setData]);

    const openDeleteModal = (set) => {
        if (!set?.Id) return;
        setDeleteId(set.Id);
        setDeleteSuccessMsg("");
        setIsDeleteModalOpen(true);
    };
    const openViewModal = async (set) => {
        const id = set?.Id;
        if (!id) return;
        await fetchSetById(id);
        setIsViewModalOpen(true);
    };
    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: { TenantId: loginData.tenantId, "Content-Type": "application/json" },
                body: JSON.stringify({ operation: "", procedureName: "SP_QuestionSetManage", parameters: { QueryChecker: 6, Id: deleteId } })
            });
            if (!response.ok) throw new Error('Failed to delete');
            setDeleteSuccessMsg("Question Set deleted successfully.");
            setTimeout(() => setIsDeleteModalOpen(false), 2000);
            fetchSetData();
        } catch (error) {
            console.error(error);
            toast.error("Delete failed. Please try again.");
            setIsDeleteModalOpen(false);
        }
    };

    const handleDownloadExcel = () => {
        if (!selectedQuestions || selectedQuestions.length === 0) return toast.error('No data available to export!');
        const worksheet = XLSX.utils.json_to_sheet(selectedQuestions);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
        XLSX.writeFile(workbook, 'Questions_Report.xlsx');
    };

    return (
           <div className="overflow-x-auto p-3">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Question Set</h1>            
            </div>
        <div className="rounded-md font-roboto overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20">
                {/* Search & Actions */}
                <div className="px-3 py-2 flex flex-wrap justify-between items-center gap-3">
                    {/* Search Box */}
                    <div className="relative flex items-center w-full sm:w-auto min-w-[180px] max-w-[300px]">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-3 pr-10 py-[6px] border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm shadow-sm transition-all duration-200"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                &times;
                            </button>
                        )}
                    </div>

                    {/* Add New Set Button & Excel */}
                    <div className='flex items-center gap-3'>
                        <button onClick={() => router.push('/setEntry')} className="text-lg text-gray-50 cursor-pointer flex items-center gap-1">
                            <IoMdAddCircle className="text-xl" />
                        </button>
                        <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                    </div>
                </div>

                {/* Set List Table */}
                <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[68vh] overflow-y-auto">
                <table className="min-w-full text-sm text-left text-gray-600">
                    {/* <thead className="bg-gray-100 text-xs uppercase text-gray-700"> */}
                         <thead className="bg-gray-100 text-xs uppercase text-gray-700 sticky top-0 z-10">
                        <tr className="border-b">
                            <th className="px-4 py-2 text-center w-[5%]">SL</th>
                            <th className="px-4 py-2 text-center w-[25%]">Set Name</th>
                            <th className="px-4 py-2 text-center w-[25%]">Total Questions</th>
                            <th className="px-4 py-2 text-center w-[15%]">Total Marks</th>
                            <th className="px-4 py-2 text-center w-[30%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white text-xs text-gray-700">
                        {filteredSet.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-4">No data found</td></tr>
                        ) : (
                            filteredSet.map((set, index) => (
                                <tr key={set.Id} className="border-b border-gray-300 hover:bg-gray-50">
                                    <td className="px-4 py-2 text-center">{index + 1}</td>
                                    <td className="px-4 py-2 text-center">{set.Name}</td>
                                    <td className="px-4 py-2 text-center">{set.TotalQuestions}</td>
                                    <td className="px-4 py-2 text-center">{set.TotalMark}</td>
                                    <td className="px-4 py-2 text-center flex justify-center gap-2">
                                        <button onClick={() => openViewModal(set)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200">
                                            <FiEye />
                                        </button>
                                        <button onClick={() => router.push(`/setEntry?id=${set.Id}`)} className="px-3 py-1.5 border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition">
                                            <FiEdit />
                                        </button>
                                        <button onClick={() => openDeleteModal(set)} className="px-3 py-1.5 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition">
                                            <FiTrash2 />
                                        </button>
                                        <DeleteConfirmModal
                                            isOpen={isDeleteModalOpen}
                                            onClose={() => setIsDeleteModalOpen(false)}
                                            onConfirm={handleConfirmDelete}
                                            statusMessage={deleteSuccessMsg}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {isViewModalOpen && viewData && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div
                        data-aos="zoom-in"
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[90vh] p-6"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold transition"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="mb-6 text-center">
                            <h3 className="text-2xl font-bold text-gray-800">View Question Set</h3>
                        </div>

                        {/* Basic Info */}
                        <div className="flex flex-wrap justify-between items-center gap-4 text-gray-700 text-sm font-medium mb-6">
                            <span>
                                <b>Set Name: </b>
                                <span className="font-normal">{viewData.SetName}</span>
                            </span>
                            <span>
                                <b>Total Question: </b>
                                <span className="font-normal">{viewData.TotalQuestions}</span>
                            </span>
                            <span>
                                <b>Total Mark: </b>
                                <span className="font-normal">{viewData.TotalMark}</span>
                            </span>
                        </div>

                        {/* Questions */}
                        <div className="space-y-6">
                            {viewData.Questions && viewData.Questions.length > 0 ? (
                                viewData.Questions.map((q, index) => (
                                    <div
                                        key={q.qnId || index}
                                        className=""
                                    >
                                        {/* Question Header */}
                                        {/* <div className="flex justify-between items-center mb-2">
                                         
                                            <h4 className="font-semibold text-gray-800 text-lg">
                                                {index + 1}. {q.question}
                                            </h4>

                                          
                                            <span className="text-sm text-gray-600 font-medium">
                                                Mark: {q.qnMark}
                                            </span>
                                        </div> */}

                                        <div className="mb-4 relative">
                                            <h4 className="font-semibold text-gray-800 text-lg pr-16">
                                                {index + 1}. {q.question}
                                            </h4>
                                            <span className="absolute top-0 right-0 text-gray-600 font-semibold">
                                                Mark: {q.qnMark}
                                            </span>
                                        </div>




                                        {/* Question Image */}
                                        {q.qnImage && (
                                            <div className="mb-3 flex justify-start">
                                                <img
                                                    src={q.qnImage}
                                                    alt="Question"
                                                    className="rounded-md object-contain border border-gray-200"
                                                    style={{ maxHeight: "150px" }}
                                                />
                                            </div>
                                        )}

                                        {/* MCQ Options */}
                                        {q.qnType === "MCQ" && q.options && q.options.length > 0 && (
                                            <ul className="ml-4 space-y-1">
                                                {q.options.map((opt, i) => (
                                                    <li
                                                        key={i}
                                                        className="p-2 rounded text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    >
                                                        <span className="font-medium mr-1">{String.fromCharCode(65 + i)}.</span>
                                                        {opt.text}
                                                        {opt.isCorrect && (
                                                            <span className="ml-2 text-green-600 font-semibold">✓</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-6 text-lg">No questions found.</p>
                            )}
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
}
