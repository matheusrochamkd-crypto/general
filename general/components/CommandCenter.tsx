import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Shield, TrendingUp, Users, Calendar, AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import { useGeneralIntel } from '../hooks/useGeneralIntel';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface CommandCenterProps {
    onBack: () => void;
    monthName: string;
    targets: any[];
    fixedIncome: any[];
    fixedCosts: any[];
    variableCosts: any[];
    totalRealized: number;
    totalExpectation: number;
    totalCost: number;
    coveragePercent: number;
    missionGap: number;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
    onBack,
    monthName,
    targets,
    fixedIncome,
    fixedCosts,
    variableCosts,
    totalRealized,
    totalExpectation,
    totalCost,
    coveragePercent,
    missionGap
}) => {
    const { intel, loading } = useGeneralIntel();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial General Greeting
    useEffect(() => {
        if (!loading && intel && messages.length === 0) {
            // merge props data with hook data
            const fullIntel = {
                ...intel,
                realTimeFinancials: {
                    month: monthName,
                    totalRealized,
                    totalExpectation,
                    totalCost,
                    coveragePercent,
                    missionGap,
                    targets,
                    fixedCosts,
                    variableCosts
                }
            };

            const systemContext = `
            YOU ARE 'THE GENERAL'. A CYBERPUNK MILITARY STRATEGIST ADVISING THE USER.
            YOU HAVE READ-ONLY ACCESS TO THE FOLLOWING INTEL: ${JSON.stringify(fullIntel)}.
            
            ROLE:
            - You are the central brain of this operation.
            - You are ruthless, efficient, and strategic.
            - You speak in direct commands and SITREP (Situation Report) style.
            - Do not be polite. Be effective.
            
            OBJECTIVE:
            - Analyze the intel provided.
            - Advise on financial runway, upcoming mission (events), and network expansion (capital social).
            - If cash flow is low, demand immediate action.
            
            START THE CONVERSATION BY GIVING A BRIEF "SITREP" BASED ON THE DATA.
            `;

            generateResponse([
                { role: 'system', content: systemContext },
                { role: 'user', content: "General, report status." }
            ]);
        }
    }, [loading, intel, monthName, targets, fixedIncome, fixedCosts, variableCosts, totalRealized, totalExpectation, totalCost, coveragePercent, missionGap]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateResponse = async (history: Message[]) => {
        setIsTyping(true);
        console.log("Comm Link: Initiating...");

        try {
            const apiKey = import.meta.env.VITE_XAI_API_KEY;

            if (!apiKey) {
                console.error("Comm Link Critical Failure: Missing API Key");
                setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ ALERT: SECURE KEY MISSING. CHECK ENV CONFIGURATION." }]);
                return;
            }

            console.log("Comm Link: Sending transmission...");
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    messages: history,
                    model: 'grok-beta', // UPDATED: Using grok-beta for compatibility
                    stream: false,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errText}`);
            }

            const data = await response.json();
            console.log("Comm Link: Transmission received.", data);

            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message;
                setMessages(prev => {
                    return [...prev, aiMessage];
                });
            } else {
                console.warn("Comm Link: Empty response payload.");
            }
        } catch (error: any) {
            console.error("Comm Link Failure:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ COMM LINK ERROR: ${error.message || 'UNKNOWN FAILURE'}. RETRY.` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        const newHistory = [...messages, userMsg];

        setMessages(newHistory);
        setInput('');

        let apiHistory = [...newHistory];

        if (!apiHistory.some(m => m.role === 'system')) {
            const systemContext = `
            YOU ARE 'THE GENERAL'. A CYBERPUNK MILITARY STRATEGIST ADVISING THE USER.
            YOU HAVE READ-ONLY ACCESS TO THE FOLLOWING INTEL: ${JSON.stringify(intel)}.
            KEEP RESPONSES CONCISE.
            `;
            apiHistory = [{ role: 'system', content: systemContext }, ...apiHistory];
        }

        generateResponse(apiHistory);
    };

    // UI Render
    if (loading) return <div className="p-10 text-center text-green-500 font-mono animate-pulse">ESTABLISHING SECURE CONNECTION...</div>;

    const cashColor = (intel?.financials.currentMonth?.total || 0) > 2000 ? 'text-emerald-400' : 'text-red-400';

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 p-6 max-w-[95vw] mx-auto bg-black text-white font-mono overflow-hidden">

            {/* LEFT PANEL: TACTICAL DASHBOARD */}
            <div className="w-1/3 flex flex-col gap-6">

                {/* Status Card */}
                <div className="bg-[#0A0A0A] border border-green-900/30 p-6 rounded-xl relative overflow-hidden group hover:border-green-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4 border-b border-green-900/30 pb-2">
                        <Shield className="w-6 h-6 text-green-500" />
                        <h2 className="text-xl font-bold tracking-widest text-green-500 uppercase">Mission Status</h2>
                    </div>
                    <div className="text-4xl font-black text-white/90">DEFCON 4</div>
                    <div className="text-xs text-green-700 mt-2 uppercase tracking-wider">All Systems Nominal</div>
                </div>

                {/* Financial Intel */}
                <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-emerald-500">
                        <TrendingUp className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wide text-sm">Financial Intel</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded border border-white/5">
                            <div className="text-xs text-gray-500 uppercase">Proj. Revenue</div>
                            <div className={`text-xl font-bold ${cashColor}`}>
                                R$ {intel?.financials.currentMonth?.total || 0}
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded border border-white/5">
                            <div className="text-xs text-gray-500 uppercase">Burn Rate</div>
                            <div className="text-xl font-bold text-red-400">R$ {intel?.financials.burnRate}</div>
                        </div>
                    </div>
                </div>

                {/* Agenda Intel */}
                <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-blue-500">
                        <Calendar className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wide text-sm">Upcoming Ops</h3>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[200px] custom-scrollbar">
                        {intel?.agenda.upcomingEvents.map((ev: any) => (
                            <div key={ev.id} className="flex items-center gap-3 p-2 bg-blue-900/10 border-l-2 border-blue-500 rounded-r">
                                <div className="text-xs text-blue-300 font-bold">{ev.start_date.slice(5)}</div>
                                <div className="text-sm truncate">{ev.title}</div>
                            </div>
                        ))}
                        {intel?.agenda.upcomingEvents.length === 0 && <span className="text-gray-600 text-sm">No Missions Pending.</span>}
                    </div>
                </div>

            </div>

            {/* RIGHT PANEL: COMM NET */}
            <div className="flex-1 bg-[#050505] border border-white/10 rounded-xl flex flex-col relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-10" />

                {/* Chat Header */}
                <div className="p-4 bg-black/50 border-b border-white/10 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="hover:bg-white/10 p-1 rounded-full text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-bold text-green-500 tracking-widest uppercase">SECURE CHANNEL // THE GENERAL</span>
                    </div>
                    <Lock className="w-4 h-4 text-gray-600" />
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-xl border ${msg.role === 'user'
                                ? 'bg-blue-900/20 border-blue-500/30 text-blue-100 rounded-br-none'
                                : 'bg-[#0A0A0A] border-green-500/30 text-green-400 font-mono rounded-bl-none shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                }`}>
                                <div className="text-[10px] uppercase opacity-50 mb-1 tracking-wider">
                                    {msg.role === 'user' ? 'OPERATOR' : 'GENERAL'}
                                </div>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-[#0A0A0A] border border-green-500/30 text-green-500 px-4 py-2 rounded-xl rounded-bl-none text-xs animate-pulse">
                                DECRYPTING TRANSMISSION...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black border-t border-white/10">
                    <div className="flex items-center gap-4 bg-[#111] border border-white/20 rounded-lg p-2 focus-within:border-green-500/50 transition-colors">
                        <Terminal className="w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Enter command or query..."
                            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-gray-700"
                            autoFocus
                        />
                        <button
                            onClick={handleSend}
                            disabled={isTyping}
                            className="p-2 bg-green-900/20 text-green-500 hover:bg-green-500 hover:text-black rounded transition-all disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
