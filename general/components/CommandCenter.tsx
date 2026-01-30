import React, { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Target, Crosshair, Radio, ArrowLeft } from 'lucide-react';
import { TransactionItem } from '../types';

interface CommandCenterProps {
    onBack: () => void;
    monthName: string;
    // Financial Data
    targets: TransactionItem[];
    fixedIncome: TransactionItem[];
    fixedCosts: TransactionItem[];
    variableCosts: TransactionItem[];
    totalRealized: number;
    totalExpectation: number;
    totalCost: number;
    coveragePercent: number;
    missionGap: number;
}

type MissionStatus = 'CRITICAL' | 'DANGER' | 'STABLE' | 'DOMINANCE';

interface AnalysisResult {
    status: MissionStatus;
    statusLabel: string;
    statusColor: string;
    statusIcon: React.ReactNode;
    intelReport: string;
    orders: string[];
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
    onBack,
    monthName,
    targets,
    fixedIncome,
    fixedCosts,
    variableCosts,
    totalRealized,
    totalExpectation,
    totalCost,
    coveragePercent,
    missionGap
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Generate AI-like analysis based on financial data
    const analysis: AnalysisResult = useMemo(() => {
        const pendingTargets = targets.filter(t => !t.completed);
        const completedTargets = targets.filter(t => t.completed);
        const pendingTargetsValue = pendingTargets.reduce((acc, t) => acc + t.amount, 0);
        const largestPendingTarget = pendingTargets.sort((a, b) => b.amount - a.amount)[0];
        const totalVariableCost = variableCosts.reduce((acc, c) => acc + c.amount, 0);

        // Determine mission status
        let status: MissionStatus;
        let statusLabel: string;
        let statusColor: string;
        let statusIcon: React.ReactNode;

        if (coveragePercent >= 100) {
            status = 'DOMINANCE';
            statusLabel = 'DOMÍNIO TOTAL';
            statusColor = 'text-accent-green';
            statusIcon = <CheckCircle2 className="w-8 h-8 text-accent-green" />;
        } else if (coveragePercent >= 70) {
            status = 'STABLE';
            statusLabel = 'ESTÁVEL';
            statusColor = 'text-accent-cyan';
            statusIcon = <Shield className="w-8 h-8 text-accent-cyan" />;
        } else if (coveragePercent >= 40) {
            status = 'DANGER';
            statusLabel = 'EM PERIGO';
            statusColor = 'text-accent-yellow';
            statusIcon = <AlertTriangle className="w-8 h-8 text-accent-yellow" />;
        } else {
            status = 'CRITICAL';
            statusLabel = 'CRÍTICO';
            statusColor = 'text-accent-red';
            statusIcon = <AlertTriangle className="w-8 h-8 text-accent-red animate-pulse" />;
        }

        // Generate intelligence report
        let intelReport: string;
        if (status === 'CRITICAL') {
            intelReport = `Base vulnerável. Cobertura de custos em apenas ${coveragePercent.toFixed(0)}%. Dependência de missões secundárias (Alvos) para sobreviver é crítica. Risco de insolvência iminente.`;
        } else if (status === 'DANGER') {
            intelReport = `Situação instável. Cobertura em ${coveragePercent.toFixed(0)}%. Ainda faltam ${formatCurrency(missionGap)} para neutralizar ameaças. Execução de alvos pendentes é essencial.`;
        } else if (status === 'STABLE') {
            intelReport = `Operação em curso. ${coveragePercent.toFixed(0)}% dos custos cobertos. Mantenha disciplina e execute os alvos restantes para garantir domínio.`;
        } else {
            intelReport = `Território conquistado. Custos neutralizados com sobra de ${formatCurrency(Math.abs(missionGap))}. Continue acumulando recursos para próximas operações.`;
        }

        // Generate tactical orders
        const orders: string[] = [];

        // Order 1: Priority target or cost control
        if (largestPendingTarget && status !== 'DOMINANCE') {
            orders.push(`PRIORIDADE ALFA: Mobilize esforços para fechar "${largestPendingTarget.description}" (${formatCurrency(largestPendingTarget.amount)}). Esse alvo é crítico para a missão.`);
        } else if (status === 'DOMINANCE') {
            orders.push(`CONSOLIDAÇÃO: Recursos excedentes detectados. Direcione ${formatCurrency(Math.abs(missionGap))} para o fundo de reserva ou investimentos estratégicos.`);
        } else {
            orders.push(`ALERTA VERMELHO: Nenhum alvo pendente identificado e cobertura insuficiente. Busque novas fontes de receita imediatamente.`);
        }

        // Order 2: Cost control or target execution
        if (totalVariableCost > 0 && status === 'CRITICAL') {
            orders.push(`CONTENÇÃO DE DANOS: Cesse gastos variáveis não essenciais (${formatCurrency(totalVariableCost)} registrados). Estamos sangrando recursos.`);
        } else if (pendingTargets.length > 1) {
            orders.push(`EXECUÇÃO TÁTICA: ${pendingTargets.length} alvos pendentes totalizando ${formatCurrency(pendingTargetsValue)}. Priorize por valor e probabilidade de fechamento.`);
        } else if (status === 'STABLE') {
            orders.push(`MANUTENÇÃO: Continue operações normais. Monitore custos variáveis e evite gastos não planejados.`);
        } else {
            orders.push(`TERRITÓRIO SEGURO: Operação estável. Avalie oportunidades de expansão para o próximo mês.`);
        }

        // Order 3: Motivational/strategic
        if (status === 'CRITICAL') {
            orders.push(`DISCIPLINA, OPERADOR: A esperança não é uma estratégia. Execute os contratos ou prepare-se para a derrota. Câmbio desligo.`);
        } else if (status === 'DANGER') {
            orders.push(`FOCO TOTAL: Cada real conta. Mantenha a disciplina e não desvie do objetivo. O erro é fatal.`);
        } else if (status === 'STABLE') {
            orders.push(`MANTENHA O RITMO: A vitória está próxima. Não relaxe até cruzar a linha de chegada.`);
        } else {
            orders.push(`MISSÃO CUMPRIDA: Excelente trabalho, Operador. Prepare-se para os próximos desafios. A guerra nunca acaba.`);
        }

        return { status, statusLabel, statusColor, statusIcon, intelReport, orders };
    }, [targets, variableCosts, coveragePercent, missionGap]);

