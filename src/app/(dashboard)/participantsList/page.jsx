'use client'
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import Link from 'next/link';
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FiEye, FiCheckCircle, FiCheck, FiX } from "react-icons/fi";
import pdfMake from "pdfmake/build/pdfmake";
import * as XLSX from "xlsx";

export default function AddExam() {
    const { loginData } = useContext(AuthContext);

    // State declarations
    const [searchQuery, setSearchQuery] = useState('');
    const [participateList, setParticipateList] = useState([]);
    const [participateQuestionPaper, setParticipateQuestionPaper] = useState([]);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [filteredSet, setFilteredSet] = useState([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    // Initialize AOS animations
    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    // for grid table
    // const fetchParticipate = async () => {
    //     try {
    //         const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
    //             method: "POST",
    //             headers: {
    //                 TenantId: loginData.tenantId,
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({
    //                 operation: "",
    //                 procedureName: "SP_Participate",
    //                 parameters: { QueryChecker: 1 },
    //             }),
    //         });

    //         const data = await response.json();
    //         console.log("Participate List", data);

    //         if (Array.isArray(data)) {
    //             const formatted = data.map(item => ({
    //                 id: item.Id,
    //                 value: item.UserId,
    //                 examName: item.ExamName,
    //                 label: item.Name,
    //                 password: item.Password,
    //                 org: item.CurrentOrg,
    //                 salary: item.CurrentSalary,
    //                 totalQnMark: item.TotalQnMark,
    //                 noticePeriod: item.NoticePeriod,
    //                 // noticePeriodLabel: item.NoticePeriod === 1 ? '1 day' : `${item.NoticePeriod} days`,
    //                 noticePeriodLabel: item.NoticePeriod <= 1
    //                     ? `${item.NoticePeriod} day`
    //                     : `${item.NoticePeriod} days`,
    //                 mobileNo: item.MobileNo,
    //                 experience: item.Experience,
    //                 mark: item.Mark,
    //             }));
    //             console.log("Participate formatted  List", formatted);

    //             setParticipateList(formatted);
    //         } else {
    //             toast.error("Invalid participate data format");
    //         }
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Failed to load participate data");
    //     }
    // };

    const fetchParticipateByDate = async (fromDate, toDate) => {
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_Participate",
                    parameters: {
                        QueryChecker: 3,
                        FromDate: fromDate,
                        ToDate: toDate
                    },
                }),
            });

            const data = await response.json();
            console.log("Participate Filtered List", data);

            if (Array.isArray(data)) {
                const formatted = data.map(item => ({
                    id: item.Id,
                    value: item.UserId,
                    examName: item.ExamName,
                    label: item.Name,
                    password: item.Password,
                    org: item.CurrentOrg,
                    salary: item.CurrentSalary,
                    totalQnMark: item.TotalQnMark,
                    totalAnsMark: item.TotalAnsMark,
                    noticePeriod: item.NoticePeriod,
                    //  noticePeriodLabel: item.NoticePeriod === 1 ? '1 day' : `${item.NoticePeriod} days`,
                    noticePeriodLabel: item.NoticePeriod <= 1
                        ? `${item.NoticePeriod} day`
                        : `${item.NoticePeriod} days`,
                    mobileNo: item.MobileNo,
                    experience: item.Experience,
                    entryDate: item.EntryDate,
                    mark: item.Mark,
                }));

                console.log("Formatted Filtered Participate List", formatted);
                setParticipateList(formatted);
            } else {
                toast.error("Invalid filtered data format");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load filtered participate data");
        }
    };

    //for view and evaluate
    const fetchParticipateQuestionPaper = async (participateId) => {
        debugger;
        try {
            const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: "POST",
                headers: {
                    TenantId: loginData.tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operation: "",
                    procedureName: "SP_Participate",
                    parameters: { QueryChecker: 2, ParticipateId: participateId },
                }),
            });
            const data = await response.json();
            console.log("Participate Question Paper", data);

            if (Array.isArray(data)) {

                const groupedData = data.reduce((acc, item) => {
                    let existing = acc.find(q => q.qnId === item.QnId);
                    if (!existing) {
                        acc.push({
                            id: item.Id,
                            participateId: item.ParticipateId,
                            qnId: item.QnId,
                            question: item.Question,
                            qnType: item.QnType,
                            examName: item.ExamName,
                            // options: item.OptionText ? [item.OptionText] : [],
                            options: item.OptionText ? [{ text: item.OptionText, adminAnswer: item.AdminAnswer }] : [],
                            participateAns: item.ParticipateAns,
                            adminAnswer: item.AdminAnswer,
                            qnMark: item.QnMark,
                            qnImage: item.Sketch,
                            ansMark: item.AnsMark,
                            userInfo: {
                                name: item.ParticipateName,
                                userId: item.UserId,
                                password: item.Password,
                                org: item.CurrentOrg,
                                salary: item.CurrentSalary,
                                noticePeriod: item.NoticePeriod,
                            },
                        });
                    }
                    // else if (item.OptionText && !existing.options.includes(item.OptionText)) {
                    //     existing.options.push(item.OptionText);
                    // }
                    else if (item.OptionText && !existing.options.some(o => o.text === item.OptionText)) {
                        existing.options.push({ text: item.OptionText, adminAnswer: item.AdminAnswer });
                    }
                    return acc;
                }, []);
                console.log("participate Group Data", groupedData)
                setParticipateQuestionPaper(groupedData);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load participate question paper");
        }
    };

    const handleSaveMarks = async (e) => {
        e.preventDefault();
        // setLoading(true);
        try {

            const payload = participateQuestionPaper.map((q) => ({
                Id: q.id,
                ParticipateId: q.participateId,
                QnId: q.qnId,
                Answer: q.participateAns || "NA",
                QnMark: q.qnMark || 0,
                AnsMark: parseFloat(q.ansMark) || 0,
                Remarks: null,
                UpdateBy: loginData?.UserId,
                UpdateDate: new Date().toISOString(),
                IsActive: true,
            }));

            console.log("Saving Evaluation Payload:", payload);

            const response = await fetch(`${config.API_BASE_URL}api/Participate/UpdateMarks`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    TenantId: loginData?.tenantId,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to update marks");
            }

            toast.success("Evaluation saved successfully!");
            setIsEditMode(false);
            // await fetchParticipate(); 
            await fetchParticipateByDate(fromDate, toDate);

        } catch (err) {
            console.error("Error saving evaluation:", err);
            toast.error(err.message || "Error saving evaluation");
        } finally {
            // setLoading(false);
        }
    };


    useEffect(() => {
        let searchData = participateList;
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            searchData = searchData.filter(item =>
                item.label?.toLowerCase().includes(query) ||
                item.examName?.toLowerCase().includes(query) ||
                item.value?.toLowerCase().includes(query) ||
                item.org?.toLowerCase().includes(query) ||
                item.password?.toLowerCase().includes(query) ||
                String(item.salary || '').toLowerCase().includes(query) ||
                item.mobileNo?.toLowerCase().includes(query) ||
                item.experience?.toLowerCase().includes(query)
            );
        }
        setFilteredSet(searchData);
    }, [searchQuery, participateList]);


    // useEffect(() => {
    //     if (loginData?.tenantId) {
    //         fetchParticipate();
    //         // fetchParticipateQuestionPaper();

    //     }
    // }, [loginData?.tenantId]);

    useEffect(() => {
        if (loginData?.tenantId && fromDate && toDate) {
            fetchParticipateByDate(fromDate, toDate);
        }
    }, [fromDate, toDate, loginData?.tenantId]);

    useEffect(() => {
        const today = new Date();
        const formDate = new Date();
        formDate.setDate(today.getDate() - 7);

        // Format dates as YYYY-MM-DD for input[type=date]
        const formatDate = (date) => date.toISOString().split("T")[0];

        setToDate(formatDate(today));
        setFromDate(formatDate(formDate));
    }, []);

    // Convert image URL to Base64
    const toBase64 = async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Load Bangla Font
    const loadBanglaFont = async () => {
        const loadFont = async (url) => {
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = "";
            const chunkSize = 0x8000;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.subarray(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, chunk);
            }
            return btoa(binary);
        };

        const normal = await loadFont("/fonts/NotoSansBengali-Regular.ttf");
        const bold = await loadFont("/fonts/NotoSansBengali-Bold.ttf");

        pdfMake.fonts = {
            NotoBengali: {
                normal: "NotoSansBengali-Regular.ttf",
                bold: "NotoSansBengali-Bold.ttf",
            },
        };

        pdfMake.vfs = {
            "NotoSansBengali-Regular.ttf": normal,
            "NotoSansBengali-Bold.ttf": bold,
        };
    };

    // Generate PDF
    const handleDownload = async () => {
        if (!participateQuestionPaper || participateQuestionPaper.length === 0) return;

        await loadBanglaFont();

        const candidate = participateQuestionPaper[0].userInfo;
        const totalScore = participateQuestionPaper.reduce((sum, q) => sum + (parseFloat(q.ansMark) || 0), 0);
        const totalMark = participateQuestionPaper.reduce((sum, q) => sum + (parseFloat(q.qnMark) || 0), 0);

        const content = [];

        // Header: Candidate Name + Exam Name (center) + Total Scored (right)
        content.push({
            table: {
                widths: ["*", "auto"], // left (centered stack) + right (score)
                body: [
                    [
                        {
                            stack: [
                                { text: candidate.name, style: "header", alignment: "center" },
                                { text: `Exam Name: ${participateQuestionPaper[0].examName}`, style: "subheader", alignment: "center" },
                            ],
                            border: [false, false, false, false],
                            alignment: "center",
                            margin: [0, 0, 0, 0],
                        },
                        {
                            text: `Total Scored: ${totalScore} / ${totalMark}`,
                            alignment: "right",
                            bold: true,
                            margin: [0, 8, 0, 0], // vertical spacing from top
                            border: [false, false, false, false],
                        },
                    ],
                ],
            },
            layout: "noBorders",
            margin: [0, 5, 0, 10], // spacing around header
        });

        // Candidate info line (centered)
        content.push({
            text: `Current Organization: ${candidate.org} | Current Salary: ৳${candidate.salary} | Notice Period: ${candidate.noticePeriod} days`,
            alignment: "center",
            style: "info",
            margin: [0, 0, 0, 10],
        });


        // Questions Loop
        for (const [index, q] of participateQuestionPaper.entries()) {
            // Question text with marks
            content.push({
                table: {
                    widths: ["*", 100],
                    body: [
                        [
                            { text: `${index + 1}. ${q.question}`, style: "question" },
                            { text: `Mark: ${q.qnMark} | Score: ${q.ansMark || 0}`, alignment: "right", style: "mark" },
                        ],
                    ],
                },
                layout: "noBorders",
                margin: [0, 5, 0, 5],
            });

            // Question image
            if (q.qnImage) {
                try {
                    const imgData = await toBase64(q.qnImage);
                    content.push({
                        image: imgData,
                        width: 120,
                        margin: [0, 5, 0, 5],
                        alignment: "left",
                    });
                } catch (err) {
                    console.error("Image load error:", err);
                }
            }

            // MCQ options
            if (q.qnType === "MCQ" && q.options && q.options.length > 0) {
                q.options.forEach((opt, i) => {
                    let symbol = "";
                    if (opt.adminAnswer) symbol = "(Correct Ans)";
                    else if (q.participateAns === opt.text) symbol = "(Applicant Ans)";
                    content.push({
                        text: `${String.fromCharCode(65 + i)}. ${opt.text} ${symbol}`,
                        style: "option",
                        margin: [15, 1, 0, 1],
                    });
                });
            }

            // Descriptive answers
            if (q.qnType !== "MCQ") {
                let rawText = q.participateAns || "No Answer Provided";
                rawText = rawText.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();

                content.push({
                    text: [
                        { text: "Answer: ", bold: true },
                        { text: rawText },
                    ],
                    style: "answer",
                    alignment: "justify",
                    margin: [0, 3, 0, 8],
                });
            }
        }

        // Styles
        const docDefinition = {
            content,
            defaultStyle: { font: "NotoBengali", fontSize: 10 },
            styles: {
                header: { fontSize: 14, bold: true, margin: [0, 0, 0, 2] },
                subheader: { fontSize: 12, margin: [0, 0, 0, 4] },
                info: { fontSize: 10 },
                question: { fontSize: 10, bold: true },
                mark: { fontSize: 10 },
                option: { fontSize: 9 },
                answer: { fontSize: 9 },
            },
            pageMargins: [30, 30, 30, 30],
        };

        pdfMake.createPdf(docDefinition).download(`${candidate.name}_answers.pdf`);
    };


    const handleDownloadExcel = () => {
        if (participateList.length === 0) {
            return alert("No data available to export!");
        }

        // Map participateList to exportable structure
        const exportData = participateList.map((item, index) => ({
            SL: index + 1,
            Exam: item.examName,
            Name: item.label,
            Organization: item.org,
            Salary: item.salary,
            "Mobile No": item.mobileNo,
            Experience: item.experience,
            "Notice Period": item.noticePeriodLabel,
            "Qn Mark": item.totalQnMark,
            "Ans Mark": item.totalAnsMark,
            // "Mark":item.mark
            // Optionally include hidden fields
            // "User ID": item.value,
            // Password: item.password,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

        XLSX.writeFile(workbook, "Participants_Report.xlsx");
    };



    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    if (!isClient) return null;
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
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px; text-align: left; border-bottom: 1px solid #ddd;
          }
          .fixed-table td::before {
            content: attr(data-label); font-weight: bold; margin-right: 10px; flex: 1;
          }
          .fixed-table td:last-child { border-bottom: none; }
        }
      `}</style>

            <div className="rounded-md font-roboto overflow-hidden">


                <div className="bg-white border-b border-gray-300 justify-between p-3 rounded-t-sm shadow-sm flex flex-wrap items-center gap-4">
                    <div >
                        <h1 className="text-2xl font-bold text-gray-600">Participant Management</h1>
                    </div>
                    <div className='flex items-center gap-4 '>
                        {/* From Date */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-600">From Date:</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="px-2 py-1 rounded-sm border border-gray-300 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        {/* To Date */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-600">To Date:</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="px-2 py-1 rounded-sm border border-gray-300 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white sticky top-0 z-20 shadow-md">
                    {/* Header with search and actions */}
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

                        {/* Action buttons */}
                        <div className='flex items-center gap-3'>
                            {/* <Link onClick={handleOpenModal} href="#" passHref className="text-lg text-gray-50 cursor-pointer">
                            <IoMdAddCircle className="text-xl" />
                        </Link> */}
                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-500" />
                        </div>
                    </div>

                    {/* Participate  table */}
                    <div className=" rounded-b-md overflow-hidden max-h-[55vh] overflow-y-auto">
                        <table className="min-w-full text-sm text-left text-gray-600 table-auto">
                            <thead className="bg-gradient-to-r from-[#2c3e50] to-[#246fa1] text-xs uppercase font-light text-gray-50 sticky top-0 z-10">
                                <tr className="border-b border-gray-500">
                                    <th className="px-4 font-thin py-2 ">SL</th>
                                    <th className="px-4 font-thin py-2 ">Exam</th>
                                    <th className="px-4 font-thin py-2 ">Name</th>
                                    <th className="px-4 font-thin py-2 ">Organization</th>
                                    <th className="px-4 font-thin py-2 ">Salary</th>
                                    <th className="px-4 font-thin py-2 ">Mobile No</th>
                                    <th className="px-4 font-thin py-2 ">Experience</th>
                                    <th className="px-4 font-thin py-2 w-[130px] text-center">Notice Period</th>
                                    <th className="px-4 font-thin py-2 w-[90px] text-center">Mark</th>
                                    <th className="px-4 font-thin py-2  text-center">Exam Paper</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white text-xs text-gray-700">
                                {filteredSet.length === 0 ? (
                                    <tr key="no-participants">
                                        <td colSpan="10" className="text-center py-4">No participants found</td>
                                    </tr>
                                ) : (
                                    filteredSet.map((item, index) => (
                                        <tr key={`${item.value}-${index}`} className="border-b border-gray-300 hover:bg-[#4775a0] group">
                                            <td data-label="SL" className="px-4 py-1.5 group-hover:text-white">{index + 1}</td>
                                            <td data-label="Exam" className="px-4 py-1.5 group-hover:text-white">{item.examName}</td>
                                            <td data-label="Name" className="px-4 py-1.5 group-hover:text-white">{item.label}</td>
                                            <td data-label="Organization" className="px-4 py-1.5 group-hover:text-white">{item.org}</td>
                                            <td data-label="Salary" className="px-4 py-1.5 group-hover:text-white">৳ {item.salary}</td>
                                            <td data-label="Mobile No" className="px-4 py-1.5 group-hover:text-white">{item.mobileNo}</td>
                                            <td data-label="Experience" className="px-4 py-1.5 group-hover:text-white">{item.experience}</td>
                                            <td data-label="Notice Period" className="px-4 py-1.5 group-hover:text-white text-center">{item.noticePeriodLabel}</td>
                                            <td data-label="Qn Mark" className="px-4 py-1.5 group-hover:text-white text-center">{item.mark}</td>
                                            <td data-label="Exam Paper" className="px-4 py-1.5 group-hover:text-white text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={async () => {
                                                            await fetchParticipateQuestionPaper(item.id);
                                                            setIsEditMode(false);
                                                            setShowQuestionModal(true);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-blue-500 text-blue-500 rounded-sm group-hover:!text-white group-hover:border-white  transition-colors duration-200"
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            await fetchParticipateQuestionPaper(item.id);
                                                            setIsEditMode(true);
                                                            setShowQuestionModal(true);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-green-500 text-green-500 rounded-sm group-hover:!text-white group-hover:border-white  transition-colors duration-200"
                                                    >
                                                        <FiCheckCircle />
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


            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-sm p-6 w-full max-w-4xl mt-10 relative">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setShowQuestionModal(false);
                                setIsEditMode(false);
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-lg font-bold"
                        >
                            ✕
                        </button>
                        {participateQuestionPaper.length > 0 ? (
                            <>

                                <div className="mb-8 p-4 bg-blue-50 rounded-sm text-center mt-5">
                                    <div className="relative ">
                                        <h2 className="text-2xl font-semibold text-center flex flex-col items-center justify-center">
                                            <span className="text-[#4775a0]">{participateQuestionPaper[0]?.userInfo.name}</span>
                                            <span className="text-black">Exam Name: {participateQuestionPaper[0]?.examName}</span>
                                        </h2>

                                        <div className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-gray-800 border-3 border-black-400 rounded-sm p-2">
                                            Total Scored:{" "}
                                            {participateQuestionPaper.reduce((sum, q) => sum + (parseFloat(q.ansMark) || 0), 0)}{" "}
                                            /{" "}
                                            {participateQuestionPaper.reduce((sum, q) => sum + (parseFloat(q.qnMark) || 0), 0)}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 mt-1">
                                        {/* <span className="font-medium">User ID:</span> {participateQuestionPaper[0].userInfo.userId} |{" "} */}
                                        <span className="font-medium">Current Organization:</span> {participateQuestionPaper[0].userInfo.org} |{" "}
                                        <span className="font-medium">Current Salary:</span>৳ {participateQuestionPaper[0].userInfo.salary} |{" "}
                                        <span className="font-medium">Notice Period:</span> {participateQuestionPaper[0].userInfo.noticePeriod} days
                                    </p>
                                </div>

                                {/* Question List */}
                                <div className="space-y-2">
                                    {participateQuestionPaper.map((q, index) => (
                                        <div key={q.qnId} className="pt-2 pb-2 pl-4 pr-4">
                                            {/* Question Header + Marks */}
                                            <div className="flex justify-between items-start"> {/* Removed mb-2 to reduce space */}
                                                {/* Left side: question text */}
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 text-lg">
                                                        {index + 1}. {q.question}
                                                    </h3>
                                                    {/* <span className="text-sm text-gray-500 font-medium">{q.qnType}</span> */}
                                                </div>

                                                {/* Right side: mark and scored */}
                                                <div className="flex-shrink-0 text-sm text-gray-600 flex gap-4 items-center mt-1">
                                                    <span>Mark: {q.qnMark}</span>
                                                    <span>Scored: {q.ansMark}</span>
                                                </div>
                                            </div>

                                            {/* MCQ Options */}
                                            {q.qnType === "MCQ" && (
                                                <ul className="ml-2 space-y-0.5"> {/* Updated ml-4 → ml-2 and space-y-1 → space-y-0.5 */}
                                                    {q.options.map((opt, i) => {
                                                        const isSelected = q.participateAns === opt.text;
                                                        const isCorrect = opt.adminAnswer;
                                                        return (
                                                            <li
                                                                key={i}
                                                                className={`p-2 rounded text-sm items-center ${isSelected
                                                                    ? isCorrect
                                                                        ? "bg-green-100 text-green-800 font-medium"
                                                                        : "bg-red-100 text-red-800 font-medium"
                                                                    : "text-gray-700"
                                                                    }`}
                                                            >
                                                                <span className="font-medium mr-1">{String.fromCharCode(65 + i)}.</span>{opt.text}

                                                                {isSelected && !isCorrect && (
                                                                    <FiX className="ml-2 text-red-600 w-5 h-5 inline" />
                                                                )}

                                                                {isCorrect && (
                                                                    <FiCheck className="ml-2 text-green-600 w-5 h-5 inline" />
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}

                                            {q.qnImage && (
                                                <div className="mb-2 flex justify-start">
                                                    <img
                                                        src={q.qnImage}
                                                        alt="Question Image"
                                                        className="rounded-md object-contain"
                                                        style={{ maxHeight: "150px" }}
                                                    />
                                                </div>
                                            )}

                                            {/* Descriptive Answer */}
                                            {q.qnType !== "MCQ" && (
                                                <div className="ml-1 text-sm -mt-1"> {/* Updated ml-2 → ml-1 and added -mt-1 to reduce space */}
                                                    <span className="font-bold">Answer:</span>{" "}
                                                    <span style={{ textAlign: "justify", display: "block" }}>
                                                        {q.participateAns || "No Answer Provided"}
                                                    </span>

                                                    {/* Editable AnsMark field when in edit mode */}
                                                    {isEditMode ? (
                                                        <div className="mt-1">
                                                            <label className="font-medium text-gray-700">Score:</label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={q.ansMark || ""}
                                                                onChange={(e) => {
                                                                    let newValue = parseFloat(e.target.value);
                                                                    if (newValue > q.qnMark) newValue = q.qnMark;
                                                                    if (newValue < 0) newValue = 0;
                                                                    setParticipateQuestionPaper((prev) =>
                                                                        prev.map((pq) =>
                                                                            pq.qnId === q.qnId ? { ...pq, ansMark: newValue } : pq
                                                                        )
                                                                    );
                                                                }}
                                                                className="ml-2 border border-gray-300 rounded px-2 py-1 w-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                            <span className="ml-2 text-gray-500 text-sm">/ {q.qnMark}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>


                            </>
                        ) : (
                            <p className="text-center text-gray-500 py-12 text-lg">No questions found.</p>
                        )}


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
                                Cancel
                            </button>

                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleSaveMarks}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Save Evaluation
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}