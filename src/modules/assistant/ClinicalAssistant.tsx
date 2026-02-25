import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../core/types/product.types';
import { AIService } from '../../services/AIService';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ClinicalAssistantProps {
  contextProducts: Product[];
}

export const ClinicalAssistant: React.FC<ClinicalAssistantProps> = ({ contextProducts }) => {
  const { hardware } = useHardwareDetection();
  
  const initialMessage = contextProducts.length > 1
    ? `Hola. Soy el Asistente Clínico Local. Estoy analizando ${contextProducts.length} medicamentos seleccionados (${contextProducts.map(p => p.nombre_comercial).join(', ')}). ¿Deseas que analice posibles interacciones o duplicidades terapéuticas?`
    : `Hola. Soy el Asistente Clínico Local. Estoy analizando ${contextProducts[0]?.nombre_comercial}. ¿Qué deseas saber sobre sus indicaciones, posología o advertencias?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: initialMessage
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ text: string; progress: number }>({ text: 'Inicializando motor de IA...', progress: 0 });
  const [isAiReady, setIsAiReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar IA cuando el componente se monta
  useEffect(() => {
    if (!hardware) return;

    const initAI = async () => {
      AIService.setProgressCallback((text, progress) => {
        setAiStatus({ text, progress });
        if (progress === 100) setIsAiReady(true);
      });

      await AIService.initialize(hardware);
      const status = AIService.getStatus();
      setIsAiReady(status.isReady || status.engine === 'Simulación');
    };

    initAI();
  }, [hardware]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !isAiReady) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await AIService.analyze(userMsg.content, contextProducts);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'system', content: 'Error al generar la respuesta. Por favor, intente nuevamente.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header del Asistente */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">Razonamiento Clínico Local</h3>
            <p className="text-[10px] text-indigo-600 font-medium">
              {hardware?.aiModelTier === 'HIGH' ? 'WebLLM (GPU)' : hardware?.aiModelTier === 'LOW' ? 'Transformers.js (CPU)' : 'Modo Simulación'}
            </p>
          </div>
        </div>
        
        {/* Barra de Progreso de Inicialización */}
        {!isAiReady && (
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="truncate max-w-[150px]">{aiStatus.text}</span>
          </div>
        )}
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-slate-800 text-white' : 
              msg.role === 'system' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : 
               msg.role === 'system' ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 
              msg.role === 'system' ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-li:marker:text-indigo-500">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Chat */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isAiReady || isTyping}
            placeholder={isAiReady ? "Pregunta sobre interacciones, dosis..." : "Cargando modelo de IA..."}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isAiReady || isTyping}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
