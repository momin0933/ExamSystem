'use client';
import config from "@/config";
import { createContext, useState} from "react";
export const DataContext = createContext();
export default function DataProvider({ children }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const data = {

        loading,
        error,
        isCollapsed,
        setIsCollapsed,
    };
    return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}