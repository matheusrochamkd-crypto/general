import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'yellow' | 'red' | 'white' | 'green';
  variant?: 'default' | 'alert';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, variant = 'default' }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getColorClasses = () => {
    switch (color) {
      case 'blue': return { text: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20' };
      case 'yellow': return { text: 'text-accent-yellow', bg: 'bg-accent-yellow/10', border: 'border-accent-yellow/20' };
      case 'red': return { text: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/20' };
      case 'green': return { text: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' };
      default: return { text: 'text-white', bg: 'bg-white/10', border: 'border-white/20' };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="glass-card rounded-xl p-5 relative h-full flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
      </div>

      {/* Value */}
      <div>
        <h3 className={`text-2xl font-semibold font-mono-numbers tracking-tight mb-1 ${colors.text}`}>
          {formatCurrency(value)}
        </h3>
        <p className="text-[11px] text-text-muted uppercase tracking-wider">{subtitle}</p>
      </div>

      {/* Progress bar for alert variant */}
      {variant === 'alert' && (
        <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
          <div className="h-full bg-accent-red rounded-full w-[12%] animate-pulse"></div>
        </div>
      )}
    </div>
  );
};