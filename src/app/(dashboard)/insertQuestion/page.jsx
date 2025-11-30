'use client'
import { Suspense, useEffect, useState } from 'react';
import InsertQuestion from '../../components/InsertQuestion';
export default function InsertQuestionPage() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InsertQuestion></InsertQuestion>
    </Suspense>
  );
}