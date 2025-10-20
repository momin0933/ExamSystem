// src/app/(exam)/examEnd/page.jsx
'use client'

import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { AuthContext } from '../../provider/AuthProvider'  // adjust path if needed

export default function ExamEndPage() {
    const router = useRouter();
    const { logout } = useContext(AuthContext); // assuming your AuthProvider has a logout method

    //   const handleLogout = () => {
    //     if (logout) logout();         
    //     router.push('/login');       
    //   }

    return (
        <div className="flex justify-center items-center">
            <div className="bg-white shadow-lg rounded-2xl  text-center max-w-lg w-full">

                {/* Logo */}
                <div className="mb-2">
                    <img
                        src="/images/FashionTex-Logo.png"
                        alt="Fashion Tex Ltd Logo"
                        className="mx-auto w-32 h-32 object-contain"
                    />
                </div>

                {/* Company Name */}
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Fashion Tex Ltd</h1>

                {/* Thank you text */}
                <p className="text-gray-700 text-lg mb-6">
                    Thank you for completing the recruitment exam.
                </p>
            </div>
        </div>

    )
}
