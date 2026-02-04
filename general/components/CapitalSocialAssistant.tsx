import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';

interface CapitalSocialRecord {
    associate_name: string;
    account_number: string;
    capital_value: string;
    metadata?: Record<string, string>;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface CapitalSocialAssistantProps {
    data: CapitalSocialRecord[];
    onClose: () => void;
}

export const CapitalSocialAssistant: React.FC<CapitalSocialAssistantProps> = ({ data, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Olá! Sou seu assistente do Capital Social. Tenho acesso a ${data.length} registros carregados agora. Pergunte-me sobre associados, valores ou detalhes!`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const processQuery = (query: string) => {
        const lowerQuery = query.toLowerCase();

        // Helper: Parse currency
        const parseValue = (val: string) => parseFloat(val.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const formatValue = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        // Analysis: Totals and Averages
        const totalCapital = data.reduce((acc, curr) => acc + parseValue(curr.capital_value), 0);
        const avgCapital = data.length > 0 ? totalCapital / data.length : 0;

        // Analysis: Metadata Frequencies (e.g. Cities, Professions)
        const metadataCounts: Record<string, Record<string, number>> = {};
        data.forEach(item => {
            if (item.metadata) {
                Object.entries(item.metadata).forEach(([key, val]) => {
                    const k = key.toLowerCase();
                    const v = String(val).trim();
                    if (!metadataCounts[k]) metadataCounts[k] = {};
                    if (v) metadataCounts[k][v] = (metadataCounts[k][v] || 0) + 1;
                });
            }
        });

        // Handler 1: General Summary / "Analyze"
        if (
            lowerQuery.includes('fala') || lowerQuery.includes('resumo') ||
            lowerQuery.includes('analise') || lowerQuery.includes('sobre') ||
            lowerQuery.includes('dados') || lowerQuery.includes('pessoas') ||
            lowerQuery.includes('geral')
        ) {
            let summary = `📊 **Análise Geral**\n\n`;
            summary += `• **Total de Associados**: ${data.length}\n`;
            summary += `• **Capital Total**: ${formatValue(totalCapital)}\n`;
            summary += `• **Média por Pessoa**: ${formatValue(avgCapital)}\n`;

            // Identify top metadata fields
            const interestingKeys = Object.keys(metadataCounts).filter(k => Object.keys(metadataCounts[k]).length > 1 && Object.keys(metadataCounts[k]).length < data.length); // Fields with some variation but not unique IDs

            if (interestingKeys.length > 0) {
                summary += `\n🔍 **Distribuição de Dados Extras**:\n`;
                interestingKeys.slice(0, 3).forEach(key => { // Show top 3 interesting fields
                    const counts = metadataCounts[key];
                    const topValues = Object.entries(counts)
                        .sort((a, b) => b[1] - a[1]) // Sort by frequency
                        .slice(0, 3); // Top 3 values

                    const formatKey = key.charAt(0).toUpperCase() + key.slice(1);
                    const valuesStr = topValues.map(([val, count]) => `${val} (${count})`).join(', ');
                    summary += `- **${formatKey}**: ${valuesStr}...\n`;
                });
            }

            return summary;
        }

        // Handler 2: Financial Stats (Specific)
        if (lowerQuery.includes('total') || lowerQuery.includes('soma') || lowerQuery.includes('valor')) {
            return `💰 O valor total acumulado é de **${formatValue(totalCapital)}**, com uma média de **${formatValue(avgCapital)}** por associado.`;
        }

        // Handler 3: Extremes (Rich/Poor)
        if (lowerQuery.includes('maior') || lowerQuery.includes('rico') || lowerQuery.includes('melhor')) {
            const sorted = [...data].sort((a, b) => parseValue(b.capital_value) - parseValue(a.capital_value));
            const top = sorted[0];
            return `🏆 O maior capital é de **${top.associate_name}** com **${top.capital_value}** (Conta: ${top.account_number}).`;
        }

        if (lowerQuery.includes('menor') || lowerQuery.includes('pobre')) {
            const sorted = [...data].sort((a, b) => parseValue(a.capital_value) - parseValue(b.capital_value));
            const bottom = sorted[0];
            return `O menor capital registrado é de **${bottom.associate_name}** com **${bottom.capital_value}**.`;
        }

        // Handler 4: Search (Specific Person)
        const results = data.filter(item =>
            item.associate_name.toLowerCase().includes(lowerQuery) ||
            item.account_number.includes(lowerQuery)
        );

        if (results.length === 1) {
            const item = results[0];
            let details = `👤 **${item.associate_name}**\n💳 Conta: ${item.account_number}\n💰 Capital: ${item.capital_value}`;
            if (item.metadata) {
                const metaStr = Object.entries(item.metadata)
                    .map(([key, val]) => `• ${key}: ${val}`)
                    .join('\n');
                if (metaStr) details += `\n\n📝 **Detalhes**:\n${metaStr}`;
            }
            return details;
        }

        if (results.length > 1 && results.length <= 5) {
            return `Encontrei alguns nomes parecidos:\n` + results.map(r => `- ${r.associate_name} (${r.capital_value})`).join('\n');
        }

        if (results.length > 5) {
            return `Encontrei ${results.length} pessoas com "${query}". Tente ser mais específico.`;
        }

        // Handler 5: Metadata Keyword Search (Search in professions, cities, etc)
        const metaMatches = data.filter(item =>
            item.metadata && Object.values(item.metadata).some(val => String(val).toLowerCase().includes(lowerQuery))
        );

        if (metaMatches.length > 0) {
            const sample = metaMatches.slice(0, 3).map(m => m.associate_name).join(', ');
            return `Encontrei ${metaMatches.length} registros que mencionam "${query}" nos detalhes (ex: ${sample}...).`;
        }

        return "🤔 Não entendi bem. Tente perguntar 'resumo geral', 'maior valor', 'total' ou o nome de alguém.";
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Quick realistic delay
        setTimeout(() => {
            const responseText = processQuery(userMsg.text);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 600);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-white/10 w-96 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Assistente IA</h3>
                        <p className="text-xs text-text-muted">Pergunte sobre os dados</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.sender === 'user'
                                ? 'bg-pink-600 text-white rounded-br-none'
                                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-white/5'
                                }`}
                        >
                            <div className="whitespace-pre-line">{msg.text}</div>
                            <span className="text-[10px] opacity-50 mt-1 block text-right">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-2xl rounded-bl-none p-3 border border-white/5">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-gray-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pergunte algo..."
                        className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
