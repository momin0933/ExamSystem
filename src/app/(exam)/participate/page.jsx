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

    // const handleNext = async (e) => {
    //     e.preventDefault();
    //     setErrors({});

    //     // Validation
    //     if (!formData.MobileNo?.trim() || !formData.NoticePeriod?.trim()) {
    //         setErrors({
    //             MobileNo: !formData.MobileNo ? "Mobile No is required" : "",
    //             NoticePeriod: !formData.NoticePeriod ? "Notice Period is required" : "",
    //         });
    //         toast.error("Please fill all required fields.");
    //         return;
    //     }

    //     try {
    //         const payload = {
    //             CandidateId: formData.CandidateId,
    //             MobileNo: formData.MobileNo,
    //             CurrentSalary: formData.CurrentSalary
    //                 ? Number(formData.CurrentSalary)
    //                 : 0,
    //             CurrentOrg: formData.CurrentOrg || "NA",
    //             Experience: formData.Experience || "00 Year",
    //             NoticePeriod: Number(formData.NoticePeriod),
    //             Remarks: formData.Remarks || null,
    //             EntryBy: loginData?.UserId,
    //             EntryDate: new Date().toISOString(),
    //             IsActive: true,
    //         };

    //         const res = await fetch(`${config.API_BASE_URL}api/Participate/AddParticipate`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 TenantId: loginData?.tenantId,
    //             },
    //             body: JSON.stringify(payload),
    //         });

    //         if (!res.ok) {
    //             const text = await res.text();
    //             throw new Error(text || "Failed to save participation data");
    //         }

    //         const resultText = await res.text();
    //         const savedId = parseInt(resultText, 10);

    //         if (!isNaN(savedId) && savedId > 0) {
    //             localStorage.setItem("participateId", savedId);
    //             router.push("/examPage");
    //         }

    //     } catch (error) {
    //         console.error("Participation save error:", error);
    //         toast.error(error.message || "Error saving data.");
    //     }
    // };
    const handleNext = (e) => {
        e.preventDefault();

        // Optional validation before navigation
        if (!formData.MobileNo?.trim() || !formData.NoticePeriod?.trim()) {
            toast.error("Please fill all required fields.");
            return;
        }

        // Just navigate to the exam page (no API call)
        router.push("/examPage");
    };



    return (
        <div className="min-h-screen flex justify-center items-start pt-10 px-4">
            <div className="bg-white shadow-lg rounded-sm w-full max-w-4xl p-8">
                {/* <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                    Exam Participation Form
                </h2> */}
                <h2
                    className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 mb-4 text-center leading-tight"
                >
                    Exam Participation Form
                </h2>


                <form onSubmit={handleNext}>
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-800  pb-2 ">
                        Candidate Information
                    </h2>
                    <hr className="w-full h-[0.5px] mb-6 border-0 bg-gradient-to-r from-gray-300 to-gray-300 rounded-none" />


                    {/* Grid container - 2 fields per row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

                        {/* Candidate Name */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Candidate Name
                            </label>:&nbsp;
                            <input
                                type="text"
                                className="w-2/3 border border-gray-300 p-1 rounded-sm bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Candidate Name"
                                value={candidate.name || ""}
                                readOnly
                            />
                        </div>

                        {/* Mobile No - required */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-sm font-medium text-gray-700">
                                Mobile No<span className="text-red-500">*</span>
                            </label>:&nbsp;
                            <input
                                type="text"
                                name="MobileNo"
                                value={formData.MobileNo}
                                onChange={handleChange}
                                className={`w-2/3 border p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.MobileNo ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter mobile number"
                                required
                            />
                        </div>


                        {/* Current Salary - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Current Salary
                            </label>:&nbsp;
                            <input
                                type="number"
                                name="CurrentSalary"
                                className="w-2/3 border border-gray-300 p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Current Salary"
                                value={formData.CurrentSalary}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Current Organization - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Current Organization
                            </label>:&nbsp;
                            <input
                                type="text"
                                name="CurrentOrg"
                                className="w-2/3 border border-gray-300 p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Organization Name"
                                value={formData.CurrentOrg}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Experience - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Experience
                            </label>:&nbsp;
                            <input
                                type="text"
                                name="Experience"
                                value={formData.Experience}
                                onChange={handleChange}
                                className="w-2/3 border border-gray-300 p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter experience (e.g., 1 year)"
                            />
                        </div>

                        {/* Notice Period - optional */}
                        <div className="flex items-center">
                            <label className="w-1/3 text-gray-700 font-medium text-sm">
                                Notice Period (days)<span className="text-red-500">*</span>
                            </label>:&nbsp;
                            <input
                                type="number"
                                name="NoticePeriod"
                                className="w-2/3 border border-gray-300 p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Notice Period"
                                value={formData.NoticePeriod}
                                onChange={handleChange}
                                required
                            />
                            {/* {errors.NoticePeriod && (
                                    <p className="text-red-500 text-sm mt-1">{errors.NoticePeriod}</p>
                                )} */}
                        </div>

                    </div>

                    {/* Next Button */}
                    <div className="flex justify-end pt-8">
                        <button
                            type="submit"
                            // onClick={handleNext}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-5 rounded-sm font-semibold hover:shadow-sm hover:scale-105 transform transition-all duration-300"
                        >
                            Next
                        </button>
                    </div>
                </form>

            </div>
        </div>


    )
}
