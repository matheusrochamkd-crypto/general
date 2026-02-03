import React, { useState, useEffect } from 'react';
import { Lock, Target, TrendingUp, Car, Trophy, Zap, CheckCircle2, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface VehicleRoadmapProps {
    currentMonthlyIncome?: number;
}

interface VehicleStats {
    entrada: { target: number };
    manutencao: { estimativa: number };
}

interface Vehicle {
    id: number;
    level: string;
    year: string;
    model: string;
    status: 'active' | 'locked' | 'completed';
    description: string;
    stats?: VehicleStats;
    image?: string;
}

const roadmapData: Vehicle[] = [
    {
        id: 1,
        level: "O START",
        year: "2026/2027",
        model: "FIAT ARGO 1.3 // DRIVE",
        status: "active",
        description: "Operação Aniversário: Aportes mensais de R$ 1.000 para garantir a entrada em Março/2027.",
        stats: {
            entrada: { target: 12000 },
            manutencao: { estimativa: 6000 } // Meta de Renda Mensal para manter o padrão
        },
        image: "/vehicles/fiat-argo.jpg"
    },
    {
        id: 2,
        level: "A ESCALADA",
        year: "2028",
        model: "HONDA CIVIC G10 SPORT",
        status: "locked",
        description: "Upgrade de potência e conforto. O sedã que impõe respeito.",
        stats: {
            entrada: { target: 40000 },
            manutencao: { estimativa: 12000 }
        },
        image: "/vehicles/honda-civic.jpg"
    },
    {
        id: 3,
        level: "O STATUS",
        year: "2029",
        model: "MERCEDES-BENZ CLA 45 S AMG",
        status: "locked",
        description: "Performance brutal e design agressivo. A entrada na elite.",
        stats: {
            entrada: { target: 150000 },
            manutencao: { estimativa: 45000 }
        },
        image: "/vehicles/bmw-320i.jpg"
    },
    {
        id: 4,
        level: "O TROFÉU FINAL",
        year: "2031",
        model: "BMW 320i M SPORT",
        status: "locked",
        description: "O prazer de dirigir definitivo. Tração traseira e engenharia pura.",
        stats: {
            entrada: { target: 80000 },
            manutencao: { estimativa: 25000 }
        },
        image: "/vehicles/mercedes-cla.jpg"
    }
];

const CHECKIN_MONTHS = [
    { id: 'mar-26', label: 'MAR', index: 0 },
    { id: 'apr-26', label: 'ABR', index: 1 },
    { id: 'may-26', label: 'MAI', index: 2 },
    { id: 'jun-26', label: 'JUN', index: 3 },
    { id: 'jul-26', label: 'JUL', index: 4 },
    { id: 'aug-26', label: 'AGO', index: 5 },
    { id: 'sep-26', label: 'SET', index: 6 },
    { id: 'oct-26', label: 'OUT', index: 7 },
    { id: 'nov-26', label: 'NOV', index: 8 },
    { id: 'dec-26', label: 'DEZ', index: 9 },
    { id: 'jan-27', label: 'JAN', index: 10 },
    { id: 'feb-27', label: 'FEV', index: 11 },
];

export const VehicleRoadmap: React.FC<VehicleRoadmapProps> = ({ currentMonthlyIncome = 0 }) => {
    const [paidMonths, setPaidMonths] = useState<string[]>([]);
    const [isSynced, setIsSynced] = useState<boolean | null>(null);

    // Load from Supabase on mount
    useEffect(() => {
        // Define helpers inside useEffect to avoid ReferenceError
        const loadFromLocalStorageInner = (): string[] => {
            const saved = localStorage.getItem('vehicle_fund_checkins');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Error parsing localStorage', e);
                }
            }
            return [];
        };

        const syncToSupabaseInner = async (monthIds: string[]) => {
            for (const monthId of monthIds) {
                const month = CHECKIN_MONTHS.find(m => m.id === monthId);
                if (month) {
                    await supabase.from('vehicle_fund_checkins').upsert({
                        month_index: month.index,
                        paid: true
                    }, { onConflict: 'month_index' });
                }
            }
            setIsSynced(true);
        };

        const loadData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vehicle_fund_checkins')
                    .select('*');

                if (error) {
                    console.warn('Supabase error:', error.message);
                    const local = loadFromLocalStorageInner();
                    setPaidMonths(local);
                    setIsSynced(false);
                } else if (data && data.length > 0) {
                    const monthIds = data.map(row => {
                        const month = CHECKIN_MONTHS.find(m => m.index === row.month_index);
                        return month?.id;
                    }).filter(Boolean) as string[];
                    setPaidMonths(monthIds);
                    localStorage.setItem('vehicle_fund_checkins', JSON.stringify(monthIds));
                    setIsSynced(true);
                } else {
                    const local = loadFromLocalStorageInner();
                    setPaidMonths(local);
                    if (local.length > 0) {
                        await syncToSupabaseInner(local);
                    }
                    setIsSynced(true);
                }
            } catch (err) {
                console.error('Error:', err);
                const local = loadFromLocalStorageInner();
                setPaidMonths(local);
                setIsSynced(false);
            }
        };
        loadData();
    }, []);

    const toggleMonth = async (monthId: string) => {
        const isPaid = paidMonths.includes(monthId);
        const newPaidMonths = isPaid
            ? paidMonths.filter(id => id !== monthId)
            : [...paidMonths, monthId];

        setPaidMonths(newPaidMonths);
        localStorage.setItem('vehicle_fund_checkins', JSON.stringify(newPaidMonths));

        const month = CHECKIN_MONTHS.find(m => m.id === monthId);
        if (!month) return;

        try {
            if (isPaid) {
                await supabase.from('vehicle_fund_checkins').delete().eq('month_index', month.index);
            } else {
                await supabase.from('vehicle_fund_checkins').upsert({
                    month_index: month.index,
                    paid: true
                }, { onConflict: 'month_index' });
            }
            setIsSynced(true);
        } catch (err) {
            console.error('Save failed:', err);
            setIsSynced(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="min-h-screen bg-[#020202] py-12 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Simples */}
                <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-6">
                    <Car className="w-6 h-6 text-accent-yellow" />
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Evolução de Veículos</h1>
                </div>

                {/* Vertical Stack Layout */}
                <div className="space-y-8">
                    {roadmapData.map((vehicle) => {
                        const isActive = vehicle.status === 'active';
                        const isLocked = vehicle.status === 'locked';

                        // Logic for active vehicle
                        const currentFund = isActive ? paidMonths.length * 1000 : 0;
                        const fundTarget = vehicle.stats?.entrada.target || 0;
                        const fundPercent = Math.min(100, (currentFund / fundTarget) * 100);

                        const maintenanceCost = vehicle.stats?.manutencao.estimativa || 0;
                        const incomeSurplus = currentMonthlyIncome - maintenanceCost;
                        const canMaintain = incomeSurplus >= 0;

                        return (
                            <div
                                key={vehicle.id}
                                className={`relative group overflow-hidden w-full min-h-[400px] flex flex-col md:flex-row border transition-all duration-300 ${isActive
                                    ? 'border-accent-yellow bg-accent-yellow/[0.02]'
                                    : 'border-white/10 bg-[#0A0A0A] opacity-60 hover:opacity-100 hover:border-white/20'
                                    }`}
                            >
                                {/* Left Content Section - Smaller width on desktop to give more space for image */}
                                <div className="w-full md:w-[45%] p-8 flex flex-col justify-between relative z-10">
                                    {/* Decorative corner */}
                                    {isActive && (
                                        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-accent-yellow z-0" />
                                    )}

                                    <div>
                                        {/* Badge */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 ${isActive ? 'bg-accent-yellow text-black font-bold' : 'bg-white/10 text-white/50'
                                                }`}>
                                                Level 0{vehicle.id} /// {vehicle.status}
                                            </span>
                                        </div>

                                        {/* Big Title */}
                                        <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 leading-none ${isActive ? 'text-accent-yellow' : 'text-white'
                                            }`}>
                                            {vehicle.level} <span className="opacity-50 text-3xl md:text-4xl">({vehicle.year})</span>
                                        </h2>

                                        {/* Subtitle / Model */}
                                        <div className={`text-sm md:text-base font-mono border-l-2 pl-4 mb-6 ${isActive ? 'text-white border-accent-yellow' : 'text-zinc-500 border-zinc-700'
                                            }`}>
                                            {vehicle.model}
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-text-muted max-w-md mb-8 leading-relaxed">
                                            {vehicle.description}
                                        </p>
                                    </div>

                                    {/* Active Stats Grid */}
                                    {isActive && vehicle.stats && (
                                        <div className="w-full max-w-lg space-y-6">

                                            {/* 1. FUNDO DE ENTRADA (Check-in System) */}
                                            <div className="border-b border-white/10 pb-4">
                                                <div className="flex justify-between text-xs text-text-muted uppercase mb-2">
                                                    <span>Fundo de Entrada (1k/mês)</span>
                                                    <span className="text-accent-yellow font-bold">{formatCurrency(fundTarget)}</span>
                                                </div>

                                                <div className="flex justify-between items-end mb-3">
                                                    <span className="text-2xl font-mono font-bold text-white">{formatCurrency(currentFund)}</span>
                                                    <span className="text-xs text-text-muted mb-1">{fundPercent.toFixed(0)}%</span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                                                    <div className="h-full bg-accent-yellow transition-all duration-500" style={{ width: `${fundPercent}%` }}></div>
                                                </div>

                                                {/* Month Check-ins */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {CHECKIN_MONTHS.map(month => {
                                                        const isPaid = paidMonths.includes(month.id);
                                                        return (
                                                            <button
                                                                key={month.id}
                                                                onClick={() => toggleMonth(month.id)}
                                                                className={`px-2 py-1 text-[10px] border rounded transition-all ${isPaid
                                                                    ? 'bg-accent-yellow text-black border-accent-yellow font-bold shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                                                                    : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'
                                                                    }`}
                                                            >
                                                                {month.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* 2. RENDA MENSAL vs MANUTENÇÃO */}
                                            <div>
                                                <div className="flex justify-between text-xs text-text-muted uppercase mb-2">
                                                    <span>Viabilidade (Renda vs Manutenção)</span>
                                                    <span className={canMaintain ? "text-accent-green" : "text-accent-red"}>
                                                        {canMaintain ? 'APROVADO' : 'RISCO ALTO'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-text-muted uppercase">Renda Conquistada</p>
                                                        <p className="text-lg font-mono font-bold text-white">{formatCurrency(currentMonthlyIncome)}</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-white/10"></div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-text-muted uppercase">Meta de Renda</p>
                                                        <p className="text-lg font-mono font-bold text-text-secondary">{formatCurrency(maintenanceCost)}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-2 text-[10px] text-right">
                                                    {canMaintain ? (
                                                        <span className="text-accent-green flex items-center justify-end gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Sobra {formatCurrency(incomeSurplus)} para lazer/investimentos
                                                        </span>
                                                    ) : (
                                                        <span className="text-accent-red flex items-center justify-end gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Faltam {formatCurrency(Math.abs(incomeSurplus))} para manter este carro
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 h-1.5 bg-accent-yellow w-32" />
                                    )}
                                </div>

                                {/* Right Image Section - Expanded width */}
                                <div className="relative w-full md:w-[55%] h-[300px] md:h-auto overflow-hidden">
                                    {/* Overlay Gradient - Reduced for visibility */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-transparent to-transparent z-10"></div>

                                    {/* Car Image or Placeholder */}
                                    {/* Car Image - Clear and visible */}
                                    {vehicle.image && (
                                        <div
                                            className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 ${isLocked ? 'saturate-50 brightness-75' : 'brightness-100'}`}
                                            style={{ backgroundImage: `url(${vehicle.image})` }}
                                        />
                                    )}

                                    {/* Subtle left fade for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-[#0A0A0A]/40 to-transparent"></div>

                                    {/* Locked Overlay */}
                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                            <Lock className="w-16 h-16 text-zinc-700 opacity-50" />
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
