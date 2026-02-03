import React from 'react';
import { Lock, Unlock, Car, Mountain, CheckCircle2, Compass } from 'lucide-react';

interface Reward {
    id: string;
    level: number;
    codename: string;
    title: string;
    cost: number;
    unlockThreshold?: number; // percentage (0-100)
    unlockAmount?: number; // absolute value
    icon: React.ReactNode;
}

interface RewardSystemProps {
    metaMensalCarro?: number;
    valorGuardadoAtual?: number;
    onOpenFullView?: () => void;
}

export const RewardSystem: React.FC<RewardSystemProps> = ({
    metaMensalCarro = 1400,
    valorGuardadoAtual = 750,
    onOpenFullView
}) => {
    const progressPercent = (valorGuardadoAtual / metaMensalCarro) * 100;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const rewards: Reward[] = [
        {
            id: 'solo',
            level: 1,
            codename: 'OPERAÇÃO SOLO',
            title: 'Trilha com Amigos',
            cost: 150,
            unlockThreshold: 50,
            icon: <Mountain className="w-5 h-5" />
        },
        {
            id: 'epje-cascavel',
            level: 2,
            codename: 'OPERAÇÃO EPJE',
            title: 'Viagem Cascavel (10 amigos)',
            cost: 300,
            unlockAmount: 3000,
            icon: <Compass className="w-5 h-5" />
        }
    ];

    const calculateAmountToUnlock = (reward: Reward) => {
        let requiredAmount = 0;
        if (reward.unlockAmount !== undefined) {
            requiredAmount = reward.unlockAmount;
        } else if (reward.unlockThreshold !== undefined) {
            requiredAmount = (reward.unlockThreshold / 100) * metaMensalCarro;
        }
        return Math.max(0, requiredAmount - valorGuardadoAtual);
    };

    return (
        <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-4 mt-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-yellow/10 border border-accent-yellow/20 flex items-center justify-center">
                    <Car className="w-4 h-4 text-accent-yellow" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-white">Sistema de Recompensas</h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Meta do Carro</p>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-muted">Fundo Carro</span>
                    <span className="text-xs font-mono text-accent-yellow font-semibold">
                        {formatCurrency(valorGuardadoAtual)} / {formatCurrency(metaMensalCarro)}
                    </span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden relative">
                    {/* Threshold markers */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10"></div>
                    {/* Progress fill */}
                    <div
                        className="h-full bg-gradient-to-r from-accent-yellow to-accent-green rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                    <span>0%</span>
                    <span className={progressPercent >= 50 ? 'text-accent-green' : ''}>50%</span>
                    <span className={progressPercent >= 100 ? 'text-accent-green' : ''}>100%</span>
                </div>
            </div>

            {/* Rewards List */}
            <div className="space-y-3">
                {rewards.map((reward) => {
                    const isUnlocked = reward.unlockAmount
                        ? valorGuardadoAtual >= reward.unlockAmount
                        : progressPercent >= (reward.unlockThreshold || 100);

                    const amountToUnlock = calculateAmountToUnlock(reward);

                    return (
                        <div
                            key={reward.id}
                            className={`relative rounded-lg border p-3 transition-all duration-300 ${isUnlocked
                                ? 'bg-accent-cyan/5 border-accent-cyan/30 shadow-[0_0_15px_rgba(0,255,204,0.1)]'
                                : 'bg-white/[0.02] border-white/10 opacity-60'
                                }`}
                        >
                            {/* Level Badge */}
                            <div className={`absolute -top-2 -left-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${isUnlocked ? 'bg-accent-cyan text-black' : 'bg-zinc-700 text-zinc-400'
                                }`}>
                                Nível {reward.level}
                            </div>

                            <div className="flex items-start gap-3 mt-1">
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUnlocked
                                    ? 'bg-accent-cyan/10 border border-accent-cyan/30'
                                    : 'bg-white/5 border border-white/10'
                                    }`}>
                                    {isUnlocked ? (
                                        <span className="text-accent-cyan">{reward.icon}</span>
                                    ) : (
                                        <Lock className="w-4 h-4 text-text-muted" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isUnlocked ? 'text-accent-cyan' : 'text-text-muted'
                                            }`}>
                                            {reward.codename}
                                        </span>
                                        {isUnlocked && (
                                            <CheckCircle2 className="w-3 h-3 text-accent-green" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-text-secondary mt-0.5">{reward.title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs font-mono font-semibold text-white">
                                            {formatCurrency(reward.cost)}
                                        </span>
                                        {!isUnlocked && (
                                            <span className="text-[10px] text-accent-red">
                                                Falta {formatCurrency(amountToUnlock)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                disabled={!isUnlocked}
                                className={`w-full mt-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isUnlocked
                                    ? 'bg-accent-cyan text-black hover:bg-accent-cyan/90 cursor-pointer'
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                {isUnlocked ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Unlock className="w-3 h-3" />
                                        Resgatar Verba
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        Bloqueado
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Progress Summary */}
            <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">
                    Progresso Atual:
                </span>
                <span className={`ml-2 text-sm font-mono font-bold ${progressPercent >= 100 ? 'text-accent-green' : progressPercent >= 50 ? 'text-accent-yellow' : 'text-accent-red'
                    }`}>
                    {progressPercent.toFixed(0)}%
                </span>
            </div>

            {/* Expand Button */}
            {onOpenFullView && (
                <button
                    onClick={onOpenFullView}
                    className="w-full mt-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-text-secondary hover:bg-white/10 hover:text-white transition-all uppercase tracking-wider font-medium"
                >
                    Expandir Cofre de Recompensas
                </button>
            )}
        </div>
    );
};
