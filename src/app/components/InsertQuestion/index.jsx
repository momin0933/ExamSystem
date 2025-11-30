// pages/insertQuestion.js
'use client';
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../provider/AuthProvider';
import * as XLSX from 'xlsx';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiTrash2 } from "react-icons/fi";
import Select from 'react-select';

export default function InsertQuestion() {
    const { loginData } = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('editId');

    // State Declaration
    const [loading, setLoading] = useState(false);
    const [subjectData, setSubjectData] = useState([]);
    const [questionImage, setQuestionImage] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [descriptiveMode, setDescriptiveMode] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [previewQuestions, setPreviewQuestions] = useState([]);
    const [isEdit, setIsEdit] = useState(false);

    // Remove mounted state and use a different approach
    const [isClient, setIsClient] = useState(false);

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

    // Set client state and handle body overflow only on client
    useEffect(() => {
        setIsClient(true);

        // Only run on client
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Fetch subjects when tenantId is available
    useEffect(() => {
        if (!loginData?.tenantId) return;
        fetchSubjectData();
    }, [loginData?.tenantId]);

    // Fetch question data if in edit mode
    useEffect(() => {
        if (editId && loginData?.tenantId) {
            setIsEdit(true);
            fetchQuestionData(editId);
        }
    }, [editId, loginData?.tenantId]);

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

    const fetchQuestionData = async (questionId) => {
        debugger
        try {
            setLoading(true);

            // Fetch question details
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
            console.log("Edit Question data", data)
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
            } : null;

            if (question) {
                let options = [{ optionText: "", isCorrect: false }];

                // Fetch MCQ options if question is MCQ
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

                // Set form data
                setFormData({
                    id: question.QuestionId,
                    subId: question.SubjectId || "",
                    qnTypeId: question.QnType === "Descriptive" ? "1" : "2",
                    name: question.Name || "",
                    mark: question.Mark ?? 0,
                    remarks: question.Remarks || "",
                    sketch: null,
                    options: options,
                });

                // FIX: Only set existingImage, not questionImage in edit mode
                setExistingImage(question.Sketch || null);
                setQuestionImage(null);
                // setDescriptiveMode(question.QnType === "Descriptive" ? "manual" : "");
                setDescriptiveMode("manual");
            }
        } catch (err) {
            console.error(`Error fetching question:`, err);
            toast.error('Failed to load question data');
        } finally {
            setLoading(false);
        }
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
            options: type === "2" ? (prev.options.length ? prev.options : [{ optionText: "", isCorrect: false }]) : [],
            sketch: type === "1" ? prev.sketch : null
        }));
    };

    const handleDescriptiveModeChange = (e) => {
        const val = e.target.value;
        setDescriptiveMode(val);

        // If user chooses Excel -> force Question Type to Descriptive (1)
        if (val === "excel") {
            setFormData((prev) => ({ ...prev, qnTypeId: "1" }));
        } else {
            // For manual mode reset question type
            setFormData((prev) => ({ ...prev, qnTypeId: "" }));
        }
    };

    // Excel handling
    const handleExcelUpload = (e) => {
        if (isEdit) {
            toast.error("Excel upload is not available in edit mode");
            return;
        }

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

    const handleSubmit = async ({ isBulk = false }) => {
        try {
            setLoading(true);

            if (isEdit) {
                await handleUpdateSubmit();
                return;
            }

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

                if (formData.qnTypeId.toString() === "2") {
                    if (formData.options.length < 2) {
                        toast.error("MCQ must have at least 2 options.");
                        setLoading(false);
                        return;
                    }

                    const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect);
                    if (!hasCorrectAnswer) {
                        toast.error("Please select at least one correct answer for MCQ.");
                        setLoading(false);
                        return;
                    }
                }

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
                body: JSON.stringify(isBulk ? questionsToSave : questionsToSave[0]),
            });

            let result = null;
            const text = await response.text();
            if (text) result = JSON.parse(text);

            if (!response.ok) throw new Error(result?.error || "Failed to save questions");

            toast.success(isBulk ? "Questions saved successfully!" : "Question added successfully!");

            // Reset form and redirect back
            setFormData({ ...initialFormData });
            setQuestionImage(null);
            setExistingImage(null);
            setPreviewQuestions([]);

            // Redirect back to question list
            router.push('/addQuestion');

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async () => {
        try {
            if (!formData.subId) throw new Error("Please select a subject.");
            if (!formData.qnTypeId) throw new Error("Please select a question type.");
            if (!formData.name.trim()) throw new Error("Question text cannot be empty.");
            if (!formData.mark) throw new Error("Question Mark cannot be empty.");

            if (formData.qnTypeId.toString() === "2") {
                if (formData.options.length < 2) {
                    toast.error("MCQ must have at least 2 options.");
                    setLoading(false);
                    return;
                }

                const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect);
                if (!hasCorrectAnswer) {
                    toast.error("Please select at least one correct answer for MCQ.");
                    setLoading(false);
                    return;
                }
            }

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
                Sketch: sketchPath,
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

            // Redirect back to question list
            router.push('/addQuestion');

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
            setIsUploading(false);
        }
    };


    if (!isClient) {
        return (
            <div className="overflow-x-auto p-3">
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEdit ? "Edit Question" : "Add New Question"}
                    </h1>
                </div>
                <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[72vh] overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center py-4">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto p-2">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? "Edit Question" : "Add New Question"}
                </h1>
            </div>
            <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[72vh] overflow-y-auto">
                <div className="bg-white rounded-sm shadow-md p-6">
                    {loading && !isEdit ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit({ isBulk: descriptiveMode === "excel" });
                            }}
                            className="space-y-4 text-sm"
                        >

                            <div className="flex flex-wrap gap-4">
                                {/* Position Name */}
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <label className="w-32 text-sm font-semibold text-gray-800">
                                        Position Name <span className="text-red-500">*</span>
                                    </label>:
                                    <Select
                                        name="subId"
                                        value={subjectData.find((s) => s.value === formData.subId) || null}
                                        onChange={(selected) => setFormData((prev) => ({ ...prev, subId: selected?.value || "" }))}
                                        options={subjectData}
                                        placeholder="Select Position"
                                        className="flex-1 "
                                        isClearable
                                        classNamePrefix="custom-select"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "34px",
                                                borderRadius: "4px",
                                                // borderColor: "#D1D5DB",
                                                // boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                // "&:hover": { borderColor: "#3B82F6" },
                                            }),
                                            menu: (base) => ({ ...base, zIndex: 9999 }),
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        menuPortalTarget={isClient ? document.body : null}
                                        required
                                    />
                                </div>

                                {/* Add Mode */}
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <label className="w-32 text-sm font-semibold text-gray-800">
                                        Add Mode <span className="text-red-500">*</span>
                                    </label>:
                                    <select
                                        value={descriptiveMode}
                                        onChange={handleDescriptiveModeChange}
                                        className="flex-1 min-h-[37px] border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                                        required
                                    >
                                        <option value="">-- Select Mode --</option>
                                        <option value="manual">Add Manual Question</option>
                                        <option value="excel">Upload Excel File</option>
                                    </select>
                                </div>
                            </div>


                            {/* Question Type - Show only when manual mode is selected */}
                            {descriptiveMode === "manual" && (
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <label className="w-32 text-sm font-semibold text-gray-800">
                                        Question Type<span className="text-red-500">*</span>
                                    </label>:
                                    <select
                                        name="qnTypeId"
                                        value={formData.qnTypeId}
                                        onChange={handleQnTypeChange}
                                        className="flex-1 border border-gray-300 rounded-sm p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 "
                                        required
                                    >
                                        <option value="">-- Select Question Type --</option>
                                        <option value="1">Descriptive</option>
                                        <option value="2">MCQ</option>
                                    </select>
                                </div>
                            )}

                            {/* Manual Descriptive Question - Show when manual mode AND descriptive type selected */}
                            {descriptiveMode === "manual" && formData.qnTypeId === "1" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="w-32 text-sm  font-semibold text-gray-800">Question <span className="text-red-500">*</span></label>:
                                        <textarea
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="flex-1 border border-gray-400 rounded-sm p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 "
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="w-32 text-sm font-semibold text-gray-800">
                                            Mark <span className="text-red-500">*</span>
                                        </label>:
                                        <input
                                            type="number"
                                            name="mark"
                                            value={formData.mark ?? ""}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (value < 0) return;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    mark: e.target.value,
                                                }));
                                            }}
                                            className="flex-1 border border-gray-400 rounded-sm p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 "
                                            required
                                            min="1"
                                            step="0.1"
                                        />
                                    </div>

                                    {/* <div className="w-full h-40 rounded-lg border border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                                        {questionImage ? (
                                            <img
                                                src={questionImage}
                                                alt="Question Preview"
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
                                    </div> */}
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-semibold text-gray-800 w-32">
                                            Question Image
                                        </label>

                                        <div className="flex flex-col items-center">
                                            {/* Image Box */}
                                            <div className="w-40 h-40 rounded-sm border border-gray-300 flex items-center justify-center overflow-hidden relative">
                                                {questionImage ? (
                                                    <img
                                                        src={questionImage}
                                                        alt="Question Preview"
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 text-sm text-center">Select Image</span>
                                                )}

                                                {/* Clickable area */}
                                                <input
                                                    id="questionImageInput"
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleQuestionImageChange}
                                                    disabled={isUploading}
                                                />
                                            </div>

                                            {/* Buttons below the image box */}
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => document.querySelector('#questionImageInput').click()}
                                                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                                                >
                                                    {questionImage ? "Change" : "Upload"}
                                                </button>

                                                {questionImage && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveQuestionImage}
                                                        className="px-3 py-1 rounded bg-red-100 text-red-600 text-sm hover:bg-red-200"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {descriptiveMode === "manual" && formData.qnTypeId === "2" && (
                                <>
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="w-32 text-sm font-semibold text-gray-800">Question <span className="text-red-500">*</span></label>:
                                        <textarea name="name" value={formData.name} onChange={handleChange} className="flex-1 border border-gray-400 rounded p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 " rows={3} required />
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="w-32 text-sm font-semibold text-gray-800">
                                            Mark <span className="text-red-500">*</span>
                                        </label>:
                                        <input
                                            type="number"
                                            name="mark"
                                            value={formData.mark ?? ""}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (value < 0) return;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    mark: e.target.value,
                                                }));
                                            }}
                                            className="flex-1 border border-gray-400 rounded p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 "
                                            required
                                            min="1"
                                            step="0.1"
                                        />
                                    </div>

                                    {/* <div className="w-full h-40 rounded-lg border border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                                        {questionImage ? (
                                            <img
                                                src={questionImage}
                                                alt="Question Preview"
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
                                    </div> */}

                                    {/* <div className="flex items-center gap-4 w-full">
                                     
                                        <label className="text-sm font-semibold text-gray-800 w-32">
                                            Question Image:
                                        </label>

                                        <div className="w-40 h-40 rounded-lg border border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                                            {questionImage ? (
                                                <img
                                                    src={questionImage}
                                                    alt="Question Preview"
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-sm text-center">
                                                    Select Image
                                                </span>
                                            )}

                                       
                                            <input
                                                id="questionImageInput"
                                                type="file"
                                                accept="image/*"
                                                className="absolute -inset-4 w-[500%] h-[200%] opacity-0 cursor-pointer"
                                                onChange={handleQuestionImageChange}
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => document.querySelector('input[type="file"]').click()}
                                            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                                        >
                                            {questionImage ? "Change" : "Upload"}
                                        </button>

                                        {questionImage && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveQuestionImage}
                                                className="text-gray-600 text-sm hover:text-red-500"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {isUploading && <p className="text-xs text-gray-500">Uploading...</p>}

                            
                                    <div className="mt-3">
                                        <div className="flex gap-2 px-1 mb-1">
                                            <span className="flex-1 text-sm font-semibold text-gray-800">Options</span>
                                            <span className="w-21 text-sm font-semibold text-gray-800 text-center">Choose Ans</span>
                                            <span className="w-8"></span>
                                        </div>
                                        {formData.options.map((opt, index) => (
                                            <div key={index} className="flex gap-2 mt-2 items-center">
                                                <input
                                                    type="text"
                                                    value={opt.optionText}
                                                    onChange={(e) => handleOptionChange(index, "optionText", e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    className="flex-1 min-w-0 border px-2 py-1 rounded"
                                                />
                                                <div className="flex justify-center items-center w-16">
                                                    <input
                                                        type="checkbox"
                                                        checked={opt.isCorrect}
                                                        onChange={(e) => handleOptionChange(index, "isCorrect", e.target.checked)}
                                                    />
                                                </div>
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        className="px-2 bg-red-500 text-white rounded flex items-center justify-center"
                                                        onClick={() => removeOption(index)}
                                                        disabled={formData.options.length <= 1}
                                                    >
                                                        <FiTrash2 className="text-base" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button type="button" onClick={addOption} className="mt-2 px-3 py-1 bg-green-500 text-white rounded">
                                            Add Option
                                        </button>
                                    </div> */}
                                    <div className="flex gap-6 w-full mt-3">
                                        <div className="flex flex-col gap-2">
                                            {/* Label + Image Input horizontal */}
                                            <div className="flex items-center gap-4">
                                                <label className="text-sm font-semibold text-gray-800 w-32">
                                                    Question Image
                                                </label>

                                                <div className="flex flex-col items-center">
                                                    {/* Image Box */}
                                                    <div className="w-40 h-40 rounded-sm border border-gray-300 flex items-center justify-center overflow-hidden relative">
                                                        {(questionImage || existingImage) ? (
                                                            <img
                                                                src={questionImage || existingImage}
                                                                alt="Question Preview"
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400 text-sm text-center">Select Image</span>
                                                        )}

                                                        {/* Clickable area */}
                                                        <input
                                                            id="questionImageInput"
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            onChange={handleQuestionImageChange}
                                                            disabled={isUploading}
                                                        />
                                                    </div>

                                                    {/* Buttons below the image box */}
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => document.querySelector('#questionImageInput').click()}
                                                            className="px-3 py-1 rounded bg-blue-700 text-white text-sm hover:bg-blue-700"
                                                        >
                                                            {questionImage ? "Change" : "Upload"}
                                                        </button>

                                                        {questionImage && (
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveQuestionImage}
                                                                className="px-3 py-1 rounded bg-red-100 text-red-600 text-sm hover:bg-red-200"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Options Section - RIGHT */}
                                        <div className="flex-1">
                                            <div className="flex gap-2 px-1 mb-1">
                                                <span className="flex-1 text-sm font-semibold text-gray-800">Options <span className="text-red-500">*</span></span>
                                                <span className="w-22 text-sm font-semibold text-gray-800 text-center">Choose Ans<span className="text-red-500">*</span></span>
                                                <span className="w-8"></span>
                                            </div>

                                            {formData.options.map((opt, index) => (
                                                <div key={index} className="flex gap-2 mt-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={opt.optionText}
                                                        onChange={(e) => handleOptionChange(index, "optionText", e.target.value)}
                                                        placeholder={`Option ${index + 1}`}
                                                        className="flex-1 border border-gray-400 rounded p-1 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 "
                                                    />
                                                    <div className="flex justify-center items-center w-16">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.isCorrect}
                                                            onChange={(e) => handleOptionChange(index, "isCorrect", e.target.checked)}
                                                        />
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <button
                                                            type="button"
                                                            className="p-2 bg-red-600 hover:bg-red-700 transition ease-in-out duration-300 text-white rounded flex items-center justify-center"
                                                            onClick={() => removeOption(index)}
                                                            disabled={formData.options.length <= 1}
                                                        >
                                                            <FiTrash2 className="text-base" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={addOption}
                                                className="mt-2 px-3 py-1.5 bg-[#4775a0] text-white rounded"
                                            >
                                                Add Option
                                            </button>
                                        </div>
                                    </div>

                                </>
                            )}

                            {/* Excel Upload Mode - Show when excel mode is selected */}
                            {descriptiveMode === "excel" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="w-33 text-sm font-semibold text-gray-800">
                                            Upload Excel File <span className="text-red-500">*</span>
                                        </label>:
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleExcelUpload}
                                            className="flex-1 border border-gray-400 rounded p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 "
                                            required
                                        />
                                    </div>

                                    {previewQuestions.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-gray-800 mb-2">Preview Questions</h5>
                                            <div className="space-y-2 max-h-80 overflow-y-auto p-2 border rounded">
                                                {previewQuestions.map((q, idx) => (
                                                    <div key={idx} className="p-2 border rounded bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <p>{idx + 1}. {q.question}</p>
                                                            <span className="text-gray-600 font-semibold">Mark: {q.mark}</span>
                                                        </div>

                                                        {q.image && (
                                                            <img
                                                                src={`data:image/png;base64,${q.image}`}
                                                                alt="Question"
                                                                className="mt-1 w-full h-32 object-cover rounded"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-sm shadow hover:bg-gray-600 transition"

                                >
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#4775a0] text-white rounded-sm shadow hover:bg-[#396186] transition"
                                    disabled={loading}
                                >
                                    {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update" : "Save")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}