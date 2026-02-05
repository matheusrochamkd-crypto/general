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

    const DEFAULT_KEY = import.meta.env.VITE_XAI_API_KEY || "";
    // Using Grok API
    const [apiKey, setApiKey] = useState(localStorage.getItem('grok_api_key') || DEFAULT_KEY);
    const [showKeyInput, setShowKeyInput] = useState(false);

    const saveApiKey = (key: string) => {
        localStorage.setItem('grok_api_key', key);
        setApiKey(key);
        setShowKeyInput(false);
    };

    const callGrokAPI = async (userQuery: string) => {
        if (!apiKey) return "Preciso de uma chave de API para funcionar.";

        const MODELS = {
            PRIMARY: "grok-2-vision-1212", // Tentativa de usar Free/Beta/Legacy
            FALLBACK: "grok-4-latest" // Fallback pago/premium
        };

        // Context simplification
        const contextData = data.map(d => ({
            n: d.associate_name,
            c: d.capital_value,
            a: d.account_number,
            m: d.metadata
        }));

        const systemPrompt = `Atue como um analista de dados SÊNIOR e OBJETIVO.
                    
                    Dados (JSON): ${JSON.stringify(contextData)}
                    
                    REGRAS P/ RESPOSTA:
                    1. SEJA BREVE. Máximo de 3 a 5 linhas ou bullet points.
                    2. Resuma os insights. Não liste dados brutos a menos que pedido.
                    3. Use Markdown e emojis para facilitar leitura rápida.
                    4. Destaque números importantes em **negrito**.`;

        const createPayload = (model: string) => ({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            model: model,
            stream: false,
            temperature: 0
        });

        const performRequest = async (model: string) => {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(createPayload(model))
            });

            const resData = await response.json();

            if (!response.ok) {
                const msg = resData.error?.message || response.statusText;
                throw new Error(msg); // Lança erro para capturar no retry
            }

            return resData.choices?.[0]?.message?.content;
        };

        try {
            // Tenta Modelo Primário (Gratuito/Beta)
            try {
                return await performRequest(MODELS.PRIMARY);
            } catch (primaryError: any) {
                console.warn(`Erro no modelo ${MODELS.PRIMARY}, tentando fallback...`, primaryError);

                // Tenta Modelo Fallback (Pago/Premium)
                const fallbackText = await performRequest(MODELS.FALLBACK);
                return `(🔄 Fallback p/ Grok 4): ${fallbackText}`;
            }

        } catch (error: any) {
            console.error("Fetch Error:", error);
            // Fallback to internal logic with error notice
            const fallbackResponse = internalProcessQuery(userQuery);
            return `⚠️ **API Grok Instável (Todos os modelos)**: ${error.message}\n\n✅ **Alternativa Offline (Ativada)**:\n${fallbackResponse}`;
        }
    };

    const processQuery = async (query: string) => {
        if (!apiKey) {
            return "⚠️ **Modo Offline**: Para análises complexas, insira sua chave da Grok API no topo do chat.\n\n" + internalProcessQuery(query);
        }
        return await callGrokAPI(query);
    };

    const internalProcessQuery = (query: string) => {
        // ... (Keep existing heuristic logic as fallback/offline mode)
        const lowerQuery = query.toLowerCase();

        // Helper: Parse currency
        const parseValue = (val: string) => parseFloat(val.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const formatValue = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        // Analysis: Totals and Averages
        const totalCapital = data.reduce((acc, curr) => acc + parseValue(curr.capital_value), 0);
        const avgCapital = data.length > 0 ? totalCapital / data.length : 0;

        // Handler 1: Financial Stats (Specific)
        if (lowerQuery.includes('total') || lowerQuery.includes('soma') || lowerQuery.includes('valor')) {
            return `💰 (Offline) O valor total acumulado é de **${formatValue(totalCapital)}**, com uma média de **${formatValue(avgCapital)}** por associado.`;
        }
        return "Para respostas mais inteligentes ('quem ganha mais', 'analise o balanço'), conecte a API Key!";
    };

    const handleSend = async () => {
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

        const responseText = await processQuery(userMsg.text);

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-white/10 w-96 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex flex-col gap-2 bg-gray-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">IA Conectada</h3>
                            <p className="text-xs text-green-400">
                                {apiKey ? '● Grok (Ativo)' : '○ Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowKeyInput(!showKeyInput)} className="text-xs text-gray-400 hover:text-white underline">
                            {apiKey ? 'Config' : 'Ativar IA'}
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* API Key Input */}
                {showKeyInput && (
                    <div className="bg-gray-900 p-2 rounded border border-green-500/30 text-xs">
                        <p className="mb-2 text-gray-300">Chave Grok API:</p>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                className="bg-black/50 border border-gray-700 rounded p-1 flex-1 text-white"
                                placeholder={DEFAULT_KEY.substring(0, 8) + "...".substring(0, 8)}
                                onBlur={(e) => saveApiKey(e.target.value)}
                            />
                        </div>
                        <p className="mt-1 text-gray-500 text-[10px]">Usando modelo Grok-4 Latest</p>
                    </div>
                )}
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
                            <div className="whitespace-pre-wrap">{msg.text}</div>
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
                        placeholder={apiKey ? "Pergunte QUALQUER coisa aos dados..." : "Pergunte o Total (ou configure a IA)..."}
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
