import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, CheckCircle2, Circle, Trash2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // Ensure this matches existing import
import { EventItem } from '../types';

interface EventsAgendaProps {
    onBack: () => void;
}

export const EventsAgenda: React.FC<EventsAgendaProps> = ({ onBack }) => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');
    const [newEventType, setNewEventType] = useState<'MEETING' | 'TASK' | 'REMINDER' | 'EVENT'>('EVENT');

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

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
                // Fallback or empty state
            } else {
                setEvents(data || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();

        const timestamp = new Date(`${newEventDate}T${newEventTime || '00:00'}:00`).toISOString();

        const newEvent = {
            title: newEventTitle,
            description: newEventDesc,
            date: timestamp,
            type: newEventType,
            completed: false
        };

        const { data, error } = await supabase
            .from('events')
            .insert([newEvent])
            .select()
            .single();

        if (error) {
            console.error('Error adding event:', error);
            alert('Erro ao salvar evento. Verifique se a tabela "events" existe no Supabase.');
        } else if (data) {
            setEvents([...events, data]);
            setShowAddModal(false);
            resetForm();
        }
    };

    const deleteEvent = async (id: string) => {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting event:', error);
        } else {
            setEvents(events.filter(ev => ev.id !== id));
        }
    };

    const toggleComplete = async (event: EventItem) => {
        const { error } = await supabase
            .from('events')
            .update({ completed: !event.completed })
            .eq('id', event.id);

        if (!error) {
            setEvents(events.map(ev => ev.id === event.id ? { ...ev, completed: !ev.completed } : ev));
        }
    };

    const resetForm = () => {
        setNewEventTitle('');
        setNewEventDate('');
        setNewEventTime('');
        setNewEventDesc('');
        setNewEventType('EVENT');
    };

    // Group events by month
    const eventsByMonth = events.reduce((acc, event) => {
        const date = new Date(event.date);
        const monthIndex = date.getMonth();
        if (!acc[monthIndex]) acc[monthIndex] = [];
        acc[monthIndex].push(event);
        return acc;
    }, {} as Record<number, EventItem[]>);

    return (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-5xl mx-auto p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Voltar</span>
                    </button>

                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Agenda 2026</h1>
                        <p className="text-orange-500 text-sm uppercase tracking-wider font-medium">Cronograma Operacional</p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Evento
                    </button>
                </div>

                {/* Timeline / List */}
                <div className="space-y-12 relative before:absolute before:left-8 before:top-0 before:bottom-0 before:w-px before:bg-white/10">
                    {months.map((month, index) => {
                        const monthEvents = eventsByMonth[index] || [];
                        // Only show months with events or if it is current/future? 
                        // Let's show all for structure, or maybe just active ones to save space.
                        // Creating a simplified view for empty months.

                        return (
                            <div key={month} className="relative pl-20">
                                {/* Month Marker */}
                                <div className="absolute left-0 top-0 w-16 text-right">
                                    <span className={`text-sm font-bold uppercase tracking-wider ${monthEvents.length > 0 ? 'text-white' : 'text-text-muted/30'}`}>
                                        {month.substring(0, 3)}
                                    </span>
                                </div>

                                {/* Dot on timeline */}
                                <div className={`absolute left-[30px] top-1.5 w-2 h-2 rounded-full border ${monthEvents.length > 0 ? 'bg-orange-500 border-orange-500' : 'bg-[#0A0A0A] border-white/20'}`} />

                                {/* Events List */}
                                <div className="space-y-4">
                                    {monthEvents.length === 0 ? (
                                        <div className="h-8 flex items-center">
                                            <span className="text-xs text-text-muted/20 italic">Sem eventos registrados</span>
                                        </div>
                                    ) : (
                                        monthEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`group relative p-4 rounded-xl border transition-all duration-300 ${event.completed
                                                        ? 'bg-white/5 border-white/5 opacity-60'
                                                        : 'bg-white/[0.03] border-white/10 hover:border-orange-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${event.type === 'MEETING' ? 'bg-blue-500/10 text-blue-500' :
                                                                    event.type === 'TASK' ? 'bg-green-500/10 text-green-500' :
                                                                        event.type === 'REMINDER' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                            'bg-purple-500/10 text-purple-500'
                                                                }`}>
                                                                {event.type === 'MEETING' ? 'Reunião' :
                                                                    event.type === 'TASK' ? 'Tarefa' :
                                                                        event.type === 'REMINDER' ? 'Lembrete' : 'Evento'}
                                                            </span>
                                                            <span className="text-xs text-text-muted flex items-center gap-1">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                {new Date(event.date).toLocaleDateString('pt-BR')}
                                                                <Clock className="w-3 h-3 ml-2" />
                                                                {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <h3 className={`text-lg font-medium ${event.completed ? 'text-text-muted line-through' : 'text-white'}`}>
                                                            {event.title}
                                                        </h3>
                                                        {event.description && (
                                                            <p className="text-sm text-text-secondary mt-1">{event.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => toggleComplete(event)}
                                                            className={`p-2 rounded-lg transition-colors ${event.completed ? 'text-green-500 hover:bg-green-500/10' : 'text-text-muted hover:text-white hover:bg-white/5'
                                                                }`}
                                                        >
                                                            {event.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteEvent(event.id)}
                                                            className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Event Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6">Novo Compromisso</h2>
                            <form onSubmit={handleAddEvent} className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-text-muted mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={newEventTitle}
                                        onChange={e => setNewEventTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Reunião de Alinhamento"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Data</label>
                                        <input
                                            type="date"
                                            value={newEventDate}
                                            onChange={e => setNewEventDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors scheme-dark"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted mb-1">Hora</label>
                                        <input
                                            type="time"
                                            value={newEventTime}
                                            onChange={e => setNewEventTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors scheme-dark"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-text-muted mb-1">Tipo</label>
                                    <select
                                        value={newEventType}
                                        onChange={e => setNewEventType(e.target.value as any)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                    >
                                        <option value="EVENT">Evento</option>
                                        <option value="MEETING">Reunião</option>
                                        <option value="TASK">Tarefa</option>
                                        <option value="REMINDER">Lembrete</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-text-muted mb-1">Descrição</label>
                                    <textarea
                                        value={newEventDesc}
                                        onChange={e => setNewEventDesc(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors h-24 resize-none"
                                        placeholder="Detalhes do compromisso..."
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
