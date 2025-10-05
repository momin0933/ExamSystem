'use client'
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2 } from "react-icons/fi";
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Select from 'react-select';

export default function AddQuestion() {
    const { loginData } = useContext(AuthContext);
    const [questionData, setQuestionData] = useState([]);
    const [filteredQuestion, setFilteredQuestion] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEdit, setIsEdit] = useState(false); 
    const [editId, setEditId] = useState(null); 
    const [showModal, setShowModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");
    const [subjectData, setSubjectData] = useState([]);
    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    // Unified formData keys
        const [formData, setFormData] = useState({
        id: 0,
        subId: 0,
        qnTypeId: "",       
        name: "",
        mark: 0,
        remarks: "",
        sketch: null,       
        options: [{ optionText: "", isCorrect: false }], 
        });

        
    const handleOpenModal = () => {
    setShowModal(true);
    //Reset New Form
        setFormData({
            id: 0,
            subId: 0,
            qnTypeId: "",
            name: "",
            mark: 0,
            remarks: "",
            sketch: null,
            options: [{ optionText: "", isCorrect: false }],
        });
    };


 // Updated handleChange to handle text, number, and select inputs
 
    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
        }));
        };

        const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            sketch: e.target.files[0] || null,
        }));
        };

        const handleOptionChange = (index, field, value) => {
            setFormData(prev => {
                const updated = [...prev.options];
                updated[index][field] = value;
                return { ...prev, options: updated };
            });
        };
            const addOption = () => {
            setFormData((prev) => ({
                ...prev,
                options: [...prev.options, { optionText: "", isCorrect: false }],
            }));
            };

            const removeOption = (index) => {
            setFormData((prev) => ({
                ...prev,
                options: prev.options.filter((_, i) => i !== index),
            }));
        };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        console.log("Form Data before validation:", formData);

        if (!formData.subId) throw new Error("Please select a subject.");
        if (!formData.qnTypeId) throw new Error("Please select a question type.");
        if (!formData.name.trim()) throw new Error("Question text cannot be empty.");
        if (formData.qnTypeId === "2" && formData.options.length < 2)
            throw new Error("MCQ must have at least 2 options.");

        const payload = {
        SubId: Number(formData.subId),
        Name: formData.name.trim(),
        QnType: formData.qnTypeId === "1" ? "Descriptive" : "MCQ",
        Mark: formData.mark ?? 0,
        Remarks: formData.remarks ?? "",
        Sketch: formData.sketch ? formData.sketch.name : null,
        Options:
        formData.qnTypeId === "2"
            ? formData.options
                .filter(opt => opt.optionText && opt.optionText.trim() !== "") 
                .map(opt => ({
                    OptionText: opt.optionText.trim(),
                    Answer: opt.isCorrect ?? false
                }))
            : null
    };


        console.log("Payload to API:", payload);
        const response = await fetch(`${config.API_BASE_URL}api/Question/Add`, {
            method: "POST",
            headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json',
                },
            body: JSON.stringify(payload),
           
        });
        console.log("Raw response object:", response);

        const result = await response.json();
        console.log("Response JSON:", result);
        if (!response.ok) throw new Error(result?.error || "Insert failed");

        toast.success("Question added successfully");
        setFormData({
            id: 0,
            subId: 0,
            qnTypeId: "",
            name: "",
            mark: 0,
            remarks: "",
            sketch: null,
            options: [{ optionText: "", isCorrect: false }],
        });
        fetchQuestionData();
    } catch (err) {
        console.error(err);
        toast.error(err.message);
    } finally {
        setLoading(false);
        setShowModal(false);
    }
};

const handleQnTypeChange = (e) => {
  const type = e.target.value;
  setFormData((prev) => ({
    ...prev,
    qnTypeId: type,
    options: type === "2" ? prev.options.length ? prev.options : [{ optionText: "", isCorrect: false }] : [],
    sketch: type === "1" ? prev.sketch : null
  }));
};

  // Fetch subjects
useEffect(() => {
    if (!loginData?.tenantId) return;
    fetchSubjectData();
    fetchQuestionData();
}, [loginData?.tenantId]);

const fetchSubjectData = async () => {
    try {
        const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
            method: 'POST',
            headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: '',
                procedureName: 'SP_ExamManage',
                parameters: { QueryChecker: 2 },
            }),
        });
        const data = await response.json();
        setSubjectData(data);

        // Automatically select first subject
        if (data.length > 0) setFormData(prev => ({ ...prev, subId: data[0].Id }));
    } catch (error) {
        toast.error('Failed to load subjects');
    }
};

