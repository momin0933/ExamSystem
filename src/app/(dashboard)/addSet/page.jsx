'use client'
import { Suspense, useEffect, useState } from 'react';
import AddSet from '../../components/AddSet';
export default function InsertQuestionPage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    if (!isClient) return null;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddSet></AddSet>
        </Suspense>
    );
}