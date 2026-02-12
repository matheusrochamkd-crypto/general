import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, AlignLeft, X, Trash2, CheckCircle2, Circle, MoreVertical, Menu, Repeat, Sun, Moon } from 'lucide-react';
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
    allDay?: boolean;
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
    const [isDarkMode, setIsDarkMode] = useState(true);
    const lastScrollTime = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Date | null>(null);
    const [dragEnd, setDragEnd] = useState<Date | null>(null);

    // Theme Helpers
    const theme = {
        bg: isDarkMode ? 'bg-black' : 'bg-white',
        bgSec: isDarkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50',
        bgTert: isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        textSec: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        border: isDarkMode ? 'border-white/10' : 'border-black/10',
        borderSec: isDarkMode ? 'border-white/5' : 'border-black/5',
        hover: isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5',
    };

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
    const [formAllDay, setFormAllDay] = useState(false);

    // Data Loading & Recovery Sync
    useEffect(() => {
        const loadAndSyncEvents = async () => {
            if (!user) return;

            let supabaseEvents: AgendaEvent[] = [];
            let localEvents: AgendaEvent[] = [];

            // 1. Fetch from Supabase
            try {
                const { data, error } = await supabase
                    .from('agenda_events')
                    .select('*')
                    .eq('user_id', user.id);

                if (data && !error) {
                    supabaseEvents = data.map((e: any) => ({
                        id: e.id,
                        title: e.title,
                        description: e.description || '',
                        startDate: e.start_date,
                        endDate: e.end_date || e.start_date,
                        startTime: e.time ? e.time.split('-')[0]?.trim() : undefined,
                        endTime: e.time ? e.time.split('-')[1]?.trim() : undefined,
                        type: e.type || 'EVENT',
                        completed: e.completed || false,
                        recurrence: e.recurrence || 'NONE',
                        allDay: e.all_day || false
                    }));
                }
            } catch (err) {
                console.error("Supabase load error", err);
            }

            // 2. Fetch from LocalStorage (V3 - Single Source of Truth for Local)
            const localV3 = localStorage.getItem('agenda_events_2026_v3');
            if (localV3) {
                try {
                    localEvents = JSON.parse(localV3);
                } catch (e) {
                    console.error("Error parsing local V3", e);
                }
            } else {
                // Formatting migration from V2 if V3 doesn't exist
                const localV2 = localStorage.getItem('agenda_events_2026_v2');
                if (localV2) {
                    try {
                        const parsed = JSON.parse(localV2);
                        localEvents = parsed.map((e: any) => ({
                            ...e,
                            startDate: e.startDate || e.date,
                            startTime: e.time ? e.time.split('-')[0]?.trim() : undefined,
                            recurrence: 'NONE'
                        }));
                    } catch (e) { console.error("Error parsing local V2", e) }
                } else {
                    // Formatting migration from Legacy if V2 doesn't exist
                    const localOld = localStorage.getItem('agenda_events_2026');
                    if (localOld) {
                        try {
                            const parsed = JSON.parse(localOld);
                            localEvents = parsed.map((e: any) => ({
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
                        } catch (e) { console.error("Error parsing local Legacy", e) }
                    }
                }
            }

            // 3. Identify Missing Events (In Local but NOT in Supabase)
            // We use a Map to merge. Supabase takes precedence for updates, 
            // but we must not lose Local events that haven't been synced yet.
            const mergedEventsMap = new Map<string, AgendaEvent>();
            const existingSignatures = new Set<string>();

            // Helper to create a signature for deduplication
            const getEventSignature = (e: AgendaEvent) => {
                return `${e.title}|${e.startDate}|${e.type}|${e.allDay}`;
            };

            // Add all Supabase events first, ensuring NO DUPLICATES exist in the source
            const seenSignatures = new Set<string>();
            const duplicatesToDelete: string[] = [];

            supabaseEvents.forEach(e => {
                const signature = getEventSignature(e);
                if (seenSignatures.has(signature)) {
                    // It's a duplicate! Mark for deletion and do NOT add to map
                    duplicatesToDelete.push(e.id);
                } else {
                    seenSignatures.add(signature);
                    mergedEventsMap.set(e.id, e);
                    existingSignatures.add(signature);
                }
            });

            // If we found duplicates in Supabase, delete them to clean up the DB
            if (duplicatesToDelete.length > 0) {
                console.log(`[Deduplication] Removing ${duplicatesToDelete.length} duplicate events from Supabase...`);
                // We do this asynchronously to not block the UI render
                supabase.from('agenda_events').delete().in('id', duplicatesToDelete).then(({ error }) => {
                    if (error) console.error("Error deleting duplicates:", error);
                    else console.log("Duplicates deleted successfully.");
                });
            }

            // Check Local events. If ID missing in map, it's a candidate to sync.
            const eventsToSync: AgendaEvent[] = [];

            localEvents.forEach(localE => {
                // strict ID check
                if (!mergedEventsMap.has(localE.id)) {
                    // secondary content check to avoid ghost duplicates (different ID but same content)
                    const signature = getEventSignature(localE);
                    if (!existingSignatures.has(signature)) {
                        mergedEventsMap.set(localE.id, localE);
                        eventsToSync.push(localE);
                        existingSignatures.add(signature);
                    }
                }
            });

            // 4. Update State Immediately
            const allEvents = Array.from(mergedEventsMap.values());
            setEvents(allEvents);

            // Update LocalStorage to match the merged reality
            localStorage.setItem('agenda_events_2026_v3', JSON.stringify(allEvents));

            // 5. Background Sync: Upload missing events to Supabase
            if (eventsToSync.length > 0) {
                console.log(`Syncing ${eventsToSync.length} missing events to Supabase...`);
                try {
                    // Prepare for insertion
                    const records = eventsToSync.map(e => ({
                        id: e.id,
                        user_id: user.id,
                        title: e.title,
                        description: e.description,
                        start_date: e.startDate,
                        end_date: e.endDate,
                        time: e.startTime ? `${e.startTime} - ${e.endTime || ''}` : null,
                        type: e.type,
                        completed: e.completed,
                        recurrence: e.recurrence,
                        all_day: e.allDay
                    }));

                    const { error } = await supabase
                        .from('agenda_events')
                        .upsert(records);

                    if (error) {
                        console.error("Error syncing missing events:", error);
                    } else {
                        console.log("Successfully synced missing events.");
                    }
                } catch (err) {
                    console.error("Critical error during sync:", err);
                }
            }
        };

        loadAndSyncEvents();
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
                    recurrence: event.recurrence,
                    all_day: event.allDay // Supabase column needs to simplify exist
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

    // Scroll Navigation
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const now = Date.now();
            if (now - lastScrollTime.current < 500) return; // Debounce 500ms

            if (Math.abs(e.deltaY) > 20) { // Threshold
                if (e.deltaY > 0) {
                    nextPeriod();
                } else {
                    prevPeriod();
                }
                lastScrollTime.current = now;
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel);
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [currentDate, view]); // Re-bind when state changes to ensure closure captures latest

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
        } else if (view === 'DAY') {
            dates.push(new Date(currentDate));
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
    const openNewEventModal = (startDate?: Date, hour?: number, endDate?: Date) => {
        const d = startDate || new Date();
        // Format YYYY-MM-DD local
        const formatD = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const dateStr = formatD(d);
        const endDateStr = endDate ? formatD(endDate) : dateStr;

        // Round to nearest hour if generic open
        const h = hour !== undefined ? hour : new Date().getHours();
        const hStr = String(h).padStart(2, '0');
        const nextHStr = String(h + 1).padStart(2, '0');

        setSelectedEvent(null);
        setFormTitle('');
        setFormDesc('');
        setFormStartDate(dateStr);
        setFormEndDate(endDateStr);
        setFormStartTime(`${hStr}:00`);
        setFormEndTime(`${nextHStr}:00`);
        setFormType('EVENT');
        setFormRecurrence('NONE');

        // If start != end, assume it's multi-day or all day
        if (endDate && endDate.getTime() !== d.getTime()) {
            setFormAllDay(true);
        } else {
            setFormAllDay(false);
        }

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
        setFormAllDay(event.allDay || false);
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
            recurrence: formRecurrence,
            allDay: formAllDay
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
            <div className={`flex flex-col h-full overflow-hidden ${theme.bg}`}>
                {/* Header Row: Days */}
                <div className={`flex border-b ${theme.border} ml-14`}>
                    {viewDates.map((date, i) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className={`flex-1 py-3 text-center border-l ${theme.borderSec}`}>
                                <span className={`text-xs font-semibold uppercase ${isToday ? 'text-blue-500' : theme.textSec}`}>
                                    {WEEKDAYS[date.getDay()]}
                                </span>
                                <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-xl ${isToday ? 'bg-blue-600 text-white' : theme.text}`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Time Grid */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    {/* All Day Row */}
                    <div className={`flex border-b ${theme.border} min-h-[40px]`}>
                        <div className={`w-14 text-[10px] ${theme.textSec} flex items-center justify-center border-r ${theme.border} ${theme.bgSec}`}>
                            DIA TODO
                        </div>
                        {viewDates.map((date, dayIdx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const dayEvents = getEventsForDate(dateStr).filter(e => e.allDay);

                            return (
                                <div key={dayIdx} className={`flex-1 border-l ${theme.borderSec} p-1 flex flex-col gap-1`}>
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(e, event);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${EVENT_COLORS[event.type].bg} border-l-4 ${EVENT_COLORS[event.type].border}`}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Time ColumnsContainer */}
                    <div className="flex min-h-[1440px]"> {/* 24h * 60px/h */}

                        {/* Time Labels */}
                        <div className={`w-14 flex-shrink-0 flex flex-col items-end pr-2 text-xs ${theme.textSec} ${theme.bgSec} border-r ${theme.border} pt-2 sticky left-0 z-10`}>
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="h-[60px] relative -top-3">
                                    {i === 0 ? '' : `${i}:00`}
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {viewDates.map((date, dayIdx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const dayEvents = getEventsForDate(dateStr).filter(e => !e.allDay);

                            return (
                                <div
                                    key={dayIdx}
                                    className={`flex-1 border-l ${theme.borderSec} relative group ${isDarkMode ? 'hover:bg-white/[0.01]' : 'hover:bg-black/[0.01]'}`}
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
                                        <div key={h} className={`absolute w-full h-[1px] ${isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`} style={{ top: `${h * 60}px` }} />
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(e, event);
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
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
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay(); // 0-6
        const daysInMonth = lastDay.getDate();
        // Calculate needed slots dynamically
        // We want to fill complete weeks (rows of 7)
        // Most months fit in 5 rows (35 days), some need 6 (42 days)
        // We calculate 'used' slots (blanks + days) and round up to next multiple of 7
        const usedSlots = startDay + daysInMonth;
        const totalSlots = Math.ceil(usedSlots / 7) * 7;

        // Days arrays
        const prevMonthDays = Array.from({ length: startDay }, (_, i) => {
            const d = new Date(year, month, 0 - (startDay - 1 - i));
            return { date: d, isCurrentMonth: false };
        });

        const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
            const d = new Date(year, month, i + 1);
            return { date: d, isCurrentMonth: true };
        });

        const currentUsed = prevMonthDays.length + currentMonthDays.length;
        const nextMonthDays = Array.from({ length: totalSlots - currentUsed }, (_, i) => {
            const d = new Date(year, month + 1, i + 1);
            return { date: d, isCurrentMonth: false };
        });

        const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

        // Drag Handler Helpers
        const handleMouseDown = (date: Date) => {
            setIsDragging(true);
            setDragStart(date);
            setDragEnd(date);
        };

        const handleMouseEnter = (date: Date) => {
            if (isDragging) {
                setDragEnd(date);
            }
        };

        const handleMouseUp = () => {
            if (isDragging && dragStart && dragEnd) {
                const start = dragStart < dragEnd ? dragStart : dragEnd;
                const end = dragStart < dragEnd ? dragEnd : dragStart;
                // If it's a single click (start == end), allow standard behavior (do nothing here, let onClick handle or unify?)
                // Actually, let's unify.
                openNewEventModal(start, undefined, end);
            }
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
        };

        const isInSelection = (date: Date) => {
            if (!isDragging || !dragStart || !dragEnd) return false;
            const start = dragStart < dragEnd ? dragStart : dragEnd;
            const end = dragStart < dragEnd ? dragEnd : dragStart;
            return date >= start && date <= end;
        };

        return (
            <div
                className={`flex-1 ${theme.bg} overflow-y-auto select-none flex flex-col`}
                onMouseLeave={() => {
                    if (isDragging) {
                        setIsDragging(false);
                        setDragStart(null);
                        setDragEnd(null);
                    }
                }}
                onMouseUp={handleMouseUp}
            >
                {/* Header Row */}
                <div className={`grid grid-cols-7 border-b ${theme.border}`}>
                    {WEEKDAYS.map(d => (
                        <div key={d} className={`text-center text-xs font-medium uppercase tracking-wider ${theme.textSec} py-2 border-r ${theme.borderSec} last:border-r-0`}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid Rows */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                    {/* Note: using auto-rows-fr fills height, but we might want min-height */}
                    {allDays.map(({ date, isCurrentMonth }, i) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayEvents = getEventsForDate(dateStr);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const dayNum = date.getDate();
                        const isSelected = isInSelection(date);

                        // Format: "1 mar." if day 1, else "2"
                        let dateLabel = String(dayNum);
                        if (dayNum === 1) {
                            const mStr = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                            dateLabel = `${dayNum} ${mStr}.`;
                        }

                        // Border logic: right border for all except last col, bottom border for all
                        // Actually standard grid gap-px with background color works best for borders, but we are using manual borders
                        // Let's rely on standard Tailwind borders on cells

                        return (
                            <div
                                key={i}
                                className={`
                                    min-h-[100px] border-b border-r ${theme.borderSec} p-1 transition flex flex-col gap-1 relative group
                                    ${(i + 1) % 7 === 0 ? 'border-r-0' : ''} /* Remove right border for last column */
                                    ${!isCurrentMonth ? (isDarkMode ? 'bg-[#000000]/40' : 'bg-gray-50/50') : theme.bg}
                                    ${isSelected ? 'bg-blue-500/10' : ''}
                                `}
                                onMouseDown={() => handleMouseDown(date)}
                                onMouseEnter={() => handleMouseEnter(date)}
                            >
                                {/* Date Label */}
                                <div className="flex justify-center mb-1">
                                    <div
                                        className={`text-xs font-semibold cursor-pointer px-1.5 py-0.5 rounded-full transition-colors 
                                            ${isToday
                                                ? 'bg-[#1A73E8] text-white'
                                                : (!isCurrentMonth ? 'text-gray-500' : theme.text)
                                            }
                                            ${!isToday && isCurrentMonth ? theme.hover : ''}
                                        `}
                                        onClick={(e) => {
                                            // Optional: click date to go to day view
                                            // Let's disable stopPropagation here to allow drag start even on header?
                                            // Nah, keep it specific
                                            // e.stopPropagation(); 
                                        }}
                                    >
                                        {dateLabel}
                                    </div>
                                </div>

                                {dayEvents.slice(0, 4).map(event => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent triggering new event logic
                                            openEditModal(e, event);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm leading-tight
                                            ${EVENT_COLORS[event.type].bg} 
                                            ${EVENT_COLORS[event.type].border ? 'border-l-[3px] ' + EVENT_COLORS[event.type].border : ''} 
                                            text-white hover:brightness-110 transition-all cursor-pointer truncate`}
                                    >
                                        {event.startTime && <span className="opacity-75 text-[9px] mr-1">{event.startTime}</span>}
                                        <span className="truncate">{event.title}</span>
                                    </div>
                                ))}
                                {dayEvents.length > 4 && (
                                    <div className={`text-[10px] ${theme.textSec} px-1 font-medium hover:text-blue-400 cursor-pointer`}>
                                        +{dayEvents.length - 4} mais
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div ref={containerRef} className={`flex h-screen ${theme.bg} ${theme.text} overflow-hidden font-sans`}>
            {/* Sidebar */}
            <div className={`w-64 ${theme.bgSec} border-r ${theme.border} flex flex-col transition-all duration-300 ${sidebarOpen ? '' : '-ml-64'}`}>
                {/* Header Logo Area */}
                <div className={`p-4 flex items-center gap-2 border-b ${theme.borderSec}`}>
                    <button onClick={onBack} className={`p-2 ${theme.hover} rounded-full`}>
                        <ArrowLeft className={`w-5 h-5 ${theme.textSec}`} />
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
                        <span className={`text-sm font-medium ${theme.textSec}`}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    </div>
                    {/* Functional Mini Calendar */}
                    <div className={`grid grid-cols-7 gap-1 text-center text-xs ${theme.textSec}`}>
                        {WEEKDAYS.map(d => <div key={d}>{d[0]}</div>)}

                        {(() => {
                            const mYear = currentDate.getFullYear();
                            const mMonth = currentDate.getMonth();
                            const mFirstDay = new Date(mYear, mMonth, 1).getDay();
                            const mDaysInMonth = new Date(mYear, mMonth + 1, 0).getDate();
                            const mBlanks = Array.from({ length: mFirstDay });
                            const mDays = Array.from({ length: mDaysInMonth }, (_, i) => i + 1);

                            return (
                                <>
                                    {mBlanks.map((_, i) => <div key={`mb-${i}`} />)}
                                    {mDays.map(d => {
                                        const dDate = new Date(mYear, mMonth, d);
                                        const isSel = dDate.toDateString() === currentDate.toDateString();
                                        return (
                                            <div
                                                key={d}
                                                onClick={() => {
                                                    setCurrentDate(dDate);
                                                    setView('DAY');
                                                }}
                                                className={`h-6 w-6 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isSel ? 'bg-blue-600 text-white' : theme.hover}`}
                                            >
                                                {d}
                                            </div>
                                        )
                                    })}
                                </>
                            );
                        })()}
                    </div>

                    {/* Purpose Images Rotation */}
                    <div className="flex-1 flex flex-col justify-end p-4 pb-6">
                        <div className={`text-[10px] ${theme.textSec} uppercase tracking-widest mb-3 text-center`}>
                            Proposta da Missão
                        </div>
                        <RotatingImage
                            images={[
                                "/propósito/WhatsApp Image 2025-12-28 at 20.41.55.jpg",
                                "/propósito/WhatsApp Image 2025-12-31 at 20.31.01.jpg",
                                "/propósito/WhatsApp Image 2025-12-31 at 20.39.32.jpg"
                            ]}
                            alt="Meu Propósito"
                            className={`w-full aspect-[9/16] rounded-xl overflow-hidden shadow-2xl border ${theme.borderSec} opacity-80 hover:opacity-100 transition-opacity duration-300`}
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
                <header className={`h-16 flex items-center justify-between px-4 border-b ${theme.border} ${theme.bgSec}`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 ${theme.hover} rounded-full`}>
                            <Menu className={`w-5 h-5 ${theme.textSec}`} />
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={goToToday} className={`px-3 py-1.5 border ${theme.borderSec} rounded ${theme.hover} text-sm font-medium`}>Hoje</button>
                            <div className="flex items-center">
                                <button onClick={prevPeriod} className={`p-1.5 ${theme.hover} rounded-full`}><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={nextPeriod} className={`p-1.5 ${theme.hover} rounded-full`}><ChevronRight className="w-4 h-4" /></button>
                            </div>
                            <h2 className="text-xl font-medium ml-2">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-gray-200'} rounded-md p-1 border ${theme.borderSec}`}>
                            <button
                                onClick={() => setView('MONTH')}
                                className={`px-3 py-1 rounded text-sm ${view === 'MONTH' ? (isDarkMode ? 'bg-[#2C2C2C] text-white shadow' : 'bg-white text-black shadow') : theme.textSec}`}
                            >
                                Mês
                            </button>
                            <button
                                onClick={() => setView('WEEK')}
                                className={`px-3 py-1 rounded text-sm ${view === 'WEEK' ? (isDarkMode ? 'bg-[#2C2C2C] text-white shadow' : 'bg-white text-black shadow') : theme.textSec}`}
                            >
                                Semanas
                            </button>
                            <button
                                onClick={() => setView('DAY')}
                                className={`px-3 py-1 rounded text-sm ${view === 'DAY' ? (isDarkMode ? 'bg-[#2C2C2C] text-white shadow' : 'bg-white text-black shadow') : theme.textSec}`}
                            >
                                Dia
                            </button>
                        </div>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 ${theme.hover} rounded-full transition-colors`}
                            title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                        >
                            {isDarkMode ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </button>
                    </div>
                </header>

                {/* View Area */}
                {view === 'MONTH' ? <MonthGrid /> : <WeeklyGrid />}
            </div>

            {/* Event Modal - Redesigned */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        className={`${isDarkMode ? 'bg-[#121212]/90 border-white/10' : 'bg-white/95 border-gray-200'} border backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100`}
                    >
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between p-6 pb-2`}>
                            <h3 className={`text-xl font-bold ${theme.text}`}>
                                {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
                            </h3>
                            <div className="flex items-center gap-1">
                                {selectedEvent && (
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setShowModal(false)} className={`p-2 ${theme.hover} rounded-full transition-colors`}>
                                    <X className={`w-5 h-5 ${theme.textSec}`} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 pt-2 space-y-6">
                            {/* Title Input - Large & Clean */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Adicionar título"
                                    value={formTitle}
                                    onChange={e => setFormTitle(e.target.value)}
                                    className={`w-full text-2xl font-medium bg-transparent border-b-2 ${theme.border} focus:border-blue-500 outline-none py-2 px-1 placeholder:text-gray-500/50 transition-colors ${theme.text}`}
                                    autoFocus
                                />
                            </div>

                            {/* Type Selector - Capsules */}
                            <div className="flex gap-2">
                                {(['EVENT', 'MEETING', 'TASK', 'REMINDER'] as AgendaEvent['type'][]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFormType(t)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all
                                            ${formType === t
                                                ? (t === 'EVENT' ? 'bg-cyan-600 text-white' : t === 'MEETING' ? 'bg-blue-600 text-white' : t === 'TASK' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white')
                                                : `${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} ${theme.textSec}`
                                            }
                                        `}
                                    >
                                        {t === 'EVENT' ? 'EVENTO' : t === 'MEETING' ? 'REUNIÃO' : t === 'TASK' ? 'TAREFA' : 'LEMBRETE'}
                                    </button>
                                ))}
                            </div>

                            {/* Date & Time Section */}
                            <div className={`space-y-4 p-4 rounded-xl ${theme.bgSec}`}>
                                {/* All Day Toggle */}
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formAllDay ? 'bg-blue-500 border-blue-500' : `border-gray-500 ${isDarkMode ? 'bg-transparent' : 'bg-white'}`}`}>
                                        {formAllDay && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formAllDay}
                                        onChange={e => setFormAllDay(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className={`text-sm font-medium ${theme.text}`}>Dia inteiro</span>
                                </label>

                                <div className="flex flex-col gap-3">
                                    {/* Dates */}
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.borderSec} ${isDarkMode ? 'bg-black/20' : 'bg-white'}`}>
                                            <CalendarIcon className={`w-4 h-4 ${theme.textSec}`} />
                                            <input
                                                type="date"
                                                value={formStartDate}
                                                onChange={e => setFormStartDate(e.target.value)}
                                                className={`bg-transparent outline-none text-sm w-full ${theme.text}`}
                                            />
                                        </div>
                                        {formAllDay && <span className={theme.textSec}>até</span>}
                                        {formAllDay && (
                                            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.borderSec} ${isDarkMode ? 'bg-black/20' : 'bg-white'}`}>
                                                <CalendarIcon className={`w-4 h-4 ${theme.textSec}`} />
                                                <input
                                                    type="date"
                                                    value={formEndDate}
                                                    onChange={e => setFormEndDate(e.target.value)}
                                                    className={`bg-transparent outline-none text-sm w-full ${theme.text}`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Times (if not all day) */}
                                    {!formAllDay && (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                                            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.borderSec} ${isDarkMode ? 'bg-black/20' : 'bg-white'}`}>
                                                <Clock className={`w-4 h-4 ${theme.textSec}`} />
                                                <input
                                                    type="time"
                                                    value={formStartTime}
                                                    onChange={e => setFormStartTime(e.target.value)}
                                                    className={`bg-transparent outline-none text-sm w-full ${theme.text}`}
                                                />
                                            </div>
                                            <span className={theme.textSec}>-</span>
                                            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.borderSec} ${isDarkMode ? 'bg-black/20' : 'bg-white'}`}>
                                                <Clock className={`w-4 h-4 ${theme.textSec}`} />
                                                <input
                                                    type="time"
                                                    value={formEndTime}
                                                    onChange={e => setFormEndTime(e.target.value)}
                                                    className={`bg-transparent outline-none text-sm w-full ${theme.text}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recurrence */}
                            <div className={`flex items-center gap-3 p-3 rounded-xl border ${theme.borderSec} ${theme.hover} cursor-pointer`} onClick={() => setFormRecurrence(formRecurrence === 'NONE' ? 'WEEKLY' : 'NONE')}>
                                <Repeat className={`w-5 h-5 ${formRecurrence === 'WEEKLY' ? 'text-blue-500' : theme.textSec}`} />
                                <div className="flex-1">
                                    <div className={`text-sm font-medium ${theme.text}`}>Repetir semanalmente</div>
                                    <div className={`text-xs ${theme.textSec}`}>
                                        {formRecurrence === 'WEEKLY' ? 'Ocorre toda semana neste horário' : 'Não se repete'}
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formRecurrence === 'WEEKLY' ? 'bg-blue-500 border-blue-500' : `border-gray-500 ${isDarkMode ? 'bg-transparent' : 'bg-white'}`}`}>
                                    {formRecurrence === 'WEEKLY' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className={`p-4 border-t ${theme.border} flex justify-end gap-3 ${theme.bgSec}`}>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme.bg} ${theme.text} hover:opacity-80`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
