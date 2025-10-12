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

export default function AddCandidate() {
    const { loginData } = useContext(AuthContext);

    console.log("LoginData", loginData)

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
    const [exam, setExam] = useState([]);
    const [candidates, setCandidates] = useState([]);

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        password: "",
        email: "",
        mobileNo: "",
        userRole: "",
        isActive: true,
        exmCandidateLists: []
    });

    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);



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

    const fetchExams = async () => {
        if (!loginData.tenantId) return;

        try {
            const res = await fetch(`${config.API_BASE_URL}api/Exam/GetExams`, {
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            const options = data.map((exam) => ({
                id: exam.Id,
                examName: exam.Name,
                setId: exam.SetId,
                totalMark: exam.TotalMark
            }));
            setExam(options);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load exams");
        }
    };

    const fetchCandidateWithExam = async () => {
        if (!loginData.tenantId) return;

        try {

            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_CandidateManage",
                    parameters: {
                        QueryChecker: 1
                    },
                }),
            });


            const data = await response.json();
            console.log("Candidate List", data)
            const candidatesArray = Array.isArray(data) ? data : [];

            // Format the data to match your table columns
            const formatted = candidatesArray.map((candidate) => ({
                id: candidate.Id,
                name: candidate.Name,
                password: candidate.Password,
                examName: candidate.ExamName,
                userId: candidate.UserId,
                userRole: candidate.UserRole,
                email: candidate.Email,
                mobileNo: candidate.MobileNo,
            }));

            //  Sort by id descending
            formatted.sort((a, b) => b.id - a.id);
            setCandidates(formatted);
            console.log("Candidate Data:", formatted);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load candidates");
        }
    };

      const generatePassword = () => {
        return Math.random().toString(36).slice(-8); // random 8-character password
    };
    //  Generate userId & password when name changes
    const handleNameChange = (e) => {
        const fullName = e.target.value;
        // Get the first name only (before first space)
        const firstName = fullName ? fullName.split(" ")[0] : "";
        const password = generatePassword(); // still auto-generate password

        setFormData((prev) => ({
            ...prev,
            name: fullName,
            userId: firstName,
            password,

        }));
    };
    
    const openEditCandidateModal = async (candidate) => {

        if (!candidate?.id) {
            console.error("Invalid Candidate ID");
            return;
        }

        try {
            setIsEdit(true);
            setEditId(candidate.id);

            // Call your API that fetches candidate by Id
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData?.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_CandidateManage",
                    parameters: {
                        QueryChecker: 2,
                        UserAccountId: candidate.id

                    },
                }),
            });

            if (!res.ok) throw new Error("Failed to fetch candidate data");

            const data = await res.json();
            console.log("Edit Candidate Data", data)
            const candidateData = Array.isArray(data) ? data[0] : null;

            if (!candidateData) {
                toast.error("Candidate not found");
                return;
            }

            setFormData({
                id: candidateData.Id,
                name: candidateData.Name || "",
                password: candidateData.Password || generatePassword(),
                userId: candidateData.UserId || candidateData.Name.split(" ")[0],
                email: candidateData.Email || "",
                mobileNo: candidateData.MobileNo || "",
                userRole: candidateData.UserRole || "Participate",
                isActive: candidateData.IsActive ?? true,
                examId: candidateData.ExamId || "",
                examName: candidateData.ExamName || "",
                exmCandidateLists: [
                    {
                        examId: candidateData.ExamId || "",
                        name: candidateData.ExamName || ""
                    }
                ]
            });

            setShowModal(true);

        } catch (err) {
            console.error("Error fetching candidate details:", err);
            toast.error("Failed to load candidate data for editing");
        }
    };


    useEffect(() => {
        if (!loginData?.tenantId) return;
        fetchExams();
        fetchCandidateWithExam();
    }, [loginData?.tenantId]);

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            password: "",
            userId: "",
            email: "",
            mobileNo: "",
            userRole: "Participate",
            isActive: true,
            examId: "",
            examName: "",
            exmCandidateLists: []
        });
        setIsEdit(false);
        setEditId(null);
    };


    const handleOpenModal = () => {
        resetForm();
        setShowModal(true);
    };


    // Handle name change
    // const handleNameChange = (e) => {
    //     const fullName = e.target.value;

    //     setFormData((prev) => ({
    //         ...prev,
    //         name: fullName,
    //         // Auto-generate userId only for new candidates
    //         userId: isEdit ? prev.userId : (fullName.split(" ")[0] || ""),
    //         // Auto-generate password only for new candidates
    //         password: isEdit ? prev.password : generatePassword(),
    //     }));
    // };


  

    //  Submit form
    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     // Prepare payload
    //     const payload = {
    //         ...formData,
    //         exmCandidateLists: [
    //             {
    //                 examId: formData.examId,
    //                 name: formData.name
    //             }
    //         ]
    //     };

    //     try {
    //         const response = await fetch(
    //             `${config.API_BASE_URL}api/ExamUserAccount/AddCandidate`,
    //             {
    //                 method: "POST",
    //                 headers: {
    //                     TenantId: loginData.tenantId,
    //                     "Content-Type": "application/json",
    //                 },
    //                 body: JSON.stringify(payload),
    //             }
    //         );

    //         if (!response.ok) {
    //             const text = await response.text();
    //             console.error("Server returned error:", text);
    //             throw new Error("Failed to add candidate");
    //         }

    //         const result = await response.json();
    //         toast.success(result.message || "Candidate added successfully");
    //         setShowModal(false);
    //     } catch (err) {
    //         console.error("Submit Error:", err);
    //         toast.error(err.message);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) return toast.error("Name is required");
        if (!formData.email.trim()) return toast.error("Email is required");
        if (!formData.mobileNo.trim()) return toast.error("Mobile No is required");

        // Prepare payload
        const payload = {
            id: isEdit ? formData.id : 0,
            name: formData.name,      
            password: formData.password,
            userId: formData.userId,
            email: formData.email,
            mobileNo: formData.mobileNo,
            userRole: "Participate",
            isActive: formData.isActive ?? true,
            entryBy: loginData.UserId,
            updateBy: isEdit ? loginData.UserId : null,
            exmCandidateLists: [
                {
                    examId: formData.examId,
                    name: formData.examName,
                    entryBy: loginData.UserId,
                    updateBy: isEdit ? loginData.UserId : null
                }
            ]
        };

        try {
            const apiEndpoint = isEdit
                ? `${config.API_BASE_URL}api/ExamUserAccount/UpdateCandidate`
                : `${config.API_BASE_URL}api/ExamUserAccount/AddCandidate`;

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Server error:", text);
                throw new Error("Failed to submit candidate");
            }

            const result = await response.json();
            toast.success(result.message || (isEdit ? "Candidate updated successfully" : "Candidate added successfully"));

            setShowModal(false);
            fetchCandidateWithExam(); // refresh table
            resetForm();

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        }
    };



    const openDeleteModal = (question) => {
        if (!question?.QuestionId) return;
        setSelectedId(question.QuestionId);
        setDeleteSuccessMsg("");
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {

        // if (!selectedId) return;

        // try {
        //     const response = await fetch(`${config.API_BASE_URL}api/Question/Delete/${selectedId}`, {
        //         method: 'DELETE',
        //         // headers: { TenantId: loginData.tenantId },
        //           headers: {
        //                 TenantId: loginData.tenantId,
        //                 'Content-Type': 'application/json'
        //             },
        //     });

        //     if (!response.ok) {
        //         let errorMessage = "Delete failed. Please try again.";

        //         try {
        //             const errorText = await response.text();

        //             // Check for specific error messages
        //             if (errorText.includes("used in a question set")) {
        //                 errorMessage = "This question cannot be deleted because it is already used in a question set.";
        //             } else if (errorText.includes("Question not found")) {
        //                 errorMessage = "Question not found.";
        //             }

        //         } catch (textError) {
        //             // If we can't read the response text, use default message
        //             console.error("Could not read error response:", textError);
        //         }

        //         throw new Error(errorMessage);
        //     }

        //     setDeleteSuccessMsg("Item deleted successfully.");
        //     setTimeout(() => setIsDeleteModalOpen(false), 1000);

        //     if (selectedSubject && selectedSubject !== "") {
        //         await fetchQuestionsBySubject(selectedSubject);
        //     } else {
        //         await fetchQuestionsBySubject();
        //     }
        // } catch (error) {
        //     // Don't log to console if it's our expected error
        //     if (!error.message.includes("used in a question set")) {
        //         console.error("Delete error:", error);
        //     }

        //     toast.error(error.message);
        //     setIsDeleteModalOpen(false);
        // }
    };



    // const openViewModal = async (question) => {
    //     if (!question?.QuestionId) return;
    //     await fetchQuestionById(question.QuestionId);
    //     setIsViewModalOpen(true);
    // };

    const handleDownloadExcel = () => {
        if (filteredQuestion.length === 0) return alert('No data available to export!');
        const worksheet = XLSX.utils.json_to_sheet(filteredQuestion);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
        XLSX.writeFile(workbook, 'Questions_Report.xlsx');
    };

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

                        </div>

                        <div className='flex items-center gap-3'>
                            <Link onClick={handleOpenModal} href="#" passHref className="text-lg text-gray-50 cursor-pointer">
                                <IoMdAddCircle className="text-xl" />
                            </Link>
                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>

                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr className="border-b">
                                <th className="px-4 py-2 text-center">SL</th>
                                <th className="px-4 py-2 ">Name</th>
                                <th className="px-4 py-2 text-center">User Id</th>
                                <th className="px-4 py-2 text-center">Password</th>
                                <th className="px-4 py-2 ">Exam</th>
                                <th className="px-4 py-2 text-center">Email</th>
                                <th className="px-4 py-2 text-center">Mobile No</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white text-xs text-gray-700">
                            {candidates.length === 0 ? (
                                <tr key="no-data">
                                    <td colSpan="6" className="text-center py-4">
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                candidates.map((candidate, index) => (
                                    <tr
                                        key={candidate.id ?? index}
                                        className="border-b border-gray-300 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-2 text-center">{index + 1}</td>
                                        <td className="px-4 py-2">{candidate.name}</td>
                                        <td className="px-4 py-2 text-center">{candidate.userId}</td>
                                        <td className="px-4 py-2 text-center">{candidate.password}</td>
                                        <td className="px-4 py-2 ">{candidate.examName}</td>
                                        <td className="px-4 py-2 text-center">{candidate.email}</td>
                                        <td className="px-4 py-2 text-center">{candidate.mobileNo}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                {/* <button
                                onClick={() => openViewModal(candidate)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200"
                            >
                                <FiEye className="text-base" />
                            </button> */}
                                                <button
                                                    onClick={() => openEditCandidateModal(candidate)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                                                >
                                                    <FiEdit className="text-base" />
                                                </button>
                                                {/* <button
                                onClick={() => openDeleteModal(candidate)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
                            >
                                <FiTrash2 className="text-base" />
                            </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>


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
                    <div
                        data-aos="zoom-in"
                        className="bg-white rounded-lg shadow-md w-full max-w-xl relative overflow-y-auto max-h-[90vh] p-6"
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        >
                            ✕
                        </button>

                        <div className="border-b border-gray-300 pb-2 mb-4">
                            <h3 className="font-bold text-lg">{isEdit ? "Update Candidate" : "Add Candidate"}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            {/* Full Name */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full border rounded p-2"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            {/* UserId */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">User ID</label>
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId || ""}
                                    readOnly
                                    className="w-full border rounded p-2 bg-gray-100"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    className="w-full border rounded p-2"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>

                            {/* Mobile No */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">Mobile No</label>
                                <input
                                    type="text"
                                    name="mobileNo"
                                    value={formData.mobileNo}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, mobileNo: e.target.value }))
                                    }
                                    className="w-full border rounded p-2"
                                    placeholder="Enter mobile number"
                                    required
                                />
                            </div>

                            {/* User Role */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">User Role</label>
                                <input
                                    type="text"
                                    value={"Participate"}
                                    readOnly
                                    className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            {/* Exam Dropdown */}
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">Select Exam</label>
                                <Select
                                    options={exam.map((ex) => ({
                                        value: ex.id,
                                        label: ex.examName,
                                    }))}
                                    value={
                                        exam
                                            .map((ex) => ({ value: ex.id, label: ex.examName }))
                                            .find((opt) => opt.value === formData.examId) || null
                                    }
                                    onChange={(option) =>
                                        setFormData({
                                            ...formData,
                                            examId: option?.value || "",
                                            examName: option?.label || "",
                                        })
                                    }
                                    placeholder="Select or search exam..."
                                    className="w-full"
                                    isClearable
                                    isSearchable
                                />
                            </div>

                            {/* Buttons */}
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
                        </form>
                    </div>
                </div>

            )}
        </div>
    );
}