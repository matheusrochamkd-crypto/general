import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, Save, CheckCircle2, MessageSquare, Table as TableIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CapitalSocialAssistant } from './CapitalSocialAssistant';

// Now dynamic!
interface CapitalSocialRecord {
    associate_name: string;
    account_number: string;
    capital_value: string;
    metadata: Record<string, string>; // Store all other CSV columns here
    [key: string]: any; // Allow index access for display
}

export const CapitalSocialLoader: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<CapitalSocialRecord[]>([]);
    const [headers, setHeaders] = useState<string[]>([]); // To store CSV headers
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showAssistant, setShowAssistant] = useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    if (results.meta.fields) {
                        setHeaders(results.meta.fields);
                    }

                    // Process dynamic data
                    const normalizedData: CapitalSocialRecord[] = results.data.map((row: any) => {
                        // Extract mandatory fields (flexible naming)
                        const name = row['Nome'] || row['nome'] || row['Associado'] || row['associado'] || 'Desconhecido';
                        const account = row['Conta'] || row['conta'] || 'N/A';
                        const value = row['Valor'] || row['valor'] || row['Capital'] || row['capital'] || '0';

                        // Store EVERYTHING else in metadata
                        const metadata: Record<string, string> = {};
                        Object.keys(row).forEach(key => {
                            // Exclude the main fields from metadata if they were found under their common names
                            const lowerKey = key.toLowerCase();
                            if (!['nome', 'associado', 'conta', 'valor', 'capital'].includes(lowerKey)) {
                                metadata[key] = row[key];
                            }
                        });

                        return {
                            associate_name: name,
                            account_number: account,
                            capital_value: value,
                            metadata: metadata,
                            ...row // Spread original row for easy table display by header key
                        };
                    });

                    if (normalizedData.length === 0) {
                        throw new Error("Nenhum dado encontrado no arquivo.");
                    }

                    setData(normalizedData);
                    setSuccessMessage(`Arquivo processado! ${normalizedData.length} registros encontrados.`);
                } catch (err: any) {
                    setError(err.message || "Erro ao processar dados.");
                } finally {
                    setLoading(false);
                }
            },
            error: (err) => {
                setError(`Erro ao ler arquivo: ${err.message}`);
                setLoading(false);
            }
        });
    };

    const handleSaveToDatabase = async () => {
        if (!user) {
            setError("Usuário não autenticado.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const rowsToInsert = data.map(record => ({
                user_id: user.id,
                associate_name: record.associate_name,
                account_number: record.account_number,
                capital_value: parseFloat(record.capital_value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0,
                metadata: record.metadata // Inserting JSONB
            }));

            const { error: dbError } = await supabase
                .from('capital_social')
                .insert(rowsToInsert);

            if (dbError) throw dbError;

            setSuccessMessage("Dados salvos com sucesso! (Colunas extras salvas em metadados)");
            setData([]); // Clear after save? or keep?
            setHeaders([]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao salvar. Verifique se a tabela 'capital_social' tem a coluna 'metadata'.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden p-6 max-w-[95vw] mx-auto">
            {/* Main Area */}
            <div className={`flex-1 flex flex-col space-y-6 overflow-y-auto min-w-0 transition-all duration-300 ${showAssistant ? 'mr-2' : ''}`}>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-6 h-6 text-pink-400" />
                                Carregar Capital Social
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Importe CSV. Colunas são detectadas automaticamente.
                            </p>
                        </div>

                        {/* Toggle Assistant */}
                        {data.length > 0 && (
                            <button
                                onClick={() => setShowAssistant(!showAssistant)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showAssistant
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                {showAssistant ? 'Ocultar Chat' : 'Conversar com IA'}
                            </button>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-pink-500 transition-colors group">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="csv-upload"
                            disabled={loading}
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                            <div className="p-4 bg-gray-700 rounded-full group-hover:bg-pink-500/20 transition-colors">
                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-pink-400" />
                            </div>
                            <span className="text-gray-300 font-medium group-hover:text-white">
                                {loading ? 'Processando...' : 'Clique para selecionar um arquivo CSV'}
                            </span>
                        </label>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-200">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-200">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            {successMessage}
                        </div>
                    )}
                </div>

                {/* Dynamic Data Table */}
                {data.length > 0 && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col shadow-lg overflow-hidden flex-1 min-h-0">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/90 z-10">
                            <div className="flex items-center gap-2">
                                <TableIcon className="w-4 h-4 text-purple-400" />
                                <h3 className="text-lg font-semibold text-white">
                                    Dados Carregados ({data.length})
                                </h3>
                            </div>
                            <button
                                onClick={handleSaveToDatabase}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Salvando...' : 'Salvar Tudo'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-gray-900 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {headers.map((header) => (
                                            <th key={header} className="p-4 text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-700 bg-gray-900">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                                            {headers.map((header) => (
                                                <td key={`${idx}-${header}`} className="p-4 text-sm text-gray-300 border-r border-gray-800 last:border-r-0">
                                                    {row[header]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Assistant Sidebar */}
            {showAssistant && (
                <CapitalSocialAssistant
                    data={data}
                    onClose={() => setShowAssistant(false)}
                />
            )}
        </div>
    );
};
