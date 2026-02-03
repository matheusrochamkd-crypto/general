import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle2, Circle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface EventsAgendaProps {
    onBack: () => void;
}

interface AgendaEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'MEETING' | 'TASK' | 'REMINDER' | 'EVENT';
    completed: boolean;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_COLORS: Record<string, { bg: string; text: string }> = {
    MEETING: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    TASK: { bg: 'bg-green-500/20', text: 'text-green-400' },
    REMINDER: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    EVENT: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export const EventsAgenda: React.FC<EventsAgendaProps> = ({ onBack }) => {
    const [events, setEvents] = useState<AgendaEvent[]>(() => {
        const saved = localStorage.getItem('agenda_events_2026');
        return saved ? JSON.parse(saved) : [];
    });

    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formType, setFormType] = useState<'MEETING' | 'TASK' | 'REMINDER' | 'EVENT'>('EVENT');

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('agenda_events_2026', JSON.stringify(events));
    }, [events]);

    // Calendar generation
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        for (let i = startOffset - 1; i >= 0; i--) {
            const d = prevMonth.getDate() - i;
            days.push({
                day: d,
                isCurrentMonth: false,
                dateStr: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }

        // Fill remaining (total 42 cells for 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => e.date === dateStr);
    };

    const isToday = (dateStr: string) => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return dateStr === todayStr;
    };

    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const openAddModal = (dateStr?: string) => {
        setFormTitle('');
        setFormDesc('');
        setFormDate(dateStr || '');
        setFormTime('');
        setFormType('EVENT');
        setShowAddModal(true);
    };

    const handleSaveEvent = () => {
        if (!formTitle || !formDate) return;

        const newEvent: AgendaEvent = {
            id: Date.now().toString(),
            title: formTitle,
            description: formDesc,
            date: formDate,
            time: formTime,
            type: formType,
            completed: false,
        };

        setEvents([...events, newEvent]);
        setShowAddModal(false);
    };

    const deleteEvent = (id: string) => {
        setEvents(events.filter(e => e.id !== id));
    };

    const toggleComplete = (id: string) => {
        setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
    };

    return (
        <div className="min-h-screen bg-[#020202] py-8 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
                >
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
                            <p className="text-sm text-text-muted mt-1">Cronograma de Eventos e Compromissos</p>
                        </div>
                    </div>

                    <button
                        onClick={() => openAddModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Evento
                    </button>
                </div>

                {/* Calendar Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-sm text-text-muted hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Hoje
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
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
                            return (
                                <div
                                    key={idx}
                                    onClick={() => openAddModal(day.dateStr)}
                                    className={`min-h-[100px] p-2 border-b border-r border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors ${!day.isCurrentMonth ? 'opacity-30' : ''
                                        }`}
                                >
                                    <div className={`w-7 h-7 flex items-center justify-center text-sm mb-1 rounded-full ${isToday(day.dateStr)
                                            ? 'bg-orange-500 text-white font-bold'
                                            : 'text-text-secondary'
                                        }`}>
                                        {day.day}
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`text-[11px] px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] text-text-muted px-1.5">
                                                +{dayEvents.length - 3} mais
                                            </div>
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
                        {events
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .slice(0, 10)
                            .map(event => (
                                <div
                                    key={event.id}
                                    className={`flex items-center gap-4 p-4 bg-[#0A0A0A] border border-white/10 rounded-lg group ${event.completed ? 'opacity-50' : ''
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleComplete(event.id)}
                                        className={`transition-colors ${event.completed ? 'text-green-500' : 'text-text-muted hover:text-white'}`}
                                    >
                                        {event.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}>
                                                {event.type === 'MEETING' ? 'Reunião' : event.type === 'TASK' ? 'Tarefa' : event.type === 'REMINDER' ? 'Lembrete' : 'Evento'}
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                {event.date.split('-').reverse().join('/')}
                                                {event.time && ` às ${event.time}`}
                                            </span>
                                        </div>
                                        <h4 className={`font-medium mt-1 ${event.completed ? 'line-through text-text-muted' : 'text-white'}`}>
                                            {event.title}
                                        </h4>
                                        {event.description && (
                                            <p className="text-sm text-text-muted mt-0.5">{event.description}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => deleteEvent(event.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        {events.length === 0 && (
                            <div className="text-center py-12 text-text-muted">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum evento cadastrado</p>
                                <p className="text-sm mt-1">Clique em qualquer dia para adicionar</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Event Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6">Novo Evento</h2>

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
                                        <label className="block text-xs uppercase text-text-muted mb-1">Data</label>
                                        <input
                                            type="date"
                                            value={formDate}
                                            onChange={(e) => setFormDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Hora</label>
                                        <input
                                            type="time"
                                            value={formTime}
                                            onChange={(e) => setFormTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-text-muted mb-1">Tipo</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {(['EVENT', 'MEETING', 'TASK', 'REMINDER'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormType(type)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${formType === type
                                                        ? `${EVENT_COLORS[type].bg} ${EVENT_COLORS[type].text} border-current`
                                                        : 'border-white/10 text-text-muted hover:text-white'
                                                    }`}
                                            >
                                                {type === 'MEETING' ? 'Reunião' : type === 'TASK' ? 'Tarefa' : type === 'REMINDER' ? 'Lembrete' : 'Evento'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
