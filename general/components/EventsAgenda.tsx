import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, AlignLeft, X, Trash2, CheckCircle2, Circle, MoreVertical, Search, Settings, HelpCircle, Menu, Repeat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RotatingImage } from './RotatingImage';
import { supabase } from '../lib/supabaseClient';

interface EventsAgendaProps {
    onBack: () => void;
}

interface AgendaEvent {
    id: string;
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    startTime?: string; // HH:MM
    endTime?: string;   // HH:MM
    type: 'MEETING' | 'TASK' | 'REMINDER' | 'EVENT';
    completed: boolean;
    color?: string;
    recurrence?: 'WEEKLY' | 'NONE';
}

type ViewType = 'MONTH' | 'WEEK' | 'DAY';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Colors for events
const EVENT_COLORS = {
    MEETING: { bg: 'bg-[#1E1E1E]', text: 'text-white', border: 'border-blue-500' },
    TASK: { bg: 'bg-[#1E1E1E]', text: 'text-white', border: 'border-emerald-500' },
    REMINDER: { bg: 'bg-[#1E1E1E]', text: 'text-white', border: 'border-amber-500' },
    EVENT: { bg: 'bg-[#1E1E1E]', text: 'text-white', border: 'border-cyan-500' },
};

export const EventsAgenda: React.FC<EventsAgendaProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('MONTH');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formStartTime, setFormStartTime] = useState('');
    const [formEndTime, setFormEndTime] = useState('');
    const [formType, setFormType] = useState<AgendaEvent['type']>('EVENT');
    const [formRecurrence, setFormRecurrence] = useState<'WEEKLY' | 'NONE'>('NONE');

    // Data Loading & Legacy Recovery
    useEffect(() => {
        const loadEvents = async () => {
            // 1. Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('agenda_events')
                    .select('*')
                    .eq('user_id', user?.id);

                if (data && data.length > 0 && !error) {
                    const mapped = data.map((e: any) => ({
                        id: e.id,
                        title: e.title,
                        description: e.description || '',
                        startDate: e.start_date,
                        endDate: e.end_date || e.start_date,
                        startTime: e.time ? e.time.split('-')[0]?.trim() : undefined,
                        endTime: e.time ? e.time.split('-')[1]?.trim() : undefined,
                        type: e.type || 'EVENT',
                        completed: e.completed || false,
                        recurrence: e.recurrence || 'NONE'
                    }));
                    setEvents(mapped);
                    // Sync to local
                    localStorage.setItem('agenda_events_2026_v3', JSON.stringify(mapped));
                    return;
                }
            } catch (err) {
                console.error("Supabase load error", err);
            }

            // 2. Fallback to LocalStorage (Newest V3)
            const localV3 = localStorage.getItem('agenda_events_2026_v3');
            if (localV3) {
                setEvents(JSON.parse(localV3));
                return;
            }

            // 3. Fallback to LocalStorage (V2 - Recent)
            const localV2 = localStorage.getItem('agenda_events_2026_v2');
            if (localV2) {
                const parsed = JSON.parse(localV2);
                const mapped = parsed.map((e: any) => ({
                    ...e,
                    startDate: e.startDate || e.date, // normalizing
                    startTime: e.time ? e.time.split('-')[0]?.trim() : undefined,
                    recurrence: 'NONE'
                }));
                setEvents(mapped);
                localStorage.setItem('agenda_events_2026_v3', JSON.stringify(mapped));
                return;
            }

            // 4. Fallback to LocalStorage (Legacy/Original)
            const localOld = localStorage.getItem('agenda_events_2026');
            if (localOld) {
                const parsed = JSON.parse(localOld);
                // Map old format to new
                const mapped = parsed.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    description: e.description || '',
                    startDate: e.date || e.startDate || new Date().toISOString().split('T')[0],
                    endDate: e.date || e.endDate || e.startDate,
                    startTime: e.time || '00:00',
                    type: 'EVENT',
                    completed: false,
                    recurrence: 'NONE'
                }));
                setEvents(mapped);
                localStorage.setItem('agenda_events_2026_v3', JSON.stringify(mapped));
            }
        };

        loadEvents();
    }, [user]);

    // Save functions
    const persistEvent = async (event: AgendaEvent, isDelete = false) => {
        // Local Update
        let newEvents = [...events];
        if (isDelete) {
            newEvents = newEvents.filter(e => e.id !== event.id);
        } else {
            const exists = newEvents.find(e => e.id === event.id);
            if (exists) {
                newEvents = newEvents.map(e => e.id === event.id ? event : e);
            } else {
                newEvents.push(event);
            }
        }
        setEvents(newEvents);
        localStorage.setItem('agenda_events_2026_v3', JSON.stringify(newEvents));

        // Supabase Update
        try {
            if (isDelete) {
                await supabase.from('agenda_events').delete().eq('id', event.id);
            } else {
                await supabase.from('agenda_events').upsert({
                    id: event.id,
                    user_id: user?.id,
                    title: event.title,
                    description: event.description,
                    start_date: event.startDate,
                    end_date: event.endDate,
                    time: event.startTime ? `${event.startTime} - ${event.endTime || ''}` : null,
                    type: event.type,
                    completed: event.completed,
                    recurrence: event.recurrence
                });
            }
        } catch (err) {
            console.error("Persist error", err);
        }
    };

    // Navigation Logic
    const nextPeriod = () => {
        const newDate = new Date(currentDate);
        if (view === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
        else if (view === 'WEEK') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const prevPeriod = () => {
        const newDate = new Date(currentDate);
        if (view === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
        else if (view === 'WEEK') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    // Helper: Dates for Current View
    const viewDates = useMemo(() => {
        const dates: Date[] = [];
        if (view === 'WEEK') {
            const curr = new Date(currentDate);
            const day = curr.getDay(); // 0 (Sun) - 6 (Sat)
            const first = curr.getDate() - day; // First day is the day of the month - the day of the week

            // Generate Sunday to Saturday
            for (let i = 0; i < 7; i++) {
                const next = new Date(curr);
                next.setDate(first + i);
                dates.push(next);
            }
        } else if (view === 'MONTH') {
            // Basic Month Logic (Need full grid for proper month view, but simple array here for headers if needed)
            // For Month View we usually use a different generator logic inside the render
        }
        return dates;
    }, [currentDate, view]);

    // Recurring Event Logic
    const getEventsForDate = (dateStr: string) => {
        const targetDate = new Date(dateStr + 'T00:00:00'); // ensure local time treatment for simple day check
        const targetDay = targetDate.getDay();

        return events.filter(e => {
            // 1. Normal single/multi-day match
            if (e.startDate <= dateStr && e.endDate >= dateStr) return true;

            // 2. Weekly Recurrence
            if (e.recurrence === 'WEEKLY') {
                // Must be after or equal to start date
                if (dateStr >= e.startDate) {
                    // Check day match
                    // Basic safeguard: parse start date day
                    // appending T00:00:00 to ensure we don't get timezone shifted to prev day on parsing
                    const startD = new Date(e.startDate + 'T00:00:00');
                    if (startD.getDay() === targetDay) return true;
                }
            }
            return false;
        });
    };

    // Modal Handlers
    const openNewEventModal = (start?: Date, hour?: number) => {
        const d = start || new Date();
        const dateStr = d.toISOString().split('T')[0];

        // Round to nearest hour if generic open
        const h = hour !== undefined ? hour : new Date().getHours();
        const hStr = String(h).padStart(2, '0');
        const nextHStr = String(h + 1).padStart(2, '0');

        setSelectedEvent(null);
        setFormTitle('');
        setFormDesc('');
        setFormStartDate(dateStr);
        setFormEndDate(dateStr);
        setFormStartTime(`${hStr}:00`);
        setFormEndTime(`${nextHStr}:00`);
        setFormType('EVENT');
        setFormRecurrence('NONE');
        setShowModal(true);
    };

    const openEditModal = (e: React.MouseEvent, event: AgendaEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setFormTitle(event.title);
        setFormDesc(event.description);
        setFormStartDate(event.startDate);
        setFormEndDate(event.endDate);
        setFormStartTime(event.startTime || '');
        setFormEndTime(event.endTime || '');
        setFormType(event.type);
        setFormRecurrence(event.recurrence || 'NONE');
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formTitle) return;

        const newEvent: AgendaEvent = {
            id: selectedEvent ? selectedEvent.id : crypto.randomUUID(),
            title: formTitle,
            description: formDesc,
            startDate: formStartDate,
            endDate: formEndDate,
            startTime: formStartTime,
            endTime: formEndTime,
            type: formType,
            completed: selectedEvent ? selectedEvent.completed : false,
            recurrence: formRecurrence
        };

        persistEvent(newEvent);
        setShowModal(false);
    };

    const handleDelete = () => {
        if (selectedEvent) {
            persistEvent(selectedEvent, true);
            setShowModal(false);
        }
    };

    // Sub-components
    const WeeklyGrid = () => {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-[#121212]">
                {/* Header Row: Days */}
                <div className="flex border-b border-white/10 ml-14">
                    {viewDates.map((date, i) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className="flex-1 py-3 text-center border-l border-white/5">
                                <span className={`text-xs font-semibold uppercase ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                                    {WEEKDAYS[date.getDay()]}
                                </span>
                                <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-xl ${isToday ? 'bg-blue-600 text-white' : 'text-gray-200'}`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Time Grid */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    {/* Time Columns */}
                    <div className="flex min-h-[1440px]"> {/* 24h * 60px/h */}

                        {/* Time Labels */}
                        <div className="w-14 flex-shrink-0 flex flex-col items-end pr-2 text-xs text-gray-500 bg-[#0A0A0A] border-r border-white/10 pt-2 sticky left-0 z-10">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="h-[60px] relative -top-3">
                                    {i === 0 ? '' : `${i}:00`}
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {viewDates.map((date, dayIdx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const dayEvents = getEventsForDate(dateStr);

                            return (
                                <div
                                    key={dayIdx}
                                    className="flex-1 border-l border-white/5 relative group hover:bg-white/[0.01]"
                                    onClick={(e) => {
                                        // Calculate hour clicked
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const y = e.clientY - rect.top + e.currentTarget.scrollTop; // approx
                                        const hour = Math.floor(y / 60);
                                        openNewEventModal(date, hour);
                                    }}
                                >
                                    {/* Horizontal Lines for Hours */}
                                    {Array.from({ length: 24 }).map((_, h) => (
                                        <div key={h} className="absolute w-full h-[1px] bg-white/[0.03]" style={{ top: `${h * 60}px` }} />
                                    ))}

                                    {/* Events */}
                                    {dayEvents.map(event => {
                                        // Calculate position
                                        // Simple logic: if all-day or multi-day, show at top (todo better handling)
                                        // For now, if it has time, position it.

                                        let top = 0;
                                        let height = 58; // default 1h approx

                                        if (event.startTime) {
                                            const [h, m] = event.startTime.split(':').map(Number);
                                            top = (h * 60) + m;

                                            if (event.endTime) {
                                                const [eh, em] = event.endTime.split(':').map(Number);
                                                const endMin = (eh * 60) + em;
                                                height = Math.max(20, endMin - top);
                                            }
                                        }

                                        const bgColor = EVENT_COLORS[event.type].bg;
                                        const borderColor = EVENT_COLORS[event.type].border;

                                        return (
                                            <div
                                                key={event.id}
                                                onClick={(e) => openEditModal(e, event)}
                                                className={`absolute left-0.5 right-1 rounded px-2 py-1 text-sm font-semibold cursor-pointer overflow-hidden border-l-4 ${borderColor} hover:brightness-110 shadow-lg ${bgColor}`}
                                                style={{ top: `${top}px`, height: `${height}px` }}
                                            >
                                                <div className="font-bold truncate">{event.title}</div>
                                                <div className="truncate opacity-80 text-xs">{event.startTime} - {event.endTime}</div>
                                                {event.recurrence === 'WEEKLY' && <Repeat className="w-3 h-3 absolute top-1 right-1 opacity-50" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const MonthGrid = () => {
        // Simple Month View Logic
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay(); // 0-6
        const daysInMonth = lastDay.getDate();

        // Blanks before
        const blanks = Array.from({ length: startDay });

        // Days
        const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="flex-1 bg-[#121212] overflow-y-auto p-4">
                <div className="grid grid-cols-7 gap-1 h-full min-h-[600px]">
                    {WEEKDAYS.map(d => <div key={d} className="text-center text-sm text-gray-500 py-2">{d}</div>)}

                    {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-[#0A0A0A]" />)}

                    {monthDays.map(day => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayEvents = getEventsForDate(dateStr);
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                            <div
                                key={day}
                                className={`min-h-[120px] bg-[#0A0A0A] border border-white/5 p-2 transition hover:bg-white/[0.03] flex flex-col gap-1 ${isToday ? 'bg-blue-900/10 border-blue-500/30' : ''}`}
                                onClick={(e) => {
                                    // Empty space click -> Create Event
                                    // Prevent if clicking on children (handled by stopPropagation there, but just in case)
                                    if (e.target === e.currentTarget) {
                                        openNewEventModal(new Date(year, month, day));
                                    }
                                }}
                            >
                                <div
                                    className={`text-sm font-medium mb-1 cursor-pointer w-fit px-1 rounded hover:bg-white/10 ${isToday ? 'text-blue-400' : 'text-gray-400'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentDate(new Date(year, month, day));
                                        setView('WEEK'); // Drill down
                                    }}
                                >
                                    {day}
                                </div>
                                <div className="space-y-1 flex-1" onClick={() => openNewEventModal(new Date(year, month, day))}>
                                    {dayEvents.slice(0, 5).map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={(e) => openEditModal(e, ev)}
                                            className={`text-sm font-semibold px-2 py-1.5 rounded flex items-center gap-2 shadow-sm ${EVENT_COLORS[ev.type].bg} ${EVENT_COLORS[ev.type].border ? 'border-l-4 ' + EVENT_COLORS[ev.type].border : ''} text-white hover:brightness-110 transition-all cursor-pointer`}
                                        >
                                            {ev.startTime && <span className="font-sans font-bold text-xs opacity-90 leading-none">{ev.startTime}</span>}
                                            <span className="truncate font-bold flex-1 leading-none pt-0.5">{ev.title}</span>
                                            {ev.recurrence === 'WEEKLY' && <Repeat className="w-2 h-2 opacity-70 ml-1" />}
                                        </div>
                                    ))}
                                    {dayEvents.length > 5 && <div className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 5} mais</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <div className={`w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col transition-all duration-300 ${sidebarOpen ? '' : '-ml-64'}`}>
                {/* Header Logo Area */}
                <div className="p-4 flex items-center gap-2 border-b border-white/5">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <span className="font-bold text-lg tracking-tight">Agenda 2026</span>
                </div>

                {/* Create Button */}
                <div className="p-4">
                    <button
                        onClick={() => openNewEventModal()}
                        className="w-full flex items-center justify-center gap-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white py-3 px-4 rounded-full shadow-lg transition-all"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="font-medium">Criar</span>
                    </button>
                </div>

                {/* Mini Calendar (Simplified) */}
                <div className="px-4 py-2">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-300">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    </div>
                    {/* Placeholder for mini-cal visual only for speed */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                        {WEEKDAYS.map(d => <div key={d}>{d[0]}</div>)}
                        {/* Mock grid - just visual rhythm */}
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div key={i} className={`h-6 w-6 flex items-center justify-center rounded-full ${i === 15 ? 'bg-blue-600 text-white' : 'hover:bg-white/10 cursor-pointer'}`}>
                                {Math.max(1, (i - 4) % 31)}
                            </div>
                        ))}
                    </div>

                    {/* Purpose Images Rotation */}
                    <div className="flex-1 flex flex-col justify-end p-4 pb-6">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 text-center">
                            Proposta da Missão
                        </div>
                        <RotatingImage
                            images={[
                                "/propósito/WhatsApp Image 2025-12-28 at 20.41.55.jpg",
                                "/propósito/WhatsApp Image 2025-12-31 at 20.31.01.jpg",
                                "/propósito/WhatsApp Image 2025-12-31 at 20.39.32.jpg"
                            ]}
                            alt="Meu Propósito"
                            className="w-full aspect-[9/16] rounded-xl overflow-hidden shadow-2xl border border-white/5 opacity-80 hover:opacity-100 transition-opacity duration-300"
                            interval={5000}
                            objectFit="cover"
                        />
                    </div>
                </div>

                {/* Minhas Agendas Filter - REMOVED */}
                <div className="p-4 mt-4 opacity-0 pointer-events-none">
                    {/* Removed as per user request */}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-[#0A0A0A]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-full">
                            <Menu className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={goToToday} className="px-3 py-1.5 border border-white/20 rounded hover:bg-white/5 text-sm font-medium">Hoje</button>
                            <div className="flex items-center">
                                <button onClick={prevPeriod} className="p-1.5 hover:bg-white/10 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={nextPeriod} className="p-1.5 hover:bg-white/10 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                            <h2 className="text-xl font-medium ml-2">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-[#1E1E1E] rounded-md p-1 border border-white/10">
                            <button
                                onClick={() => setView('MONTH')}
                                className={`px-3 py-1 rounded text-sm ${view === 'MONTH' ? 'bg-[#2C2C2C] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Mês
                            </button>
                            <button
                                onClick={() => setView('WEEK')}
                                className={`px-3 py-1 rounded text-sm ${view === 'WEEK' ? 'bg-[#2C2C2C] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Semana
                            </button>
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-full"><Search className="w-5 h-5 text-gray-400" /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full"><Settings className="w-5 h-5 text-gray-400" /></button>
                    </div>
                </header>

                {/* View Area */}
                {view === 'WEEK' ? <WeeklyGrid /> : <MonthGrid />}
            </div>

            {/* Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-[#1E1E1E] w-[500px] rounded-xl shadow-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#252525] px-4 py-3 flex justify-between items-center border-b border-white/5">
                            <h3 className="text-lg font-medium text-gray-200">
                                {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {selectedEvent && (
                                    <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition"><Trash2 className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Adicionar título"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className="w-full bg-transparent text-2xl border-b-2 border-transparent focus:border-blue-500 outline-none pb-2 text-white placeholder-gray-500"
                                autoFocus
                            />

                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="p-2 rounded bg-white/5"><AlignLeft className="w-5 h-5" /></div>
                                <div className="flex-1 text-sm bg-white/5 rounded px-3 py-2 text-gray-400">
                                    {formType}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="p-2 rounded bg-white/5"><Clock className="w-5 h-5" /></div>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="date"
                                        value={formStartDate}
                                        onChange={e => setFormStartDate(e.target.value)}
                                        className="bg-white/5 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="time"
                                        value={formStartTime}
                                        onChange={e => setFormStartTime(e.target.value)}
                                        className="bg-white/5 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span>-</span>
                                    <input
                                        type="time"
                                        value={formEndTime}
                                        onChange={e => setFormEndTime(e.target.value)}
                                        className="bg-white/5 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="p-2 rounded bg-white/5"><Repeat className="w-5 h-5" /></div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={formRecurrence === 'WEEKLY'}
                                        onChange={(e) => setFormRecurrence(e.target.checked ? 'WEEKLY' : 'NONE')}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-300">Repetir semanalmente</span>
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-2 rounded bg-white/5 h-fit"><AlignLeft className="w-5 h-5 text-transparent" /></div> {/* Spacer */}
                                <textarea
                                    placeholder="Adicionar descrição"
                                    value={formDesc}
                                    onChange={e => setFormDesc(e.target.value)}
                                    className="w-full bg-white/5 rounded-lg p-3 min-h-[100px] text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 rounded">Cancelar</button>
                                <button onClick={handleSave} className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded shadow-lg">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
