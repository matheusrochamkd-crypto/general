import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { incomeProjections, IncomeProjection } from '../data/incomeProjections';
import { useAuth } from '../contexts/AuthContext';

export interface IntelligenceData {
    financials: {
        currentMonth: IncomeProjection | undefined;
        burnRate: number; // Placeholder mock
        runway: string;   // Placeholder mock
        totalCapitalSocial: number;
    };
    agenda: {
        upcomingEvents: any[];
        pendingTasks: any[];
    };
    capitalSocial: {
        totalAssociates: number;
        topAssociates: any[];
    };
    lastUpdated: string;
}

export const useGeneralIntel = () => {
    const { user } = useAuth();
    const [intel, setIntel] = useState<IntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const gatherIntel = async () => {
            setLoading(true);

            // 1. Financials (Projections)
            const today = new Date();
            const currentMonthStr = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            // Mapping EN month specific to our data needs might be tricky, let's just pick based on index for now relative to Feb 2026?
            // Actually, let's just grab the first one that matches Month/Year or just the most immediate relevant one.
            // For simplicity in this demo, we can just grab the "current" simulation month (e.g. Feb 2026) or the real current month.
            // Let's assume the user is "living" in the simulation timeframe.
            const currentSimulationMonth = incomeProjections[0]; // Start of Sim

            // 2. Agenda Events (Supabase)
            const { data: eventsData } = await supabase
                .from('agenda_events')
                .select('*')
                .eq('user_id', user.id)
                .gte('start_date', new Date().toISOString().split('T')[0])
                .order('start_date', { ascending: true })
                .limit(10);

            // 3. Capital Social (Supabase)
            const { data: capitalData } = await supabase
                .from('capital_social')
                .select('*')
                .eq('user_id', user.id);

            const totalAssociates = capitalData?.length || 0;
            const totalCapitalValue = capitalData?.reduce((acc, curr) => acc + (Number(curr.capital_value) || 0), 0) || 0;

            // Synthesis
            const newIntel: IntelligenceData = {
                financials: {
                    currentMonth: currentSimulationMonth,
                    burnRate: 1200, // Mock fixed cost for verified "survival" mode
                    runway: "Infinity (Theoretical)",
                    totalCapitalSocial: totalCapitalValue
                },
                agenda: {
                    upcomingEvents: eventsData?.filter(e => e.type !== 'TASK') || [],
                    pendingTasks: eventsData?.filter(e => e.type === 'TASK') || []
                },
                capitalSocial: {
                    totalAssociates,
                    topAssociates: capitalData?.slice(0, 5) || []
                },
                lastUpdated: new Date().toLocaleTimeString()
            };

            setIntel(newIntel);
            setLoading(false);
        };

        gatherIntel();
    }, [user]);

    return { intel, loading };
};
