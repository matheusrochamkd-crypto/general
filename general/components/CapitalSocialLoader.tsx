import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface CapitalSocialRecord {
    associate_name: string;
    account_number: string;
    capital_value: string;
    // Helper for table display
    parsedValue?: number;
}

export const CapitalSocialLoader: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<CapitalSocialRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
                    // Normalize keys to lowercase and map to our interface
                    const normalizedData: CapitalSocialRecord[] = results.data.map((row: any) => ({
                        associate_name: row['Nome'] || row['nome'] || row['Associado'] || row['associado'] || 'Desconhecido',
                        account_number: row['Conta'] || row['conta'] || 'N/A',
                        capital_value: row['Valor'] || row['valor'] || row['Capital'] || row['capital'] || '0',
                    }));

                    // Simple validation
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
            // Prepare data for insertion (cleaning values)
            const rowsToInsert = data.map(record => ({
                user_id: user.id,
                associate_name: record.associate_name,
                account_number: record.account_number,
                capital_value: parseFloat(record.capital_value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
            }));

            const { error: dbError } = await supabase
                .from('capital_social')
                .insert(rowsToInsert);

            if (dbError) throw dbError;

            setSuccessMessage("Dados salvos no banco de dados com sucesso!");
            setData([]); // Clear after save? or keep?
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao salvar no Supabase. Verifique se a tabela 'capital_social' existe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-6 h-6 text-purple-400" />
                            Carregar Capital Social
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Importe arquivos CSV com: Nome, Conta, Valor</p>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors group">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                        disabled={loading}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                        <div className="p-4 bg-gray-700 rounded-full group-hover:bg-purple-500/20 transition-colors">
                            <Upload className="w-8 h-8 text-gray-300 group-hover:text-purple-400" />
                        </div>
                        <span className="text-gray-300 font-medium group-hover:text-white">
                            Clique para selecionar um arquivo CSV
                        </span>
                        <span className="text-xs text-gray-500">
                            (Formatos aceitos: .csv)
                        </span>
                    </label>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-200 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        {successMessage}
                    </div>
                )}
            </div>

            {/* Data Preview */}
            {data.length > 0 && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                        <h3 className="text-lg font-semibold text-white">Pré-visualização ({data.length} registros)</h3>
                        <button
                            onClick={handleSaveToDatabase}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Salvando...' : 'Salvar no Sistema'}
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900/50 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Associado</th>
                                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Conta</th>
                                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Valor Capital</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 text-sm text-gray-200 font-medium">{row.associate_name}</td>
                                        <td className="p-4 text-sm text-gray-400 font-mono">{row.account_number}</td>
                                        <td className="p-4 text-sm text-emerald-400 font-mono text-right font-medium">
                                            {row.capital_value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
