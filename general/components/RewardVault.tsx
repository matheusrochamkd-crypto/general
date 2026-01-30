import React from 'react';
import { Lock, Unlock, Car, Mountain, Compass, ArrowLeft, Shield, Zap, Target } from 'lucide-react';

interface RewardVaultProps {
    onBack: () => void;
    metaMensalCarro?: number;
    valorGuardadoAtual?: number;
}

interface Mission {
    id: string;
    level: number;
    codename: string;
    subtitle: string;
    description: string;
    cost: number;
    unlockThreshold: number;
    backgroundImage: string;
    icon: React.ReactNode;
}

export const RewardVault: React.FC<RewardVaultProps> = ({
    onBack,
    metaMensalCarro = 1400,
    valorGuardadoAtual = 750
}) => {
    const progressPercent = (valorGuardadoAtual / metaMensalCarro) * 100;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const missions: Mission[] = [
        {
            id: 'solo',
            level: 1,
            codename: 'OPERAÇÃO SOLO',
            subtitle: 'Trilha com Amigos',
            description: 'Desbloqueie uma aventura na natureza com seus companheiros de equipe. Combustível e alimentação inclusos.',
            cost: 150,
            unlockThreshold: 50,
            backgroundImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
            icon: <Mountain className="w-6 h-6" />
        },
        {
            id: 'expedition',
            level: 2,
            codename: 'EXPEDIÇÃO VENTO SUL',
            subtitle: 'Trilha Guiada Premium',
            description: 'Expedição completa com guia profissional, equipamentos e hospedagem em refúgio de montanha.',
            cost: 200,
            unlockThreshold: 100,
            backgroundImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
            icon: <Compass className="w-6 h-6" />
        }
    ];

    const calculateAmountToUnlock = (threshold: number) => {
        const requiredAmount = (threshold / 100) * metaMensalCarro;
        return Math.max(0, requiredAmount - valorGuardadoAtual);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Navigation Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Voltar ao Dashboard</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent-cyan" />
                        <span className="text-xs text-text-muted uppercase tracking-widest">Cofre de Recompensas // Acesso Autorizado</span>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-16 px-6 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 via-transparent to-transparent"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-cyan/10 rounded-full blur-[150px]"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    {/* Protocol Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                            <span className="text-white">CENTRAL DE</span>
                            <span className="text-accent-cyan ml-3">RECOMPENSAS</span>
                        </h1>
                        <p className="text-text-secondary text-lg max-w-xl mx-auto">
                            Seu cofre de recompensas pessoal. Atinja as metas e desbloqueie experiências exclusivas.
                        </p>
                    </div>

                    {/* Main Progress Card */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-yellow/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-cyan/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 flex items-center justify-center">
                                        <Car className="w-7 h-7 text-accent-yellow" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Objetivo Principal</h2>
                                        <p className="text-sm text-text-muted">Meta Mensal: Fundo para o Carro</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-bold font-mono text-accent-cyan">
                                        {progressPercent.toFixed(0)}%
                                    </div>
                                    <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Progresso Atual</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-sm text-text-secondary">Acumulado</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold font-mono text-white">{formatCurrency(valorGuardadoAtual)}</span>
                                        <span className="text-text-muted mx-2">/</span>
                                        <span className="text-lg font-mono text-text-muted">{formatCurrency(metaMensalCarro)}</span>
                                    </div>
                                </div>
                                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden relative">
                                    {/* Threshold Markers */}
                                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10"></div>
                                    {/* Progress Fill */}
                                    <div
                                        className="h-full bg-gradient-to-r from-accent-yellow via-accent-cyan to-accent-green rounded-full transition-all duration-1000 relative"
                                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-text-muted mt-2">
                                    <span>0%</span>
                                    <span className={progressPercent >= 50 ? 'text-accent-green font-bold' : ''}>50% - Nível 1</span>
                                    <span className={progressPercent >= 100 ? 'text-accent-green font-bold' : ''}>100% - Nível 2</span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                                <div className="text-center">
                                    <div className="text-2xl font-bold font-mono text-white">{formatCurrency(metaMensalCarro - valorGuardadoAtual)}</div>
                                    <p className="text-xs text-text-muted mt-1">Faltando</p>
                                </div>
                                <div className="text-center border-x border-white/5">
                                    <div className="text-2xl font-bold font-mono text-accent-green">{missions.filter(m => progressPercent >= m.unlockThreshold).length}</div>
                                    <p className="text-xs text-text-muted mt-1">Desbloqueadas</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold font-mono text-text-muted">{missions.filter(m => progressPercent < m.unlockThreshold).length}</div>
                                    <p className="text-xs text-text-muted mt-1">Bloqueadas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Missions Grid */}
            <section className="px-6 pb-20">
                <div className="max-w-5xl mx-auto">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <Target className="w-5 h-5 text-accent-cyan" />
                        <h2 className="text-2xl font-bold text-white">Missões Disponíveis</h2>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {missions.map((mission) => {
                            const isUnlocked = progressPercent >= mission.unlockThreshold;
                            const amountToUnlock = calculateAmountToUnlock(mission.unlockThreshold);

                            return (
                                <div
                                    key={mission.id}
                                    className={`relative rounded-2xl overflow-hidden h-[400px] group transition-all duration-500 ${isUnlocked
                                        ? 'border-2 border-accent-green shadow-[0_0_30px_rgba(0,255,136,0.2)]'
                                        : 'border border-white/10'
                                        }`}
                                >
                                    {/* Background Image */}
                                    <div
                                        className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${isUnlocked
                                            ? 'scale-105 group-hover:scale-110'
                                            : 'grayscale blur-[2px] opacity-40'
                                            }`}
                                        style={{ backgroundImage: `url(${mission.backgroundImage})` }}
                                    ></div>

                                    {/* Gradient Overlay */}
                                    <div className={`absolute inset-0 ${isUnlocked
                                        ? 'bg-gradient-to-t from-black via-black/60 to-transparent'
                                        : 'bg-black/70'
                                        }`}></div>

                                    {/* Locked Overlay */}
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                            <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-4">
                                                <Lock className="w-10 h-10 text-text-muted" />
                                            </div>
                                            <p className="text-sm text-text-muted font-mono uppercase tracking-wider">Acesso Negado</p>
                                            <p className="text-xs text-accent-red mt-2 font-mono">Requer {mission.unlockThreshold}% de progresso</p>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                                        {/* Level Badge */}
                                        <div className={`inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full mb-4 ${isUnlocked
                                            ? 'bg-accent-green/20 border border-accent-green/30'
                                            : 'bg-white/5 border border-white/10'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${isUnlocked ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`}></span>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isUnlocked ? 'text-accent-green' : 'text-text-muted'}`}>
                                                Nível {mission.level} {isUnlocked ? '// Desbloqueado' : '// Bloqueado'}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUnlocked
                                                ? 'bg-accent-green/20 border border-accent-green/30'
                                                : 'bg-white/5 border border-white/10'
                                                }`}>
                                                <span className={isUnlocked ? 'text-accent-green' : 'text-text-muted'}>{mission.icon}</span>
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-bold ${isUnlocked ? 'text-white' : 'text-text-muted'}`}>
                                                    {mission.codename}
                                                </h3>
                                                <p className="text-sm text-text-secondary">{mission.subtitle}</p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className={`text-sm mb-4 ${isUnlocked ? 'text-text-secondary' : 'text-text-muted opacity-50'}`}>
                                            {mission.description}
                                        </p>

                                        {/* Action Button */}
                                        {isUnlocked ? (
                                            <button className="w-full py-4 rounded-xl bg-accent-green text-black font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-accent-green/90 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                                                <Unlock className="w-5 h-5" />
                                                Resgatar Verba ({formatCurrency(mission.cost)})
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="text-center py-2">
                                                    <span className="text-sm text-accent-red font-mono">
                                                        Falta {formatCurrency(amountToUnlock)} para desbloquear
                                                    </span>
                                                </div>
                                                <button
                                                    disabled
                                                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-text-muted font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
                                                >
                                                    <Lock className="w-5 h-5" />
                                                    Bloqueado
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-6 text-center">
                <p className="text-xs text-text-muted font-mono">
                    REWARD_VAULT.SYS // v2026.1 // Classified Level: OMEGA
                </p>
            </footer>
        </div>
    );
};
