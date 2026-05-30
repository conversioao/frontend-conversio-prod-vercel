import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface CatalogItem {
  name: string;
  price: string;
  stock: string;
  category: string;
}

interface CatalogUploaderProps {
  catalogData: CatalogItem[];
  lastUpdated?: string;
  onUpdate: (data: CatalogItem[]) => void;
}

export function CatalogUploader({ catalogData, lastUpdated, onUpdate }: CatalogUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('catalog', file);

    try {
      setUploading(true);
      setError(null);
      
      const res = await apiFetch('/user-agent/catalog', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Falha ao processar catálogo');
      
      const data = await res.json();
      onUpdate(data.catalog);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Catálogo de Produtos</h3>
            <p className="text-sm text-white/40 mt-1 max-w-sm">
              Carrega o teu inventário para que o agente saiba responder sobre preços, stock e disponibilidade.
            </p>
          </div>

          <div className="w-full max-w-md pt-4">
            <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/[0.05] hover:border-[#FFB800]/50 rounded-[2rem] cursor-pointer transition-all bg-black/40 hover:bg-[#FFB800]/5">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <Loader2 className="w-10 h-10 text-[#FFB800] animate-spin mb-3" />
                ) : (
                  <Upload className="w-10 h-10 text-white/20 group-hover:text-[#FFB800] mb-3 transition-colors" />
                )}
                <p className="text-sm font-bold text-white/40 group-hover:text-white transition-colors">
                  {uploading ? 'A processar ficheiro...' : 'Clica para carregar PDF, Excel ou CSV'}
                </p>
                <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest">Limite de 10MB</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 px-4 py-2 rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] text-white/20 font-black uppercase tracking-[0.2em] pt-2">
            <span>PDF</span>
            <span>•</span>
            <span>EXCEL</span>
            <span>•</span>
            <span>CSV</span>
          </div>
        </div>
      </div>

      {catalogData.length > 0 && (
        <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <h4 className="font-bold">Preview do Catálogo</h4>
            </div>
            {lastUpdated && (
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                Última atualização: {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01] text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <th className="px-8 py-4">Produto</th>
                  <th className="px-8 py-4">Categoria</th>
                  <th className="px-8 py-4 text-right">Preço</th>
                  <th className="px-8 py-4 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {catalogData.map((item, index) => (
                  <tr key={index} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-4 font-bold text-white/80">{item.name}</td>
                    <td className="px-8 py-4 text-white/40">{item.category}</td>
                    <td className="px-8 py-4 text-right font-black text-[#FFB800]">{item.price} Kz</td>
                    <td className="px-8 py-4 text-right font-medium text-white/60">{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-[#FFB800]/5 flex items-start gap-3">
             <AlertCircle size={16} className="text-[#FFB800] shrink-0 mt-0.5" />
             <p className="text-[11px] text-[#FFB800]/70 leading-relaxed">
               O agente usa estas informações para responder sobre produtos e preços. Mantém o teu catálogo sempre atualizado para evitar informações incorretas.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
