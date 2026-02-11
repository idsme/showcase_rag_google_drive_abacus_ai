'use client';

import { useState } from 'react';
import { FileText, Edit3, CheckSquare, Square, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_QUESTIONS = [
  { id: '1', text: 'Beschrijf de huidige situatie', selected: true },
  { id: '2', text: 'Wat is het belangrijkste probleem om op te lossen?', selected: true },
  { id: '3', text: 'Wat is de huidige technische situatie?', selected: true },
  { id: '4', text: 'Welke vaardigheden en resources zijn beschikbaar?', selected: false },
  { id: '5', text: 'Wat zijn de mogelijke oplossingsopties?', selected: false }
];

interface Citation {
  sourceNumber: number;
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export default function QuestionSelector() {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [showReport, setShowReport] = useState(false);
  
  const toggleQuestion = (id: string) => {
    setQuestions(prev => prev?.map(q => 
      q?.id === id ? { ...q, selected: !q?.selected } : q
    ) ?? []);
  };
  
  const updateQuestion = (id: string, text: string) => {
    setQuestions(prev => prev?.map(q => 
      q?.id === id ? { ...q, text } : q
    ) ?? []);
  };
  
  const selectedQuestions = questions?.filter(q => q?.selected) ?? [];
  
  const generateReport = async () => {
    if ((selectedQuestions?.length ?? 0) === 0) return;
    
    setIsGenerating(true);
    setReport('');
    setCitations([]);
    setShowReport(true);
    
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questions: selectedQuestions?.map(q => q?.text) ?? []
        })
      });
      
      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';
      
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines?.pop() ?? '';
        
        for (const line of lines) {
          if (line?.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data?.type === 'citations') {
                setCitations(data?.citations ?? []);
              } else if (data?.type === 'content') {
                setReport(prev => (prev ?? '') + (data?.content ?? ''));
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setReport('Er is een fout opgetreden bij het genereren van het rapport.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Questions Section */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Solution Architecture Vragen</h3>
              <p className="text-xs text-slate-400">Selecteer en pas vragen aan voor het rapport</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {questions?.map((question, index) => (
            <motion.div
              key={question?.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                question?.selected 
                  ? 'bg-indigo-900/30 border border-indigo-500/30' 
                  : 'bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50'
              }`}
            >
              <button
                onClick={() => toggleQuestion(question?.id ?? '')}
                className="flex-shrink-0 mt-1"
              >
                {question?.selected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-500">Vraag {index + 1}</span>
                  <Edit3 className="w-3 h-3 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={question?.text ?? ''}
                  onChange={(e) => updateQuestion(question?.id ?? '', e?.target?.value ?? '')}
                  className="w-full bg-transparent text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-2 py-1 -ml-2"
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-4 pb-4">
          <button
            onClick={generateReport}
            disabled={isGenerating || (selectedQuestions?.length ?? 0) === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Rapport genereren...</>
            ) : (
              <><FileText className="w-5 h-5" /> Genereer Rapport ({selectedQuestions?.length ?? 0} vragen)</>
            )}
          </button>
        </div>
      </div>
      
      {/* Report Display */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Gegenereerd Rapport</h3>
                    <p className="text-xs text-slate-400">
                      {isGenerating ? 'Bezig met genereren...' : 'Rapport klaar'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReport(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Sluiten
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-slate-300">
                  {report || (isGenerating ? 'Laden...' : '')}
                </div>
              </div>
              
              {/* Citations */}
              {(citations?.length ?? 0) > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Bronverwijzingen
                  </h4>
                  <div className="space-y-2">
                    {citations?.map((citation, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-emerald-400">[Bron {citation?.sourceNumber ?? idx + 1}]</span>
                          <div>
                            <p className="text-slate-300">{citation?.documentName ?? 'Unknown'}</p>
                            <p className="text-slate-500">Pagina {citation?.pageNumber ?? 0}</p>
                            <p className="text-slate-400 mt-1 italic">"{citation?.snippet ?? ''}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
