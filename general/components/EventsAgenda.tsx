import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Plus, Calendar, CheckCircle2, Circle, Trash2, ChevronLeft, ChevronRight, Sparkles, X, AlertTriangle, TrendingUp, ListTodo, Cloud, CloudOff, Clock, RotateCw, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface EventsAgendaProps {
    onBack: () => void;
}

interface AgendaEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    time: string;
    type: 'MEETING' | 'TASK' | 'REMINDER' | 'EVENT';
    completed: boolean;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_COLORS: Record<string, { bg: string; text: string; solid: string }> = {
    MEETING: { bg: 'bg-blue-500/20', text: 'text-blue-400', solid: 'bg-blue-500' },
    TASK: { bg: 'bg-green-500/20', text: 'text-green-400', solid: 'bg-green-500' },
    REMINDER: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', solid: 'bg-yellow-500' },
    EVENT: { bg: 'bg-purple-500/20', text: 'text-purple-400', solid: 'bg-purple-500' },
};

const TYPE_LABELS: Record<string, string> = {
    MEETING: 'Reunião',
    TASK: 'Tarefa',
    REMINDER: 'Lembrete',
    EVENT: 'Evento',
};

// Pure mapping functions (outside component to avoid initialization issues)
const mapAgendaEventFromDb = (row: any): AgendaEvent => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    startDate: row.start_date,
    endDate: row.end_date || row.start_date,
    time: row.time || '',
    type: row.type || 'EVENT',
    completed: row.completed || false,
});

const mapAgendaEventToDb = (event: AgendaEvent) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    start_date: event.startDate,
    end_date: event.endDate,
    time: event.time,
    type: event.type,
    completed: event.completed,
});

const getDaysBetween = (start: string, end: string): string[] => {
    const days: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const current = new Date(startDate);
    while (current <= endDate) {
        days.push(`${current.getFullYear()} -${String(current.getMonth() + 1).padStart(2, '0')} -${String(current.getDate()).padStart(2, '0')} `);
        current.setDate(current.getDate() + 1);
    }
    return days;
};