    return (
        <div className="min-h-screen bg-[#020202] py-8 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-wider">Retornar ao Dashboard</span>
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
                    <div className="w-12 h-12 rounded-lg bg-accent-red/20 border border-accent-red/30 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-accent-red" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Comando Central</h1>
                        <p className="text-sm text-text-muted">Análise Tática • {monthName} 2026</p>
                    </div>
                </div>

                {/* Mission Status Card */}
                <div className={`relative overflow-hidden rounded-xl border ${analysis.status === 'CRITICAL' ? 'border-accent-red/50 bg-accent-red/5' :
                        analysis.status === 'DANGER' ? 'border-accent-yellow/50 bg-accent-yellow/5' :
                            analysis.status === 'STABLE' ? 'border-accent-cyan/50 bg-accent-cyan/5' :
                                'border-accent-green/50 bg-accent-green/5'
                    } p-8 mb-8`}>
                    {/* Decorative Grid */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05) 76%, transparent 77%, transparent)',
                            backgroundSize: '50px 50px'
                        }} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            {analysis.statusIcon}
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Status da Missão</p>
                                <h2 className={`text-3xl font-black uppercase tracking-tight ${analysis.statusColor}`}>
                                    {analysis.statusLabel}
                                </h2>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-black/30 rounded-lg">
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">Conquistado</p>
                                <p className="text-lg font-mono font-bold text-accent-green">{formatCurrency(totalRealized)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">Expectativa</p>
                                <p className="text-lg font-mono font-bold text-white">{formatCurrency(totalExpectation)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">Custo Total</p>
                                <p className="text-lg font-mono font-bold text-accent-red">{formatCurrency(totalCost)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">Cobertura</p>
                                <p className={`text-lg font-mono font-bold ${analysis.statusColor}`}>{coveragePercent.toFixed(0)}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Intelligence Report */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Crosshair className="w-5 h-5 text-accent-cyan" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Relatório de Inteligência</h3>
                    </div>
                    <blockquote className="border-l-2 border-accent-cyan pl-4 text-text-secondary italic leading-relaxed">
                        {analysis.intelReport}
                    </blockquote>
                </div>

                {/* Tactical Orders */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="w-5 h-5 text-accent-yellow" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ordens do Comando</h3>
                    </div>

                    <div className="space-y-4">
                        {analysis.orders.map((order, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 bg-white/5 rounded-lg border border-white/5">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-yellow/20 border border-accent-yellow/30 flex items-center justify-center text-accent-yellow font-bold text-sm">
                                    {index + 1}
                                </span>
                                <p className="text-text-secondary leading-relaxed pt-1">{order}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-widest">
                        /// Comando Central HQ • Operação Financeira 2026 ///
                    </p>
                </div>
            </div>
        </div>
    );
};
