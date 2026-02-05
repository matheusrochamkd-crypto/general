import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Mountain, Flag, BookOpen, Scroll } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BucketListProps {
    onBack: () => void;
}

interface BucketItem {
    id: string;
    text: string;
    subtitle?: string;
    image: string;
}

interface Category {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    border: string;
    bg: string;
    items: BucketItem[];
}

export const BucketList: React.FC<BucketListProps> = ({ onBack }) => {
    const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
    const [isSynced, setIsSynced] = useState<boolean | null>(null);

    // Load from Supabase on mount, fallback to localStorage
    useEffect(() => {
        // Define helpers inside useEffect to avoid ReferenceError/Hoisting issues
        const loadFromLocalStorageInner = (): Record<string, boolean> => {
            try {
                const saved = localStorage.getItem('bucket_list_state');
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (err) {
                console.error('Error parsing localStorage:', err);
            }
            return {};
        };

        const syncToSupabaseInner = async (state: Record<string, boolean>) => {
            for (const [id, completed] of Object.entries(state)) {
                await supabase.from('bucket_list_items').upsert({
                    id,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null
                }, { onConflict: 'id' });
            }
            setIsSynced(true);
        };

        const loadData = async () => {
            try {
                const { data, error } = await supabase
                    .from('bucket_list_items')
                    .select('*');

                if (error) {
                    console.warn('Supabase error, using localStorage:', error.message);
                    const local = loadFromLocalStorageInner();
                    setCheckedState(local);
                    setIsSynced(false);
                } else if (data && data.length > 0) {
                    const state: Record<string, boolean> = {};
                    data.forEach(item => { state[item.id] = item.completed; });
                    setCheckedState(state);
                    localStorage.setItem('bucket_list_state', JSON.stringify(state));
                    setIsSynced(true);
                } else {
                    // No data in Supabase, try localStorage and sync up
                    const local = loadFromLocalStorageInner();
                    setCheckedState(local);
                    if (Object.keys(local).length > 0) {
                        await syncToSupabaseInner(local);
                    }
                    setIsSynced(true);
                }
            } catch (err) {
                console.error('Error loading:', err);
                const local = loadFromLocalStorageInner();
                setCheckedState(local);
                setIsSynced(false);
            }
        };
        loadData();
    }, []);

    const toggleItem = async (id: string) => {
        const newCompleted = !checkedState[id];
        const newState = { ...checkedState, [id]: newCompleted };
        setCheckedState(newState);
        localStorage.setItem('bucket_list_state', JSON.stringify(newState));

        try {
            const { error } = await supabase.from('bucket_list_items').upsert({
                id,
                completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null
            }, { onConflict: 'id' });
            if (error) throw error;
            setIsSynced(true);
        } catch (err) {
            console.error('Save failed:', err);
            setIsSynced(false);
        }
    };

    const categories: Category[] = [
        {
            id: 'sublime',
            title: 'O SUBLIME',
            subtitle: 'Fenômenos & Natureza Extrema',
            icon: <Mountain className="w-5 h-5" />,
            color: 'text-purple-400',
            border: 'border-purple-500/50',
            bg: 'bg-purple-500/10',
            items: [
                { id: 'aurora', text: 'Ver a Aurora Boreal', subtitle: 'Caçar as luzes do norte', image: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&w=800&q=80' }, // Green Aurora Night
                { id: 'volcano', text: 'Ver um Vulcão Ativo', subtitle: 'Sentir a terra viva', image: 'https://images.unsplash.com/photo-1462331940185-00029557301c?auto=format&fit=crop&w=800&q=80' }, // Active Volcano
                { id: 'snow', text: 'Ver Neve real', subtitle: 'O silêncio do branco', image: 'https://images.unsplash.com/photo-1517299321609-52687d1bc555?auto=format&fit=crop&w=800&q=80' }, // Winter Snow Forest
                { id: 'ski', text: 'Esquiar', subtitle: 'Dominar a descida', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80' } // Skiing (confirmed working)
            ]
        },
        {
            id: 'missions',
            title: 'MISSÕES LOCAIS',
            subtitle: 'Aventura & Altitude',
            icon: <Flag className="w-5 h-5" />,
            color: 'text-yellow-400',
            border: 'border-yellow-500/50',
            bg: 'bg-yellow-500/10',
            items: [
                { id: 'pico_parana', text: 'Subir o Pico Paraná', subtitle: 'O teto do Sul', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' }, // Dramatic Mountains
                { id: 'buraco_padre', text: 'Explorar o Buraco do Padre', subtitle: 'A furna e a cachoeira', image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80' } // Waterfall
            ]
        },
        {
            id: 'legacy',
            title: 'LEGADO E HISTÓRIA',
            subtitle: 'Cultura & Memória',
            icon: <BookOpen className="w-5 h-5" />,
            color: 'text-amber-500',
            border: 'border-amber-500/50',
            bg: 'bg-amber-500/10',
            items: [
                { id: 'museu_feb', text: 'Museu do Expedicionário', subtitle: 'Honrar a FEB', image: 'https://images.unsplash.com/photo-1599554316688-21d72605335d?auto=format&fit=crop&w=800&q=80' }, // War History
                { id: 'museu_holocausto', text: 'Museu do Holocausto', subtitle: 'Entender a humanidade', image: 'https://images.unsplash.com/photo-1551189671-d68b9283a811?auto=format&fit=crop&w=800&q=80' }, // Museum
                { id: 'museu_atilio', text: 'Museu Atílio Rocco', subtitle: 'Minhas raízes em SJP', image: 'https://images.unsplash.com/photo-1549144342-63b72f10256d?auto=format&fit=crop&w=800&q=80' } // Vintage
            ]
        }
    ];

    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = Object.values(checkedState).filter(Boolean).length;
    const progress = Math.round((completedItems / totalItems) * 100);

    return (
        <div className="min-h-screen bg-[#020202] py-8 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-medium uppercase tracking-wider">Voltar</span>
                    </button>

                    <div className="text-center md:text-right">
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">Lista de Vida</h1>
                        <div className="flex items-center justify-center md:justify-end gap-3 text-sm text-text-muted">
                            <span>{completedItems}/{totalItems} Conquistas</span>
                            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-16">
                    {categories.map((category) => (
                        <div key={category.id} className="relative">
                            {/* Category Title */}
                            <div className="flex items-center gap-4 mb-8">
                                <span className={`p-3 rounded-2xl ${category.bg} ${category.color} border border-white/5`}>
                                    {category.icon}
                                </span>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-wide">{category.title}</h2>
                                    <p className="text-sm text-text-muted uppercase tracking-widest opacity-60">{category.subtitle}</p>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {category.items.map((item) => {
                                    const isChecked = !!checkedState[item.id];
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-500"
                                        >
                                            {/* Background Image */}
                                            <div className="absolute inset-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.text}
                                                    className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${isChecked ? 'grayscale-[50%]' : ''}`}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

                                                {/* Status Overlay */}
                                                {isChecked && (
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                                        <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md">
                                                            <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">Concluído</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="absolute inset-x-0 bottom-0 p-6 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                <h3 className={`text-xl font-bold leading-tight mb-2 text-white group-hover:text-indigo-300 transition-colors ${isChecked ? 'opacity-50' : ''}`}>
                                                    {item.text}
                                                </h3>
                                                <p className={`text-xs text-gray-300 uppercase tracking-wider font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 ${isChecked ? 'opacity-50' : ''}`}>
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Quote */}
                <div className="mt-24 mb-12 text-center">
                    <p className="text-lg font-serif italic text-white/40 hover:text-white/80 transition-colors duration-500 max-w-2xl mx-auto leading-relaxed">
                        "Não é a morte que o homem deve temer, mas sim nunca começar a viver."
                    </p>
                </div>
            </div>
        </div>
    );
};
