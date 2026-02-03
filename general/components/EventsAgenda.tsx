import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { EventItem } from '../types';

interface EventsAgendaProps {
    onBack: () => void;
}

type ViewMode = 'month' | 'week' | 'day';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    MEETING: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    TASK: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    REMINDER: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    EVENT: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
};

export const EventsAgenda: React.FC<EventsAgendaProps> = ({ onBack }) => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

    // Form state
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventEndTime, setNewEventEndTime] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');
    const [newEventType, setNewEventType] = useState<'MEETING' | 'TASK' | 'REMINDER' | 'EVENT'>('EVENT');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                console.error('Error fetching events:', error);
            } else {
                setEvents(data || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calendar grid generation
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // Next month days to fill grid
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [currentDate]);

    // Get events for a specific day
    const getEventsForDay = (date: Date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear()
            );
        });
    };

    // Navigation
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Open add modal with pre-filled date
    const openAddModal = (date?: Date) => {
        if (date) {
            const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            setNewEventDate(formatted);
        } else {
            setNewEventDate('');
        }
        setNewEventTitle('');
        setNewEventTime('');
        setNewEventEndTime('');
        setNewEventDesc('');
        setNewEventType('EVENT');
        setSelectedEvent(null);
        setShowAddModal(true);
    };

    // Open event details
    const openEventDetails = (event: EventItem) => {
        setSelectedEvent(event);
        const eventDate = new Date(event.date);
        setNewEventTitle(event.title);
        setNewEventDate(`${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`);
        setNewEventTime(`${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`);
        setNewEventEndTime('');
        setNewEventDesc(event.description || '');
        setNewEventType(event.type);
        setShowAddModal(true);
    };

    // Save event
    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();

        const timestamp = new Date(`${newEventDate}T${newEventTime || '00:00'}:00`).toISOString();

        if (selectedEvent) {
            // Update existing
            const { error } = await supabase
                .from('events')
                .update({
                    title: newEventTitle,
                    description: newEventDesc,
                    date: timestamp,
                    type: newEventType,
                })
                .eq('id', selectedEvent.id);

            if (!error) {
                setEvents(events.map((ev) =>
                    ev.id === selectedEvent.id
                        ? { ...ev, title: newEventTitle, description: newEventDesc, date: timestamp, type: newEventType }
                        : ev
                ));
            }
        } else {
            // Create new
            const newEvent = {
                title: newEventTitle,
                description: newEventDesc,
                date: timestamp,
                type: newEventType,
                completed: false,
            };

            const { data, error } = await supabase
                .from('events')
                .insert([newEvent])
                .select()
                .single();

            if (!error && data) {
                setEvents([...events, data]);
            }
        }

        setShowAddModal(false);
    };

    // Delete event
    const deleteEvent = async (id: string) => {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (!error) {
            setEvents(events.filter((ev) => ev.id !== id));
            setShowAddModal(false);
        }
    };

    // Toggle complete
    const toggleComplete = async (event: EventItem) => {
        const { error } = await supabase
            .from('events')
            .update({ completed: !event.completed })
            .eq('id', event.id);

        if (!error) {
            setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, completed: !ev.completed } : ev)));
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    return (
        <div className="fixed top-0 right-0 bottom-0 left-72 z-[100] bg-[#0A0A0A] overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0A0A]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            Hoje
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={goToPrevMonth}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={goToNextMonth}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <h1 className="text-xl font-semibold text-white">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                        {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === mode
                                    ? 'bg-orange-500 text-white'
                                    : 'text-text-muted hover:text-white'
                                    }`}
                            >
                                {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => openAddModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Evento
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Mini Calendar Sidebar */}
                <div className="w-64 border-r border-white/10 p-4 flex-shrink-0 overflow-y-auto">
                    <MiniCalendar
                        currentDate={currentDate}
                        onDateSelect={(date) => {
                            setCurrentDate(date);
                        }}
                        events={events}
                    />

                    {/* Upcoming Events */}
                    <div className="mt-6">
                        <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-medium">
                            Próximos Eventos
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {events
                                .filter((e) => new Date(e.date) >= new Date())
                                .slice(0, 5)
                                .map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => openEventDetails(event)}
                                        className={`p-2 rounded-lg cursor-pointer transition-all border ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].border} hover:scale-[1.02]`}
                                    >
                                        <p className={`text-sm font-medium truncate ${EVENT_COLORS[event.type].text}`}>
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                ))}
                            {events.filter((e) => new Date(e.date) >= new Date()).length === 0 && (
                                <p className="text-xs text-text-muted/50 italic">Nenhum evento futuro</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {viewMode === 'month' && (
                        <MonthView
                            days={calendarDays}
                            events={events}
                            getEventsForDay={getEventsForDay}
                            isToday={isToday}
                            onDayClick={openAddModal}
                            onEventClick={openEventDetails}
                        />
                    )}
                    {viewMode === 'week' && (
                        <WeekView
                            currentDate={currentDate}
                            events={events}
                            onTimeSlotClick={openAddModal}
                            onEventClick={openEventDetails}
                        />
                    )}
                    {viewMode === 'day' && (
                        <DayView
                            currentDate={currentDate}
                            events={events}
                            onTimeSlotClick={openAddModal}
                            onEventClick={openEventDetails}
                        />
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 py-2 text-xl text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-text-muted"
                                    placeholder="Adicionar título"
                                    required
                                />
                            </div>

                            {/* Type Selector */}
                            <div className="flex gap-2 flex-wrap">
                                {(['EVENT', 'MEETING', 'TASK', 'REMINDER'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewEventType(type)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${newEventType === type
                                            ? `${EVENT_COLORS[type].bg} ${EVENT_COLORS[type].text} ${EVENT_COLORS[type].border}`
                                            : 'border-white/10 text-text-muted hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        {type === 'MEETING' ? 'Reunião' : type === 'TASK' ? 'Tarefa' : type === 'REMINDER' ? 'Lembrete' : 'Evento'}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                                    <CalendarIcon className="w-4 h-4 text-text-muted" />
                                    <input
                                        type="date"
                                        value={newEventDate}
                                        onChange={(e) => setNewEventDate(e.target.value)}
                                        className="bg-transparent text-white text-sm focus:outline-none flex-1 scheme-dark"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                                    <Clock className="w-4 h-4 text-text-muted" />
                                    <input
                                        type="time"
                                        value={newEventTime}
                                        onChange={(e) => setNewEventTime(e.target.value)}
                                        className="bg-transparent text-white text-sm focus:outline-none flex-1 scheme-dark"
                                    />
                                </div>
                            </div>

                            <div>
                                <textarea
                                    value={newEventDesc}
                                    onChange={(e) => setNewEventDesc(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors h-20 resize-none"
                                    placeholder="Adicionar descrição..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                {selectedEvent && (
                                    <button
                                        type="button"
                                        onClick={() => deleteEvent(selectedEvent.id)}
                                        className="px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir
                                    </button>
                                )}
                                <div className="flex-1" />
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-lg text-text-secondary hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== MINI CALENDAR ====================
interface MiniCalendarProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    events: EventItem[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ currentDate, onDateSelect, events }) => {
    const [miniDate, setMiniDate] = useState(new Date());

    const miniDays = useMemo(() => {
        const year = miniDate.getFullYear();
        const month = miniDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: (Date | null)[] = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [miniDate]);

    const hasEvents = (date: Date) => {
        return events.some((e) => {
            const ed = new Date(e.date);
            return ed.getDate() === date.getDate() && ed.getMonth() === date.getMonth() && ed.getFullYear() === date.getFullYear();
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        return date.getDate() === currentDate.getDate() && date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">
                    {MONTHS[miniDate.getMonth()]} {miniDate.getFullYear()}
                </h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1))}
                        className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1))}
                        className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="text-[10px] text-text-muted py-1">
                        {d.charAt(0)}
                    </div>
                ))}
                {miniDays.map((day, i) => (
                    <button
                        key={i}
                        onClick={() => day && onDateSelect(day)}
                        disabled={!day}
                        className={`aspect-square text-xs rounded-full flex items-center justify-center transition-all relative ${day
                            ? isSelected(day)
                                ? 'bg-orange-500 text-white'
                                : isToday(day)
                                    ? 'text-orange-500 font-bold'
                                    : 'text-text-secondary hover:bg-white/5'
                            : ''
                            }`}
                    >
                        {day?.getDate()}
                        {day && hasEvents(day) && !isSelected(day) && (
                            <span className="absolute bottom-0.5 w-1 h-1 bg-orange-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ==================== MONTH VIEW ====================
interface MonthViewProps {
    days: { date: Date; isCurrentMonth: boolean }[];
    events: EventItem[];
    getEventsForDay: (date: Date) => EventItem[];
    isToday: (date: Date) => boolean;
    onDayClick: (date: Date) => void;
    onEventClick: (event: EventItem) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ days, getEventsForDay, isToday, onDayClick, onEventClick }) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-white/10">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                {days.map(({ date, isCurrentMonth }, i) => {
                    const dayEvents = getEventsForDay(date);
                    const displayEvents = dayEvents.slice(0, 3);
                    const moreCount = dayEvents.length - 3;

                    return (
                        <div
                            key={i}
                            onClick={() => onDayClick(date)}
                            className={`border-b border-r border-white/5 p-1 cursor-pointer transition-colors hover:bg-white/[0.02] min-h-0 overflow-hidden flex flex-col ${isCurrentMonth ? '' : 'opacity-40'
                                }`}
                        >
                            <div
                                className={`w-7 h-7 flex items-center justify-center text-sm mb-1 rounded-full ${isToday(date)
                                    ? 'bg-orange-500 text-white font-bold'
                                    : 'text-text-secondary'
                                    }`}
                            >
                                {date.getDate()}
                            </div>

                            <div className="flex-1 space-y-0.5 overflow-hidden">
                                {displayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className={`text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-all hover:scale-[1.02] ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {moreCount > 0 && (
                                    <div className="text-[10px] text-text-muted px-1.5">
                                        +{moreCount} mais
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ==================== WEEK VIEW ====================
interface WeekViewProps {
    currentDate: Date;
    events: EventItem[];
    onTimeSlotClick: (date: Date) => void;
    onEventClick: (event: EventItem) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onTimeSlotClick, onEventClick }) => {
    const weekDays = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDayAndHour = (day: Date, hour: number) => {
        return events.filter((e) => {
            const ed = new Date(e.date);
            return (
                ed.getDate() === day.getDate() &&
                ed.getMonth() === day.getMonth() &&
                ed.getFullYear() === day.getFullYear() &&
                ed.getHours() === hour
            );
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/10">
                <div className="py-3" />
                {weekDays.map((day, i) => (
                    <div key={i} className="py-2 text-center border-l border-white/5">
                        <div className="text-xs text-text-muted">{WEEKDAYS[day.getDay()]}</div>
                        <div
                            className={`text-lg font-semibold ${isToday(day) ? 'w-8 h-8 mx-auto rounded-full bg-orange-500 text-white flex items-center justify-center' : 'text-white'
                                }`}
                        >
                            {day.getDate()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                    {hours.map((hour) => (
                        <React.Fragment key={hour}>
                            <div className="h-12 pr-2 text-right text-xs text-text-muted flex items-start justify-end pt-0.5">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            {weekDays.map((day, di) => {
                                const hourEvents = getEventsForDayAndHour(day, hour);
                                return (
                                    <div
                                        key={di}
                                        onClick={() => {
                                            const clickedDate = new Date(day);
                                            clickedDate.setHours(hour);
                                            onTimeSlotClick(clickedDate);
                                        }}
                                        className="h-12 border-l border-b border-white/5 relative hover:bg-white/[0.02] cursor-pointer"
                                    >
                                        {hourEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(event);
                                                }}
                                                className={`absolute inset-x-0.5 top-0.5 text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ==================== DAY VIEW ====================
interface DayViewProps {
    currentDate: Date;
    events: EventItem[];
    onTimeSlotClick: (date: Date) => void;
    onEventClick: (event: EventItem) => void;
}

const DayView: React.FC<DayViewProps> = ({ currentDate, events, onTimeSlotClick, onEventClick }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForHour = (hour: number) => {
        return events.filter((e) => {
            const ed = new Date(e.date);
            return (
                ed.getDate() === currentDate.getDate() &&
                ed.getMonth() === currentDate.getMonth() &&
                ed.getFullYear() === currentDate.getFullYear() &&
                ed.getHours() === hour
            );
        });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="py-4 px-6 border-b border-white/10 text-center">
                <div className="text-sm text-text-muted">{WEEKDAYS[currentDate.getDay()]}</div>
                <div className="text-4xl font-bold text-orange-500">{currentDate.getDate()}</div>
                <div className="text-sm text-text-secondary">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
            </div>

            {/* Time Slots */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[80px_1fr]">
                    {hours.map((hour) => {
                        const hourEvents = getEventsForHour(hour);
                        return (
                            <React.Fragment key={hour}>
                                <div className="h-16 pr-3 text-right text-sm text-text-muted flex items-start justify-end pt-1">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                                <div
                                    onClick={() => {
                                        const clickedDate = new Date(currentDate);
                                        clickedDate.setHours(hour);
                                        onTimeSlotClick(clickedDate);
                                    }}
                                    className="h-16 border-l border-b border-white/10 relative hover:bg-white/[0.02] cursor-pointer"
                                >
                                    {hourEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
                                            }}
                                            className={`absolute inset-x-2 top-1 text-sm px-3 py-2 rounded-lg cursor-pointer border ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} ${EVENT_COLORS[event.type].border}`}
                                        >
                                            <div className="font-medium">{event.title}</div>
                                            {event.description && (
                                                <div className="text-xs opacity-70 truncate">{event.description}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
