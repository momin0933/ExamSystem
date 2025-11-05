'use client'
import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Select from 'react-select';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Icons
import { FaFileExcel } from 'react-icons/fa';
import { IoMdAddCircle } from 'react-icons/io';
import { FiEdit, FiTrash2, FiEye, FiX } from "react-icons/fi";

// Context and Components
import { AuthContext } from '../../provider/AuthProvider';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import config from '@/config';
import pdfMake from "pdfmake/build/pdfmake";

export default function AddExam() {
  const { loginData } = useContext(AuthContext);
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Control States
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Data States
  const [questionSet, setQuestionSet] = useState([]);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [examTimeError, setExamTimeError] = useState("");

  // Form States
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    setId: "",
    totalMark: 0,
    totalQn: 0,
    examTime: "00:00",
    examFromDate: "",
    examToDate: "",
    entryBy: loginData?.UserId,
    isActive: true,
  });

  // Time States
  const [examHour, setExamHour] = useState("00");
  const [examMinute, setExamMinute] = useState("00");

  // Operation States
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  // Update time states when formData.examTime changes
  useEffect(() => {
    if (formData.examTime) {
      const [hh, mm] = formData.examTime.split(":");
      setExamHour(hh || "00");
      setExamMinute(mm || "00");
    }
  }, [formData.examTime]);

  // Filter exams based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExams(exams);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = exams.filter(exam =>
      exam.setName.toLowerCase().includes(query) ||
      exam.examName.toLowerCase().includes(query)
    );
    setFilteredExams(filtered);
  }, [searchQuery, exams]);

  // Load data when tenantId is available
  useEffect(() => {
    if (loginData?.tenantId) {
      fetchQuestionSets();
      fetchExams();
    }
  }, [loginData?.tenantId]);


  //Fetches all Question set for Dropdown

  const fetchQuestionSets = async () => {
    if (!loginData?.tenantId) {
      console.warn("No tenantId available, skipping fetch");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}api/Exam/GetQuestionSets`, {
        headers: {
          TenantId: loginData.tenantId,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch question sets");

      const data = await res.json();
      const options = data.map(set => ({
        value: set.Id,
        label: set.Name,
        totalMark: set.TotalMark,
        totalQn: set.TotalQn,
      }));

      setQuestionSet(options);
    } catch (err) {
      console.error("Error fetching question sets:", err);
      toast.error("Failed to load question sets");
    }
  };


  //Fetches all exams for display in table

  const fetchExams = async () => {
    if (!loginData?.tenantId) {
      console.warn("No tenantId available, skipping fetch");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}api/Exam/GetExams`, {
        headers: {
          TenantId: loginData.tenantId,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch exams");

      const data = await res.json();
      console.log("Exam Grid Data", data)
      const formattedExams = data.map(exam => ({
        id: exam.Id,
        setName: exam.SetName,
        examName: exam.ExamName,
        setId: exam.SetId,
        totalMark: exam.TotalMark,
        totalQn: exam.TotalQn,
        examTime: exam.ExamTime,
        fromDate: exam.FromDate,
        toDate: exam.ToDate
      }));
      console.log("Exam Grid formatted Data", formattedExams)
      setExams(formattedExams);
      setFilteredExams(formattedExams);
    } catch (err) {
      console.error("Error fetching exams:", err);
      toast.error("Failed to load exams");
    }
  };

  //Fetches detailed exam data for view

  const fetchExamById = async (id) => {
    if (!id || !loginData?.tenantId) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
        method: "POST",
        headers: {
          TenantId: loginData.tenantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "",
          procedureName: "SP_ExamManage",
          parameters: { QueryChecker: 1, Id: id },
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch exam data");

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        toast.error("No data found for this exam");
        setViewData(null);
        return;
      }

      // Group questions by QuestionId to handle multiple options
      const questionMap = new Map();

      data.forEach((item) => {
        const key = item.QuestionId ?? `no-id-${item.Id}-${Math.random()}`;
        if (!questionMap.has(key)) {
          questionMap.set(key, {
            qnId: item.QuestionId ?? item.Id,
            subjectName: item.SubjectName ?? "",
            question: item.Question || "No Question Text",
            qnType: item.QnType ?? "MCQ",
            qnMark: item.Mark ?? 0,
            qnImage: item.Sketch || null,
            options: item.OptionText ? [{ text: item.OptionText, isCorrect: item.isCorrect }] : [],
          });
        } else {
          const existing = questionMap.get(key);
          if (item.OptionText && !existing.options.some(o => o.text === item.OptionText)) {
            existing.options.push({ text: item.OptionText, isCorrect: item.isCorrect });
          }
        }
      });

      const exam = {
        Id: data[0].ExamId,
        ExamName: data[0].ExamName || "Untitled Exam",
        SetName: data[0].SetName || "No Set Name",
        TotalMark: data[0].TotalMark ?? 0,
        TotalQuestions: questionMap.size,
        ExamTime: data[0].ExamTime || "00:00",
        ExamFromDate: data[0].ExamFromDate ? new Date(data[0].ExamFromDate).toISOString().split("T")[0] : "",
        ExamToDate: data[0].ExamToDate ? new Date(data[0].ExamToDate).toISOString().split("T")[0] : "",
        Questions: Array.from(questionMap.values()),
      };

      setViewData(exam);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast.error(error.message || "Failed to load exam data");
      setViewData(null);
    }
  };

  //Handles form submission for both add and edit operations

  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();
    setLoading(true);
    setExamTimeError("");

    try {
      // Input validation
      if (!formData.setId) throw new Error("Please select a question set.");
      if (!formData.name?.trim()) throw new Error("Exam name cannot be empty.");
      //  Exam time validation
      if (!examHour && !examMinute) {
        setExamTimeError("Please enter exam time (hour or minute).");
        setTimeout(() => setExamTimeError(""), 2000);
        setLoading(false);
        return;
      }

      if (Number(examHour) === 0 && Number(examMinute) === 0) {
        setExamTimeError("Exam time cannot be 0 hours and 0 minutes.");
        setTimeout(() => setExamTimeError(""), 2000);
        setLoading(false);
        return;
      }

      // Format exam time safely
      let examTime = null;
      if (examHour || examMinute) {
        const hh = String(examHour).padStart(2, "0");
        const mm = String(examMinute).padStart(2, "0");
        examTime = `${hh}:${mm}:00`;
      }

      const payload = {
        Id: formData.id,
        SetId: Number(formData.setId),
        Name: formData.name.trim(),
        TotalMark: Number(formData.totalMark),
        ExamFromDate: formData.examFromDate ? new Date(formData.examFromDate).toISOString() : null,
        ExamToDate: formData.examToDate ? new Date(formData.examToDate).toISOString() : null,
        ExamTime: examTime,
        ...(isEdit
          ? { UpdateBy: loginData?.UserId }
          : { EntryBy: loginData?.UserId }),
        IsActive: true,
      };

      console.log("Exam play load Data", payload)
      if (formData.examFromDate && formData.examToDate) {
        if (new Date(formData.examToDate) < new Date(formData.examFromDate)) {
          toast.error("Exam To Date cannot be earlier than Exam From Date.");
          setLoading(false);
          return;
        }
      }

      const apiUrl = isEdit
        ? `${config.API_BASE_URL}api/Exam/UpdateExam`
        : `${config.API_BASE_URL}api/Exam/AddExam`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          TenantId: loginData?.tenantId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Failed to save exam");

      toast.success(isEdit ? "Exam updated successfully!" : "Exam added successfully!");
      resetForm();
      setShowModal(false);
      fetchExams(); // Refresh the exam list
    } catch (err) {
      console.error("Error saving exam:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  //Resets form to initial state

  const resetForm = () => {
    setFormData({
      id: 0,
      name: "",
      setId: "",
      totalMark: 0,
      totalQn: 0,
      examTime: "00:00",
      examFromDate: "",
      examToDate: "",
      entryBy: loginData?.UserId,
      isActive: true
    });
    setExamHour("00");
    setExamMinute("00");
    setIsEdit(false);
    setEditId(null);
  };


  //Opens modal for adding new exam

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };


  //Opens modal for editing existing exam

  const openEditModal = async (exam) => {
    if (!exam?.id) {
      console.error("Invalid Exam ID");
      return;
    }

    try {
      setIsEdit(true);
      setEditId(exam.id);

      const res = await fetch(`${config.API_BASE_URL}api/Exam/GetExamById/${exam.id}`, {
        headers: {
          TenantId: loginData?.tenantId,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch exam data");

      const data = await res.json();
      setFormData({
        id: data.Id,
        name: data.Name || "",
        setId: data.SetId || "",
        totalMark: data.TotalMark || 0,
        totalQn: data.TotalQn || 0,
        examTime: data.ExamTime,
        examFromDate: data.ExamFromDate ? data.ExamFromDate.split("T")[0] : "",
        examToDate: data.ExamToDate ? data.ExamToDate.split("T")[0] : "",
        entryBy: data.EntryBy || loginData?.UserId,
        isActive: data.IsActive ?? true,
      });

      const [hh, mm] = exam.examTime ? exam.examTime.split(":") : ["00", "00"];
      setExamHour(hh);
      setExamMinute(mm);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching exam for edit:", err);
      toast.error("Failed to load exam data for editing");
    }
  };


  // Opens view modal with exam details

  const openViewModal = (exam) => {
    if (!exam?.id) return;
    fetchExamById(exam.id);
  };



  //Opens delete confirmation modal

  const openDeleteModal = (exam) => {
    if (!exam?.id) return;
    setDeleteId(exam.id);
    setDeleteSuccessMsg("");
    setIsDeleteModalOpen(true);
  };

  // Handles exam deletion after confirmation

  const handleConfirmDelete = async () => {
    if (!deleteId || !loginData?.tenantId) return;

    try {
      const response = await fetch(
        `${config.API_BASE_URL}api/Exam/RemoveExam/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            TenantId: loginData.tenantId,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error || "Failed to delete exam");
      }

      setDeleteSuccessMsg("Exam deleted successfully.");
      setTimeout(() => setIsDeleteModalOpen(false), 1500);
      fetchExams(); // Refresh the exam list
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Delete failed. Please try again.");
      setIsDeleteModalOpen(false);
    }
  };

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

  const handleDownload = async () => {
    if (!viewData || !viewData.Questions || viewData.Questions.length === 0) return;

    await loadBanglaFont();

    const content = [
      {

        text: `Exam Name: ${viewData.ExamName || "N/A"}`,
        style: "header",
        alignment: "center",
      },
      {
        text: `Set Name: ${viewData.SetName || "N/A"}`,
        style: "subheader",
        alignment: "center",
      },
      {
        text: `Total Questions: ${viewData.TotalQuestions || 0} | Total Marks: ${viewData.TotalMark || 0}`,
        style: "subheader",
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
    ];

    // If exam date/time info exists, show it
    const infoLines = [];
    if (viewData.ExamFromDate) infoLines.push(`From: ${viewData.ExamFromDate}`);
    if (viewData.ExamToDate) infoLines.push(`To: ${viewData.ExamToDate}`);
    if (viewData.ExamTime) infoLines.push(`Time: ${viewData.ExamTime}`);
    if (infoLines.length > 0) {
      content.push({
        text: infoLines.join(" | "),
        style: "smallInfo",
        alignment: "center",
        margin: [0, 0, 0, 6],
      });
    }

    // Group by subject (if available)
    const groupedQuestions = Object.entries(
      viewData.Questions.reduce((acc, q) => {
        const key = q.subjectName || "Questions";
        if (!acc[key]) acc[key] = [];
        acc[key].push(q);
        return acc;
      }, {})
    );

    for (const [subject, questions] of groupedQuestions) {
      // Subject Header
      content.push({ text: subject, style: "subjectHeader", margin: [0, 6, 0, 4] });

      for (const [index, q] of questions.entries()) {
        // Question text & mark
        content.push({
          table: {
            widths: ["*", 50],
            body: [
              [
                { text: `${index + 1}. ${q.question}`, style: "question" },
                { text: `${q.qnMark || 0}`, style: "mark", alignment: "right" },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 2, 0, 2],
        });

        // Question image
        if (q.qnImage) {
          try {
            const imgData = await toBase64(q.qnImage);
            content.push({
              image: imgData,
              width: 200,
              margin: [0, 5, 0, 5],
            });
          } catch (err) {
            console.error("Image load error:", err);
          }
        }

        // MCQ Options
        if (q.qnType === "MCQ" && q.options && q.options.length > 0) {
          q.options.forEach((opt, i) => {
            content.push({
              text: `${String.fromCharCode(65 + i)}. ${opt.text}${opt.isCorrect ? " ✓" : ""
                }`,
              style: "option",
              margin: [12, 1, 0, 1],
            });
          });
        }
      }
    }

    const docDefinition = {
      content,
      defaultStyle: { font: "NotoBengali" },
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
        subheader: { fontSize: 14, margin: [0, 0, 0, 5] },
        smallInfo: { fontSize: 12, bold: true, color: "#555" },
        subjectHeader: { fontSize: 12, bold: true, color: "#2b4b80" },
        question: { fontSize: 11 },
        mark: { fontSize: 11, },
        option: { fontSize: 10 },
      },
      pageMargins: [40, 40, 40, 40],
    };

    pdfMake.createPdf(docDefinition).download(
      `${viewData.ExamName?.replace(/\s+/g, "_") || "Exam"}_${viewData.SetName || "Set"}.pdf`
    );
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);



  // ========== RENDER COMPONENT ==========

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
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-800">Exam List</h1>
      </div>
      <div className="rounded-sm font-roboto overflow-hidden">
        <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">
          {/* Search Input */}
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
              <FaFileExcel className="text-lg cursor-pointer text-gray-50" />
            </div>
          </div>

          {/* Exams table */}
          <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[65vh] overflow-y-auto">
            <table className="min-w-full ">
              <thead className="bg-gray-100 text-xs uppercase text-gray-800 sticky top-0 z-10">
                <tr className="border-b">
                  <th className="px-4 py-2 text-center whitespace-nowrap">SL</th>
                  <th className="px-4 py-2 whitespace-nowrap">Set</th>
                  <th className="px-4 py-2 whitespace-nowrap">Exam Name</th>
                  <th className="px-4 py-2 whitespace-nowrap">Total Ques</th>
                  <th className="px-4 py-2 whitespace-nowrap">Total Mark</th>
                  <th className="px-4 py-2 whitespace-nowrap">From Date</th>
                  <th className="px-4 py-2 whitespace-nowrap">To Date</th>
                  <th className="px-4 py-2 whitespace-nowrap">Exam Time</th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white text-xs text-gray-800">
                {filteredExams.length === 0 ? (
                  <tr key="no-exams">
                    <td colSpan="9" className="text-center py-4">No exams found</td>
                  </tr>
                ) : (
                  filteredExams.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-300 hover:bg-[#4775a0] group">
                      <td data-label="SL" className="px-4 py-1.5 group-hover:text-white text-center">{index + 1}</td>
                      <td data-label="Set Name" className="px-4 py-1.5 group-hover:text-white ">{item.setName}</td>
                      <td data-label="Exam Name" className="px-4 py-1.5 group-hover:text-white ">{item.examName}</td>
                      <td data-label="Total Ques" className="px-4 py-1.5  group-hover:text-white">{item.totalQn}</td>
                      <td data-label="Total Mark" className="px-4 py-1.5 group-hover:text-white ">{item.totalMark}</td>
                      {/* <td data-label="From Date" className="px-4 py-1.5 text-center">{item.fromDate}</td>
                    <td data-label="To Date" className="px-4 py-1.5 text-center">{item.toDate}</td> */}
                      <td data-label="From Date" className="px-4 py-1.5 group-hover:text-white ">
                        {item.fromDate ? new Date(item.fromDate).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td data-label="To Date" className="px-4 py-1.5 group-hover:text-white ">
                        {item.toDate ? new Date(item.toDate).toLocaleDateString("en-GB") : "-"}
                      </td>


                      <td data-label="Exam Time" className="px-4 py-1.5 group-hover:text-white">{item.examTime}</td>
                      <td data-label="Actions" className="px-4 py-1.5 group-hover:text-white text-center">
                        <div className="flex justify-center gap-3">
                          {/* View Button */}
                          <button
                            onClick={() => openViewModal(item)}
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-blue-500 text-blue-500  rounded-sm group-hover:!text-white group-hover:border-white transition-colors duration-200"
                          >
                            <FiEye />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Exam"
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-[#00925a] text-[#00925a] rounded-sm group-hover:!text-white group-hover:border-white transition-colors duration-200"
                          >
                            <FiEdit className="text-base" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => openDeleteModal(item)}
                            title="Delete Exam"
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium border border-red-500 text-red-500 rounded-sm group-hover:bg-red-500 group-hover:!text-white transition-colors duration-200"
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

      {/* Add/Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-40 z-50 flex items-center justify-center">
          <div data-aos="zoom-in" className="bg-white rounded-sm shadow-md p-6 w-full max-w-xl relative">
            <form method="dialog">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              >
                <FiX className="w-4 h-4" />
              </button>
            </form>

            <div className="border-b border-gray-300 pb-2 mb-4">
              <h3 className="font-bold text-lg text-gray-800">{isEdit ? 'Edit Exam' : 'Exam Entry'}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Question Set Selection */}
              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Select Set <span className="text-red-500">*</span></label>:
                <Select
                  options={questionSet}
                  value={questionSet.find(opt => opt.value === formData.setId) || null}
                  onChange={(option) => setFormData({
                    ...formData,
                    setId: option?.value,
                    totalMark: option?.totalMark || 0,
                    totalQn: option?.totalQn || 0
                  })}
                  placeholder="Select or search question set..."
                  className="w-full focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                  isClearable
                  isSearchable
                  required
                />
              </div>

              {/* Exam Name Input */}
              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam Name <span className="text-red-500">*</span></label>:
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded-sm focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter exam name"
                  required
                />
              </div>
              {/* Exam From Date */}
              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam From Date <span className="text-red-500">*</span></label>:
                <input
                  type="date"
                  value={formData.examFromDate || ""}
                  onChange={(e) => setFormData({ ...formData, examFromDate: e.target.value })}
                  required
                  className="w-full border px-3 py-2 rounded-sm focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>

              {/* Exam To Date */}
              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam To Date <span className="text-red-500">*</span></label>:
                <input
                  type="date"
                  value={formData.examToDate || ""}
                  onChange={(e) => setFormData({ ...formData, examToDate: e.target.value })}
                  required
                  className="w-full border px-3 py-2 rounded-sm focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>

              {/* Total Mark and Questions Display */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 w-1/2">
                  <label className="w-1/3 text-sm font-semibold text-gray-700">Total Ques</label>:
                  <input
                    type="number"
                    value={formData.totalQn ?? 0}
                    readOnly
                    className="w-2/3 border px-3 py-2 rounded-sm bg-gray-100 text-gray-700"
                  />
                </div>
                <div className="flex items-center gap-3 w-1/2">
                  <label className="w-1/3 text-sm font-semibold text-gray-700">Total Mark</label>:
                  <input
                    type="number"
                    value={formData.totalMark ?? 0}
                    readOnly
                    className="w-2/3 border px-3 py-2 rounded-sm bg-gray-100 text-gray-700"
                  />
                </div>
              </div>

              {/* Exam Time Input */}
              {/* <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam Time</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={examHour}
                    onChange={(e) => setExamHour(e.target.value)}
                    className="w-16 border px-2 py-1 rounded-sm text-center focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="hh"
                    required
                  />
                  <span>hh</span>
                  <span>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={examMinute}
                    onChange={(e) => setExamMinute(e.target.value)}
                    className="w-16 border px-2 py-1 rounded-sm text-center focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="mm"
                    required
                  />
                  <span>mm</span>
                </div>
              </div> */}

              <div className="flex flex-col w-full">
                <div className="flex items-center gap-3">
                  <label className="w-1/3 text-sm font-semibold text-gray-700">
                    Exam Time<span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={examHour}
                      onChange={(e) => {
                        setExamHour(e.target.value);
                        setExamTimeError(""); // clear error when user types
                      }}
                      className="w-16 border px-2 py-1 rounded-sm text-center focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="hh"
                      required
                    />
                    <span>hh</span>
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={examMinute}
                      onChange={(e) => {
                        setExamMinute(e.target.value);
                        setExamTimeError("");
                      }}
                      className="w-16 border px-2 py-1 rounded-sm text-center focus:outline-none focus:ring-0 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="mm"
                      required
                    />
                    <span>mm</span>
                  </div>
                </div>

                {/* Error message under inputs */}
                {examTimeError && (
                  <p className="text-red-500 text-sm mt-1 ml-[33%]">{examTimeError}</p>
                )}
              </div>


              {/* Form Actions */}
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
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Exam Details Modal */}
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
              <h3 className="text-2xl font-bold text-gray-800">Exam Name</h3>
              <span className="font-normal">{viewData.ExamName}</span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-700 text-medium font-medium mb-6">
              {/* First Row */}
              <span>
                <b>Set Name: </b>
                <span className="font-normal">{viewData.SetName}</span>
              </span>
              <span>
                <b>Total Questions: </b>
                <span className="font-normal">{viewData.TotalQuestions}</span>
              </span>
              <span>
                <b>Total Marks: </b>
                <span className="font-normal">{viewData.TotalMark}</span>
              </span>

              {/* Second Row */}
              {viewData.ExamFromDate && (
                <span>
                  <b>From Date: </b>
                  <span className="font-normal">{viewData.ExamFromDate}</span>
                </span>
              )}
              {viewData.ExamToDate && (
                <span>
                  <b>To Date: </b>
                  <span className="font-normal">{viewData.ExamToDate}</span>
                </span>
              )}
              {viewData.ExamTime && (
                <span>
                  <b>Exam Time: </b>
                  <span className="font-normal">{viewData.ExamTime}</span>
                </span>
              )}
            </div>


            {/* Questions List */}
            <div className="space-y-2">
              {viewData.Questions && viewData.Questions.length > 0 ? (
                viewData.Questions.map((q, index) => (
                  <div key={q.qnId || index}>
                    {/* Question Header */}
                    <div className="mb-2 flex justify-between items-start">
                      <h4 className="font-normal flex-1 mr-4">
                        {index + 1}. {q.question}
                      </h4>
                      <span className="font-normal whitespace-nowrap">
                        {q.qnMark}
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
                            className="p-1 rounded-sm text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <span className="font-normal">{String.fromCharCode(65 + i)}.</span>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        statusMessage={deleteSuccessMsg}
      />
    </div>
  )
}