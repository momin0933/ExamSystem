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
        debugger;
        try {
            if (!formData.CandidateId) {
                toast.error("Candidate is required");
                return;
            }

            const payload = {
                CandidateId: formData.CandidateId,
                CurrentSalary: Number(formData.CurrentSalary) || null,
                MobileNo: formData.MobileNo || null,
                Experience: formData.Experience || null,
                CurrentOrg: formData.CurrentOrg || null,
                NoticePeriod: Number(formData.NoticePeriod) || null,
                Remarks: formData.Remarks || null,
                EntryBy: loginData?.UserId,
                EntryDate: new Date().toISOString(),
                IsActive: true
            };

            console.log("Sending payload:", payload);

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
            console.log("API returned Id:", savedId);
       
            if (!isNaN(savedId) && savedId > 0) {
                // Store the new ParticipateId locally before redirect
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
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    Exam Participation Form
                </h2>

                <form className="space-y-6">
                    {/* Candidate Name */}
                    <div className="flex items-center">
                        <label className="w-1/4 text-gray-700 font-medium">Candidate Name</label>
                        <input
                            type="text"
                            className="w-3/4 border border-gray-300 p-3 rounded-lg bg-gray-100"
                            placeholder="Candidate Name"
                            value={candidate.name || ""}
                            readOnly
                        />
                    </div>

                    {/* Mobile No */}
                    <div className="flex items-center gap-2">
                        <label className="w-1/3 font-medium text-gray-700">Mobile No</label>
                        <input
                            type="text"
                            name="MobileNo"
                            value={formData.MobileNo}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            placeholder="Enter mobile number"
                        />
                    </div>

                    {/* Current Salary */}
                    <div className="flex items-center">
                        <label className="w-1/4 text-gray-700 font-medium">Current Salary</label>
                        <input
                            type="number"
                            name="CurrentSalary"
                            className="w-3/4 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Current Salary"
                            value={formData.CurrentSalary}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Current Organization */}
                    <div className="flex items-center">
                        <label className="w-1/4 text-gray-700 font-medium">Current Organization</label>
                        <input
                            type="text"
                            name="CurrentOrg"
                            className="w-3/4 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Organization Name"
                            value={formData.CurrentOrg}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-1/3 font-medium text-gray-700">Experience</label>
                        <input
                            type="text"
                            name="Experience"
                            value={formData.Experience}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            placeholder="Enter experience (e.g., 1 year)"
                        />
                    </div>


                    {/* Notice Period */}
                    <div className="flex items-center">
                        <label className="w-1/4 text-gray-700 font-medium">Notice Period (days)</label>
                        <input
                            type="number"
                            name="NoticePeriod"
                            className="w-3/4 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Notice Period"
                            value={formData.NoticePeriod}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Next Button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleNext}
                            className="bg-blue-600 text-white py-3 px-10 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </form>
            </div>
        </div>


    )
}
