'use client'
import config from '@/config';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import { FaFileExcel } from 'react-icons/fa';
import React, { useState, useEffect, useContext } from 'react';
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { AuthContext } from '../../provider/AuthProvider';
import { toast } from 'react-hot-toast';
import Select from 'react-select';



export default function AddSet() {
    const { loginData } = useContext(AuthContext);
    const [setData, setSetData] = useState([]);
    const [filteredSet, setFilteredSet] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [totalMark, setTotalMark] = useState(0);
    const [editId, setEditId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

    const [subjectData, setSubjectData] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [questionData, setQuestionData] = useState([]);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        remarks: ''
    });

    const [showPreview, setShowPreview] = useState(false); //for showing preview table

    //  Load subjects
    useEffect(() => {
        if (!loginData?.tenantId) return;
        fetchSubjectData();
        fetchSetData();
    }, [loginData?.tenantId]);

    const resetForm = () => {
        setFormData({
            name: '',
            remarks: ''
        });
        setSelectedQuestions([]);
        setTotalMark(0);
        setSelectedSubject('');
        setEditId(null);
        setIsEdit(false);
        setQuestionData([]);
        setShowPreview(false);
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

    //  Load questions by subject
    // const fetchQuestionsBySubject = async (subId = null) => {
    //     try {
    //         const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
    //             method: "POST",
    //             headers: {
    //                 TenantId: loginData.tenantId,
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({
    //                 operation: "",
    //                 procedureName: "SP_QuestionManage",
    //                 parameters: {
    //                     QueryChecker: 5,
    //                     SubId: subId || 0,
    //                 },
    //             }),
    //         });

    //         const data = await response.json();
    //         const questions = Array.isArray(data) ? data : [];
    //         setQuestionData(questions);
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Failed to load questions");
    //     }
    // };

    const fetchQuestionsBySubject = async (subId = null, setId = null) => {
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
            // if (!setId) {
            //     setSelectedQuestions([]);
            // }
            //       if (!setId && !isEdit) {
            //     setSelectedQuestions([]);
            // }

            setQuestionData(questions);
            return questions;
        } catch (error) {
            console.error(error);
            toast.error("Failed to load questions");
            return [];
        }
    };


    // Load existing sets
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
            console.log("Set Data", data)
            const set = Array.isArray(data) ? data : [];
            setSetData(set);
            //  setSetData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching Set:', error);
            toast.error('Failed to load Set data');
        }
    };

    //  Filter
    useEffect(() => {
        let filteredData = setData;
        if (searchQuery.trim() !== '') {
            filteredData = filteredData.filter(set =>
                set.Name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredSet(filteredData);
    }, [searchQuery, setData]);

    // Modal open
    const handleOpenModal = () => {
        setShowModal(true);
         resetForm()
        setIsEdit(false);
        setEditId(null);
        setFormData({ name: '', remarks: '' });
        setSelectedQuestions([]);
        setTotalMark(0);
        setShowPreview(false);
    };

    //  Input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    //  Checkbox select
    // const handleCheckboxChange = (question) => {
    //     let updatedSelected = [...selectedQuestions];
    //     if (updatedSelected.some(q => q.QuestionId === question.QuestionId)) {
    //         updatedSelected = updatedSelected.filter(q => q.QuestionId !== question.QuestionId);
    //     } else {
    //         updatedSelected.push(question);
    //     }
    //     setSelectedQuestions(updatedSelected);
    //     const total = updatedSelected.reduce((acc, q) => acc + (q.Mark || 0), 0);
    //     setTotalMark(total);
    // };

    const handleCheckboxChange = (question) => {
        let updatedSelected = [...selectedQuestions];

        // Check if question is already selected (handle both property names)
        const isSelected = updatedSelected.some(q =>
            q.QuestionId === question.QuestionId
            // || 
            // q.QnId === question.QuestionId
        );

        if (isSelected) {
            // Remove the question
            updatedSelected = updatedSelected.filter(q =>
                q.QuestionId !== question.QuestionId
                // && 
                // q.QnId !== question.QuestionId
            );
        } else {
            // Add the question with consistent structure
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

    //  Show preview before save
    const handleShowPreview = () => {
        if (selectedQuestions.length === 0) return toast.error("Please select at least one question!");
        setShowPreview(true);
    };

    //  Save set
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name) return toast.error("Set Name required");
        if (selectedQuestions.length === 0) return toast.error("Select at least 1 question");

        try {
            // Prepare JSON for Questions
            const questionsJson = selectedQuestions.map(q => ({
                SubId: q.SubjectId,      // adjust property names according to your API
                QnId: q.QuestionId,
                Mark: q.Mark || 0,
                Remarks: q.Remarks || ''
            }));

            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionSetManage',
                    parameters: {
                        QueryChecker: 1,
                        Name: formData.name,
                        Remarks: formData.remarks || '',
                        TotalMark: totalMark || 0,
                        EntryBy: loginData.UserId,
                        Questions: JSON.stringify(questionsJson)
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to save set');

            toast.success(`Set ${isEdit ? 'updated' : 'saved'} successfully`);
            setShowModal(false);
            fetchSetData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     // Basic validation
    //     if (!formData.name) return toast.error("Set Name required");
    //     if (selectedQuestions.length === 0) return toast.error("Select at least 1 question");

    //     try {
    //         // Prepare JSON for Questions
    //         const questionsJson = selectedQuestions.map(q => ({
    //             SubId: q.SubjectId,
    //             QnId: q.QuestionId,
    //             Mark: q.Mark || 0,
    //             Remarks: q.Remarks || ''
    //         }));

    //         // Determine query checker based on edit mode
    //         const queryChecker = isEdit ? 5 : 1;

    //         const requestBody = {
    //             operation: '',
    //             procedureName: 'SP_QuestionSetManage',
    //             parameters: {
    //                 QueryChecker: queryChecker,
    //                 Name: formData.name,
    //                 Remarks: formData.remarks || '',
    //                 TotalMark: totalMark || 0,
    //                 EntryBy: loginData.UserId,
    //                 Questions: JSON.stringify(questionsJson)
    //             }
    //         };

    //         // Add SetId for update operation
    //         if (isEdit && editId) {
    //             requestBody.parameters.Id = editId;
    //         }

    //         const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
    //             method: 'POST',
    //             headers: {
    //                 TenantId: loginData.tenantId,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(requestBody)
    //         });

    //         if (!response.ok) throw new Error('Failed to save set');

    //         toast.success(`Set ${isEdit ? 'updated' : 'saved'} successfully`);
    //         setShowModal(false);
    //         resetForm();
    //         fetchSetData();
    //     } catch (err) {
    //         toast.error(err.message);
    //     }
    // };
    const fetchSetById = async (Id) => {
        console.log('Fetching set for ID:', Id);
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
                    parameters: {
                        QueryChecker: 3,
                        Id: Id
                    },
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            console.log('Fetched Set Data:', data);

            if (data.length === 0) {
                toast.error("No data found for this set");
                setViewData(null);
                return;
            }

            const set = {
                Id: data[0].Id,
                SetName: data[0].SetName,
                TotalMark: data[0].TotalMark,
                TotalQuestions: data[0].TotalQuestions,
                Questions: data.map((q) => ({
                    SubjectName: q.SubjectName,
                    QuestionName: q.Question,
                    QnType: q.QnType,
                    Mark: q.Mark,
                })),
            };

            setViewData(set);
        } catch (err) {
            console.error('Error fetching set:', err);
            toast.error('Failed to load set data');
            setViewData(null);
        }
    };


    const openViewModal = async (set) => {
        console.log("Opening set:", set);
        const id = set?.Id;
        if (!id) return;
        await fetchSetById(id);
        setIsViewModalOpen(true);
    };

    const openEditModal = async (setItem) => {
        setShowModal(true);
        setIsEdit(true);
        setEditId(setItem.Id);

        setSelectedQuestions([]); // Clear initially
        setTotalMark(0);

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
                        Id: setItem.Id,
                    },
                }),
            });

            const data = await response.json();
            console.log("Edit Data", data)

            if (!Array.isArray(data) || data.length === 0) {
                toast.error("No data found for this question set!");
                return;
            }

            const master = data[0];

            // Set master info
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
                    Mark: item.AssignedMark || item.QuestionMark,
                    QnType: item.QnType,
                    SubjectId: item.SubjectId,
                    SubjectName: item.SubjectName,
                    Remarks: item.Remarks || ""
                }));

            // Set selected questions
            setSelectedQuestions(details);

            const subjectIds = [...new Set(details.map(d => d.SubjectId))];

            if (subjectIds.length > 0) {
                // Set the first subject as selected
                const firstSubjectId = subjectIds[0];
                setSelectedSubject(firstSubjectId);

                // Fetch questions for that subject
                await fetchQuestionsBySubject(firstSubjectId, setItem.Id);
            } else {
                setQuestionData([]);
            }

        } catch (error) {
            console.error("Error fetching set:", error);
            toast.error("Failed to load question set for edit");
        }
    };


    return (
        <div className="overflow-x-auto p-3">
            <div className="overflow-x-auto p-3">
                <style jsx>
                    {`
        .custom-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .fixed-table {
            table-layout: fixed;
            width: 100%;
        }
        .fixed-table th,
        .fixed-table td {
            padding: 10px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 100px;
        }
        .fixed-table th {
            padding: 12px;
            white-space: nowrap;
            overflow: hidden;
        }
        @media (max-width: 768px) {
            .fixed-table {
                display: block;
                width: 100%;
            }
            .fixed-table thead {
                display: none;
            }
            .fixed-table tbody {
                display: block;
                width: 100%;
            }
            .fixed-table tr {
                display: block;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .fixed-table td {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .fixed-table td::before {
                content: attr(data-label);
                font-weight: bold;
                margin-right: 10px;
                flex: 1;
            }
            .fixed-table td:last-child {
                border-bottom: none;
            }
        }
    `}
                </style>

                <div className="rounded-md font-roboto overflow-hidden">
                    <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">
                        <div className="px-3 py-2 flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center w-full sm:w-auto min-w-[180px] max-w-[300px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg
                                            className="h-4 w-4 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        className="block w-full pl-10 pr-3 py-[6px] border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm"
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <svg
                                                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className='flex items-center gap-3'>
                                <Link
                                    onClick={handleOpenModal}
                                    href="#"
                                    passHref
                                    className="text-lg text-gray-50 cursor-pointer"
                                >
                                    <IoMdAddCircle className="text-xl" />
                                </Link>

                                <FaFileExcel
                                    // onClick={handleDownloadExcel} 
                                    className="text-lg cursor-pointer text-gray-50" />
                            </div>
                        </div>
                        <table className="min-w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-center w-[5%]">SL</th>
                                    <th className="px-4 py-2 text-center w-[15%]">Set Name</th>
                                    <th className="px-4 py-2 text-center w-[50%]">Total Question</th>
                                    <th className="px-4 py-2 text-center w-[15%]">Total Mark</th>
                                    <th className="px-4 py-2 text-center w-[15%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-xs text-gray-700">
                                {filteredSet.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">No data found</td>
                                    </tr>
                                ) : (
                                    filteredSet.map((set, index) => (
                                        <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
                                            <td data-label="Reg Date" className="px-4 py-2 text-center"> {index + 1}</td>
                                            <td data-label="Subject" className="px-4 py-2 text-center">{set.Name}</td>
                                            <td data-label="Question" className="px-4 py-2 text-center">{set.TotalQuestions}</td>
                                            <td data-label="Mark" className="px-4 py-2 text-center">{set.TotalMark}</td>
                                            <td data-label="Actions" className="px-4 py-2 text-center">
                                                <div className="text-base flex items-end gap-3">
                                                    <button onClick={() => openViewModal(set)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200">
                                                        <FiEye className="text-base" />
                                                    </button>

                                                    <button
                                                        onClick={() => openEditModal(set)}
                                                        title="Edit"
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiEdit className="text-base" />
                                                    </button>

                                                    <button
                                                        onClick={() => openDeleteModal(set.Id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiTrash2 className="text-base" />
                                                    </button>

                                                    {/* Modal */}
                                                    <DeleteConfirmModal
                                                        isOpen={isDeleteModalOpen}
                                                        onClose={() => setIsDeleteModalOpen(false)}
                                                        // onConfirm={handleConfirmDelete}
                                                        statusMessage={deleteSuccessMsg}
                                                    />

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden border border-gray-200">
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                                <h3 className="font-bold text-lg text-gray-800">Set Entry</h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="text-gray-500 hover:text-red-500 text-xl font-bold transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto max-h-[75vh]">
                                <form onSubmit={handleSubmit} className="space-y-4 text-sm">

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

                                    {/* Subject Dropdown */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Subject</label>
                                        {subjectData.length > 0 && (
                                            <Select
                                                name="filterSubject"
                                                value={subjectData.find(s => s.value === selectedSubject) || null}
                                                onChange={(selected) => {
                                                    const subId = selected?.value || "";
                                                    setSelectedSubject(subId);
                                                    fetchQuestionsBySubject(subId);
                                                    // fetchQuestionsBySubject(subId, isEdit ? editId : null);
                                                }}
                                                options={subjectData}
                                                placeholder="Select or search subject..."
                                                className="w-full"
                                                isClearable
                                                isSearchable
                                            />
                                        )}
                                    </div>

                                    {/* Questions List */}
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                                        {questionData.length === 0 ? (
                                            <p className="text-gray-400 text-sm italic text-center py-3">No questions found.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {questionData.map((q) => (
                                                    <div
                                                        key={q.QuestionId}
                                                        className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md hover:shadow-sm transition"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedQuestions.some(sq => sq.QuestionId === q.QuestionId)}
                                                            // checked={selectedQuestions.some(sq =>
                                                            //     sq.QuestionId === q.QuestionId ||
                                                            //     (sq.QnId && sq.QnId === q.QuestionId) // Handle different property names
                                                            // )}
                                                            onChange={() => handleCheckboxChange(q)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                                                        />
                                                        <label className="text-gray-700 text-sm flex-1">
                                                            {q.Name}
                                                            <span className="text-gray-500 ml-1">
                                                                ({q.QnType} - {q.Mark} Marks)
                                                            </span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview */}

                                    {showPreview && selectedQuestions.length > 0 && (
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
                                                                        (acc, t) => ({
                                                                            count: acc.count + t.count,
                                                                            totalMark: acc.totalMark + t.totalMark,
                                                                        }),
                                                                        { count: 0, totalMark: 0 }
                                                                    );

                                                                    grandTotalQuestions += totalForSubject.count;
                                                                    grandTotalMarks += totalForSubject.totalMark;

                                                                    return (
                                                                        <React.Fragment key={idx}>
                                                                            {Object.entries(types).map(([type, data], tIdx) => (
                                                                                <tr key={`${subject}-${type}`} className="bg-white hover:bg-gray-50">
                                                                                    {tIdx === 0 && (
                                                                                        <>
                                                                                            <td
                                                                                                className="border px-2 py-1 text-center font-medium"
                                                                                                rowSpan={Object.keys(types).length}
                                                                                            >
                                                                                                {idx + 1}
                                                                                            </td>
                                                                                            <td
                                                                                                className="border px-2 py-1 font-semibold text-gray-800"
                                                                                                rowSpan={Object.keys(types).length}
                                                                                            >
                                                                                                {subject}
                                                                                            </td>
                                                                                        </>
                                                                                    )}
                                                                                    <td className="border px-2 py-1 text-center">{data.count}</td>
                                                                                    <td className="border px-2 py-1 text-center">{type}</td>
                                                                                    <td className="border px-2 py-1 text-center">{data.totalMark}</td>
                                                                                </tr>
                                                                            ))}

                                                                            {/* Per-subject subtotal */}
                                                                            <tr className="bg-blue-50 font-semibold text-gray-800">
                                                                                <td colSpan={2} className="border px-2 py-1 text-right">
                                                                                    Subtotal:
                                                                                </td>
                                                                                <td className="border px-2 py-1 text-center">{totalForSubject.count}</td>
                                                                                <td className="border px-2 py-1 text-center">Total</td>
                                                                                <td className="border px-2 py-1 text-center">{totalForSubject.totalMark}</td>
                                                                            </tr>
                                                                        </React.Fragment>
                                                                    );
                                                                })}

                                                                {/* Grand Total */}
                                                                <tr className="bg-green-100 font-bold text-gray-900">
                                                                    <td colSpan={2} className="border px-2 py-1 text-right">
                                                                        Grand Total:
                                                                    </td>
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
                                    )}


                                    {/* Buttons */}
                                    <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                                        {!showPreview && (
                                            <button
                                                type="button"
                                                onClick={handleShowPreview}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
                                            >
                                                Add (Preview)
                                            </button>
                                        )}
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
                )}

                {isViewModalOpen && viewData && (

                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                        <div
                            data-aos="zoom-in"
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-y-auto max-h-[90vh] p-6"
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

                            <div className="space-y-5 text-gray-700 text-sm">
                                {/* Set Info */}
                                <div className="flex flex-nowrap justify-between items-center gap-6 text-gray-700 text-sm font-medium">
                                    <span><b>Set Name: </b><span className="font-normal">{viewData.SetName}</span></span>
                                    <span><b>Total Question: </b> <span className="font-normal">{viewData.TotalQuestions}</span></span>
                                    <span><b>Total Mark: </b> <span className="font-normal">{viewData.TotalMark}</span></span>
                                </div>


                                {/* Questions Table */}
                                <div className="mt-4">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Questions</h4>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-sm border-collapse">
                                            <thead className="bg-blue-50 text-blue-800">
                                                <tr>
                                                    <th className="p-2 text-left border-b">SL</th>
                                                    <th className="p-2 text-left border-b">Subject</th>
                                                    <th className="p-2 text-left border-b">Question</th>
                                                    <th className="p-2 text-left border-b">Type</th>
                                                    <th className="p-2 text-left border-b">Mark</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {viewData.Questions.map((q, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition">
                                                        <td className="p-2">{i + 1}</td>
                                                        <td className="p-2">{q.SubjectName}</td>
                                                        <td className="p-2">{q.QuestionName}</td>
                                                        <td className="p-2">{q.QnType}</td>
                                                        <td className="p-2">{q.Mark}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
                    </div>


                )}




            </div>
        </div>
    );
}
