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
import Select from 'react-select';


export default function AddCandidate() {
    const { loginData } = useContext(AuthContext);

    console.log("LoginData", loginData)
    const [filteredQuestion, setFilteredQuestion] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [participateQuestionPaper, setParticipateQuestionPaper] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");
    const [exam, setExam] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [filteredSet, setFilteredSet] = useState([]);
    const [setData, setSetData] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);

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
        let filteredData = candidates;

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filteredData = filteredData.filter(candidate =>
                candidate.name.toLowerCase().includes(query) ||
                candidate.userId.toLowerCase().includes(query) ||
                candidate.examName.toLowerCase().includes(query) ||
                candidate.mobileNo.toLowerCase().includes(query) ||
                candidate.email.toLowerCase().includes(query) ||
                candidate.isActive.toString().toLowerCase().includes(query)
            );
        }
        setFilteredSet(filteredData);
    }, [searchQuery, candidates]);


    //For Exam Dropdown
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
                examName: exam.ExamName,
                setId: exam.SetId,
                totalMark: exam.TotalMark
            }));
            setExam(options);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load exams");
        }
    };

    //For View
    // const fetchParticipateQuestionPaper = async (userAutoId) => {
    //     debugger;
    //     try {
    //         const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
    //             method: "POST",
    //             headers: {
    //                 TenantId: loginData.tenantId,
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({
    //                 operation: "",
    //                 procedureName: "SP_CandidateManage",
    //                 parameters: { QueryChecker: 3, UserAccountId: userAutoId },
    //             }),
    //         });
    //         console.log("Check Response", response);
    //         const data = await response.json();
    //         console.log("Participate Question Paper", data);

    //         if (Array.isArray(data)) {
    //             const groupedData = data.reduce((acc, item) => {
    //                 // Check if question already added
    //                 let existing = acc.find(q => q.question === item.Question);

    //                 if (!existing) {
    //                     acc.push({
    //                         userId: item.Id,
    //                         examName: item.ExamName,
    //                         totalMark: item.TotalMark,
    //                         qnMark: item.Mark,
    //                         setName: item.SetName,
    //                         question: item.Question,
    //                         qnType: item.QnType,
    //                         // collect first option if present
    //                         options: item.OptionText ? [item.OptionText] : [],
    //                         userInfo: {
    //                             name: item.ParticipateName,
    //                         },
    //                     });
    //                 } else if (item.OptionText && !existing.options.includes(item.OptionText)) {
    //                     existing.options.push(item.OptionText);
    //                 }

    //                 return acc;
    //             }, []);

    //             console.log("Grouped Question Paper Data", groupedData);
    //             setParticipateQuestionPaper(groupedData);
    //         }
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Failed to load participate question paper");
    //     }
    // };

    //For Grid Table
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
                setName: candidate.SetName,
                userId: candidate.UserId,
                userRole: candidate.UserRole,
                email: candidate.Email,
                mobileNo: candidate.MobileNo,
                isActive: candidate.IsActive
            }));

            //  Sort by id descending
            formatted.sort((a, b) => b.id - a.id);
            setCandidates(formatted);
            setSetData(formatted);
            setFilteredSet(formatted);
            console.log("Candidate Data:", formatted);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load candidates");
        }
    };

    const handleToggleActive = async (candidate) => {
        try {
            const newStatus = !candidate.isActive;

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
                        QueryChecker: 4,
                        UserAccountId: candidate.id,
                        IsActive: !candidate.isActive
                    },
                }),
            });

            if (response.ok) {
                toast.success(`User ${newStatus ? "activated" : "deactivated"} successfully`);
                // Update UI instantly
                setFilteredSet((prev) =>
                    prev.map((item) =>
                        item.id === candidate.id ? { ...item, isActive: newStatus } : item
                    )
                );
            } else {
                toast.error("Failed to update user status");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error updating user status");
        }
    };

    const generatePassword = () => {
        // random 4 chars + current timestamp in base36 to make it unique
        return Math.random().toString(36).slice(-4) + Date.now().toString(36).slice(-4);
    };



    const generateRandomNumber = () => {
        return Math.floor(1000 + Math.random() * 9000); // 4-digit number
    };

    const handleNameChange = (e) => {
        const fullName = e.target.value; // remove extra spaces
        if (!fullName) {
            setFormData(prev => ({ ...prev, name: "", userId: "" }));
            return;
        }

        const nameParts = fullName.split(/\s+/); // split by one or more spaces
        const longestPart = nameParts.reduce(
            (max, part) => (part.length > max.length ? part : max),
            ""
        );

        const userId = longestPart.toLowerCase() + generateRandomNumber();
        const password = generatePassword();

        setFormData(prev => ({
            ...prev,
            name: fullName,
            userId,
            password,
        }));
    };



    //for fetch data for  Edit
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

    //For Pdf Download

    const handleDownload = async () => {
        if (!participateQuestionPaper || participateQuestionPaper.length === 0) return;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 14;
        const topMargin = 14;
        const bottomMargin = 14;
        const usableWidth = pageWidth - 2 * margin;
        let y = topMargin;

        // Title - Candidate Name
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text(`${participateQuestionPaper[0].userInfo.name}`, pageWidth / 2, y, { align: "center" });
        y += 6;
        doc.text(`Exam Name: ${participateQuestionPaper[0].examName}`, pageWidth / 2, y, { align: "center" });


        // Total Score - Top Right
        const totalScore = participateQuestionPaper.reduce((sum, q) => sum + (parseFloat(q.ansMark) || 0), 0);
        const totalMark = participateQuestionPaper.reduce((sum, q) => sum + (parseFloat(q.qnMark) || 0), 0);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text(`Total Scored: ${totalScore} / ${totalMark}`, pageWidth - margin, y, { align: "right" });
        y += 8;

        // Candidate Info
        const infoText = `Current Organization: ${participateQuestionPaper[0].userInfo.org} |Current Salary: ${participateQuestionPaper[0].userInfo.salary} | Notice Period: ${participateQuestionPaper[0].userInfo.noticePeriod} days`;
        const infoLines = doc.splitTextToSize(infoText, usableWidth);
        infoLines.forEach(line => {
            doc.text(line, pageWidth / 2, y, { align: "center" });
            y += 6;
        });
        y += 4;

        // Helper: Convert image URL to Base64
        const getBase64FromUrl = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = url;
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                };
                img.onerror = function (err) {
                    reject(err);
                };
            });
        };

        // Questions Loop
        for (const [index, q] of participateQuestionPaper.entries()) {
            if (y + 10 > pageHeight - bottomMargin) {
                doc.addPage();
                y = topMargin;
            }

            // Question text (Bold, consistent font size)
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            const questionLines = doc.splitTextToSize(`${index + 1}. ${q.question}`, usableWidth - 50);
            questionLines.forEach((line, i) => {
                doc.text(line, margin, y);

                if (i === 0) {

                    doc.setFont("times", "bold");
                    doc.setFontSize(10);
                    const markText = `Mark: ${q.qnMark} | Score: ${q.ansMark || 0}`;
                    doc.text(markText, pageWidth - margin, y, { align: "right" });
                }
                y += 6;
            });

            // Question image
            if (q.qnImage) {
                try {
                    const imgBase64 = await getBase64FromUrl(q.qnImage);
                    const imgProps = doc.getImageProperties(imgBase64);
                    const imgWidth = 50;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    if (y + imgHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        y = topMargin;
                    }

                    doc.addImage(imgBase64, 'JPEG', margin, y, imgWidth, imgHeight);
                    y += imgHeight + 5;
                } catch (err) {
                    console.error("Failed to add image", err);
                }
            }

            // MCQ options with symbol
            if (q.qnType === "MCQ" && q.options.length > 0) {
                doc.setFontSize(8);
                doc.setFont("times", "normal");
                q.options.forEach((opt, i) => {
                    const prefix = String.fromCharCode(65 + i) + ". ";
                    let symbol = "";

                    if (opt.adminAnswer) symbol = "(Correct Ans)";
                    else if (q.participateAns === opt.text) symbol = "(Applicant Ans)";

                    const optionText = `${prefix}${opt.text}${symbol ? " " + symbol : ""}`;
                    const optionLines = doc.splitTextToSize(optionText, usableWidth - 4);

                    optionLines.forEach(line => {
                        if (y + 5 > pageHeight - bottomMargin) {
                            doc.addPage();
                            y = topMargin;
                        }
                        doc.text(line, margin + 4, y);
                        y += 5;
                    });
                });
            }

            // Descriptive Answer - Justified
            if (q.qnType !== "MCQ") {
                doc.setFontSize(8);
                // ensure sentence has spaces between words
                let rawText = q.participateAns || "No Answer Provided";
                rawText = rawText.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();

                const text = `Answer: ${rawText}`;
                const words = text.split(" ");

                // Bold "Answer:" only
                doc.setFont("times", "bold");
                doc.text("Answer:", margin, y);
                const answerLabelWidth = doc.getTextWidth("Answer: ");
                doc.setFont("times", "normal");

                let x = margin + answerLabelWidth;
                const lineHeight = 5;

                words.slice(1).forEach(word => {
                    const wordWidth = doc.getTextWidth(word + " ");
                    if (x + wordWidth > margin + usableWidth) {
                        y += lineHeight;
                        if (y + lineHeight > pageHeight - bottomMargin) {
                            doc.addPage();
                            y = topMargin;
                        }
                        x = margin;
                    }
                    doc.text(word, x, y);
                    x += wordWidth;
                });

                y += 8;
            }

            y += 6; // spacing after each question
        }

        // Save PDF
        doc.save(`${participateQuestionPaper[0].userInfo.name}_answers.pdf`);
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

    //Insert and Update
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) return toast.error("Name is required");
        if (!formData.email.trim()) return toast.error("Email is required");
        // if (!formData.mobileNo.trim()) return toast.error("Mobile No is required");

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
                <h1 className="text-2xl font-bold text-gray-800">Candidate List</h1>
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

                        </div>

                        <div className='flex items-center gap-3'>
                            <Link onClick={handleOpenModal} href="#" passHref className="text-lg text-gray-50 cursor-pointer">
                                <IoMdAddCircle className="text-xl" />
                            </Link>
                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>
                    <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[65vh] overflow-y-auto">
                        <table className="min-w-full text-sm text-left text-gray-700">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-700 sticky top-0 z-10">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-center">SL</th>
                                    <th className="px-4 py-2 ">Name</th>
                                    <th className="px-4 py-2 ">User Id</th>
                                    <th className="px-4 py-2 ">Password</th>
                                    <th className="px-4 py-2 ">Exam</th>
                                    <th className="px-4 py-2 ">Set</th>
                                    <th className="px-4 py-2 ">Email</th>
                                    <th className="px-4 py-2 text-center">Mobile No</th>
                                    <th className="px-4 py-2 text-center">Is Active</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white text-xs text-gray-700">
                                {filteredSet.length === 0 ? (
                                    <tr key="no-data">
                                        <td colSpan="6" className="text-center py-4">
                                            No data found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSet.map((candidate, index) => (
                                        <tr
                                            key={candidate.id ?? index}
                                            className="border-b border-gray-300 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-2 text-center">{index + 1}</td>
                                            <td className="px-4 py-2">{candidate.name}</td>
                                            <td className="px-4 py-2 ">{candidate.userId}</td>
                                            <td className="px-4 py-2 ">{candidate.password}</td>
                                            <td className="px-4 py-2 ">{candidate.examName}</td>
                                            <td className="px-4 py-2 ">{candidate.setName}</td>
                                            <td className="px-4 py-2 ">{candidate.email}</td>
                                            <td className="px-4 py-2 text-center">{candidate.mobileNo}</td>

                                            {/* <td className="px-4 py-2 text-center">
                                            {candidate.isActive ? "Active" : "Inactive"}
                                        </td> */}
                                            {/* <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleToggleActive(candidate)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${candidate.isActive
                                                    ? "bg-green-100 text-green-700 border border-green-500"
                                                    : "bg-red-100 text-red-700 border border-red-500"
                                                    }`}
                                            >
                                                {candidate.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td> */}
                                            {/* <td className="px-4 py-2 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={candidate.isActive}
                                                    onChange={() => handleToggleActive(candidate)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-colors duration-300"></div>
                                                <span
                                                    className={`absolute left-[4px] top-[4px] bg-white w-4 h-4 rounded-full transition-transform duration-300 ${candidate.isActive ? "translate-x-5" : ""
                                                        }`}
                                                ></span>
                                            </label>
                        
                                        </td> */}

                                            <td className="px-4 py-2 text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={candidate.isActive}
                                                            onChange={() => handleToggleActive(candidate)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-8 h-4 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-all duration-300"></div>
                                                        <div
                                                            className={`absolute top-[2px] left-[2px] w-3 h-3 bg-white rounded-full transition-transform duration-300 ${candidate.isActive ? "translate-x-4" : ""
                                                                }`}
                                                        ></div>
                                                    </div>
                                                </label>
                                            </td>


                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    {/* <button
                                                    onClick={async () => {
                                                        await fetchParticipateQuestionPaper(candidate.id);
                                                        setIsEditMode(false);
                                                        setShowQuestionModal(true);
                                                    }}
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
                        className="bg-white rounded-sm shadow-md w-full max-w-xl relative overflow-y-auto max-h-[90vh] p-6"
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        >
                            <FiX className="w-4 h-4" />
                        </button>

                        <div className="border-b border-gray-300 pb-2 mb-4">
                            <h3 className="font-bold text-lg text-gray-700">{isEdit ? "Update Candidate" : "Add Candidate"}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            {/* Full Name */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></label>:
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full border rounded-sm p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            {/* UserId */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">User ID</label>:
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId || ""}
                                    readOnly
                                    className="w-full border rounded-sm p-2 bg-gray-100 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>:
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    className="w-full border rounded-sm p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>

                            {/* Mobile No */}
                            <div className="flex items-center gap-2">
                                <label className="w-1/3 font-semibold text-gray-700">Mobile No</label>:
                                <input
                                    type="text"
                                    name="mobileNo"
                                    value={formData.mobileNo}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, mobileNo: e.target.value }))
                                    }
                                    className="w-full border rounded-sm p-2 focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                                    placeholder="Enter mobile number"

                                />
                            </div>

                            {/* User Role */}
                            {/* <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">User Role</label>
                                <input
                                    type="text"
                                    value={"Participate"}
                                    readOnly
                                    className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                                />
                            </div> */}

                            {/* Exam Dropdown */}
                            <div className="flex items-center gap-2 mt-2 relative z-50">
                                <label className="w-1/3 text-sm font-semibold text-gray-700">Select Exam <span className="text-red-500">*</span></label>:
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
                                    className="w-full focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                                    isClearable
                                    isSearchable
                                    required
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                        control: (base) => ({
                                            ...base,
                                            minHeight: "36px",
                                            borderColor: "#D1D5DB",
                                            "&:hover": { borderColor: "#3B82F6" },
                                        }),
                                    }}
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


            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl mt-10 relative">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setShowQuestionModal(false);
                                setIsEditMode(false);
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-lg font-bold"
                        >
                            <FiX className="w-4 h-4" />
                        </button>

                        {participateQuestionPaper.length > 0 ? (
                            <>
                                {/* ==== User Info & Exam Info ==== */}
                                <div className="mb-8 p-4 bg-blue-50 rounded-lg text-center mt-5">
                                    <div className="relative">
                                        <h2 className="text-2xl font-semibold text-center flex flex-col items-center justify-center">
                                            <span className="text-blue-700">{participateQuestionPaper[0]?.userInfo?.name}</span>
                                            <span className="text-black">
                                                Exam Name: {participateQuestionPaper[0]?.examName}
                                            </span>
                                        </h2>

                                        {/* <div className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-gray-800 border-3 border-gray-400 rounded-lg p-2">
                                Total Scored:{" "}
                                {participateQuestionPaper.reduce(
                                    (sum, q) => sum + (parseFloat(q.ansMark) || 0),
                                    0
                                )}{" "}
                                /{" "}
                                {participateQuestionPaper.reduce(
                                    (sum, q) => sum + (parseFloat(q.qnMark) || 0),
                                    0
                                )}
                            </div> */}
                                    </div>

                                    {/* <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Current Organization:</span>{" "}
                            {participateQuestionPaper[0]?.userInfo?.org || "N/A"} |{" "}
                            <span className="font-medium">Current Salary:</span> ৳
                            {participateQuestionPaper[0]?.userInfo?.salary || "N/A"} |{" "}
                            <span className="font-medium">Notice Period:</span>{" "}
                            {participateQuestionPaper[0]?.userInfo?.noticePeriod || "N/A"} days
                        </p> */}
                                </div>

                                {/* ==== Question List ==== */}
                                <div className="space-y-4">
                                    {participateQuestionPaper.map((q, index) => (
                                        <div key={index} className="p-4 border border-gray-100 rounded-lg shadow-sm">
                                            {/* Question Header + Marks */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 text-lg">
                                                        {index + 1}. {q.question}
                                                    </h3>
                                                    <span className="text-sm text-gray-500 font-medium">{q.qnType}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 flex gap-4 mt-1">
                                                    <span>Mark: {q.qnMark ?? "-"}</span>
                                                    {/* <span>Scored: {q.ansMark ?? "-"}</span> */}
                                                </div>
                                            </div>

                                            {/* MCQ Options */}
                                            {q.qnType === "MCQ" && q.options?.length > 0 && (
                                                <ul className="ml-4 space-y-1">
                                                    {q.options.map((opt, i) => {
                                                        const isSelected = q.participateAns === opt;
                                                        return (
                                                            <li
                                                                key={i}
                                                                className={`p-2 rounded text-sm items-center ${isSelected
                                                                    ? "bg-blue-100 text-blue-800 font-medium"
                                                                    : "text-gray-700"
                                                                    }`}
                                                            >
                                                                <span className="font-medium mr-1">
                                                                    {String.fromCharCode(65 + i)}.
                                                                </span>
                                                                {opt}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}

                                            {/* Question Image */}
                                            {q.qnImage && (
                                                <div className="mb-2 flex justify-start">
                                                    <img
                                                        src={q.qnImage}
                                                        alt="Question"
                                                        className="rounded-md object-contain"
                                                        style={{ maxHeight: "150px" }}
                                                    />
                                                </div>
                                            )}

                                            {/* Written Answer */}
                                            {q.qnType !== "MCQ" && (
                                                <div className="mt-2 ml-2 text-sm pl-2">
                                                    <span className="font-bold">Answer:</span>{" "}
                                                    <span style={{ textAlign: "justify", display: "block" }}>
                                                        {q.participateAns || "No Answer Provided"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-gray-500 py-12 text-lg">
                                No questions found.
                            </p>
                        )}

                        {/* ==== Footer Buttons ==== */}
                        <div className="flex justify-end space-x-2 pt-4">
                            {!isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Download
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQuestionModal(false);
                                    setIsEditMode(false);
                                }}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}