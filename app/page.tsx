import { Sparkles, MessageSquare, FileSearch, Lightbulb } from 'lucide-react';
import ChatInterface from '@/components/chat-interface';
import QuestionSelector from '@/components/question-selector';
import DocumentStatus from '@/components/document-status';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/70 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">RAG Startup Coach</h1>
                <p className="text-xs text-slate-400">Document Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-teal-500/10 text-teal-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">
              Vraag je documenten alles met <span className="text-teal-400">AI</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Upload projectdocumenten en krijg direct antwoord op al je vragen over 
              het Waterschapswerken Projectenplatform met bronvermelding.
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-teal-500/30 transition-colors">
              <div className="p-2 bg-teal-500/10 rounded-lg w-fit mb-3">
                <FileSearch className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">RAG Technologie</h3>
              <p className="text-sm text-slate-400">Semantische zoektechnologie vindt relevante informatie in je documenten.</p>
            </div>
            
            <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-blue-500/30 transition-colors">
              <div className="p-2 bg-blue-500/10 rounded-lg w-fit mb-3">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Interactieve Chat</h3>
              <p className="text-sm text-slate-400">Stel vragen in natuurlijke taal en krijg direct antwoord.</p>
            </div>
            
            <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-purple-500/30 transition-colors">
              <div className="p-2 bg-purple-500/10 rounded-lg w-fit mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Rapport Generatie</h3>
              <p className="text-sm text-slate-400">Genereer gestructureerde rapporten met bronvermelding.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Chat */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-semibold text-white">Chat met Documenten</h2>
            </div>
            <ChatInterface />
          </div>
          
          {/* Right Column - Questions & Report */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Solution Architecture Rapport</h2>
            </div>
            <QuestionSelector />
          </div>
        </div>
        
        {/* Document Status */}
        <div className="mt-12">
          <DocumentStatus />
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">
            RAG Startup Coach • Powered by AI Document Intelligence
          </p>
        </div>
      </footer>
    </main>
  );
}
