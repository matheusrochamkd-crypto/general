import React from 'react';
import { Clock } from 'lucide-react';

interface HeaderProps {
    monthName: string;
    year: string | number;
    status: string;
    currentTime: Date;
}

export const Header: React.FC<HeaderProps> = ({ monthName, year, status, currentTime }) => {
    return (
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
            <div>
                <h1 className="text-4xl font-semibold text-white tracking-tight flex items-baseline gap-3">
                    {monthName}
                    <span className="text-2xl text-text-muted font-normal">{year}</span>
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'Em Simulação' ? 'bg-accent-cyan animate-pulse' : 'bg-accent-yellow'}`}></div>
                    <span className="text-sm text-text-secondary">{status}</span>
                </div>
            </div>

            <div className="glass-card rounded-xl px-5 py-3 text-right">
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-text-muted" />
                    <span className="text-[10px] uppercase text-text-muted tracking-wider">Agora</span>
                </div>
                <div className="text-2xl font-semibold font-mono-numbers text-accent-yellow">
                    {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-text-muted mt-1">
                    {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
            </div>
        </header>
    );
};
