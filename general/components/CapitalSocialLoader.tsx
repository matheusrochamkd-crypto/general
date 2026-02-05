import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, Save, CheckCircle2, MessageSquare, Table as TableIcon, Trash2, Edit2, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CapitalSocialAssistant } from './CapitalSocialAssistant';

interface CapitalSocialRecord {
    id?: string; // Optional for new records
    associate_name: string;
    account_number: string;
    capital_value: string; // Display as string
    metadata: Record<string, string>;
    [key: string]: any;
}

export const CapitalSocialLoader: React.FC = () => {
    const { user } = useAuth();
    const [dbData, setDbData] = useState<CapitalSocialRecord[]>([]);
    const [previewData, setPreviewData] = useState<CapitalSocialRecord[]>([]);
    const [headers, setHeaders] = useState<string[]>(['Nome', 'Conta', 'Valor']); // Default headers

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showAssistant, setShowAssistant] = useState(false);
    const [showTable, setShowTable] = useState(false); // Default: hidden

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<CapitalSocialRecord | null>(null);

    // Fetch Data
    const fetchCapitalSocial = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('capital_social')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map DB structure to UI structure
            const formatted: CapitalSocialRecord[] = data.map(item => ({
                id: item.id,
                associate_name: item.associate_name,
                account_number: item.account_number,
                capital_value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.capital_value),
                metadata: item.metadata || {},
                ...item.metadata // Spread metadata for display if needed
            }));

            setDbData(formatted);

            // Update headers based on metadata keys from first few records if any
            const dynamicKeys = new Set<string>();
            formatted.forEach(item => {
                if (item.metadata) {
                    Object.keys(item.metadata).forEach(k => {
                        if (!/^_\d+$/.test(k)) dynamicKeys.add(k);
                    });
                }
            });
            if (dynamicKeys.size > 0) {
                setHeaders(['Nome', 'Conta', 'Valor', ...Array.from(dynamicKeys)]);
            }

        } catch (err: any) {
            console.error(err);
            setError("Erro ao buscar dados.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCapitalSocial();
    }, [fetchCapitalSocial]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setShowTable(true); // Auto-show table on fresh upload for preview

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const foundHeaders = results.meta.fields || [];
                    const extraHeaders = foundHeaders.filter(h =>
                        !['Nome', 'Conta', 'Valor'].includes(h) && !/^_\d+$/.test(h)
                    );
                    setHeaders(['Nome', 'Conta', 'Valor', ...extraHeaders]);

                    const normalizedData: CapitalSocialRecord[] = results.data.map((row: any) => {
                        const name = row['Nome'] || row['nome'] || row['Associado'] || row['associado'] || 'Desconhecido';
                        const account = row['Conta'] || row['conta'] || 'N/A';
                        const value = row['Valor'] || row['valor'] || row['Capital'] || row['capital'] || '0';

                        const metadata: Record<string, string> = {};
                        Object.keys(row).forEach(key => {
                            const lowerKey = key.toLowerCase();
                            // Filter out standard keys AND artifact keys like _1, _2...
                            if (!['nome', 'associado', 'conta', 'valor', 'capital'].includes(lowerKey) && !/^_\d+$/.test(key)) {
                                metadata[key] = row[key];
                            }
                        });

                        return {
                            associate_name: name,
                            account_number: account,
                            capital_value: value,
                            metadata: metadata,
                            ...row
                        };
                    });

                    if (normalizedData.length === 0) throw new Error("Arquivo vazio.");
                    setPreviewData(normalizedData);
                    setSuccessMessage(`Arquivo lido! ${normalizedData.length} registros prontos para salvar.`);
                } catch (err: any) {
                    setError(err.message || "Erro ao processar.");
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

    const handleSavePreview = async () => {
        if (!user || previewData.length === 0) return;
        setLoading(true);
        try {
            const rowsToInsert = previewData.map(record => ({
                user_id: user.id,
                associate_name: record.associate_name,
                account_number: record.account_number,
                capital_value: parseFloat(record.capital_value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0,
                metadata: record.metadata
            }));

            // 1. Delete all existing records for this user (User Request: Overwrite on new upload)
            const { error: deleteError } = await supabase
                .from('capital_social')
                .delete()
                .eq('user_id', user.id); // Explicit safety check, though RLS handles it

            if (deleteError) throw deleteError;

            // 2. Insert new records
            const { error: dbError } = await supabase.from('capital_social').insert(rowsToInsert);
            if (dbError) throw dbError;

            setSuccessMessage("Dados importados com sucesso!");
            setPreviewData([]); // Clear preview
            setShowTable(false); // Hide table after save, as requested
            fetchCapitalSocial(); // Refresh list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro?")) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('capital_social').delete().eq('id', id);
            if (error) throw error;
            setDbData(prev => prev.filter(item => item.id !== id));
            setSuccessMessage("Registro excluído.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (record: CapitalSocialRecord) => {
        setEditingId(record.id || null);
        setEditForm({ ...record });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEdit = async () => {
        if (!editForm || !editForm.id) return;
        setLoading(true);
        try {
            const val = typeof editForm.capital_value === 'string'
                ? parseFloat(editForm.capital_value.replace(/[^\d,-]/g, '').replace(',', '.'))
                : editForm.capital_value;

            const { error } = await supabase
                .from('capital_social')
                .update({
                    associate_name: editForm.associate_name,
                    account_number: editForm.account_number,
                    capital_value: val,
                    metadata: editForm.metadata // Save the updated metadata
                })
                .eq('id', editForm.id);

            if (error) throw error;

            setSuccessMessage("Registro atualizado!");
            setEditingId(null);
            setEditForm(null);
            fetchCapitalSocial();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const activeData = previewData.length > 0 ? previewData : dbData;
    const isPreview = previewData.length > 0;
    const hasData = dbData.length > 0;

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden p-6 max-w-[95vw] mx-auto">
            <div className={`flex-1 flex flex-col space-y-6 overflow-y-auto min-w-0 transition-all duration-300 ${showAssistant ? 'mr-2' : ''}`}>

                {/* Header Card */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-6 h-6 text-pink-400" />
                                Gestão de Capital Social
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {isPreview ? 'Pré-visualizando importação de CSV' : `${dbData.length} registros armazenados`}
                            </p>
                        </div>

                        {/* Global Actions (Import, AI, Refresh) */}
                        <div className="flex gap-2">
                            {/* Toggle Table Visibility */}
                            {hasData && !isPreview && (
                                <button
                                    onClick={() => setShowTable(!showTable)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showTable
                                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    {showTable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {showTable ? 'Ocultar Tabela' : 'Ver Tabela'}
                                </button>
                            )}

                            {/* Toggle AI Chat */}
                            {activeData.length > 0 && (
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
                    </div>

                    {/* Actions: Upload or Save */}
                    {!isPreview ? (
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors border border-gray-600 hover:border-pink-500">
                                <Upload className="w-4 h-4" />
                                <span>Importar Novos Dados (.csv)</span>
                                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={loading} />
                            </label>

                            <button onClick={fetchCapitalSocial} className="p-2 text-gray-400 hover:text-white" title="Atualizar">
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-pink-500/30">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-pink-400" />
                                <span className="text-pink-100">Confira os dados abaixo antes de salvar.</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setPreviewData([]); setShowTable(false); }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSavePreview}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-lg shadow-pink-900/20"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Salvando...' : 'Confirmar Importação'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-200">
                            <X className="w-5 h-5 shrink-0 cursor-pointer" onClick={() => setError(null)} />
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

                {/* Table Area (Conditional) */}
                {(showTable || isPreview) && activeData.length > 0 && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col shadow-lg overflow-hidden flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-gray-900 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 w-12 bg-gray-900 border-b border-gray-700"></th> {/* Actions */}
                                        <th className="p-4 text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-700 bg-gray-900">Nome</th>
                                        <th className="p-4 text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-700 bg-gray-900">Conta</th>
                                        <th className="p-4 text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-700 bg-gray-900 text-right">Valor</th>
                                        {/* Only show extra metadata cols if explicitly found, or just show 'Detalhes' */}
                                        {headers.slice(3).map(h => (
                                            <th key={h} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 bg-gray-900">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {activeData.map((row, idx) => {
                                        const isEditing = editingId === row.id;

                                        return (
                                            <tr key={row.id || idx} className={`transition-colors ${isEditing ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'}`}>
                                                {/* Actions */}
                                                <td className="p-4 flex gap-2">
                                                    {!isPreview && (
                                                        isEditing ? (
                                                            <>
                                                                <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                                                                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-300"><X className="w-4 h-4" /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEdit(row)} className="text-blue-400 hover:text-blue-300"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDelete(row.id!)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                                            </>
                                                        )
                                                    )}
                                                </td>

                                                {/* Cells */}
                                                <td className="p-4 text-sm text-gray-200">
                                                    {isEditing ? (
                                                        <input
                                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white w-full"
                                                            value={editForm?.associate_name}
                                                            onChange={e => setEditForm(prev => prev ? ({ ...prev, associate_name: e.target.value }) : null)}
                                                        />
                                                    ) : row.associate_name}
                                                </td>

                                                <td className="p-4 text-sm text-gray-400 font-mono">
                                                    {isEditing ? (
                                                        <input
                                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white w-full"
                                                            value={editForm?.account_number}
                                                            onChange={e => setEditForm(prev => prev ? ({ ...prev, account_number: e.target.value }) : null)}
                                                        />
                                                    ) : row.account_number}
                                                </td>

                                                <td className="p-4 text-sm text-emerald-400 font-mono text-right font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-right w-full"
                                                            value={editForm?.capital_value}
                                                            onChange={e => setEditForm(prev => prev ? ({ ...prev, capital_value: e.target.value }) : null)}
                                                        />
                                                    ) : row.capital_value}
                                                </td>

                                                {/* Metadata Columns */}
                                                {headers.slice(3).map(h => (
                                                    <td key={h} className="p-4 text-xs text-gray-500">
                                                        {isEditing ? (
                                                            <input
                                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs w-full"
                                                                value={editForm?.metadata?.[h] || ''}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setEditForm(prev => {
                                                                        if (!prev) return null;
                                                                        return {
                                                                            ...prev,
                                                                            metadata: {
                                                                                ...prev.metadata,
                                                                                [h]: val
                                                                            }
                                                                        };
                                                                    });
                                                                }}
                                                            />
                                                        ) : (
                                                            row.metadata?.[h] || row[h] || '-'
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                    {activeData.length === 0 && (
                                        <tr>
                                            <td colSpan={headers.length + 1} className="p-10 text-center text-gray-500">
                                                {loading ? 'Carregando...' : 'Nenhum registro encontrado.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Assistant Sidebar */}
            {showAssistant && (
                <CapitalSocialAssistant
                    data={activeData}
                    onClose={() => setShowAssistant(false)}
                />
            )}
        </div>
    );
};
