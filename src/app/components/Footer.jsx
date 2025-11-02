'use client'
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Footer() {
    const [currentYear, setCurrentYear] = useState(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear()); 
    }, []);

    return (
        <footer className="footer font-roboto footer-center bg-cyan-950 border-t-2 text-base-content p-2 text-white">
            <div className="flex justify-center items-center">
                <p>Copyright © {currentYear} - All rights reserved by</p>
                <Image
                    src="/images/FashionTex-Logo.png"
                    alt="FashionTex Logo"
                    width={130}
                    height={35}
                    priority
                />
            </div>
        </footer>
    );
}
