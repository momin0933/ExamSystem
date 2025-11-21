'use client'
import { Suspense, useEffect, useState } from 'react';
import SetEntry from '../../components/SetEntry';
export default function SetEntryPage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    if (!isClient) return null;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SetEntry></SetEntry>
        </Suspense>
    );
}