export const EventsAgenda: React.FC<EventsAgendaProps> = ({ onBack }) => {
    console.log('EventsAgenda mounting...');

    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [isSynced, setIsSynced] = useState<boolean | null>(null); // null = loading, true = synced, false = offline
    const [lastSyncTime, setLastSyncTime] = useState<string>('');

    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);

    const { user } = useAuth();

    // Drag selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<string | null>(null);
    const [dragEnd, setDragEnd] = useState<string | null>(null);

    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formStartTime, setFormStartTime] = useState('');
    const [formEndTime, setFormEndTime] = useState('');

    // Load events from Supabase on mount, fallback to localStorage
    useEffect(() => {
        // ... (existing load logic)
        // ... (keeping existing load logic hidden for brevity if unchanged, but need to be careful with replace_file_content)
        // Actually, I should use multi_replace for surgical edits.
        // Cancelling this replace to use multi_replace.

        // Helper functions defined INSIDE useEffect to ensure proper order
        const loadFromLocalStorageInner = (): AgendaEvent[] => {
            try {
                const savedNew = localStorage.getItem('agenda_events_2026_v2');
                if (savedNew) {
                    const parsed = JSON.parse(savedNew);
                    if (!Array.isArray(parsed)) {
                        localStorage.removeItem('agenda_events_2026_v2');
                        return [];
                    }
                    const validEvents = parsed.filter((e: any) => e && e.id && e.title).map((e: any) => ({
                        id: String(e.id),
                        title: String(e.title || ''),
                        description: String(e.description || ''),
                        startDate: String(e.startDate || e.date || ''),
                        endDate: String(e.endDate || e.startDate || e.date || ''),
                        time: String(e.time || ''),
                        type: (['MEETING', 'TASK', 'REMINDER', 'EVENT'].includes(e.type) ? e.type : 'EVENT') as 'MEETING' | 'TASK' | 'REMINDER' | 'EVENT',
                        completed: Boolean(e.completed),
                    }));
                    return validEvents;
                }
                const savedOld = localStorage.getItem('agenda_events_2026');
                if (savedOld) {
                    const oldEvents = JSON.parse(savedOld);
                    if (!Array.isArray(oldEvents)) return [];
                    const migratedEvents = oldEvents.filter((e: any) => e && e.id).map((e: any) => ({
                        id: String(e.id),
                        title: String(e.title || ''),
                        description: String(e.description || ''),
                        startDate: String(e.date || e.startDate || ''),
                        endDate: String(e.date || e.endDate || e.startDate || ''),
                        time: String(e.time || ''),
                        type: (['MEETING', 'TASK', 'REMINDER', 'EVENT'].includes(e.type) ? e.type : 'EVENT') as 'MEETING' | 'TASK' | 'REMINDER' | 'EVENT',
                        completed: Boolean(e.completed),
                    }));
                    localStorage.setItem('agenda_events_2026_v2', JSON.stringify(migratedEvents));
                    return migratedEvents;
                }
            } catch (err) {
                console.error('Error loading localStorage:', err);
                localStorage.removeItem('agenda_events_2026_v2');
                localStorage.removeItem('agenda_events_2026');
            }
            return [];
        };

        const syncLocalToSupabaseInner = async (localEvents: AgendaEvent[]) => {
            try {
                for (const event of localEvents) {
                    await supabase.from('agenda_events').upsert(mapAgendaEventToDb(event), { onConflict: 'id' });
                }
                setIsSynced(true);
                setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            } catch (err) {
                console.error('Sync error:', err);
                setIsSynced(false);
            }
        };

        const loadEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from('agenda_events')
                    .select('*')
                    .order('start_date', { ascending: true });

                if (error) {
                    console.warn('Supabase error:', error.message);
                    const local = loadFromLocalStorageInner();
                    setEvents(local);
                    setIsSynced(false);
                } else if (data && data.length > 0) {
                    const mapped = data.map(mapAgendaEventFromDb);
                    setEvents(mapped);
                    localStorage.setItem('agenda_events_2026_v2', JSON.stringify(mapped));
                    setIsSynced(true);
                    setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                } else {
                    const local = loadFromLocalStorageInner();
                    setEvents(local);
                    if (local.length > 0) {
                        await syncLocalToSupabaseInner(local);
                    }
                    setIsSynced(true);
                }

                // Temporary Seed: Add EPJE Trip if missing (User Request)
                const epjeId = 'epje-cascavel-2026';
                const { data: existing } = await supabase.from('agenda_events').select('id').eq('id', epjeId).single();

                if (!existing) {
                    console.log('Seeding EPJE Trip...');
                    const epjeEvent: AgendaEvent = {
                        id: epjeId,
                        title: 'Viagem EPJE Cascavel',
                        description: 'Viagem com 10 amigos e colegas. Meta: R$ 3.000.',
                        startDate: '2026-03-13',
                        endDate: '2026-03-15',
                        time: '08:00',
                        type: 'EVENT',
                        completed: false
                    };

                    // Insert into DB
                    await supabase.from('agenda_events').upsert(mapAgendaEventToDb(epjeEvent));

                    // Update Local State
                    setEvents(prev => {
                        const exists = prev.find(e => e.id === epjeId);
                        if (exists) return prev;
                        const newEvents = [...prev, epjeEvent];
                        localStorage.setItem('agenda_events_2026_v2', JSON.stringify(newEvents));
                        return newEvents;
                    });
                }
            } catch (err) {
                console.error('Error loading:', err);
                const local = loadFromLocalStorageInner();
                setEvents(local);
                setIsSynced(false);
            }
        };

        loadEvents();
    }, []);

    // mapFromDb and mapToDb are defined outside the component

    // Save to both localStorage and Supabase
    const saveEvent = async (event: AgendaEvent, isNew: boolean = true) => {
        const newEvents = isNew ? [...events, event] : events.map(e => e.id === event.id ? event : e);
        setEvents(newEvents);
        localStorage.setItem('agenda_events_2026_v2', JSON.stringify(newEvents));

        try {
            const { error } = await supabase.from('agenda_events').upsert(mapAgendaEventToDb(event), { onConflict: 'id' });
            if (error) throw error;
            setIsSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
            console.error('Save to Supabase failed:', err);
            setIsSynced(false);
        }
    };

    const removeEvent = async (id: string) => {
        const newEvents = events.filter(e => e.id !== id);
        setEvents(newEvents);
        localStorage.setItem('agenda_events_2026_v2', JSON.stringify(newEvents));

        try {
            const { error } = await supabase.from('agenda_events').delete().eq('id', id);
            if (error) throw error;
            setIsSynced(true);
        } catch (err) {
            console.error('Delete from Supabase failed:', err);
            setIsSynced(false);
        }
    };

    // Calendar generation
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

        const prevMonth = new Date(year, month, 0);
        for (let i = startOffset - 1; i >= 0; i--) {
            const d = prevMonth.getDate() - i;
            const m = month === 0 ? 12 : month;
            const y = month === 0 ? year - 1 : year;
            days.push({ day: d, isCurrentMonth: false, dateStr: `${y} -${String(m).padStart(2, '0')} -${String(d).padStart(2, '0')} ` });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, dateStr: `${year} -${String(month + 1).padStart(2, '0')} -${String(i).padStart(2, '0')} ` });
        }

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const m = month + 2 > 12 ? 1 : month + 2;
            const y = month + 2 > 12 ? year + 1 : year;
            days.push({ day: i, isCurrentMonth: false, dateStr: `${y} -${String(m).padStart(2, '0')} -${String(i).padStart(2, '0')} ` });
        }

        return days;
    }, [currentDate]);

    // Check if event spans a date
    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => {
            const start = e.startDate;
            const end = e.endDate || e.startDate;
            return dateStr >= start && dateStr <= end;
        });
    };

    // Check if date is in drag selection
    const isInDragSelection = (dateStr: string) => {
        if (!dragStart) return false;
        const end = dragEnd || dragStart;
        const [startStr, endStr] = dragStart <= end ? [dragStart, end] : [end, dragStart];
        return dateStr >= startStr && dateStr <= endStr;
    };

    const isToday = (dateStr: string) => {
        const today = new Date();
        const todayStr = `${today.getFullYear()} -${String(today.getMonth() + 1).padStart(2, '0')} -${String(today.getDate()).padStart(2, '0')} `;
        return dateStr === todayStr;
    };

    const goToPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Drag handlers
    const handleMouseDown = (dateStr: string) => {
        setIsDragging(true);
        setDragStart(dateStr);
        setDragEnd(dateStr);
    };

    const handleMouseEnter = (dateStr: string) => {
        if (isDragging) {
            setDragEnd(dateStr);
        }
    };

    const handleMouseUp = () => {
        if (isDragging && dragStart) {
            const end = dragEnd || dragStart;
            const [startStr, endStr] = dragStart <= end ? [dragStart, end] : [end, dragStart];
            handleAddEvent(startStr, endStr);
        }
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
    };

    const handleAddEvent = (startDate?: string, endDate?: string) => {
        setEditingEventId(null);
        setFormTitle('');
        setFormDesc('');
        setFormStartDate(startDate || '');
        setFormEndDate(endDate || startDate || '');
        setFormStartTime('');
        setFormEndTime('');
        // setFormType('EVENT');
        setShowAddModal(true);
    };

    const handleEditEvent = (event: AgendaEvent) => {
        setEditingEventId(event.id);
        setFormTitle(event.title);
        setFormDesc(event.description || '');
        setFormStartDate(event.startDate);
        setFormEndDate(event.endDate || event.startDate);

        if (event.time) {
            const parts = event.time.split('-');
            setFormStartTime(parts[0]?.trim() || '');
            setFormEndTime(parts[1]?.trim() || '');
        } else {
            setFormStartTime('');
            setFormEndTime('');
        }
        setShowAddModal(true);
    };

    const handleSaveEvent = async () => {
        if (!formTitle || !formStartDate) return;

        // Time logic
        let finalTimeStr = '';
        if (formStartTime) {
            if (!formEndTime) {
                // Default 1h duration
                const [h, m] = formStartTime.split(':').map(Number);
                const endH = (h + 1) % 24;
                const endMStr = String(m).padStart(2, '0');
                const endHStr = String(endH).padStart(2, '0');
                finalTimeStr = `${formStartTime} - ${endHStr}:${endMStr} `;
            } else {
                finalTimeStr = `${formStartTime} - ${formEndTime} `;
            }
        }

        if (editingEventId) {
            // Update existing
            const { error } = await supabase
                .from('agenda_events')
                .update({
                    title: formTitle,
                    description: formDesc,
                    start_date: formStartDate,
                    end_date: formEndDate || formStartDate,
                    time: finalTimeStr,
                })
                .eq('id', editingEventId);

            if (error) {
                console.error('Error updating event:', error);
                return;
            }

            setEvents(prev => prev.map(ev => ev.id === editingEventId ? {
                ...ev,
                title: formTitle,
                description: formDesc,
                startDate: formStartDate,
                endDate: formEndDate || formStartDate,
                time: finalTimeStr
            } : ev));
        } else {
            // Create new
            const newEvent: AgendaEvent = {
                id: Date.now().toString(),
                title: formTitle,
                description: formDesc,
                startDate: formStartDate,
                endDate: formEndDate || formStartDate,
                time: finalTimeStr,
                type: 'EVENT', // Hardcoded
                completed: false,
            };

            const { data, error } = await supabase
                .from('agenda_events')
                .insert({
                    id: newEvent.id, // Explicit ID for local sync
                    user_id: user.id,
                    title: newEvent.title,
                    description: newEvent.description,
                    start_date: newEvent.startDate,
                    end_date: newEvent.endDate,
                    time: newEvent.time,
                    type: newEvent.type,
                    completed: newEvent.completed
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving event:', error);
                // Fallback local...
            }

            setEvents(prev => [...prev, newEvent]);
        }
        setShowAddModal(false);
    };

    const toggleComplete = async (id: string) => {
        const event = events.find(e => e.id === id);
        if (event) {
            const updated = { ...event, completed: !event.completed };
            await saveEvent(updated, false);
        }
    };

    // AI Analysis
    const aiAnalysis = useMemo(() => {
        const monthStart = `${currentDate.getFullYear()} -${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
        const monthEnd = `${currentDate.getFullYear()} -${String(currentDate.getMonth() + 1).padStart(2, '0')} -31`;

        const monthEvents = events.filter(e => e.startDate >= monthStart && e.startDate <= monthEnd);

        const countByType = {
            MEETING: monthEvents.filter(e => e.type === 'MEETING').length,
            TASK: monthEvents.filter(e => e.type === 'TASK').length,
            REMINDER: monthEvents.filter(e => e.type === 'REMINDER').length,
            EVENT: monthEvents.filter(e => e.type === 'EVENT').length,
        };

        // Days with events count
        const eventsByDay: Record<string, number> = {};
        monthEvents.forEach(e => {
            const days = getDaysBetween(e.startDate, e.endDate);
            days.forEach(d => {
                eventsByDay[d] = (eventsByDay[d] || 0) + 1;
            });
        });

        const overloadedDays = Object.entries(eventsByDay).filter(([_, count]) => count >= 3).map(([day]) => day);
        const busiestDay = Object.entries(eventsByDay).sort((a, b) => b[1] - a[1])[0];

        const totalEvents = monthEvents.length;
        const completedEvents = monthEvents.filter(e => e.completed).length;
        const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

        // Check for consecutive busy days
        const sortedBusyDays = overloadedDays.sort();
        let consecutiveBusy = 0;
        for (let i = 1; i < sortedBusyDays.length; i++) {
            const prev = new Date(sortedBusyDays[i - 1]);
            const curr = new Date(sortedBusyDays[i]);
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) consecutiveBusy++;
        }

        const recommendations: string[] = [];

        if (overloadedDays.length > 0) {
            recommendations.push(`⚠️ Você tem ${overloadedDays.length} dia(s) com 3 + eventos.Considere redistribuir.`);
        }
        if (countByType.MEETING > countByType.TASK * 2) {
            recommendations.push(`📊 Muitas reuniões em relação a tarefas.Reserve tempo para execução.`);
        }
        if (consecutiveBusy >= 3) {
            recommendations.push(`🔥 ${consecutiveBusy + 1} dias consecutivos sobrecarregados.Planeje pausas.`);
        }
        if (totalEvents === 0) {
            recommendations.push(`📅 Nenhum evento este mês.Comece a planejar!`);
        }
        if (completionRate < 50 && completedEvents > 0) {
            recommendations.push(`✅ Taxa de conclusão em ${completionRate}%.Foque em finalizar pendências.`);
        }
        if (totalEvents > 20) {
            recommendations.push(`📈 Mês intenso com ${totalEvents} eventos.Priorize o essencial.`);
        }

        return {
            totalEvents,
            completedEvents,
            completionRate,
            countByType,
            overloadedDays,
            busiestDay: busiestDay ? { day: busiestDay[0], count: busiestDay[1] } : null,
            recommendations: recommendations.length > 0 ? recommendations : ['✨ Agenda equilibrada! Continue assim.'],
        };
    }, [events, currentDate]);



    return (
        <div
            className="min-h-screen bg-[#020202] py-8 px-4 md:px-8"
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { if (isDragging) handleMouseUp(); }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-wider">Retornar ao Dashboard</span>
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Agenda 2026</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-text-muted">Arraste nos dias para eventos de múltiplos dias</p>
                                <div className={`flex items - center gap - 1.5 px - 2 py - 0.5 rounded - full text - xs ${isSynced === null ? 'bg-gray-500/20 text-gray-400' :
                                    isSynced ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                    } `}>
                                    {isSynced === null ? (
                                        <><span className="animate-pulse">●</span> Carregando...</>
                                    ) : isSynced ? (
                                        <><Cloud className="w-3 h-3" /> Sincronizado {lastSyncTime && `às ${lastSyncTime} `}</>
                                    ) : (
                                        <><CloudOff className="w-3 h-3" /> Offline (salvando localmente)</>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAIPanel(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all font-medium"
                        >
                            <Sparkles className="w-5 h-5" />
                            Análise IA
                        </button>
                        <button
                            onClick={() => handleAddEvent()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Evento
                        </button>
                    </div>
                </div>

                {/* Calendar Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm text-text-muted hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                        Hoje
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden select-none">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const dayEvents = getEventsForDate(day.dateStr);
                            const inSelection = isInDragSelection(day.dateStr);

                            return (
                                <div
                                    key={idx}
                                    onMouseDown={() => handleMouseDown(day.dateStr)}
                                    onMouseEnter={() => handleMouseEnter(day.dateStr)}
                                    className={`min - h - [100px] p - 2 border - b border - r border - white / 5 cursor - pointer transition - colors ${!day.isCurrentMonth ? 'opacity-30' : ''
                                        } ${inSelection ? 'bg-orange-500/20 border-orange-500/40' : 'hover:bg-white/[0.02]'} `}
                                >
                                    <div className={`w - 7 h - 7 flex items - center justify - center text - sm mb - 1 rounded - full ${isToday(day.dateStr) ? 'bg-orange-500 text-white font-bold' : 'text-text-secondary'
                                        } `}>
                                        {day.day}
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map(event => {
                                            const isMultiDay = event.startDate !== event.endDate;
                                            const isStart = event.startDate === day.dateStr;
                                            const isEnd = event.endDate === day.dateStr;

                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditEvent(event);
                                                    }}
                                                    className={`text - [11px] px - 2 py - 0.5 truncate ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} ${isMultiDay
                                                        ? `${isStart ? 'rounded-l' : 'rounded-none -ml-2'} ${isEnd ? 'rounded-r' : 'rounded-none -mr-2'}`
                                                        : 'rounded'
                                                        } flex justify - between items - center gap - 2 cursor - pointer hover: brightness - 110 transition - all border border - transparent hover: border - white / 20`}
                                                >
                                                    <span className="truncate flex-1 font-semibold tracking-tight">{(isStart || !isMultiDay) && event.title}</span>
                                                    {(isStart || !isMultiDay) && event.time && (
                                                        <span className="text-[10px] opacity-100 font-bold font-mono whitespace-nowrap bg-black/20 px-1 rounded-sm">
                                                            {event.time.split('-')[0].trim()}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] text-text-muted px-1.5">+{dayEvents.length - 3} mais</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Events List */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Próximos Eventos</h3>
                    <div className="space-y-2">
                        {/* Filter next events (ONLY THIS WEEK) */}
                        {events
                            .filter(e => {
                                const eventDate = new Date(e.startDate);
                                const now = new Date();
                                // Reset hours to compare dates only
                                now.setHours(0, 0, 0, 0);

                                // Calculate end of week (Saturday)
                                const endOfWeek = new Date(now);
                                endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Saturday is 6

                                return eventDate >= now && eventDate <= endOfWeek && !e.completed;
                            })
                            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                            .slice(0, 5)
                            .map(event => (
                                <div key={event.id} className={`flex items - center gap - 4 p - 4 bg - [#0A0A0A] border border - white / 10 rounded - lg group ${event.completed ? 'opacity-50' : ''} `}>
                                    <button onClick={() => toggleComplete(event.id)} className={`transition - colors ${event.completed ? 'text-green-500' : 'text-text-muted hover:text-white'} `}>
                                        {event.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text - xs px - 2 py - 0.5 rounded - full ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} `}>
                                                {TYPE_LABELS[event.type]}
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                {event.startDate.split('-').reverse().join('/')}
                                                {event.endDate !== event.startDate && ` - ${event.endDate.split('-').reverse().join('/')} `}
                                                {event.time && ` às ${event.time} `}
                                            </span>
                                        </div>
                                        <h4 className={`font - medium mt - 1 ${event.completed ? 'line-through text-text-muted' : 'text-white'} `}>
                                            {event.title}
                                        </h4>
                                        {event.description && <p className="text-sm text-text-muted mt-0.5">{event.description}</p>}
                                    </div>

                                    <button onClick={() => removeEvent(event.id)} className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-500 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        {events.length === 0 && (
                            <div className="text-center py-12 text-text-muted">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum evento cadastrado</p>
                                <p className="text-sm mt-1">Clique e arraste nos dias para criar eventos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Event Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm w-screen h-screen top-0 left-0">
                        <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6">
                                {editingEventId ? 'Editar Evento' : (formStartDate !== formEndDate ? 'Novo Evento (Múltiplos Dias)' : 'Novo Evento')}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-text-muted mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Reunião de Planejamento"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Data Início</label>
                                        <input
                                            type="date"
                                            value={formStartDate}
                                            onChange={(e) => setFormStartDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Data Fim</label>
                                        <input
                                            type="date"
                                            value={formEndDate}
                                            onChange={(e) => setFormEndDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Início</label>
                                        <input
                                            type="time"
                                            value={formStartTime}
                                            onChange={(e) => setFormStartTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Fim (Opcional)</label>
                                        <input
                                            type="time"
                                            value={formEndTime}
                                            onChange={(e) => setFormEndTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                            placeholder="Auto 1h"
                                        />
                                    </div>
                                </div>

                                {/* Type selector removed - always EVENT */}

                                <div>
                                    <label className="block text-xs uppercase text-text-muted mb-1">Descrição</label>
                                    <textarea
                                        value={formDesc}
                                        onChange={(e) => setFormDesc(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors h-20 resize-none"
                                        placeholder="Detalhes do evento..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveEvent} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors">
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Analysis Panel */}
                {showAIPanel && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Análise de IA</h2>
                                        <p className="text-xs text-text-muted">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAIPanel(false)} className="p-2 text-text-muted hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-text-muted mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs uppercase">Total de Eventos</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{aiAnalysis.totalEvents}</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-text-muted mb-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xs uppercase">Concluídos</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-400">{aiAnalysis.completionRate}%</div>
                                </div>
                            </div>

                            {/* Events by Type */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                    <ListTodo className="w-4 h-4" />
                                    Eventos por Tipo
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(aiAnalysis.countByType).map(([type, count]) => (
                                        <div key={type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w - 3 h - 3 rounded - full ${EVENT_COLORS[type].solid} `} />
                                                <span className="text-sm text-text-secondary">{TYPE_LABELS[type]}</span>
                                            </div>
                                            <span className="text-sm font-medium text-white">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Busiest Day */}
                            {aiAnalysis.busiestDay && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm font-medium text-orange-400">Dia Mais Ocupado</span>
                                    </div>
                                    <p className="text-white">
                                        {aiAnalysis.busiestDay.day.split('-').reverse().join('/')} com {aiAnalysis.busiestDay.count} evento(s)
                                    </p>
                                </div>
                            )}

                            {/* Overloaded Days Warning */}
                            {aiAnalysis.overloadedDays.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                        <span className="text-sm font-medium text-red-400">Dias Sobrecarregados</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">
                                        {aiAnalysis.overloadedDays.length} dia(s) com 3+ eventos:
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {aiAnalysis.overloadedDays.slice(0, 5).map(day => (
                                            <span key={day} className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                                                {day.split('-')[2]}/{day.split('-')[1]}
                                            </span>
                                        ))}
                                        {aiAnalysis.overloadedDays.length > 5 && (
                                            <span className="text-xs text-text-muted">+{aiAnalysis.overloadedDays.length - 5} mais</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Recomendações
                                </h3>
                                <ul className="space-y-2">
                                    {aiAnalysis.recommendations.map((rec, idx) => (
                                        <li key={idx} className="text-sm text-text-secondary">{rec}</li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => setShowAIPanel(false)}
                                className="w-full mt-6 px-4 py-2.5 rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
