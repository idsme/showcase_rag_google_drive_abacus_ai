'use client';

import { useState, useEffect } from 'react';
import { FileText, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Document {
  id: string;
  name: string;
  fileType: string;
  _count: { chunks: number };
}

export default function DocumentStatus() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string>('');
  
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data?.documents ?? []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  const handleIngestAll = async () => {
    setIsIngesting(true);
    setIngestStatus('Bezig met verwerken van documenten...');
    
    try {
      const response = await fetch('/api/ingest-all', { method: 'POST' });
      const data = await response.json();
      setIngestStatus(`Klaar! ${data?.results?.length ?? 0} documenten verwerkt.`);
      await fetchDocuments();
    } catch (error) {
      console.error('Ingestion error:', error);
      setIngestStatus('Fout bij het verwerken van documenten.');
    } finally {
      setIsIngesting(false);
      setTimeout(() => setIngestStatus(''), 5000);
    }
  };
  
  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Documenten Status</h3>
              <p className="text-xs text-slate-400">{documents?.length ?? 0} documenten geïndexeerd</p>
            </div>
          </div>
          
          <button
            onClick={handleIngestAll}
            disabled={isIngesting}
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isIngesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isIngesting ? 'Verwerken...' : 'Verwerk Documenten'}
          </button>
        </div>
        
        {ingestStatus && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-amber-300"
          >
            {ingestStatus}
          </motion.p>
        )}
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : (documents?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500/50" />
            <p>Geen documenten geïndexeerd.</p>
            <p className="text-sm">Klik op "Verwerk Documenten" om te beginnen.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {documents?.map((doc, index) => (
              <motion.div
                key={doc?.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{doc?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-500">
                    {doc?._count?.chunks ?? 0} chunks • {doc?.fileType?.toUpperCase?.() ?? 'UNKNOWN'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
