'use client'
import config from '@/config';
import React, { useState, useEffect, useContext } from "react"
import { useRouter } from 'next/navigation'
import { AuthContext } from '../../provider/AuthProvider';
import { debugPort } from "process";
import toast from 'react-hot-toast';

export default function ParticipatePage() {
    const { loginData } = useContext(AuthContext);
    const router = useRouter()
    const [candidate, setCandidate] = useState({ id: '', name: '' })
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        CandidateId: '',
        CurrentSalary: '',
        CurrentOrg: '',
        NoticePeriod: '',
        MobileNo: '',
        Experience: '',
        Remarks: '',
    })


    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('loginData'));
        console.log("Participant Login Data:", storedUser);
        if (storedUser) {
            setCandidate({ id: storedUser.UserAutoId, name: storedUser.Name });
            setFormData((prev) => ({ ...prev, CandidateId: storedUser.UserAutoId }));
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleNext = async () => {
        // Reset errors
        setErrors({});

        // Validate only MobileNo
      if (!formData.MobileNo || formData.MobileNo.trim() === "" || !formData.NoticePeriod || formData.NoticePeriod.trim() === "") {
    setErrors({
        MobileNo: !formData.MobileNo ? "Mobile No is required" : "",
        NoticePeriod: !formData.NoticePeriod ? "Notice Period is required" : "",
    });
    return;
}

        try {
            const payload = {
                CandidateId: formData.CandidateId,
                MobileNo: formData.MobileNo,
                CurrentSalary: formData.CurrentSalary ? Number(formData.CurrentSalary) : null,
                CurrentOrg: formData.CurrentOrg || null,
                Experience: formData.Experience || null,
                NoticePeriod: formData.NoticePeriod ? Number(formData.NoticePeriod) : null,
                Remarks: formData.Remarks || null,
                EntryBy: loginData?.UserId,
                EntryDate: new Date().toISOString(),
                IsActive: true
            };

            const res = await fetch(`${config.API_BASE_URL}api/Participate/AddParticipate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    TenantId: loginData?.tenantId
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to save participation data");
            }

            const resultText = await res.text();
            const savedId = parseInt(resultText, 10);

            if (!isNaN(savedId) && savedId > 0) {
                localStorage.setItem("participateId", savedId);
                router.push("/examPage");
            }

        } catch (error) {
            console.error("Participation save error:", error);
            toast.error(error.message || "Error saving data.");
        }
    };



    return (
        <div className="min-h-screen flex justify-center items-start pt-10 px-4">
            <div className="bg-white shadow-lg rounded-2xl w-full max-w-4xl p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                    Exam Participation Form
                </h2>

                <form>
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-6">
                        Candidate Information
                    </h2>

                    {/* Grid container - 2 fields per row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

                        {/* Candidate Name */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Candidate Name:
                            </label>
                            <input
                                type="text"
                                className="w-2/3 border border-gray-300 p-1 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Candidate Name"
                                value={candidate.name || ""}
                                readOnly
                            />
                        </div>

                        {/* Mobile No - required */}
                        <div className="flex items-center gap-2">
                            <label className="w-1/3 text-sm font-medium text-gray-700">
                                Mobile No: <span className="text-red-500">*</span>
                            </label>
                            <div className="w-2/3 flex flex-col">
                                <input
                                    type="text"
                                    name="MobileNo"
                                    value={formData.MobileNo}
                                    onChange={handleChange}
                                    className={`w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.MobileNo ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder="Enter mobile number"
                                />
                                {errors.MobileNo && (
                                    <p className="text-red-500 text-sm mt-1">{errors.MobileNo}</p>
                                )}
                            </div>
                        </div>


                        {/* Current Salary - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Current Salary:
                            </label>
                            <input
                                type="number"
                                name="CurrentSalary"
                                className="w-2/3 border border-gray-300 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Current Salary"
                                value={formData.CurrentSalary}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Current Organization - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Current Organization:
                            </label>
                            <input
                                type="text"
                                name="CurrentOrg"
                                className="w-2/3 border border-gray-300 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Organization Name"
                                value={formData.CurrentOrg}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Experience - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Experience:
                            </label>
                            <input
                                type="text"
                                name="Experience"
                                value={formData.Experience}
                                onChange={handleChange}
                                className="w-2/3 border border-gray-300 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter experience (e.g., 1 year)"
                            />
                        </div>

                        {/* Notice Period - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Notice Period: (days)<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="NoticePeriod"
                                className="w-2/3 border border-gray-300 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Notice Period"
                                value={formData.NoticePeriod}
                                onChange={handleChange}
                            />
                             {errors.NoticePeriod && (
                                    <p className="text-red-500 text-sm mt-1">{errors.NoticePeriod}</p>
                                )}
                        </div>

                    </div>

                    {/* Next Button */}
                    <div className="flex justify-end pt-8">
                        <button
                            type="button"
                            onClick={handleNext}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transform transition-all duration-300"
                        >
                            Next →
                        </button>
                    </div>
                </form>

            </div>
        </div>


    )
}
