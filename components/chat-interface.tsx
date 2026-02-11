'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Citation {
  documentName: string;
  pageNumber: number;
  snippet: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!input?.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...(prev ?? []), userMessage]);
    setInput('');
    setIsLoading(true);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      citations: []
    };
    
    setMessages(prev => [...(prev ?? []), assistantMessage]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
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
                setMessages(prev => {
                  const updated = [...(prev ?? [])];
                  const last = updated[updated.length - 1];
                  if (last) last.citations = data?.citations ?? [];
                  return updated;
                });
              } else if (data?.type === 'content') {
                setMessages(prev => {
                  const updated = [...(prev ?? [])];
                  const last = updated[updated.length - 1];
                  if (last) last.content += data?.content ?? '';
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...(prev ?? [])];
        const last = updated[updated.length - 1];
        if (last) last.content = 'Sorry, er is een fout opgetreden. Probeer het opnieuw.';
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[600px] bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-900/50 to-teal-900/50 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Startup Coach</h3>
            <p className="text-xs text-slate-400">Vraag me alles over het project</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <Bot className="w-12 h-12 mb-3 text-teal-500/50" />
            <p>Welkom! Stel een vraag over de projectdocumenten.</p>
          </div>
        )}
        
        <AnimatePresence mode="popLayout">
          {messages?.map((message) => (
            <motion.div
              key={message?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${message?.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message?.role === 'assistant' && (
                <div className="flex-shrink-0 p-2 bg-teal-500/20 rounded-lg h-fit">
                  <Bot className="w-4 h-4 text-teal-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message?.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-xl px-4 py-3 ${
                  message?.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{message?.content || (isLoading ? '...' : '')}</p>
                </div>
                
                {/* Citations */}
                {message?.role === 'assistant' && (message?.citations?.length ?? 0) > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Bronnen:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {message?.citations?.map((citation, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-slate-800/80 text-teal-400 px-2 py-1 rounded-md"
                          title={citation?.snippet ?? ''}
                        >
                          {citation?.documentName?.slice(0, 30) ?? 'Unknown'}... (p.{citation?.pageNumber ?? 0})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {message?.role === 'user' && (
                <div className="flex-shrink-0 p-2 bg-blue-600/20 rounded-lg h-fit">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e?.target?.value ?? '')}
            placeholder="Stel een vraag over het project..."
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="px-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
