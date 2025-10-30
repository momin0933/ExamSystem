'use client';
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Select from 'react-select';

export default function AddQuestion() {
    const { loginData } = useContext(AuthContext);

    // State Declaration 

    const [questionData, setQuestionData] = useState([]);
    const [filteredQuestion, setFilteredQuestion] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");
    const [subjectData, setSubjectData] = useState([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [previewQuestions, setPreviewQuestions] = useState([]);

    const [questionImage, setQuestionImage] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [descriptiveMode, setDescriptiveMode] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const initialFormData = {
        id: 0,
        subId: "",
        qnTypeId: "",
        name: "",
        mark: 0,
        remarks: "",
        sketch: null,
        options: [{ optionText: "", isCorrect: false }],
    };
    const [formData, setFormData] = useState({ ...initialFormData });

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

    // Modal handlers

    const handleOpenModal = () => {
        setShowModal(true);
        setIsEdit(false);
        setEditId(null);
        setFormData({ ...initialFormData });
        setQuestionImage(null);
        setExistingImage(null);
        setDescriptiveMode("");
    };

    const openEditModal = async (question) => {
        if (!question?.QuestionId) return console.error("Invalid question ID");

        setIsEdit(true);
        setEditId(question.QuestionId);

        let options = [{ optionText: "", isCorrect: false }];

        if (question.QnType === "MCQ") {
            try {
                const res = await fetch(
                    `${config.API_BASE_URL}api/Question/GetByQuestion/${question.QuestionId}`,
                    {
                        headers: {
                            TenantId: loginData.tenantId,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.ok) {
                    const apiOptions = await res.json();
                    options = apiOptions.map((opt) => ({
                        id: opt.Id || 0,
                        optionText: opt.OptionText || "",
                        isCorrect: opt.Answer ?? false,
                    }));

                    if (options.length < 2) options.push({ optionText: "", isCorrect: false });
                }
            } catch (err) {
                console.error("Error fetching MCQ options:", err);
            }
        }

        setFormData({
            id: question.QuestionId,
            subId: question.SubjectId || "",
            qnTypeId: question.QnType === "Descriptive" ? "1" : "2",
            name: question.Name || "",
            mark: question.Mark ?? 0,
            remarks: question.Remarks || "",
            sketch: null, // new file
            options: options,
        });

        // FIX: Store the existing image as is (could be full path or filename)
        setExistingImage(question.Sketch || null);
        setQuestionImage(null);
        // if (question.QnType === "Descriptive") {
        //     setDescriptiveMode("manual");
        // } else {
        //     setDescriptiveMode("");
        // }
        setDescriptiveMode(question.QnType === "Descriptive" ? "manual" : "");
        setShowModal(true);
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

    // Form handlers
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
        }));
    };

    const handleQuestionImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const previewUrl = URL.createObjectURL(file);
            setQuestionImage(previewUrl);

            const formDataToSend = new FormData();
            formDataToSend.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataToSend
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            if (isEdit) {
                setFormData(prev => ({ ...prev, sketch: file }));
                setExistingImage(data.filename);
            } else {
                setFormData(prev => ({ ...prev, sketch: data.filename }));
            }

        } catch (err) {
            console.error('Upload error:', err);
            toast.error(err.message);
            setQuestionImage(null);
            setFormData(prev => ({ ...prev, sketch: null }));
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveQuestionImage = () => {
        setQuestionImage(null);
        setExistingImage(null);
        setFormData(prev => ({ ...prev, sketch: null }));
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

    const handleQnTypeChange = (e) => {
        const type = e.target.value;
        setFormData((prev) => ({
            ...prev,
            qnTypeId: type,
            options: type === "2" ? prev.options.length ? prev.options : [{ optionText: "", isCorrect: false }] : [],
            sketch: type === "1" ? prev.sketch : null
        }));
    };


    // Excel handling
    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            const questions = json.map((row) => ({
                question: row.Question || "No Question Text",
                mark: row.Mark || 1,
                image: row.Image || null,
            }));

            setPreviewQuestions(questions);
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadExcel = () => {
        if (filteredQuestion.length === 0) return alert('No data available to export!');
        const worksheet = XLSX.utils.json_to_sheet(filteredQuestion);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
        XLSX.writeFile(workbook, 'Questions_Report.xlsx');
    };


    const handleSubmit = async ({ isBulk = false }) => {
        debugger;
        try {
            setLoading(true);

            let questionsToSave = [];

            if (isBulk) {
                // Bulk mode: Excel upload
                if (!previewQuestions || previewQuestions.length === 0) {
                    throw new Error("No questions to save in bulk mode");
                }

                questionsToSave = previewQuestions.map((q) => {
                    const sketchPath = q.sketch ? `/images/questionImage/${q.sketch}` : null;

                    return {
                        SubId: Number(formData.subId),
                        Name: q.name?.trim() || q.question?.trim(),
                        QnType: "Descriptive",
                        Mark: q.mark ?? 0,
                        Remarks: q.remarks ?? "",
                        EntryBy: loginData?.UserId,
                        Sketch: sketchPath,
                        Options: null,
                    };
                });
            } else {
                // Manual single question
                if (!formData.subId) throw new Error("Please select a subject.");
                if (!formData.qnTypeId) throw new Error("Please select a question type.");
                if (!formData.name?.trim()) throw new Error("Question text cannot be empty.");
                if (formData.mark === undefined || formData.mark === null) throw new Error("Question Mark cannot be empty.");

                if (formData.qnTypeId.toString() === "2" && formData.options.length < 2)
                    throw new Error("MCQ must have at least 2 options.");

                const sketchPath = formData.sketch ? `/images/questionImage/${formData.sketch}` : null;

                questionsToSave = [
                    {
                        SubId: Number(formData.subId),
                        Name: formData.name.trim(),
                        QnType: formData.qnTypeId.toString() === "1" ? "Descriptive" : "MCQ",
                        Mark: formData.mark ?? 0,
                        Remarks: formData.remarks ?? "",
                        EntryBy: loginData?.UserId,
                        Sketch: sketchPath,
                        Options:
                            formData.qnTypeId.toString() === "2"
                                ? formData.options
                                    .filter((opt) => opt.optionText && opt.optionText.trim() !== "")
                                    .map((opt) => ({
                                        OptionText: opt.optionText.trim(),
                                        Answer: opt.isCorrect ?? false,
                                    }))
                                : null,
                    },
                ];
            }

            // Determine endpoint
            const endpoint = isBulk
                ? `${config.API_BASE_URL}api/Question/SaveBulk`
                : `${config.API_BASE_URL}api/Question/Add`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    TenantId: loginData.tenantId,
                },
                // body: JSON.stringify(questionsToSave),
                body: JSON.stringify(isBulk ? questionsToSave : questionsToSave[0]),

            });

            let result = null;
            const text = await response.text();
            if (text) result = JSON.parse(text);

            if (!response.ok) throw new Error(result?.error || "Failed to save questions");

            toast.success(isBulk ? "Questions saved successfully!" : "Question added successfully!");

            // Reset form and preview
            if (!isBulk) {
                setFormData({ ...initialFormData });
                setQuestionImage(null);
                setExistingImage(null);
                setShowModal(false);
            } else {
                setPreviewQuestions([]);
            }
            setShowModal(false);
            // Refresh questions list
            await fetchQuestionsBySubject(selectedSubject || "");
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleUpdateSubmit = async (e) => {
        debugger;
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.subId) throw new Error("Please select a subject.");
            if (!formData.qnTypeId) throw new Error("Please select a question type.");
            if (!formData.name.trim()) throw new Error("Question text cannot be empty.");
            if (!formData.mark) throw new Error("Question Mark cannot be empty.");
            if (formData.qnTypeId === "2" && formData.options.length < 2)
                throw new Error("MCQ must have at least 2 options.");

            let finalSketch = existingImage;

            if (formData.sketch && typeof formData.sketch === 'object') {
                setIsUploading(true);

                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.sketch);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');

                finalSketch = uploadData.filename;
                setIsUploading(false);
            }

            // Check if existingImage already contains the full path
            let sketchPath = null;
            if (finalSketch) {
                // If the image already has the full path, use it as is
                if (finalSketch.startsWith('/images/questionImage/')) {
                    sketchPath = finalSketch;
                } else {
                    // Otherwise, prepend the path
                    sketchPath = `/images/questionImage/${finalSketch}`;
                }
            }

            const payload = {
                Id: formData.id,
                SubId: Number(formData.subId),
                Name: formData.name.trim(),
                QnType: formData.qnTypeId === "1" ? "Descriptive" : "MCQ",
                Mark: formData.mark ?? 0,
                Remarks: formData.remarks ?? "",
                UpdateBy: loginData?.UserId,
                Sketch: sketchPath, // Use the corrected path
                Options: formData.qnTypeId === "2"
                    ? formData.options
                        .filter(opt => opt.optionText && opt.optionText.trim() !== "")
                        .map(opt => ({
                            Id: opt.id || 0,
                            OptionText: opt.optionText.trim(),
                            Answer: opt.isCorrect ?? false
                        }))
                    : null
            };

            console.log("Update Payload:", payload);

            const res = await fetch(`${config.API_BASE_URL}api/Question/Update`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result?.error || "Update failed");

            toast.success("Question updated successfully");
            setShowModal(false);
            //fetchQuestionsBySubject();
            if (selectedSubject && selectedSubject !== "") {

                await fetchQuestionsBySubject(selectedSubject);
            } else {

                await fetchQuestionsBySubject();
            }

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
            setIsUploading(false);
        }
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
        <div className="overflow-x-auto p-3">
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
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
            </div>
            <div className="rounded-md font-roboto overflow-hidden">
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
                                    className="block w-full pl-10 pr-3 py-[6px] border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm"
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


                            <div className="w-full sm:w-auto min-w-[180px] max-w-[300px]">
                                {subjectData.length > 0 && (
                                    <Select
                                        name="filterSubject"
                                        value={
                                            selectedSubject === ""
                                                ? { value: "", label: "All Position" }
                                                : subjectData.find(s => s.value === selectedSubject) || null
                                        }
                                        onChange={(selected) => {
                                            const subId = selected?.value || "";
                                            setSelectedSubject(subId);
                                            fetchQuestionsBySubject(subId);
                                        }}
                                        options={[
                                            { value: "", label: "All Position" },
                                            ...subjectData
                                        ]}
                                        placeholder="Select or search position..."
                                        className="w-full"
                                        isClearable
                                        isSearchable
                                    />
                                )}
                            </div>
                        </div>

                        <div className='flex items-center gap-3'>
                            <Link onClick={handleOpenModal} href="#" passHref className="text-lg text-gray-50 cursor-pointer">
                                <IoMdAddCircle className="text-xl" />
                            </Link>
                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>
                    <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[59vh] overflow-y-auto">
                        <table className="min-w-full text-sm text-left text-gray-600">
                            {/* <thead className="bg-gray-100 text-xs uppercase text-gray-700"> */}
                            <thead className="bg-gray-100 text-xs uppercase text-gray-700 sticky top-0">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-center">SL</th>
                                    <th className="px-4 py-2">Position</th>
                                    <th className="px-4 py-2">Question</th>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2">Mark</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-xs text-gray-700">
                                {filteredQuestion.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">No data found</td>
                                    </tr>
                                ) : (
                                    filteredQuestion.map((question, index) => (
                                        <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
                                            <td data-label="SL" className="px-4 py-2 text-center">{index + 1}</td>
                                            <td data-label="Subject" className="px-4 py-2">{question.SubjectName}</td>
                                            <td data-label="Question" className="px-4 py-2">{question.Name}</td>
                                            <td data-label="Type" className="px-4 py-2">{question.QnType}</td>
                                            <td data-label="Mark" className="px-4 py-2 text-center">{question.Mark}</td>
                                            <td data-label="Actions" className="px-4 py-2 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => openViewModal(question)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiEye className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(question)}
                                                        title="Edit"
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                                                    >
                                                        <FiEdit className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(question)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
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

            {showModal && (
                <div className="fixed inset-0 bg-black/20 bg-opacity-40 z-50 flex items-center justify-center">
                    <div data-aos="zoom-in" className="bg-white rounded-lg shadow-md  w-full max-w-xl relative overflow-y-auto max-h-[90vh] p-6">
                        <button
                            onClick={() => {

                                setFormData({ ...initialFormData });
                                setQuestionImage(null);
                                setExistingImage(null);
                                setDescriptiveMode("");
                                setIsUploading(false);
                                setShowModal(false);
                            }}
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        >
                            ✕
                        </button>


                        <div className="border-b border-gray-300 pb-2 mb-4">
                            <h3 className="font-bold text-lg"> {isEdit ? "Update Question" : "Question Entry"}</h3>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (isEdit) {
                                    handleUpdateSubmit(e);
                                } else {
                                    handleSubmit({ isBulk: descriptiveMode === "excel" });
                                }
                            }}
                            className="space-y-4 text-sm"
                        >
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">Position Name</label>
                                <Select
                                    name="subId"
                                    value={subjectData.find((s) => s.value === formData.subId) || null}
                                    onChange={(selected) => setFormData((prev) => ({ ...prev, subId: selected?.value || "" }))}
                                    options={subjectData}
                                    placeholder="Select Subject"
                                    className="w-full"
                                    isClearable
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">Question Type</label>
                                <select name="qnTypeId" value={formData.qnTypeId} onChange={handleQnTypeChange} className="w-full border rounded p-2">
                                    <option value="">-- Select Question Type --</option>
                                    <option value="1">Descriptive</option>
                                    <option value="2">MCQ</option>
                                </select>
                            </div>



                            {formData.qnTypeId === "1" && !isEdit && (
                                <div className="flex items-center gap-2 mt-2">
                                    <label className="w-1/3 text-sm font-semibold text-gray-700">Add Mode</label>
                                    <select
                                        value={descriptiveMode}
                                        onChange={(e) => setDescriptiveMode(e.target.value)}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="">-- Select Mode --</option>
                                        <option value="manual">Add Manual Question</option>
                                        <option value="excel">Upload Excel File</option>
                                    </select>
                                </div>
                            )}

                            {/* --- Manual Question Mode --- */}
                            {descriptiveMode === "manual" && (
                                <div className="mt-2 space-y-2">
                                    {/* Question Text */}
                                    <div className="flex items-center gap-2">
                                        <label className="w-1/3 text-sm font-semibold text-gray-700">Question</label>
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
                                    <div className="flex items-center gap-2">
                                        <label className="w-1/3 text-sm font-semibold text-gray-700">Mark</label>
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



                                    <div className="w-full h-40 rounded-lg border border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                                        {questionImage ? (
                                            <img
                                                src={questionImage}
                                                alt="Question Preview"
                                                className="object-cover w-full h-full"
                                            />
                                        ) : existingImage ? (
                                            <img
                                                src={existingImage}
                                                alt="Existing Question Image"
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-sm">Select Question Image</span>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleQuestionImageChange}
                                            disabled={isUploading}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => document.querySelector('input[type="file"]').click()}
                                            className={`px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700`}
                                        >
                                            {questionImage || existingImage ? "Change" : "Upload"}
                                        </button>

                                        {(questionImage || existingImage) && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveQuestionImage}
                                                className="text-gray-600 text-sm hover:text-red-500"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- Excel Upload Mode --- */}
                            {descriptiveMode === "excel" && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 mt-2">
                                        <label className="w-1/3 text-sm font-semibold text-gray-700">
                                            Upload Excel File
                                        </label>
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleExcelUpload}
                                            className="w-full border rounded p-2"
                                        />
                                    </div>



                                    {previewQuestions.length > 0 && (
                                        <div className="mt-2">
                                            <h5 className="font-semibold text-gray-700 mb-1">Preview Questions</h5>
                                            <div className="space-y-2">
                                                {previewQuestions.map((q, idx) => (
                                                    <div key={idx} className="p-2 border rounded bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <p>{idx + 1}. {q.question}</p>
                                                            <span className="text-gray-600 font-semibold">Mark: {q.mark}</span>
                                                        </div>
                                                        {q.image && (

                                                            <img src={`data:image/png;base64,${q.image}`} alt="Question" className="mt-1 w-full h-32 object-cover rounded" />


                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.qnTypeId === "2" && (
                                <>
                                    <div className="flex items-center gap-2 mt-2">
                                        <label className="w-1/3 text-sm font-semibold text-gray-700">Question</label>
                                        <textarea name="name" value={formData.name} onChange={handleChange} className="w-full border px-3 py-2 rounded" rows={3} required />
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <label className="w-1/3 text-sm font-semibold text-gray-700">Mark</label>
                                        <input type="number" name="mark" value={formData.mark ?? ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" required min="0" step="0.1" />
                                    </div>

                                    <div className="w-full h-40 rounded-lg border border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                                        {questionImage ? (
                                            <img
                                                src={questionImage}
                                                alt="Question Preview"
                                                className="object-cover w-full h-full"
                                            />
                                        ) : existingImage ? (
                                            <img
                                                src={existingImage}
                                                alt="Existing Question Image"
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-sm">Select Question Image</span>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleQuestionImageChange}
                                            disabled={isUploading}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => document.querySelector('input[type="file"]').click()}
                                            className={`px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700`}
                                        >
                                            {questionImage || existingImage ? "Change" : "Upload"}
                                        </button>

                                        {(questionImage || existingImage) && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveQuestionImage}
                                                className="text-gray-600 text-sm hover:text-red-500"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {isUploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}

                                    <div className="mt-3">
                                        <div className="flex gap-2 px-1 mb-1">
                                            <span className="flex-1 text-sm font-semibold text-gray-700">Options</span>
                                            <span className="w-21 text-sm font-semibold text-gray-700 text-center">Choose Ans</span>
                                            <span className="w-8"></span>
                                        </div>
                                        {formData.options.map((opt, index) => (
                                            <div key={index} className="flex gap-2 mt-2 items-center">
                                                <input type="text" value={opt.optionText} onChange={(e) => handleOptionChange(index, "optionText", e.target.value)} placeholder={`Option ${index + 1}`} className="flex-1 min-w-0 border px-2 py-1 rounded" />
                                                <div className="flex justify-center items-center w-16">
                                                    <input type="checkbox" checked={opt.isCorrect} onChange={(e) => handleOptionChange(index, "isCorrect", e.target.checked)} />
                                                </div>
                                                <div className="flex justify-center">
                                                    <button type="button" className="px-2 bg-red-500 text-white rounded flex items-center justify-center" onClick={() => removeOption(index)}>
                                                        <FiTrash2 className="text-base" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button type="button" onClick={addOption} className="mt-2 px-3 py-1 bg-green-500 text-white rounded">
                                            Add Option
                                        </button>
                                    </div>
                                </>
                            )}

                            {formData.qnTypeId && (
                                <div className="flex justify-end space-x-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {

                                            setFormData({ ...initialFormData });
                                            setQuestionImage(null);
                                            setExistingImage(null);
                                            setDescriptiveMode("");
                                            setShowModal(false);
                                        }}
                                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                        {isEdit ? "Update" : "Save"}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {isViewModalOpen && viewData && (

                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                    <div data-aos="zoom-in" className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 text-lg font-bold"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="border-b border-gray-200 pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">View Question Details</h3>
                        </div>

                        <div className="space-y-4 text-sm text-gray-700">
                            {/* Position */}
                            <div className="flex items-center gap-2">
                                <span className="w-32 font-semibold text-gray-800">Position</span>
                                <span className="flex-1">{subjectData.find(s => s.value === viewData.SubjectId)?.label || "-"}</span>
                            </div>

                            {/* Question Type */}
                            <div className="flex items-center gap-2">
                                <span className="w-32 font-semibold text-gray-800">Question Type</span>
                                <span className="flex-1">{viewData.QnType}</span>
                            </div>

                            {/* Question */}
                            <div className="flex items-start gap-2">
                                <span className="w-32 font-semibold text-gray-800">Question</span>
                                <p className="flex-1 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-200">{viewData.Name}</p>
                            </div>

                            {/* Mark */}
                            <div className="flex items-center gap-2">
                                <span className="w-32 font-semibold text-gray-800">Mark</span>
                                <span className="flex-1">{viewData.Mark}</span>
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
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
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