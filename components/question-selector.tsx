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
      <div className="bg-bv-surface-alt rounded-lg border border-bv-border overflow-hidden">
        <div className="px-6 py-4 bg-bv-accent border-b border-bv-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-bv-text-inverse" />
            </div>
            <div>
              <h3 className="font-semibold text-bv-text-inverse">Solution Architecture Vragen</h3>
              <p className="text-xs text-bv-text-inverse/70">Selecteer en pas vragen aan voor het rapport</p>
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
                  ? 'bg-bv-accent/10 border border-bv-accent/30' 
                  : 'bg-bv-surface border border-bv-border hover:bg-bv-surface-hover'
              }`}
            >
              <button
                onClick={() => toggleQuestion(question?.id ?? '')}
                className="flex-shrink-0 mt-1"
              >
                {question?.selected ? (
                  <CheckSquare className="w-5 h-5 text-bv-accent" />
                ) : (
                  <Square className="w-5 h-5 text-bv-text-muted" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-bv-text-muted">Vraag {index + 1}</span>
                  <Edit3 className="w-3 h-3 text-bv-text-muted" />
                </div>
                <input
                  type="text"
                  value={question?.text ?? ''}
                  onChange={(e) => updateQuestion(question?.id ?? '', e?.target?.value ?? '')}
                  className="w-full bg-transparent text-bv-text text-sm focus:outline-none focus:ring-1 focus:ring-bv-accent/50 rounded px-2 py-1 -ml-2"
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-4 pb-4">
          <button
            onClick={generateReport}
            disabled={isGenerating || (selectedQuestions?.length ?? 0) === 0}
            className="w-full py-3 bg-bv-accent hover:bg-bv-accent-hover disabled:opacity-50 text-bv-text-inverse font-medium rounded-lg transition-all flex items-center justify-center gap-2"
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
            className="bg-bv-surface-alt rounded-lg border border-bv-border overflow-hidden"
          >
            <div className="px-6 py-4 bg-bv-accent-subtle border-b border-bv-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-bv-success/15 rounded-lg">
                    <FileText className="w-5 h-5 text-bv-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-bv-text">Gegenereerd Rapport</h3>
                    <p className="text-xs text-bv-text-muted">
                      {isGenerating ? 'Bezig met genereren...' : 'Rapport klaar'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReport(false)}
                  className="text-bv-text-muted hover:text-bv-text text-sm"
                >
                  Sluiten
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-bv-text">
                  {report || (isGenerating ? 'Laden...' : '')}
                </div>
              </div>
              
              {/* Citations */}
              {(citations?.length ?? 0) > 0 && (
                <div className="mt-6 pt-6 border-t border-bv-border">
                  <h4 className="text-sm font-semibold text-bv-text mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-bv-accent" />
                    Bronverwijzingen
                  </h4>
                  <div className="space-y-2">
                    {citations?.map((citation, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-bv-surface rounded-lg p-3 border border-bv-border"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-bv-accent">[Bron {citation?.sourceNumber ?? idx + 1}]</span>
                          <div>
                            <p className="text-bv-text">{citation?.documentName ?? 'Unknown'}</p>
                            <p className="text-bv-text-muted">Pagina {citation?.pageNumber ?? 0}</p>
                            <p className="text-bv-text-muted mt-1 italic">"{citation?.snippet ?? ''}"</p>
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
