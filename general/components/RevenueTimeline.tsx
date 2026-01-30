import React from 'react';
import { incomeProjections } from '../data/incomeProjections';
import { TrendingUp } from 'lucide-react';

export const RevenueTimeline: React.FC = () => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(val);
    };

    const maxTotal = Math.max(...incomeProjections.map(p => p.total));
    const chartHeight = 400;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                    Projeção de Renda 2026-2027
                </h2>
                <p className="text-sm text-text-muted mt-2">Crescimento projetado de Fevereiro/2026 até Março/2027</p>
            </div>

            {/* Main Chart */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8">
                <div className="relative" style={{ height: `${chartHeight + 60}px` }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-text-muted font-mono">
                        <span>{formatCurrency(maxTotal)}</span>
                        <span>{formatCurrency(maxTotal * 0.75)}</span>
                        <span>{formatCurrency(maxTotal * 0.5)}</span>
                        <span>{formatCurrency(maxTotal * 0.25)}</span>
                        <span>R$ 0</span>
                    </div>

                    {/* Chart Area */}
                    <div className="ml-20 relative" style={{ height: chartHeight }}>
                        {/* Horizontal grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                            <div
                                key={idx}
                                className="absolute w-full border-t border-white/5"
                                style={{ bottom: `${ratio * 100}%` }}
                            />
                        ))}

                        {/* SVG for line and area */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>

                            {/* Area under curve */}
                            <path
                                d={incomeProjections.map((proj, idx) => {
                                    const x = (idx / (incomeProjections.length - 1)) * 100;
                                    const y = 100 - (proj.total / maxTotal) * 100;
                                    return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                                }).join(' ') + ` L 100% 100% L 0% 100% Z`}
                                fill="url(#areaGradient)"
                            />

                            {/* Line */}
                            <path
                                d={incomeProjections.map((proj, idx) => {
                                    const x = (idx / (incomeProjections.length - 1)) * 100;
                                    const y = 100 - (proj.total / maxTotal) * 100;
                                    return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                                }).join(' ')}
                                stroke="#10b981"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Data points */}
                            {incomeProjections.map((proj, idx) => {
                                const x = (idx / (incomeProjections.length - 1)) * 100;
                                const y = 100 - (proj.total / maxTotal) * 100;
                                const isCurrent = idx === 0; // Feb 2026
                                const isPeak = proj.id === 'dec-2026';
                                const isTarget = proj.id === 'mar-2027';

                                return (
                                    <g key={proj.id}>
                                        <circle
                                            cx={`${x}%`}
                                            cy={`${y}%`}
                                            r={isCurrent || isPeak || isTarget ? 6 : 4}
                                            fill={isCurrent ? '#10b981' : isPeak ? '#f97316' : isTarget ? '#06b6d4' : '#ffffff'}
                                            stroke={isCurrent ? '#10b981' : isPeak ? '#f97316' : isTarget ? '#06b6d4' : '#ffffff'}
                                            strokeWidth="2"
                                            className="transition-all cursor-pointer hover:r-8"
                                        />

                                        {/* Highlight current month */}
                                        {isCurrent && (
                                            <>
                                                <circle
                                                    cx={`${x}%`}
                                                    cy={`${y}%`}
                                                    r="12"
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="2"
                                                    opacity="0.3"
                                                />
                                                {/* Value label above */}
                                                <text
                                                    x={`${x}%`}
                                                    y={`${y - 8}%`}
                                                    textAnchor="middle"
                                                    fill="#10b981"
                                                    fontSize="14"
                                                    fontWeight="bold"
                                                    className="font-mono"
                                                >
                                                    {formatCurrency(proj.total)}
                                                </text>
                                            </>
                                        )}

                                        {/* Peak label */}
                                        {isPeak && (
                                            <text
                                                x={`${x}%`}
                                                y={`${y - 8}%`}
                                                textAnchor="middle"
                                                fill="#f97316"
                                                fontSize="14"
                                                fontWeight="bold"
                                                className="font-mono"
                                            >
                                                {formatCurrency(proj.total)}
                                            </text>
                                        )}

                                        {/* Target label */}
                                        {isTarget && (
                                            <text
                                                x={`${x}%`}
                                                y={`${y - 8}%`}
                                                textAnchor="middle"
                                                fill="#06b6d4"
                                                fontSize="14"
                                                fontWeight="bold"
                                                className="font-mono"
                                            >
                                                {formatCurrency(proj.total)}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* X-axis labels */}
                    <div className="ml-20 flex justify-between text-xs text-text-muted font-mono mt-4">
                        {incomeProjections.map((proj, idx) => {
                            // Show every other month to avoid crowding
                            if (idx % 2 === 0 || proj.id === 'dec-2026' || proj.id === 'mar-2027') {
                                return (
                                    <span key={proj.id} className={proj.id === 'feb-2026' ? 'text-emerald-500 font-bold' : ''}>
                                        {proj.month}
                                    </span>
                                );
                            }
                            return <span key={proj.id}></span>;
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0A0A0A] border border-emerald-500/30 rounded-lg p-5">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Mês Atual</p>
                    <p className="text-2xl font-mono font-bold text-emerald-500">
                        {formatCurrency(incomeProjections[0].total)}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-1">{incomeProjections[0].month}/{incomeProjections[0].year}</p>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Crescimento Total</p>
                    <p className="text-2xl font-mono font-bold text-emerald-500">
                        +{formatCurrency(incomeProjections[13].total - incomeProjections[0].total)}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-1">+82% em 14 meses</p>
                </div>

                <div className="bg-[#0A0A0A] border border-orange-500/30 rounded-lg p-5">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Pico (Dez/26)</p>
                    <p className="text-2xl font-mono font-bold text-orange-500">
                        {formatCurrency(incomeProjections[10].total)}
                    </p>
                    <p className="text-[10px] text-orange-400 mt-1">Temporada festas</p>
                </div>

                <div className="bg-[#0A0A0A] border border-cyan-500/30 rounded-lg p-5">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Meta Final (Mar/27)</p>
                    <p className="text-2xl font-mono font-bold text-cyan-500">
                        {formatCurrency(incomeProjections[13].total)}
                    </p>
                    <p className="text-[10px] text-cyan-400 mt-1">1 ano completo</p>
                </div>
            </div>

            {/* Individual Goals for Current Month */}
            <div className="bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 border-2 border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase">Metas do Mês Atual</h3>
                        <p className="text-xs text-emerald-400 mt-1">{incomeProjections[0].month}/{incomeProjections[0].year} • Detalhamento por Fonte</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-muted uppercase">Meta Total</p>
                        <p className="text-2xl font-mono font-bold text-emerald-500">{formatCurrency(incomeProjections[0].total)}</p>
                    </div>
                </div>

                {/* Grid of Individual Sources */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Violão */}
                    <div className="bg-black/30 border border-emerald-600/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <span className="text-xl">🎸</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase">Violão</h4>
                                <p className="text-[10px] text-text-muted">Base Estável</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-text-muted">Meta:</span>
                                <span className="text-2xl font-mono font-bold text-emerald-600">
                                    {formatCurrency(incomeProjections[0].sources.violao)}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600" style={{ width: '0%' }}></div>
                            </div>
                            <p className="text-[10px] text-text-muted">R$ 0 / {formatCurrency(incomeProjections[0].sources.violao)}</p>
                        </div>
                    </div>

                    {/* Bartender */}
                    <div className="bg-black/30 border border-orange-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <span className="text-xl">🎯</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase">Bartender</h4>
                                <p className="text-[10px] text-text-muted">Hustle Crescente</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-text-muted">Meta:</span>
                                <span className="text-2xl font-mono font-bold text-orange-500">
                                    {formatCurrency(incomeProjections[0].sources.bartender)}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: '0%' }}></div>
                            </div>
                            <p className="text-[10px] text-text-muted">R$ 0 / {formatCurrency(incomeProjections[0].sources.bartender)}</p>
                        </div>
                    </div>

                    {/* Eletron */}
                    <div className="bg-black/30 border border-cyan-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <span className="text-xl">⚡</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase">Eletron</h4>
                                <p className="text-[10px] text-text-muted">Business Exponencial</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-text-muted">Meta:</span>
                                <span className="text-2xl font-mono font-bold text-cyan-500">
                                    {formatCurrency(incomeProjections[0].sources.eletron)}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: '0%' }}></div>
                            </div>
                            <p className="text-[10px] text-text-muted">R$ 0 / {formatCurrency(incomeProjections[0].sources.eletron)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-text-muted">Mês Atual (Fev/26)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-text-muted">Pico (Dez/26)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <span className="text-text-muted">Meta (Mar/27)</span>
                </div>
            </div>
        </div>
    );
};
