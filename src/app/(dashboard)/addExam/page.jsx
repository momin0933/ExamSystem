'use client'
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import Link from 'next/link';
import { IoMdAddCircle } from 'react-icons/io';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2 } from "react-icons/fi";
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Select from 'react-select';

export default function AddExam() {
  const { loginData } = useContext(AuthContext);

  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [questionSet, setQuestionSet] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  

  // Form data state
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    setId: "",
    totalMark: 0,
    remarks: "",
    examTime: 0,
    entryBy: loginData?.UserId,
    isActive: true
  });

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  // Fetch question sets for dropdown
  const fetchQuestionSets = async () => {
    if (!loginData.tenantId) {
      console.warn("No loginData available, skipping fetch");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}api/Exam/GetQuestionSets`, {
        headers: {
          TenantId: loginData.tenantId,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      const options = data.map(set => ({
        value: set.Id,
        label: set.Name,
        totalMark: set.TotalMark
      }));
      setQuestionSet(options);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load question sets");
    }
  };

  // Fetch exams list for show grid data
  const fetchExams = async () => {
    debugger;
    if (!loginData.tenantId) {
      console.warn("No loginData available, skipping fetch");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}api/Exam/GetExams`, {
        headers: {
          TenantId: loginData.tenantId,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Exam data", data)
      const options = data.map(exam => ({
        id: exam.Id,
        setName: exam.SetName,
        examName: exam.ExamName,
        setId: exam.SetId,
        totalMark: exam.TotalMark,
        examTime: exam.ExamTime
      }));

      console.log("option",options)
      setExam(options);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load exams");
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (loginData?.tenantId) {
      fetchQuestionSets();
      fetchExams();
    }
  }, [loginData?.tenantId]);

  const handleSubmit = async (e) => {
    debugger;
  e.preventDefault();
  setLoading(true);

  try {
    if (!formData.setId) throw new Error("Please select a question set.");
    if (!formData.name.trim()) throw new Error("Exam name cannot be empty.");

    // Convert examTime to "HH:mm:ss" string
    let examTime = null;
    if (formData.examTime) {
      const parts = formData.examTime.split(":"); // ["HH","MM"]
      if (parts.length === 2) {
        examTime = `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
      } else if (parts.length === 3) {
        examTime = `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
      }
    }

    const payload = {
      Id: formData.id,
      SetId: Number(formData.setId),
      Name: formData.name.trim(),
      TotalMark: Number(formData.totalMark),
      ExamTime: examTime, // HH:mm:ss string
      ...(isEdit
        ? { UpdateBy: loginData?.UserId }
        : { EntryBy: loginData?.UserId }),
      IsActive: true,
    };

    console.log("Payload to submit:", payload);

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

    const result = await response.json(); // safe JSON parsing now
    if (!response.ok) throw new Error(result?.error || "Failed to save exam");

    toast.success(isEdit ? "Exam updated successfully!" : "Exam added successfully!");
    resetForm();
    setShowModal(false);
    fetchExams();
  } catch (err) {
    console.error(err);
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};


  // Reset form data
  const resetForm = () => {
    setFormData({
      id: 0,
      name: "",
      setId: "",
      totalMark: 0,
      remarks: "",
      examTime: 0,
      entryBy: loginData?.UserId,
      isActive: true
    });
    setIsEdit(false);
    setEditId(null);
  };

  // Open modal for adding new exam
  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for editing exam
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
        examTime:data.ExamTime,
        remarks: data.Remarks || "",
        entryBy: data.EntryBy || loginData?.UserId,
        isActive: data.IsActive ?? true,
      });

      setShowModal(true);
    } catch (err) {
      console.error("Error fetching exam details:", err);
      toast.error("Failed to load exam data for editing");
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (exam) => {
    if (!exam?.id) return;
    setDeleteId(exam.id);
    setDeleteSuccessMsg("");
    setIsDeleteModalOpen(true);
  };

  // Handle exam deletion
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

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
      fetchExams();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed. Please try again.");
      setIsDeleteModalOpen(false);
    }
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
                <th className="px-4 py-2 text-center">Total Mark</th>
                 <th className="px-4 py-2 text-center">Exam Time</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white text-xs text-gray-700">
              {exam.length === 0 ? (
                <tr key="no-exams">
                  <td colSpan="4" className="text-center py-4">No exams found</td>
                </tr>
              ) : (
                exam.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td data-label="SL" className="px-4 py-2 text-center">{index + 1}</td>
                      <td data-label="Set Name" className="px-4 py-2 text-center">{item.setName}</td>
                    <td data-label="Exam Name" className="px-4 py-2 text-center">{item.examName}</td>
                    <td data-label="Total Mark" className="px-4 py-2 text-center">{item.totalMark}</td>
                    <td data-label="Exam Time" className="px-4 py-2 text-center">{item.examTime}</td>
                    <td data-label="Actions" className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Exam"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                        >
                          <FiEdit className="text-base" />
                        </button>
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
                    totalMark: option?.totalMark || 0
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

              {/* Total Mark Display */}
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-semibold text-gray-700">Total Mark</label>
                <input
                  type="number"
                  value={formData.totalMark}
                  readOnly
                  className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam Time(hh:mm)</label>
                <input
                  type="text"
                  value={formData.examTime || "00:00"} 
                  onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                  className="w-full border px-3 py-2 rounded bg-white text-gray-700"
                />
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
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isEdit ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
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