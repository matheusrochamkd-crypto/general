import React, { useState } from 'react';
import { TransactionItem, CategoryType } from '../types';
import { Plus, Trash2, Crosshair, Wallet, Shield, AlertTriangle, Check, Calendar } from 'lucide-react';

interface SectionListProps {
  title: string;
  type: CategoryType;
  items: TransactionItem[];
  total: number;
  onAddItem: (item: Omit<TransactionItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  colorTheme: 'yellow' | 'blue' | 'red';
  warningMessage?: string;
  currentMonthId?: string;
}

export const SectionList: React.FC<SectionListProps> = ({
  title,
  type,
  items,
  total,
  onAddItem,
  onRemoveItem,
  onToggleComplete,
  colorTheme,
  warningMessage,
  currentMonthId
}) => {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [date, setDate] = useState('');

  const handleAdd = () => {
    if (!desc || !val) return;

    // For INCOME, require date
    if (type === 'INCOME' && !date) {
      alert('Por favor, informe a data de recebimento.');
      return;
    }

    onAddItem({
      description: desc,
      amount: parseFloat(val),
      date: date || undefined,
      isRecurring: false,
      completed: false
    });
    setDesc('');
    setVal('');
    setDate('');
  };

  const getThemeColors = () => {
    switch (colorTheme) {
      case 'yellow': return { bg: 'bg-accent-yellow', text: 'text-accent-yellow', border: 'border-accent-yellow/30', iconBg: 'bg-accent-yellow/10' };
      case 'red': return { bg: 'bg-accent-red', text: 'text-accent-red', border: 'border-accent-red/30', iconBg: 'bg-accent-red/10' };
      default: return { bg: 'bg-accent-cyan', text: 'text-accent-cyan', border: 'border-accent-cyan/30', iconBg: 'bg-accent-cyan/10' };
    }
  };

  const theme = getThemeColors();

  const getIcon = () => {
    switch (type) {
      case 'TARGET': return <Crosshair className="w-4 h-4" />;
      case 'INCOME': return <Wallet className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Check if income item should be auto-completed based on date and month
  const isIncomeReceived = (item: TransactionItem) => {
    if (type !== 'INCOME') return item.completed;
    if (item.completed) return true;
    if (!item.date) return false;

    const today = new Date();
    const currentRealMonthIndex = today.getMonth(); // 0 = Jan, 1 = Feb, etc.

    // Map month IDs to their index
    const monthIndexMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const viewingMonthIndex = monthIndexMap[currentMonthId || 'feb'] ?? 1;

    // If viewing a future month, income is NOT received yet
    if (viewingMonthIndex > currentRealMonthIndex) {
      return false;
    }

    // If viewing a past month, all income is received
    if (viewingMonthIndex < currentRealMonthIndex) {
      return true;
    }

    // Same month: check if current day >= item day
    const currentDay = today.getDate();
    const itemDay = parseInt(item.date.split('/')[0] || item.date, 10);
    return currentDay >= itemDay;
  };

  // Show checkbox for TARGET, show date status for INCOME
  const showCheckbox = type === 'TARGET';
  const showDateInput = type === 'INCOME';

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${theme.iconBg} ${theme.border} border flex items-center justify-center`}>
            <span className={theme.text}>{getIcon()}</span>
          </div>
          <h3 className="text-white font-medium text-sm">{title}</h3>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono-numbers ${theme.bg} text-black`}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {warningMessage && (
          <div className={`${theme.iconBg} ${theme.border} border rounded-lg p-3 text-xs ${theme.text} flex items-center gap-2`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center rounded-lg overflow-hidden border border-white/10 bg-white/[0.02]">
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={`Adicionar ${type === 'TARGET' ? 'alvo' : type === 'INCOME' ? 'receita' : 'custo'}...`}
              className="flex-1 bg-transparent text-sm px-4 py-3 text-white placeholder-text-muted focus:outline-none"
            />
            <div className="w-px h-6 bg-white/10"></div>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="0,00"
              className="w-28 bg-transparent text-sm px-4 py-3 text-right text-text-secondary focus:text-white focus:outline-none font-mono-numbers"
            />
            {showDateInput && (
              <>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Dia"
                    maxLength={2}
                    className="w-20 bg-transparent text-sm pl-9 pr-3 py-3 text-center text-text-secondary focus:text-white focus:outline-none font-mono-numbers"
                  />
                </div>
              </>
            )}
            <button
              onClick={handleAdd}
              disabled={!desc || !val || (showDateInput && !date)}
              className={`h-full px-4 py-3 ${theme.bg} text-black hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isCompleted = showCheckbox ? item.completed : isIncomeReceived(item);

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between group p-3 hover:bg-white/[0.03] transition-colors rounded-lg ${isCompleted ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox for TARGET items */}
                  {showCheckbox && onToggleComplete && (
                    <button
                      onClick={() => onToggleComplete(item.id, !item.completed)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${item.completed
                        ? 'bg-accent-green border-accent-green text-black'
                        : 'border-white/20 hover:border-accent-green/50'
                        }`}
                    >
                      {item.completed && <Check className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Icon for non-checkbox items */}
                  {!showCheckbox && (
                    <div className={`w-8 h-8 rounded-lg ${theme.iconBg} flex items-center justify-center`}>
                      <span className={`${theme.text} opacity-60`}>{getIcon()}</span>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {item.description}
                    </span>
                    {item.date && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Dia {item.date}
                        {type === 'INCOME' && isCompleted && (
                          <span className="ml-2 text-accent-green">• Recebido</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold font-mono-numbers ${isCompleted ? 'text-accent-green' : theme.text}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-text-muted hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-text-muted">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};