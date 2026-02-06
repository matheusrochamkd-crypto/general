import React, { useState, useRef, useEffect } from 'react';
import { MonthData } from '../types';
import { ChevronDown, Calendar, Car, Trophy, TrendingUp, Radio, Scroll, FileText } from 'lucide-react';

interface SidebarProps {
  months: MonthData[];
  currentMonthId: string;
  onSelectMonth: (id: string) => void;
  onOpenRewardVault?: () => void;
  onOpenVehicleRoadmap?: () => void;
  onOpenRevenueTimeline?: () => void;
  onOpenCommandCenter?: () => void;
  onOpenBucketList?: () => void;
  onOpenEventsAgenda?: () => void;
  onOpenCapitalSocial?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ months, currentMonthId, onSelectMonth, onOpenRewardVault, onOpenVehicleRoadmap, onOpenRevenueTimeline, onOpenCommandCenter, onOpenBucketList, onOpenEventsAgenda, onOpenCapitalSocial }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMonth = months.find(m => m.id === currentMonthId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelectMonth(id);
    setIsOpen(false);
  };

  return (
    <div className="w-72 h-screen bg-[#0A0A0A]/90 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo Area - Compact */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Comandos Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-base font-semibold text-white tracking-wide">Comandos</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Operação 2026</p>
          </div>
        </div>
      </div>

      {/* Month Selector - Dropdown */}
      <div className="p-3" ref={dropdownRef}>
        <label className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5 block">
          Período Ativo
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm text-white font-medium">{currentMonth?.name || 'Selecionar'}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-3 right-3 mt-2 py-2 bg-[#111111] border border-white/10 rounded-lg shadow-xl shadow-black/50 max-h-80 overflow-y-auto z-50">
            {months.map((month) => {
              const isActive = month.id === currentMonthId;
              return (
                <button
                  key={month.id}
                  onClick={() => handleSelect(month.id)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className="text-sm font-medium">{month.name}</span>
                  {isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-accent-cyan/20 text-accent-cyan rounded-full uppercase font-medium">
                      Ativo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats Summary - Compact */}
      <div className="px-3 py-3">
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Status do Mês</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Mês</span>
              <span className="text-xs text-white font-medium">{currentMonth?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Ano</span>
              <span className="text-xs text-white font-medium">2026</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Status</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${currentMonth?.status === 'ACTV'
                ? 'bg-accent-green/10 text-accent-green'
                : 'bg-accent-yellow/10 text-accent-yellow'
                }`}>
                {currentMonth?.status === 'ACTV' ? 'Em Andamento' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Compact */}
      <div className="px-3 space-y-2 flex-1">
        {/* Cofre de Recompensas Button */}
        {onOpenRewardVault && (
          <button
            onClick={onOpenRewardVault}
            className="w-full py-2.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center gap-2 text-accent-cyan hover:bg-accent-cyan/20 transition-all"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Cofre de Recompensas</span>
          </button>
        )}

        {/* Roadmap de Veículos Button */}
        {onOpenVehicleRoadmap && (
          <button
            onClick={onOpenVehicleRoadmap}
            className="w-full py-2.5 rounded-lg bg-accent-yellow/10 border border-accent-yellow/20 flex items-center justify-center gap-2 text-accent-yellow hover:bg-accent-yellow/20 transition-all"
          >
            <Car className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Roadmap de Veículos</span>
          </button>
        )}

        {/* Projeção de Renda Button */}
        {onOpenRevenueTimeline && (
          <button
            onClick={onOpenRevenueTimeline}
            className="w-full py-2.5 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center gap-2 text-emerald-500 hover:bg-emerald-600/20 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Projeção de Renda</span>
          </button>
        )}

        {/* Comando Central Button */}
        {onOpenCommandCenter && (
          <button
            onClick={onOpenCommandCenter}
            className="w-full py-2.5 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-center justify-center gap-2 text-accent-red hover:bg-accent-red/20 transition-all"
          >
            <Radio className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Comando Central</span>
          </button>
        )}

        {/* Bucket List Button */}
        {onOpenBucketList && (
          <button
            onClick={onOpenBucketList}
            className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-gray-300 hover:bg-white/10 transition-all"
          >
            <Scroll className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Lista de Vida</span>
          </button>
        )}

        {/* Agenda Anual Button */}
        {onOpenEventsAgenda && (
          <button
            onClick={onOpenEventsAgenda}
            className="w-full py-2.5 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-600/20 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Agenda 2026</span>
          </button>
        )}

        {/* Capital Social Button */}
        {onOpenCapitalSocial && (
          <button
            onClick={onOpenCapitalSocial}
            className="w-full py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Capital Social</span>
          </button>
        )}
      </div>

      {/* Large Bottom Logo */}
      <div className="mt-auto px-4 pb-4 flex justify-center opacity-80">
        <img
          src="/sidebar-ghost.jpg"
          alt="Operador Ghost"
          className="w-48 h-48 object-cover rounded-2xl drop-shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
        />
      </div>

      {/* Footer - Compact */}
      <div className="p-3 border-t border-white/5">
        <p className="text-[9px] text-text-muted text-center">v2026.1 • Dashboard Financeiro</p>
      </div>
    </div>
  );
};