'use client';
import config from '@/config';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import { FaFileExcel } from 'react-icons/fa';
import { FiEdit, FiTrash2, FiEye,FiX } from "react-icons/fi";
import { useState, useEffect, useContext } from 'react';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { AuthContext } from '../../provider/AuthProvider';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import pdfMake from "pdfmake/build/pdfmake";



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
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [viewData, setViewData] = useState(null);

    //For Image
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

// For Bangla Font
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
            NotoBengali: { normal: "NotoSansBengali-Regular.ttf", bold: "NotoSansBengali-Bold.ttf" }
        };
        pdfMake.vfs = {
            "NotoSansBengali-Regular.ttf": normal,
            "NotoSansBengali-Bold.ttf": bold
        };
    };
 
//For Download Pdf
    const handleDownload = async () => {
        if (!viewData?.Questions || viewData.Questions.length === 0) return;

        await loadBanglaFont();
        const content = [
            {
                // text: viewData.SetName || "Question Set",
                text: `Question Set: ${viewData.SetName || "Question Set"}`,
                style: "header",
                alignment: "center"  
            },
            {
                text: `Total Questions: ${viewData.TotalQuestions || 0} | Total Marks: ${viewData.TotalMark || 0}`,
                style: "subheader",
                alignment: "center"  
            }
        ];

        const groupedQuestions = Object.entries(
            viewData.Questions.reduce((acc, q) => {
                if (!acc[q.subjectName]) acc[q.subjectName] = [];
                acc[q.subjectName].push(q);
                return acc;
            }, {})
        );

        for (const [subject, questions] of groupedQuestions) {
            // Subject header
            content.push({ text: `${subject} (${questions.length})`, style: "subject" });

            for (const [idx, q] of questions.entries()) {
              
                content.push({
                    table: {
                        widths: ['*', 50], 
                        body: [
                            [
                                { text: `${idx + 1}. ${q.question}`, style: "question" },
                                { text: `${q.qnMark || 0}`, style: "mark", alignment: "right" }
                            ]
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 2, 0, 2]
                });

                // Question image
                if (q.qnImage) {
                    try {
                        const imgData = await toBase64(q.qnImage);
                        content.push({
                            image: imgData,
                            width: 200,
                            margin: [0, 5, 0, 5]
                        });
                    } catch (err) {
                        console.error("Image load error:", err);
                    }
                }

                // MCQ options
                if (q.qnType === "MCQ" && q.options && q.options.length > 0) {
                    for (const [i, opt] of q.options.entries()) {
                        content.push({
                            text: `${String.fromCharCode(65 + i)}. ${opt.text}${opt.isCorrect ? ' ✓' : ''}`,
                            style: "option",
                            margin: [10, 1, 0, 1]
                        });
                    }
                }
            }
        }

        const docDefinition = {
            content,
            defaultStyle: { font: "NotoBengali" },
            styles: {
                header: { fontSize: 15, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 13, margin: [0, 0, 0, 10] },
                subject: { fontSize: 13, bold: true, margin: [0, 5, 0, 5] },
                question: { fontSize: 12 },
                mark: { fontSize: 12},
                option: { fontSize: 11 }
            }
        };

        pdfMake.createPdf(docDefinition).download(`QuestionSet_${viewData.SetName || "QuestionSet"}.pdf`);
    };


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
            console.log("Question Set", data)
            setSetData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load Set data');
        }
    };

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
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    return (
        <div className="overflow-x-auto p-2">
            <div className="mb-1">
                <h1 className="text-2xl font-bold text-gray-800">Question Set</h1>
            </div>
            <div className="rounded-sm font-roboto overflow-hidden shadow-md">
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
                            {/* <button onClick={() => router.push('/setEntry')} className="text-lg text-gray-50 cursor-pointer flex items-center gap-1">
                                <IoMdAddCircle className="text-xl" />
                            </button> */}
                            <Link
                                href="/setEntry"
                                className="text-lg text-gray-50 cursor-pointer flex items-center gap-1"

                            >
                                <IoMdAddCircle className="text-xl" />
                            </Link>
                            {/* <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" /> */}
                        </div>
                    </div>

                    {/* Set List Table */}
                    <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[65vh] overflow-y-auto">
                        <table className="min-w-full text-sm text-left">
                            {/* <thead className="bg-gray-100 text-xs uppercase text-gray-700"> */}
                            <thead className="bg-gray-100 text-xs uppercase text-gray-800 sticky top-0 z-10">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-center ">SL</th>
                                    <th className="px-4 py-2 text-center ">Set Name</th>
                                    <th className="px-4 py-2">Position Name</th>
                                    <th className="px-4 py-2 text-center ">Total Questions</th>
                                    <th className="px-4 py-2 text-center ">Total Marks</th>
                                    <th className="px-4 py-2 text-center ">Actions</th>
                                </tr>
                            </thead>
                            {/* <tbody className="bg-white text-xs text-gray-700">
                                {filteredSet.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-4">No data found</td></tr>
                                ) : (
                                    filteredSet.map((set, index) => (
                                        <tr key={set.Id} className="border-b border-gray-300 hover:bg-gray-50">
                                            <td className="px-4 py-2 text-center">{index + 1}</td>
                                            <td className="px-4 py-2 text-center">{set.Name}</td>
                                            <td className="px-4 py-2 text-center">{set.TotalQn}</td>
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
                            </tbody> */}
                            <tbody className="bg-white text-xs text-gray-800">
                                {filteredSet.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-4">No data found</td></tr>
                                ) : (
                                    filteredSet.map((set, index) => (
                                        <tr key={set.Id} className="border-b border-gray-300 hover:bg-[#4775a0] group">
                                            <td className="px-4 py-1.5 group-hover:text-white text-center">{index + 1}</td>
                                            <td className="px-4 py-1.5 group-hover:text-white text-center">{set.Name}</td>
                                            <td className="px-4 py-1.5 group-hover:text-white ">{set.SubjectSummary}</td>
                                            <td className="px-4 py-1.5 group-hover:text-white text-center">{set.TotalQn}</td>
                                            <td className="px-4 py-1.5 group-hover:text-white text-center">{set.TotalMark}</td>
                                            <td className="px-4 py-1.5 text-center flex justify-center gap-2">
                                                <button onClick={() => openViewModal(set)} className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-blue-500 text-blue-500 rounded-sm group-hover:!text-white group-hover:border-white transition-colors duration-200">
                                                    <FiEye />
                                                </button>
                                                <button onClick={() => router.push(`/setEntry?id=${set.Id}`)} className="px-3 py-1 border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] group-hover:!text-white group-hover:border-white  transition">
                                                    <FiEdit />
                                                </button>
                                                <button onClick={() => openDeleteModal(set)} className="px-3 py-1 border border-red-500 text-red-500 rounded group-hover:bg-red-500 group-hover:!text-white transition">
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
                            className="bg-white rounded-sm shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[90vh] p-6"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold transition"
                            >
                                <FiX className="w-4 h-4" />
                            </button>

                            {/* Header */}
                            <div className="mb-6 text-center">
                                <h3 className="text-2xl font-bold text-gray-800">Question Set: <span className="font-normal">{viewData.SetName}</span></h3>
                            </div>

                            {/* Basic Info */}
                            <div className="flex flex-wrap justify-between items-center gap-4 text-gray-700 text-sm font-medium mb-6">
                                {/* <span>
                                    <b>Set Name: </b>
                                    <span className="font-normal">{viewData.SetName}</span>
                                </span> */}
                                <span>
                                    <b>Total Question: </b>
                                    <span className="font-normal">{viewData.TotalQuestions}</span>
                                </span>
                                <span>
                                    <b>Total Marks: </b>
                                    <span className="font-normal">{viewData.TotalMark}</span>
                                </span>
                            </div>

                            {/* Questions */}
                            <div className="space-y-6">
                                {/* {viewData.Questions && viewData.Questions.length > 0 ? (
                                    viewData.Questions.map((q, index) => (
                                        <div
                                            key={q.qnId || index}
                                            className=""
                                        >
         

                                            <div className="mb-4 relative">
                                                <h4 className="font-semibold text-gray-800 text-lg pr-16">
                                                    {index + 1}. {q.question}
                                                </h4>
                                                <span className="absolute top-0 right-0 text-gray-600 font-semibold">
                                                    Mark: {q.qnMark}
                                                </span>
                                            </div>
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
                                )} */}

                                {viewData.Questions && viewData.Questions.length > 0 ? (
                                    Object.entries(
                                        viewData.Questions.reduce((acc, q) => {
                                            if (!acc[q.subjectName]) acc[q.subjectName] = [];
                                            acc[q.subjectName].push(q);
                                            return acc;
                                        }, {})
                                    ).map(([subject, questions]) => (
                                        <div key={subject} className="mb-6">
                                            {/* Subject Header */}
                                            <h4 className="text-lg font-normal text-gray-800 mb-3">{subject} ({questions.length})</h4>

                                            {/* Questions under this subject */}
                                            {questions.map((q, index) => (
                                                <div key={q.qnId || index} className="mb-4 relative">
                                                    <h5 className="font-normal text-gray-700 pr-16">
                                                        {index + 1}. {q.question}
                                                    </h5>
                                                    <span className="absolute top-0 right-0 text-gray-700 font-normal">
                                                        {q.qnMark}
                                                    </span>

                                                    {q.qnImage && (
                                                        <div className="mb-2 flex justify-start">
                                                            <img
                                                                src={q.qnImage}
                                                                alt="Question"
                                                                className="rounded-sm object-contain border border-gray-200"
                                                                style={{ maxHeight: "150px" }}
                                                            />
                                                        </div>
                                                    )}

                                                    {q.qnType === "MCQ" && q.options && q.options.length > 0 && (
                                                        <ul className="ml-4 space-y-1">
                                                            {q.options.map((opt, i) => (
                                                                <li key={i} className="p-2 rounded text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                                                    <span className="font-medium mr-1">{String.fromCharCode(65 + i)}.</span>
                                                                    {opt.text}
                                                                    {opt.isCorrect && <span className="ml-2 text-green-600 font-semibold">✓</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-6 text-lg">No questions found.</p>
                                )}

                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded-sm shadow hover:bg-blue-700 transition duration-200 ease-in-out flex items-center"
                                >
                                    Download
                                </button>

                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-sm shadow hover:bg-gray-300 transition duration-200 ease-in-out"
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
