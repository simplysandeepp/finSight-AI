import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Target, Info } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ActiveSignals from './pages/ActiveSignals';
import SectorAnalysis from './pages/SectorAnalysis';
import PeerBenchmarking from './pages/PeerBenchmarking';
import AuditTrail from './pages/AuditTrail';
import Configurations from './pages/Configurations';

const App = () => {
    const [companyId, setCompanyId] = useState('COMP_007');
    const [asOfDate, setAsOfDate] = useState('2026-01-31');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handlePredict = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/predict', {
                company_id: companyId,
                as_of_date: asOfDate
            });
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'System synchronization failure. Check API availability.');
        } finally {
            setLoading(false);
        }
    };

    const getRecStyles = (rec) => {
        const action = rec?.action?.toLowerCase() || '';
        if (action.includes('buy')) return { label: 'Strong Buy', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: TrendingUp };
        if (action.includes('sell')) return { label: 'Underweight', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: TrendingUp };
        if (action.includes('hold')) return { label: 'Neutral Hold', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', icon: Target };
        return { label: 'Monitor', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: Info };
    };

    const chartData = useMemo(() => {
        if (!data?.result) return [];
        return [
            {
                name: 'Revenue',
                value: data.result.final_forecast.revenue_p50,
                low: data.result.final_forecast.revenue_ci[0],
                high: data.result.final_forecast.revenue_ci[1],
                unit: 'M'
            },
            {
                name: 'EBITDA',
                value: data.result.final_forecast.ebitda_p50,
                low: data.result.final_forecast.ebitda_ci[0],
                high: data.result.final_forecast.ebitda_ci[1],
                unit: 'M'
            }
        ];
    }, [data]);

    const recStyles = getRecStyles(data?.result?.recommendation);

    return (
        <BrowserRouter>
            <Routes>
                {/* Landing Page - No Sidebar/Navbar */}
                <Route path="/" element={<Landing />} />

                {/* Dashboard Routes - With Sidebar/Navbar */}
                <Route path="/*" element={
                    <div className="flex h-screen bg-[#0d0d0f] text-zinc-100 overflow-hidden font-sans">
                        <Sidebar />

                        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0d0d0f] to-[#09090b]">
                            <Navbar
                                companyId={companyId}
                                setCompanyId={setCompanyId}
                                asOfDate={asOfDate}
                                setAsOfDate={setAsOfDate}
                                handlePredict={handlePredict}
                                loading={loading}
                            />

                            <div className="p-10 max-w-7xl mx-auto">
                                <Routes>
                                    <Route
                                        path="/dashboard"
                                        element={<Dashboard data={data} error={error} recStyles={recStyles} chartData={chartData} />}
                                    />
                                    <Route path="/signals" element={<ActiveSignals />} />
                                    <Route path="/sector" element={<SectorAnalysis data={data} />} />
                                    <Route path="/peers" element={<PeerBenchmarking data={data} />} />
                                    <Route path="/audit" element={<AuditTrail />} />
                                    <Route path="/configs" element={<Configurations />} />
                                </Routes>
                            </div>
                        </main>
                    </div>
                } />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
