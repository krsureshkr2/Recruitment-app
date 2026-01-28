
import React, { useState, useRef, useEffect } from 'react';
import { Candidate } from '../types';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { askAboutCandidate } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIClarityAssistantProps {
  candidate: Candidate;
  onClose: () => void;
}

const AIClarityAssistant: React.FC<AIClarityAssistantProps> = ({ candidate, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello! I've analyzed ${candidate.name}'s profile. Do you have any specific questions about their experience, skills, or career trajectory?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askAboutCandidate(candidate, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to connect to AI assistant. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-96 h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Clarity Assistant</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Reviewing: {candidate.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-sm'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-center bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assistant Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask about skills, gaps, or potential..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              input.trim() && !isLoading ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-3">
          AI insights based on extracted CV and web indices.
        </p>
      </div>
    </div>
  );
};

export default AIClarityAssistant;
