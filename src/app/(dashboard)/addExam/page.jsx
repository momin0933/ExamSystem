'use client'
import config from '@/config';
import React, { useContext, useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import { AuthContext } from '../../provider/AuthProvider';
import * as XLSX from 'xlsx';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);


  const handleOpenModal = () => setShowModal(true);

  useEffect(() => {
    if (!loginData?.tenantId) return;
    // fetchSubjectData();
  }, [loginData?.tenantId]);


  return (
    <div className="overflow-x-auto p-3">
      <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .fixed-table {
                    table-layout: fixed;
                    width: 100%;
                }
                .fixed-table th,
                .fixed-table td {
                    padding: 10px;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    min-width: 100px;
                }
                .fixed-table th {
                    padding: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                }
                @media (max-width: 768px) {
                    .fixed-table {
                        display: block;
                        width: 100%;
                    }
                    .fixed-table thead {
                        display: none;
                    }
                    .fixed-table tbody {
                        display: block;
                        width: 100%;
                    }
                    .fixed-table tr {
                        display: block;
                        margin-bottom: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                    }
                    .fixed-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    .fixed-table td::before {
                        content: attr(data-label);
                        font-weight: bold;
                        margin-right: 10px;
                        flex: 1;
                    }
                    .fixed-table td:last-child {
                        border-bottom: none;
                    }
                }
            `}</style>


      <div className="rounded-md font-roboto overflow-hidden">
        <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] sticky top-0 z-20 shadow-md">
          <div className="px-3 py-2 flex flex-wrap justify-between items-center gap-2">
            <div className='flex items-center gap-3'>
              <div className="relative flex items-center w-full sm:w-auto min-w-[180px] max-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
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
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="h-4 w-4 text-gray-400 hover:text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>

            </div>
            <div className='flex items-center gap-3'>
              <Link
                onClick={handleOpenModal}
                href="#"
                passHref
                className="text-lg text-gray-50 cursor-pointer"
              >
                <IoMdAddCircle className="text-xl" />
              </Link>

              <FaFileExcel
                // onClick={handleDownloadExcel} 
                className="text-lg cursor-pointer text-gray-50" />
            </div>
          </div>
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr className="border-b">
                <th className="px-4 py-2 text-center">SL</th>
                <th className="px-4 py-2 text-center">Set Name</th>
                <th className="px-4 py-2 text-center">Exam Name</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            {/* <tbody className="bg-white text-xs text-gray-700">
              {filteredSubject.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">No data found</td>
                </tr>
              ) : (
                filteredSubject.map((subject, index) => (
                  <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
                    <td data-label="Reg Date" className="px-4 py-2 text-center"> {index + 1}</td>
                    <td data-label="Subject Name" className="px-4 py-2 text-center">{subject.Name}</td>
                    <td data-label="Actions" className="px-4 py-2 text-center">
                      <div className="text-base flex items-end gap-3">


                        <button
                          onClick={() => openEditModal(subject)}
                          title="Edit"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[#00925a] text-[#00925a] rounded hover:bg-[#00925a] hover:text-white transition-colors duration-200"
                        >
                          <FiEdit className="text-base" />
                        </button>



                        <button
                          onClick={() => openDeleteModal(subject.Id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
                        >
                          <FiTrash2 className="text-base" />
                        </button>

                       
                        <DeleteConfirmModal
                          // isOpen={isDeleteModalOpen}
                          // onClose={() => setIsDeleteModalOpen(false)}
                          // onConfirm={handleConfirmDelete}
                          // statusMessage={deleteSuccessMsg}
                        />

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody> */}
          </table>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/20  bg-opacity-40 z-50 flex items-center justify-center">
          <div data-aos="zoom-in" className="bg-white rounded-lg shadow-md p-6 w-full max-w-xl relative">
            <form method="dialog">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>


            <div className="border-b border-gray-300 pb-2 mb-4">
              <h3 className="font-bold text-lg">Exam Entry</h3>
            </div>
            <form
              // onSubmit={isEdit ? handleUpdateSubmit : handleSubmit} 
              className="space-y-4 text-sm">

              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Select Set</label>
                {
                  // subjectData.length > 0 && 
                  (
                    <Select
                      // name="filterSubject"
                      // value={subjectData.find(s => s.value === selectedSubject) || null}
                      // onChange={(selected) => {
                      //   const subId = selected?.value || "";
                      //   setSelectedSubject(subId);
                      //   fetchQuestionsBySubject(subId);
                      // }}
                      // options={subjectData}
                      placeholder="Select or search subject..."
                      className="w-full"
                      isClearable
                      isSearchable
                    />
                  )}
              </div>


              <div className='flex items-center gap-2 mt-2'>
                <label className="w-1/3 text-sm font-semibold text-gray-700">Exam Name</label>
                <input
                  type="text"
                  name="name"
                  // value={formData.name}
                  // onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-semibold text-gray-700">Total Mark</label>
                <input name="mark" 
                // value={totalMark} 
                readOnly className="w-full border border-gray-200 px-3 py-2 rounded-md bg-gray-100 text-gray-600" />
              </div>

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
                  {
                    // isEdit ? 'Update' : 
                    'Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


    </div>
  )
}