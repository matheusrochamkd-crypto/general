import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface MissionStatusCardProps {
    missionGap: number;
    coveragePercent: number;
}

export const MissionStatusCard: React.FC<MissionStatusCardProps> = ({ missionGap, coveragePercent }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const isProfit = coveragePercent >= 100;

    const getStatusColor = () => {
        if (coveragePercent >= 100) return 'green';
        if (coveragePercent >= 70) return 'yellow';
        return 'red';
    };

    const status = getStatusColor();
    const colorClasses = {
        green: { text: 'text-accent-green', bg: 'bg-accent-green', bgLight: 'bg-accent-green/10', border: 'border-accent-green/20' },
        yellow: { text: 'text-accent-yellow', bg: 'bg-accent-yellow', bgLight: 'bg-accent-yellow/10', border: 'border-accent-yellow/20' },
        red: { text: 'text-accent-red', bg: 'bg-accent-red', bgLight: 'bg-accent-red/10', border: 'border-accent-red/20' }
    };

    const colors = colorClasses[status];

    // Calculate profit (realized - costs) when coverage >= 100%
    const profitAmount = Math.abs(missionGap);

    return (
        <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px]">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Status da Missão</span>
                <div className={`w-9 h-9 rounded-lg ${colors.bgLight} ${colors.border} border flex items-center justify-center`}>
                    {isProfit ? (
                        <TrendingUp className={`w-4 h-4 ${colors.text}`} />
                    ) : (
                        <TrendingDown className={`w-4 h-4 ${colors.text}`} />
                    )}
                </div>
            </div>

            <div>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm text-text-muted">
                        {isProfit ? 'Lucro:' : 'Falta:'}
                    </span>
                    <span className={`text-2xl font-semibold font-mono-numbers ${colors.text}`}>
                        {formatCurrency(profitAmount)}
                    </span>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-xs text-text-muted mb-2">
                        <span>Cobertura de Custos</span>
                        <span className={`font-semibold font-mono-numbers ${colors.text}`}>{coveragePercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, coveragePercent)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
