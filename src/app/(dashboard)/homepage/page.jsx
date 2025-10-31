"use client";

import { useState, useEffect, useContext } from 'react';

export default function Homepage() {

   useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    
  return (
  <div className="font-roboto flex items-center justify-center p-6">
  
    <p className="text-gray-600 text-sm md:text-base">
      |THIS IS HOMEPAGE
    </p>
 
</div>

  );
}

