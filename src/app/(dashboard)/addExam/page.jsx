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
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

// Context and Components
import { AuthContext } from '../../provider/AuthProvider';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import config from '@/config';

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

  // Form States
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    setId: "",
    totalMark: 0,
    totalQn: 0,
    examTime: "00:00",
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
      const formattedExams = data.map(exam => ({
        id: exam.Id,
        setName: exam.SetName,
        examName: exam.ExamName,
        setId: exam.SetId,
        totalMark: exam.TotalMark,
        totalQn: exam.TotalQn,
        examTime: exam.ExamTime
      }));

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
    e.preventDefault();
    setLoading(true);

    try {
      // Input validation
      if (!formData.setId) throw new Error("Please select a question set.");
      if (!formData.name?.trim()) throw new Error("Exam name cannot be empty.");

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
        ExamTime: examTime,
        ...(isEdit
          ? { UpdateBy: loginData?.UserId }
          : { EntryBy: loginData?.UserId }),
        IsActive: true,
      };

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

  // ========== RENDER COMPONENT ==========

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
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr className="border-b">
                <th className="px-4 py-2 text-center">SL</th>
                <th className="px-4 py-2 text-center">Set Name</th>
                <th className="px-4 py-2 text-center">Exam Name</th>
                <th className="px-4 py-2 text-center">Total Ques</th>
                <th className="px-4 py-2 text-center">Total Mark</th>
                <th className="px-4 py-2 text-center">Exam Time</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white text-xs text-gray-700">
              {filteredExams.length === 0 ? (
                <tr key="no-exams">
                  <td colSpan="7" className="text-center py-4">No exams found</td>
                </tr>
              ) : (
                filteredExams.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td data-label="SL" className="px-4 py-2 text-center">{index + 1}</td>
                    <td data-label="Set Name" className="px-4 py-2 text-center">{item.setName}</td>
                    <td data-label="Exam Name" className="px-4 py-2 text-center">{item.examName}</td>
                    <td data-label="Total Ques" className="px-4 py-2 text-center">{item.totalQn}</td>
                    <td data-label="Total Mark" className="px-4 py-2 text-center">{item.totalMark}</td>
                    <td data-label="Exam Time" className="px-4 py-2 text-center">{item.examTime}</td>
                    <td data-label="Actions" className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-3">
                        {/* View Button */}
                        <button
                          onClick={() => openViewModal(item)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200">
                          <FiEye />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Exam"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                        >
                          <FiEdit className="text-base" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal(item)}
                          title="Delete Exam"
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

      {/* Add/Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-40 z-50 flex items-center justify-center">
          <div data-aos="zoom-in" className="bg-white rounded-lg shadow-md p-6 w-full max-w-xl relative">
            <form method="dialog">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              >
                ✕
              </button>
            </form>

            <div className="border-b border-gray-300 pb-2 mb-4">
              <h3 className="font-bold text-lg">{isEdit ? 'Edit Exam' : 'Exam Entry'}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Question Set Selection */}
              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Select Set</label>
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
                  className="w-full"
                  isClearable
                  isSearchable
                />
              </div>

              {/* Exam Name Input */}
              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter exam name"
                  required
                />
              </div>

              {/* Total Mark and Questions Display */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 w-1/2">
                  <label className="w-1/3 text-sm font-semibold text-gray-700">Total Mark</label>
                  <input
                    type="number"
                    value={formData.totalMark ?? 0}
                    readOnly
                    className="w-2/3 border px-3 py-2 rounded bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="flex items-center gap-3 w-1/2">
                  <label className="w-1/3 text-sm font-semibold text-gray-700">Total Ques</label>
                  <input
                    type="number"
                    value={formData.totalQn ?? 0}
                    readOnly
                    className="w-2/3 border px-3 py-2 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              {/* Exam Time Input */}
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam Time</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={examHour}
                    onChange={(e) => setExamHour(e.target.value)}
                    className="w-16 border px-2 py-1 rounded text-center"
                    placeholder="hh"
                  />
                  <span>hh</span>
                  <span>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={examMinute}
                    onChange={(e) => setExamMinute(e.target.value)}
                    className="w-16 border px-2 py-1 rounded text-center"
                    placeholder="mm"
                  />
                  <span>mm</span>
                </div>
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[90vh] p-6"
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
              <h3 className="text-2xl font-bold text-gray-800">Exam Name</h3>
              <span className="font-normal">{viewData.ExamName}</span>
            </div>

            {/* Basic Info */}
            <div className="flex flex-wrap justify-between items-center gap-4 text-gray-700 text-sm font-medium mb-6">
              <span>
                <b>Set Name: </b>
                <span className="font-normal">{viewData.SetName}</span>
              </span>
              <span>
                <b>Total Questions: </b>
                <span className="font-normal">{viewData.TotalQuestions}</span>
              </span>
              <span>
                <b>Total Mark: </b>
                <span className="font-normal">{viewData.TotalMark}</span>
              </span>
              {viewData.ExamTime && (
                <span>
                  <b>Exam Time: </b>
                  <span className="font-normal">{viewData.ExamTime}</span>
                </span>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {viewData.Questions && viewData.Questions.length > 0 ? (
                viewData.Questions.map((q, index) => (
                  <div key={q.qnId || index}>
                    {/* Question Header */}
                    <div className="mb-4 relative">
                      <h4 className="font-semibold text-gray-800 text-lg pr-16">
                        {index + 1}. {q.question}
                      </h4>
                      <span className="absolute top-0 right-0 text-gray-600 font-semibold">
                        Mark: {q.qnMark}
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
              )}
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