const fetchQuestionData = async () => {
   
    try {
        const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
            method: 'POST',
            headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: '',
                procedureName: 'SP_ExamManage',
                parameters: { QueryChecker: 5 },
            }),
        });
        const data = await response.json();
        setQuestionData(data);
    } catch (error) {
        toast.error('Failed to load question data');
    }
};


    //  Filter subjects
    useEffect(() => {
        let filteredData = questionData;
        if (searchQuery.trim() !== '') {
            filteredData = filteredData.filter(question =>
                question.Question.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredQuestion(filteredData);
    }, [searchQuery, questionData]);

    const handleDownloadExcel = () => {
        if (filteredQuestion.length === 0) return alert('No data available to export!');
        const worksheet = XLSX.utils.json_to_sheet(v);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Subjects');
        XLSX.writeFile(workbook, 'Subjects_Report.xlsx');
    };

    //  Open edit modal
    const openEditModal = (question) => {
    setIsEdit(true);
    setEditId(question.Id);

    setFormData({
        
        id: question.Id,
        subId: question.SubId || 0,
        qnTypeId: question.QnType === "Descriptive" ? "1" : "2",
        name: question.Name || '',
        mark: question.Mark || 0,
        remarks: question.Remarks || '',
        sketch: question.Sketch || null,
        options:
            question.QnType === "MCQ" && question.Options
                ? question.Options.map(opt => ({
                    optionText: opt.OptionText || "",
                    isCorrect: opt.Answer || false
                }))
                : [{ optionText: "", isCorrect: false }],
    });

    setShowModal(true);
};



    // Update subject
    const handleUpdateSubmit = async (e) => {
    // e.preventDefault();
    // try {
    //     const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
    //         method: 'POST',
    //         headers: {
    //             TenantId: loginData.tenantId,
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             operation: '',
    //             procedureName: 'SP_ExamManage', 
    //             parameters: {
    //                 QueryChecker: 6,     
    //                 Id: editId,
    //                 SubId: formData.subId, 
    //                 Name: formData.name,
    //                 Mark: formData.mark,
    //                 Remarks: formData.remarks,
    //                 UpdateBy: loginData.UserId,
    //             },
    //         }),
    //     });

    //     if (!response.ok) throw new Error(`Update failed!`);
    //     toast.success(`Question updated successfully`);
        
    //     // Refresh question list
    //     await fetchQuestionData();

    //     // Reset form
    //     setFormData({ subId: '', name: '', mark: '', remarks: '' });

    // } catch (err) {
    //     toast.error(err.message);
    // } finally {
    //     setShowModal(false);
    //     setIsEdit(false);
    //     setEditId(null);
    // }
    };

    const openDeleteModal = (id) => {
        setSelectedId(id);
        setDeleteSuccessMsg("");
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        // try {
        //     const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
        //         method: 'POST',
        //         headers: {
        //             TenantId: loginData.tenantId,
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             operation: '',
        //             procedureName: 'SP_ExamManage',
        //             parameters: { QueryChecker: 8, Id: selectedId },
        //         }),
        //     });
        //     if (!response.ok) throw new Error('Failed to delete');
        //     setDeleteSuccessMsg("Item deleted successfully."); 
        //     setTimeout(() => setIsDeleteModalOpen(false), 2000);
        //     fetchQuestionData();
        // } catch (error) {
        //     toast.error("Delete failed. Please try again.");
        //     setIsDeleteModalOpen(false);
        // }
    };

    return (
        <div className="overflow-x-auto p-3">
            <style jsx>{`
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
            `}</style>


            <div className="rounded-md font-roboto overflow-hidden">
                <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">
                    <div className="px-3 py-2 flex flex-wrap justify-between items-center gap-2">
                        <div className='flex items-center gap-3'>
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

                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>
                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr className="border-b">
                                  <th className="px-4 py-2 text-center w-[5%]">SL</th>                                 
                                  <th className="px-4 py-2 text-center w-[50%]">Question</th>   
                                  <th className="px-4 py-2 text-center w-[50%]">Type</th>             
                                  <th className="px-4 py-2 text-center w-[10%]">Mark</th>
                                  <th className="px-4 py-2 text-center w-[15%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-xs text-gray-700">
                            {filteredQuestion.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">No data found</td>
                                </tr>
                            ) : (
                                filteredQuestion.map((question, index) => (
                                    <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
                                        <td data-label="Reg Date" className="px-4 py-2 text-center"> {index + 1}</td>
                                        <td data-label="Subject" className="px-4 py-2 text-center">{question.Name}</td>
                                        <td data-label="Question" className="px-4 py-2 text-center">{question.QnType}</td>                                    
                                        <td data-label="Mark" className="px-4 py-2 text-center">{question.Mark}</td>
                                        <td data-label="Actions" className="px-4 py-2 text-center">
                                            <div className="text-base flex items-end gap-3">
                                                <button
                                                    onClick={() => openEditModal(question)}
                                                    title="Edit"
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                                                >
                                                    <FiEdit className="text-base" />
                                                </button>

                                                <button
                                                    onClick={() => openDeleteModal(question.Id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
                                                >
                                                    <FiTrash2 className="text-base" />
                                                </button>

                                                {/* Modal */}
                                                <DeleteConfirmModal
                                                    isOpen={isDeleteModalOpen}
                                                    onClose={() => setIsDeleteModalOpen(false)}
                                                    onConfirm={handleConfirmDelete}
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

            {showModal && (
                <div className="fixed inset-0 bg-black/20  bg-opacity-40 z-50 flex items-center justify-center">
                    <div data-aos="zoom-in" className="bg-white rounded-lg shadow-md p-6 w-full max-w-xl relative">
                        <form method="dialog">
                        <button
                            onClick={() => setShowModal(false)}
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        >
                            ✕
                        </button>
                        </form>

                        {/* Modal Title */}
                        <div className="border-b border-gray-300 pb-2 mb-4">
                        <h3 className="font-bold text-lg">Question Entry</h3>
                        </div>

                        <form
                        onSubmit={isEdit ? handleUpdateSubmit : handleSubmit}
                        className="space-y-4 text-sm"
                        >
                        {/* Subject */}
                        <div className="flex items-center gap-2 mt-2">
                            <label className="w-1/3 text-sm font-semibold text-gray-700">
                            Subject Name
                            </label>
                            <Select
                            name="subId"
                            value={subjectData.find((s) => s.Id === formData.subId) || null}
                            onChange={(selected) =>
                                setFormData((prev) => ({ ...prev, subId: selected?.Id || "" }))
                            }
                            options={subjectData}
                            getOptionLabel={(option) => option.Name}
                            getOptionValue={(option) => option.Id}
                            placeholder="Select Subject"
                            className="w-full"
                            isClearable
                            />
                        </div>

                        {/* Question Type */}
                        <div className="flex items-center gap-2 mt-2">
                            <label className="w-1/3 text-sm font-semibold text-gray-700">
                            Question Type
                            </label>
                            <select
                                name="qnTypeId"
                                value={formData.qnTypeId}
                                onChange={handleQnTypeChange}
                                className="w-full border rounded p-2"
                                >
                                <option value="">-- Select Question Type --</option>
                                <option value="1">Descriptive</option>
                                <option value="2">MCQ</option>
                                </select>

                        </div>

                        {/* Descriptive Fields */}
                        {formData.qnTypeId === "1" && (
                            <>
                            {/* Question */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">
                                Question
                                </label>
                                <textarea
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                                rows={3}
                                required
                                />
                            </div>

                            {/* Mark */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">
                                Mark
                                </label>
                                <input
                                type="number"
                                name="mark"
                                value={formData.mark ?? ""}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                                required
                                min="0"
                                step="0.1"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">
                                Upload Image
                                </label>
                                <input
                                type="file"
                                name="sketch"
                                onChange={handleFileChange}
                                className="w-full border px-3 py-2 rounded"
                                />
                            </div>
                            </>
                        )}

                        {/* MCQ Fields */}
                        {formData.qnTypeId === "2" && (
                            <>
                            {/* Question */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">
                                Question
                                </label>
                                <textarea
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                                rows={3}
                                required
                                />
                            </div>

                            {/* Mark */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">
                                Mark
                                </label>
                                <input
                                type="number"
                                name="mark"
                                value={formData.mark ?? ""}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                                required
                                min="0"
                                step="0.1"
                                />
                            </div>

                            {/* MCQ Options */}
                            <div className="mt-3">
                                {/* Header Row */}
                                <div className="flex gap-2 px-1 mb-1">
                                    <span className="flex-1 text-sm font-semibold text-gray-700">Options</span>
                                    <span className="w-21 text-sm font-semibold text-gray-700 text-center">Choose Ans</span>
                                    <span className="w-8"></span> 
                                </div>

                                {/* Option Rows */}
                                {formData.options.map((opt, index) => (
                                    <div key={index} className="flex gap-2 mt-2 items-center">
                                    {/* Option Text Input */}
                                    <input
                                        type="text"
                                        value={opt.optionText}
                                        onChange={(e) => handleOptionChange(index, "optionText", e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="flex-1 min-w-0 border px-2 py-1 rounded"
                                    />

                                    {/* Checkbox */}
                                    <div className="flex justify-center items-center w-16">
                                        <input
                                        type="checkbox"
                                        checked={opt.isCorrect}
                                        onChange={(e) => handleOptionChange(index, "isCorrect", e.target.checked)}
                                        />
                                    </div>

                                    {/* Delete Button */}
                                    <div className=" flex justify-center">
                                        <button
                                        type="button"
                                        className="px-2 bg-red-500 text-white rounded flex items-center justify-center"
                                        onClick={() => removeOption(index)}
                                        >
                                        <FiTrash2 className="text-base" />
                                        </button>
                                    </div>
                                    </div>
                                ))}

                                {/* Add Option Button */}
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
                                >
                                    Add Option
                                </button>
                                </div>

                            </>
                        )}

                        {/* Buttons */}
                        {formData.qnTypeId && ( 
                            <div className="flex justify-end space-x-2 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {isEdit ? "Update" : "Save"}
                            </button>
                            </div>
                        )}
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}