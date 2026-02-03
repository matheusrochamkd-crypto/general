import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Mountain, Flag, BookOpen, Scroll, Cloud, CloudOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BucketListProps {
    onBack: () => void;
}

interface BucketItem {
    id: string;
    text: string;
    subtitle?: string;
}

interface Category {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    items: BucketItem[];
}

export const BucketList: React.FC<BucketListProps> = ({ onBack }) => {
    const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
    const [isSynced, setIsSynced] = useState<boolean | null>(null);

    // Load from Supabase on mount, fallback to localStorage
    useEffect(() => {
        const loadData = async () => {
            try {
                const { data, error } = await supabase
                    .from('bucket_list_items')
                    .select('*');

                if (error) {
                    console.warn('Supabase error, using localStorage:', error.message);
                    loadFromLocalStorage();
                    setIsSynced(false);
                } else if (data && data.length > 0) {
                    const state: Record<string, boolean> = {};
                    data.forEach(item => { state[item.id] = item.completed; });
                    setCheckedState(state);
                    localStorage.setItem('bucket_list_state', JSON.stringify(state));
                    setIsSynced(true);
                } else {
                    // No data in Supabase, try localStorage and sync up
                    const local = loadFromLocalStorage();
                    if (Object.keys(local).length > 0) {
                        await syncToSupabase(local);
                    }
                    setIsSynced(true);
                }
            } catch (err) {
                console.error('Error loading:', err);
                loadFromLocalStorage();
                setIsSynced(false);
            }
        };
        loadData();
    }, []);

    const loadFromLocalStorage = (): Record<string, boolean> => {
        const saved = localStorage.getItem('bucket_list_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            setCheckedState(parsed);
            return parsed;
        }
        return {};
    };

    const syncToSupabase = async (state: Record<string, boolean>) => {
        for (const [id, completed] of Object.entries(state)) {
            await supabase.from('bucket_list_items').upsert({
                id,
                completed,
                completed_at: completed ? new Date().toISOString() : null
            }, { onConflict: 'id' });
        }
        setIsSynced(true);
    };

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
            icon: <Mountain className="w-6 h-6" />,
            color: 'text-purple-400', // Mystical/Sublime
            items: [
                { id: 'aurora', text: 'Ver a Aurora Boreal', subtitle: 'Caçar as luzes do norte' },
                { id: 'volcano', text: 'Ver um Vulcão Ativo', subtitle: 'Sentir a terra viva' },
                { id: 'snow', text: 'Ver Neve real', subtitle: 'O silêncio do branco' },
                { id: 'ski', text: 'Esquiar', subtitle: 'Dominar a descida' }
            ]
        },
        {
            id: 'missions',
            title: 'MISSÕES LOCAIS',
            subtitle: 'Aventura & Altitude',
            icon: <Flag className="w-6 h-6" />,
            color: 'text-accent-yellow', // Adventure/Action
            items: [
                { id: 'pico_parana', text: 'Subir o Pico Paraná', subtitle: 'O teto do Sul' },
                { id: 'buraco_padre', text: 'Explorar o Buraco do Padre', subtitle: 'A furna e a cachoeira' }
            ]
        },
        {
            id: 'legacy',
            title: 'LEGADO E HISTÓRIA',
            subtitle: 'Cultura & Memória',
            icon: <BookOpen className="w-6 h-6" />,
            color: 'text-amber-600', // History/Gold/Sepia-ish but staying vibrant
            items: [
                { id: 'museu_feb', text: 'Museu do Expedicionário', subtitle: 'Honrar a FEB' },
                { id: 'museu_holocausto', text: 'Museu do Holocausto', subtitle: 'Entender a humanidade' },
                { id: 'museu_atilio', text: 'Museu Atílio Rocco', subtitle: 'Minhas raízes em SJP' }
            ]
        }
    ];

    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = Object.values(checkedState).filter(Boolean).length;
    const progress = Math.round((completedItems / totalItems) * 100);

    return (
        <div className="min-h-screen bg-[#020202] py-8 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-wider">Retornar ao Dashboard</span>
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative z-10">
                        <Scroll className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Lista de Vida</h1>
                        <p className="text-sm text-text-muted mt-1">Coisas para fazer antes de morrer • Progresso: {progress}%</p>
                    </div>
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/50 transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>

                {/* Categories */}
                <div className="space-y-8">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                            {/* Category Header */}
                            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-white/5 ${category.color}`}>
                                        {category.icon}
                                    </div>
                                    <div>
                                        <h2 className={`text-lg font-bold uppercase tracking-wide ${category.color}`}>
                                            {category.title}
                                        </h2>
                                        <p className="text-xs text-text-muted uppercase tracking-wider">
                                            {category.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="divide-y divide-white/5">
                                {category.items.map((item) => {
                                    const isChecked = !!checkedState[item.id];
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className="group flex items-center gap-4 p-5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                                        >
                                            <div className={`transition-all duration-300 ${isChecked ? category.color : 'text-text-muted group-hover:text-white'}`}>
                                                {isChecked ? (
                                                    <CheckCircle2 className="w-6 h-6 fill-current bg-black rounded-full" />
                                                ) : (
                                                    <Circle className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-base font-medium transition-all duration-300 ${isChecked ? 'text-text-muted line-through decoration-white/20' : 'text-white'}`}>
                                                    {item.text}
                                                </h3>
                                                {item.subtitle && (
                                                    <p className={`text-sm transition-colors ${isChecked ? 'text-text-muted/50' : 'text-text-muted'}`}>
                                                        {item.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Quote */}
                <div className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-sm font-serif italic text-text-muted">
                        "Não é a morte que o homem deve temer, mas sim nunca começar a viver."
                    </p>
                    <p className="text-[10px] uppercase tracking-widest mt-2 text-text-secondary">— Marco Aurélio</p>
                </div>
            </div>
        </div>
    );
};
