'use client'
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Select from 'react-select';
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

export default function AddExam() {
    const { loginData } = useContext(AuthContext);

    // State declarations
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [setData, setSetData] = useState([]);
    const [filteredSet, setFilteredSet] = useState([]);
    const [participateList, setParticipateList] = useState([]);
    const [participateQuestionPaper, setParticipateQuestionPaper] = useState([]);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    // const [formData, setFormData] = useState({
    //     id: 0,
    //     name: "",
    //     setId: "",
    //     totalMark: 0,
    //     examTime: "00:00",
    //     entryBy: loginData?.UserId,
    //     isActive: true,
    // });

    // Initialize AOS animations
    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);


    const fetchParticipate = async () => {
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
                    parameters: { QueryChecker: 1 },
                }),
            });

            const data = await response.json();
            console.log("Participate List", data);

            if (Array.isArray(data)) {
                const formatted = data.map(item => ({
                    id: item.Id,
                    value: item.UserId,
                    label: item.Name,
                    password: item.Password,
                    org: item.CurrentOrg,
                    salary: item.CurrentSalary,
                    noticePeriod: item.NoticePeriod,
                }));
                setParticipateList(formatted);
            } else {
                toast.error("Invalid participate data format");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load participate data");
        }
    };


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
                            qnId: item.QnId,
                            question: item.Question,
                            qnType: item.QnType,
                            options: item.OptionText ? [item.OptionText] : [],
                            participateAns: item.ParticipateAns,
                            qnMark: item.QnMark,
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
                    } else if (item.OptionText && !existing.options.includes(item.OptionText)) {
                        existing.options.push(item.OptionText);
                    }
                    return acc;
                }, []);
                console.log("participate ans paper", groupedData)
                setParticipateQuestionPaper(groupedData);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load participate question paper");
        }
    };


    // useEffect(() => {
    //     let participateList = setData;

    //     if (searchQuery.trim() !== '') {
    //         const query = searchQuery.toLowerCase();
    //         participateList = participateList.filter(set =>
    //             set.name.toLowerCase().includes(query) ||
    //             set.examName.toLowerCase().includes(query)
    //         );
    //     }

    //     setFilteredSet(filteredData);
    // }, [searchQuery, setData]);

    useEffect(() => {
        if (loginData?.tenantId) {
            fetchParticipate();
            // fetchParticipateQuestionPaper();

        }
    }, [loginData?.tenantId]);


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
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Participant Management</h1>
                    <p className="text-gray-600 mt-2">View and manage participant exam papers</p>
                </div>
                <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">

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
                            <FaFileExcel className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>

                    {/* Participate  table */}
                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr className="border-b">
                                <th className="px-4 py-2 text-center">SL</th>
                                <th className="px-4 py-2 text-center">Name</th>
                                <th className="px-4 py-2 text-center">User ID</th>
                                <th className="px-4 py-2 text-center">Password</th>
                                <th className="px-4 py-2 text-center">Organization</th>
                                <th className="px-4 py-2 text-center">Salary</th>
                                <th className="px-4 py-2 text-center">Notice Period (days)</th>
                                <th className="px-4 py-2 text-center">Exam Paper</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white text-xs text-gray-700">
                            {participateList.length === 0 ? (
                                <tr key="no-participants">
                                    <td colSpan="7" className="text-center py-4">No participants found</td>
                                </tr>
                            ) : (
                                participateList.map((item, index) => (
                                    <tr key={`${item.value}-${index}`} className="border-b border-gray-300 hover:bg-gray-50">
                                        <td data-label="SL" className="px-4 py-2 text-center">{index + 1}</td>
                                        <td data-label="Name" className="px-4 py-2 text-center">{item.label}</td>
                                        <td data-label="User ID" className="px-4 py-2 text-center">{item.value}</td>
                                        <td data-label="Password" className="px-4 py-2 text-center">{item.password}</td>
                                        <td data-label="Organization" className="px-4 py-2 text-center">{item.org}</td>
                                        <td data-label="Salary" className="px-4 py-2 text-center">$ {item.salary}</td>
                                        <td data-label="Notice Period" className="px-4 py-2 text-center">{item.noticePeriod}</td>
                                        <td data-label="Actions" className="px-4 py-2 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={async () => {
                                                        await fetchParticipateQuestionPaper(item.id);
                                                        setShowQuestionModal(true);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200"
                                                >
                                                    <FiEye className="text-base" />
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


            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl mt-10 relative">
                        {/* Close button */}
                        <button
                            onClick={() => setShowQuestionModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-lg font-bold"
                        >
                            ✕
                        </button>

                        {participateQuestionPaper.length > 0 ? (
                            <>
                                {/* Candidate Info */}
                                <div className="mb-8 p-4 bg-blue-50 rounded-lg text-center">
                                    <h2 className="text-2xl font-semibold text-blue-700">
                                        {participateQuestionPaper[0].userInfo.name}
                                    </h2>
                                    <p className="text-sm text-gray-700 mt-1">
                                        {/* <span className="font-medium">User ID:</span> {participateQuestionPaper[0].userInfo.userId} |{" "} */}
                                        <span className="font-medium">Current Organization:</span> {participateQuestionPaper[0].userInfo.org} |{" "}
                                        <span className="font-medium">Current Salary:</span> {participateQuestionPaper[0].userInfo.salary} |{" "}
                                        <span className="font-medium">Notice Period:</span> {participateQuestionPaper[0].userInfo.noticePeriod} days
                                    </p>
                                </div>

                                {/* Question List */}
                                <div className="space-y-4">
                                    {participateQuestionPaper.map((q, index) => (
                                        <div key={q.qnId} className="p-4 bg-gray-50 rounded-lg">
                                            {/* Question Header + Marks */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 text-lg">
                                                        {index + 1}. {q.question}
                                                    </h3>
                                                    <span className="text-sm text-gray-500 font-medium">{q.qnType}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 flex gap-4 mt-1">
                                                    <span>Mark: {q.qnMark}</span>
                                                    <span>Scored: {q.ansMark}</span>
                                                </div>
                                            </div>

                                            {/* Optional Sketch / Image */}
                                            {q.sketch && (
                                                <div className="mb-2">
                                                    <img src={q.sketch} alt="Question Sketch" className="max-w-full rounded" />
                                                </div>
                                            )}

                                            {/* MCQ Options */}
                                            {q.qnType === "MCQ" && (
                                                <ul className="ml-4 space-y-1">
                                                    {q.options.map((opt, i) => (
                                                        <li
                                                            key={i}
                                                            className={`p-2 rounded text-sm ${q.participateAns === opt ? "bg-green-100 text-green-800 font-medium" : "text-gray-700"}`}
                                                        >
                                                            <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* Descriptive / Non-MCQ Answer */}
                                            {q.qnType !== "MCQ" && (
                                                <div className="mt-2 ml-2 text-sm text-gray-700 pl-2">
                                                    <span className="font-medium">Answer:</span>{" "}
                                                    <span className="text-blue-700">{q.participateAns || "No Answer Provided"}</span>
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
                            <button type="button" onClick={() => setShowQuestionModal(false)} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}