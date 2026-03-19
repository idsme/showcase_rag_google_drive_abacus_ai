import { Sparkles, MessageSquare, FileSearch, Lightbulb } from 'lucide-react';
import ChatInterface from '@/components/chat-interface';
import QuestionSelector from '@/components/question-selector';
import DocumentStatus from '@/components/document-status';

export default function Home() {
  return (
    <main className="min-h-screen bg-bv-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bv-accent border-b border-bv-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Lightbulb className="w-6 h-6 text-bv-text-inverse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-bv-text-inverse">RAG Startup Coach</h1>
                <p className="text-xs text-bv-text-inverse/70">Document Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white/15 text-bv-text-inverse text-xs font-medium rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-bv-accent/5" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-bv-text mb-4">
              Vraag je documenten alles met <span className="text-bv-accent">AI</span>
            </h2>
            <p className="text-bv-text-muted text-lg">
              Upload projectdocumenten en krijg direct antwoord op al je vragen over 
              het Waterschapswerken Projectenplatform met bronvermelding.
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            <div className="p-5 bg-bv-surface-alt rounded-lg border border-bv-border hover:border-bv-accent/40 transition-colors">
              <div className="p-2 bg-bv-accent/10 rounded-lg w-fit mb-3">
                <FileSearch className="w-5 h-5 text-bv-accent" />
              </div>
              <h3 className="font-semibold text-bv-text mb-1">RAG Technologie</h3>
              <p className="text-sm text-bv-text-muted">Semantische zoektechnologie vindt relevante informatie in je documenten.</p>
            </div>
            
            <div className="p-5 bg-bv-surface-alt rounded-lg border border-bv-border hover:border-bv-info/40 transition-colors">
              <div className="p-2 bg-bv-info/10 rounded-lg w-fit mb-3">
                <MessageSquare className="w-5 h-5 text-bv-info" />
              </div>
              <h3 className="font-semibold text-bv-text mb-1">Interactieve Chat</h3>
              <p className="text-sm text-bv-text-muted">Stel vragen in natuurlijke taal en krijg direct antwoord.</p>
            </div>
            
            <div className="p-5 bg-bv-surface-alt rounded-lg border border-bv-border hover:border-bv-success/40 transition-colors">
              <div className="p-2 bg-bv-success/10 rounded-lg w-fit mb-3">
                <Sparkles className="w-5 h-5 text-bv-success" />
              </div>
              <h3 className="font-semibold text-bv-text mb-1">Rapport Generatie</h3>
              <p className="text-sm text-bv-text-muted">Genereer gestructureerde rapporten met bronvermelding.</p>
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
              <MessageSquare className="w-5 h-5 text-bv-accent" />
              <h2 className="text-xl font-semibold text-bv-text">Chat met Documenten</h2>
            </div>
            <ChatInterface />
          </div>
          
          {/* Right Column - Questions & Report */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-bv-accent" />
              <h2 className="text-xl font-semibold text-bv-text">Solution Architecture Rapport</h2>
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
      <footer className="bg-bv-accent py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-bv-text-inverse/80">
            RAG Startup Coach • Powered by AI Document Intelligence
          </p>
        </div>
      </footer>
    </main>
  );
}