'use client'

import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import Select from "react-select";
import * as XLSX from 'xlsx';
import AOS from 'aos';
import 'aos/dist/aos.css';
import toast from 'react-hot-toast';

import { FaFileExcel } from 'react-icons/fa';
import { IoMdAddCircle } from 'react-icons/io';
import { FiEdit, FiTrash2, FiX, FiSave } from "react-icons/fi";
import config from '@/config';
import { AuthContext } from '../../provider/AuthProvider';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

export default function SubjectManage() {
    const { loginData } = useContext(AuthContext);

    // ------------------- STATES -------------------
    const [subjectData, setSubjectData] = useState([]);
    const [filteredSubject, setFilteredSubject] = useState([]);
    const [departmentData, setDepartmentData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ id: 0, name: '', department: '', remarks: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");
    const [selectedDepartmentLabel, setSelectedDepartmentLabel] = useState('');

    // ------------------- INITIALIZE AOS -------------------
    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    // ------------------- HANDLE INPUT CHANGE -------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ------------------- MODAL HANDLERS -------------------
    const handleOpenModal = () => setShowModal(true);

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEdit(false);
        setEditId(null);
        setFormData({ id: 0, name: '', department: '', remarks: '' });
        setSelectedDepartmentLabel('');
    };

    // ------------------- FETCH DATA -------------------
    useEffect(() => {
        if (!loginData?.tenantId) return;
        fetchSubjectData();
        fetchDepartmentData();
    }, [loginData?.tenantId]);

    const fetchSubjectData = async () => {
        try {
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionManage',
                    parameters: { QueryChecker: 2 },
                }),
            });
            if (!res.ok) throw new Error('Failed to load subject data');
            const data = await res.json();
            setSubjectData(data);
        } catch (err) {
            toast.error('Failed to load Subject data');
        }
    };

    const fetchDepartmentData = async () => {
        try {
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionManage',
                    parameters: { QueryChecker: 7 },
                }),
            });
            if (!res.ok) throw new Error('Failed to load department data');
            const data = await res.json();
            setDepartmentData(data);
        } catch (err) {
            toast.error('Failed to load Department data');
        }
    };

    // ------------------- FILTER SUBJECT DATA -------------------
    useEffect(() => {
        let filtered = subjectData;
        if (searchQuery.trim()) {
            filtered = filtered.filter(subject =>
                subject.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.Department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.EntryDate.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredSubject(filtered);
    }, [searchQuery, subjectData]);

    // ------------------- EXCEL EXPORT -------------------
    const handleDownloadExcel = () => {
        if (!filteredSubject.length) return alert('No data available to export!');
        const worksheet = XLSX.utils.json_to_sheet(filteredSubject);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Subjects');
        XLSX.writeFile(workbook, 'Subjects_Report.xlsx');
    };

    // ------------------- SUBMIT HANDLERS -------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionManage',
                    parameters: {
                        QueryChecker: 1, // Insert
                        Name: formData.name,
                        Department: selectedDepartmentLabel || '',
                        Remarks: formData.remarks || '',
                        EntryBy: loginData.UserId,
                        IsActive: true,
                    },
                }),
            });
            if (!res.ok) throw new Error(`Insert failed: ${res.status}`);
            toast.success('Subject added successfully');
            setFormData({ id: 0, name: '', department: '', remarks: '' });
            setSelectedDepartmentLabel('');
            fetchSubjectData();
        } catch (err) {
            toast.error('Failed to add subject');
        } finally {
            setShowModal(false);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionManage',
                    parameters: {
                        QueryChecker: 3, // Update
                        Id: editId,
                        Name: formData.name,
                        Department: selectedDepartmentLabel || formData.department || '',
                        Remarks: formData.remarks || '',
                        UpdateBy: loginData.UserId,
                        IsActive: true
                    },
                }),
            });
            if (!res.ok) throw new Error(`Update failed!`);
            toast.success('Subject updated successfully');
            fetchSubjectData();
            setFormData({ id: 0, name: '', department: '', remarks: '' });
            setSelectedDepartmentLabel('');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setShowModal(false);
            setIsEdit(false);
            setEditId(null);
        }
    };

    // ------------------- EDIT & DELETE HANDLERS -------------------
    const openEditModal = (subject) => {
        setIsEdit(true);
        setEditId(subject.Id);
        setFormData({ name: subject.Name, department: subject.Department || '', remarks: subject.Remarks || '' });
        setSelectedDepartmentLabel(subject.Department || '');
        setShowModal(true);
    };

    const openDeleteModal = (id) => {
        setSelectedId(id);
        setDeleteSuccessMsg("");
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        try {
            const res = await fetch(`${config.API_BASE_URL}api/Procedure/GetData`, {
                method: 'POST',
                headers: { TenantId: loginData.tenantId, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: '',
                    procedureName: 'SP_QuestionManage',
                    parameters: { QueryChecker: 4, Id: selectedId },
                }),
            });
            const result = await res.json();
            const message = Array.isArray(result) ? result[0]?.Message : result?.Message;
            setDeleteSuccessMsg(message || "Unknown error");

            setTimeout(() => {
                setIsDeleteModalOpen(false);
                setDeleteSuccessMsg("");
                fetchSubjectData();
            }, 2000);
        } catch (err) {
            toast.error(err.message || "Delete failed. Please try again.");
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

        <div className="overflow-x-auto p-2 ">

            <div className="mb-1">
                <h1 className="text-2xl font-bold  text-gray-800">Position List</h1>
            </div>
            {/* ------------------- SEARCH & ACTIONS ------------------- */}
            <div className="rounded-sm font-roboto overflow-hidden">
                {/* Search & Add/Export */}
                <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">
                    <div className="px-3 py-2 flex flex-wrap justify-between items-center gap-2">
                        <div className='flex items-center gap-3'>
                            {/* Search */}
                            <div className="relative flex items-center w-full sm:w-auto min-w-[180px] max-w-[300px]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-[6px] border border-gray-300 rounded-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        {/* <FiX className="w-4 h-4" /> */}
                                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Add & Export */}
                        <div className='flex items-center gap-3'>
                            <Link onClick={handleOpenModal} href="#" passHref className="text-lg text-gray-50 cursor-pointer">
                                <IoMdAddCircle className="text-xl" />
                            </Link>
                            <FaFileExcel onClick={handleDownloadExcel} className="text-lg cursor-pointer text-gray-50" />
                        </div>
                    </div>
                </div>

                {/* ------------------- TABLE WRAPPER ------------------- */}
                <div className="border border-gray-300 rounded-b-md overflow-hidden max-h-[64vh] overflow-y-auto">
                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase  text-gray-800 sticky top-0 z-10">
                            <tr className="border-b">
                                <th className="px-4 py-2">SL</th>
                                <th className="px-4 py-2">Department Name</th>
                                <th className="px-4 py-2">Position Name</th>
                                <th className="px-4 py-2 text-center">Entry Date</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-xs text-gray-800">
                            {filteredSubject.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">No data found</td>
                                </tr>
                            ) : (
                                filteredSubject.map((subject, index) => (
                                    <tr key={subject.Id} className="border-b border-gray-300  text-gray-800 hover:bg-gray-50">
                                        <td className="px-4 py-2">{index + 1}</td>
                                        <td className="px-4 py-2">{subject.Department}</td>
                                        <td className="px-4 py-2">{subject.Name}</td>
                                        <td className="px-4 py-2 text-center">{subject.EntryDate ? new Date(subject.EntryDate).toLocaleDateString("en-GB") : "-"}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => openEditModal(subject)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded-sm hover:bg-[#00925a] hover:text-white">
                                                    <FiEdit />
                                                </button>
                                                <button onClick={() => openDeleteModal(subject.Id)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-500 text-red-500 rounded-sm hover:bg-red-500 hover:text-white">
                                                    <FiTrash2 />
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

            {/* ------------------- MODALS ------------------- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                    <div data-aos="zoom-in" className="bg-white rounded-sm shadow-md p-6 w-full max-w-xl relative">
                        <button onClick={handleCloseModal} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><FiX className="w-4 h-4" /></button>

                        <h3 className="font-bold text-lg text-gray-800  border-b border-gray-300 pb-2 mb-4">    {isEdit ? 'Department and Position Update' : 'Department and Position Entry'}</h3>

                        <form onSubmit={isEdit ? handleUpdateSubmit : handleSubmit} className="space-y-4 text-sm">
                            <div className="flex items-center gap-2 mt-2">
                                <label className="w-1/3 text-sm font-semibold text-gray-800">Department <span className="text-red-500">*</span></label>:
                                <div className="w-full  ">
                                    <Select
                                        options={departmentData.map(d => ({ value: d.ChildId, label: d.ChildName }))}
                                        value={departmentData.map(d => ({ value: d.ChildId, label: d.ChildName }))
                                            .find(opt => opt.label === formData.department) || null
                                        }
                                        onChange={(selected) => {
                                            setFormData(prev => ({ ...prev, department: selected?.label || '' }));
                                            setSelectedDepartmentLabel(selected?.label || '');
                                        }}
                                        placeholder="Select or search department..."
                                        className="text-gray-800"
                                        isSearchable
                                        required
                                    />
                                </div>
                            </div>

                            <div className='flex items-center gap-2 mt-2'>
                                <label className="w-1/3 text-sm font-semibold text-gray-800">Position Name <span className="text-red-500">*</span></label>:
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-400 px-3 py-2 rounded-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                {/* Cancel Button */}
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                  className="px-4 py-2 bg-gray-500 text-white rounded-sm shadow hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                   className="px-4 py-2 bg-blue-600 text-white rounded-sm shadow hover:bg-blue-700 transition"
                                >
                                    {isEdit ? "Update" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                statusMessage={deleteSuccessMsg}
            />
        </div>

    );
}
