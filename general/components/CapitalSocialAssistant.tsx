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
        let response = "Desculpe, não entendi. Tente perguntar sobre um nome específico ou totais.";

        // 1. Total Capital
        if (lowerQuery.includes('total') || lowerQuery.includes('soma')) {
            const total = data.reduce((acc, curr) => {
                const val = parseFloat(curr.capital_value.replace('.', '').replace(',', '.')) || 0;
                return acc + val;
            }, 0);
            response = `O valor total do Capital Social carregado é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}.`;
        }
        // 2. Highest Value
        else if (lowerQuery.includes('maior') || lowerQuery.includes('maximo') || lowerQuery.includes('rico')) {
            const sorted = [...data].sort((a, b) => {
                const valA = parseFloat(a.capital_value.replace('.', '').replace(',', '.')) || 0;
                const valB = parseFloat(b.capital_value.replace('.', '').replace(',', '.')) || 0;
                return valB - valA;
            });
            const top = sorted[0];
            if (top) {
                response = `O associado com maior capital é **${top.associate_name}** com ${top.capital_value}. (Conta: ${top.account_number})`;
            }
        }
        // 3. Search by Name
        else {
            const results = data.filter(item =>
                item.associate_name.toLowerCase().includes(lowerQuery) ||
                item.account_number.includes(lowerQuery)
            );

            if (results.length === 1) {
                const item = results[0];
                let details = `Encontrei: **${item.associate_name}**\nConta: ${item.account_number}\nCapital: ${item.capital_value}`;

                // Add metadata details if any
                if (item.metadata) {
                    const metaStr = Object.entries(item.metadata)
                        .map(([key, val]) => `- ${key}: ${val}`)
                        .join('\n');
                    if (metaStr) details += `\n\nOutros dados:\n${metaStr}`;
                }
                response = details;
            } else if (results.length > 1 && results.length < 10) {
                const names = results.map(r => r.associate_name).join(', ');
                response = `Encontrei ${results.length} associados com esse termo: ${names}. Seja mais específico para ver detalhes.`;
            } else if (results.length >= 10) {
                response = `Encontrei muitos associados (${results.length}) com esse termo. Por favor, especifique melhor o nome.`;
            } else {
                // Try searching in metadata
                const metaResults = data.filter(item =>
                    item.metadata && Object.values(item.metadata).some(val => String(val).toLowerCase().includes(lowerQuery))
                );

                if (metaResults.length > 0) {
                    response = `Encontrei ${metaResults.length} registros com essa informação nos dados extras (metadados). O primeiro é: ${metaResults[0].associate_name}.`;
                } else {
                    response = `Não encontrei nenhum associado combatendo com "${query}".`;
                }
            }
        }

        return response;
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

        // Simulate AI delay
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
        }, 800);
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
