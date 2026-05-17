import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../core/types/product.types';
import { aiService } from '../../services/AIService';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { medicalRAGService } from '../../services/MedicalRAGService';

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
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Verificar estado inicial sin forzar arranque
  useEffect(() => {
    const status = aiService.getStatus();
    setIsAiReady(status.isReady);
    setIsInitializing(status.isInitializing);
    if (status.isInitializing) {
      setAiStatus(status.lastProgress);
      // Si ya se estaba inicializando en otro lado, suscribirse al progreso
      aiService.setProgressCallback((text, progress) => {
        setAiStatus({ text, progress });
        if (progress === 100) {
          setIsAiReady(true);
          setIsInitializing(false);
        }
      });
    }
  }, []);

  const handleActivateAI = async () => {
    if (!hardware || isInitializing || isAiReady) return;
    
    setIsInitializing(true);
    aiService.setProgressCallback((text, progress) => {
      setAiStatus({ text, progress });
      if (progress === 100) {
        setIsAiReady(true);
        setIsInitializing(false);
      }
    });

    await aiService.startEngine();
    
    const status = aiService.getStatus();
    setIsAiReady(status.isReady);
    setIsInitializing(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !isAiReady) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const principles = contextProducts
        .flatMap(p => p.principios_activos || [])
        .filter((value, index, self) => self.indexOf(value) === index);
        
      const insights = await medicalRAGService.retrieveClinicalContext(principles);
      const ragContext = insights.length > 0
        ? `\n\n${medicalRAGService.formatInsightsForPrompt(insights)}`
        : '';
        
      const response = await aiService.analyze(userMsg.content + ragContext, contextProducts);
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
    <div className="flex flex-col h-[500px] bg-background border border-border rounded-lg overflow-hidden">
      {/* Header del Asistente */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Razonamiento Clínico</h3>
            <p className="text-xs text-muted-foreground">
              {hardware?.aiModelTier === 'HIGH' ? 'WebLLM (GPU)' : hardware?.aiModelTier === 'LOW' ? 'Transformers.js (CPU)' : 'Modo Simulación'}
            </p>
          </div>
        </div>
        
        {/* Barra de Progreso de Inicialización */}
        {!isAiReady && isInitializing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="truncate max-w-[150px]">{aiStatus.text}</span>
          </div>
        )}
        {!isAiReady && !isInitializing && (
          <button 
            onClick={handleActivateAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90"
          >
            <Bot className="w-3.5 h-3.5" />
            Activar IA
          </button>
        )}
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background relative">
        {!isAiReady && !isInitializing && (
          <div className="absolute inset-0 z-10 bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-card text-primary rounded-full flex items-center justify-center mb-4 border border-border">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Asistente Clínico Inactivo</h4>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Activa la IA para analizar interacciones, posología y contraindicaciones.
            </p>
            <button 
              onClick={handleActivateAI}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90"
            >
              <Bot className="w-4 h-4" />
              Iniciar Motor de IA
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${
              msg.role === 'user' ? 'bg-muted text-foreground' : 
              msg.role === 'system' ? 'bg-background border border-destructive text-destructive' : 'bg-card border border-border text-primary'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : 
               msg.role === 'system' ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 
              msg.role === 'system' ? 'bg-background border border-destructive text-destructive' : 'bg-card border border-border text-foreground'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 w-8 h-8 rounded bg-card border border-border flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Chat */}
      <form onSubmit={handleSend} className="p-3 bg-card border-t border-border">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isAiReady || isTyping}
            placeholder={isAiReady ? "Pregunta..." : "Cargando modelo..."}
            className="w-full pl-4 pr-12 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isAiReady || isTyping}
            className="absolute right-2 p-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
