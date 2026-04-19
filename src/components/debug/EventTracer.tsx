import React, { useEffect, useState } from 'react';
import { Terminal, Activity, ChevronDown, ChevronRight, Clock, Hash, Trash2 } from 'lucide-react';
import { EventBus } from '../../services/EventBus';
import { motion, AnimatePresence } from 'motion/react';

export const EventTracer: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    // Cargar historial inicial
    setEvents(EventBus.getHistory().reverse());

    // Suscribirse a nuevos eventos con throttling para proteger la UI
    let throttleTimer: number | null = null;
    let pendingEvents: any[] = [];

    const sub = EventBus.all().subscribe(event => {
      pendingEvents.push(event);
      
      if (!throttleTimer) {
        throttleTimer = window.setTimeout(() => {
          setEvents(prev => {
            const newEvents = [...pendingEvents.reverse(), ...prev].slice(0, 50);
            pendingEvents = [];
            throttleTimer = null;
            return newEvents;
          });
        }, 800); // Máximo una actualización visual cada 800ms
      }
    });

    return () => {
      if (throttleTimer) window.clearTimeout(throttleTimer);
      sub.unsubscribe();
    };
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-96 max-h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Event Tracer</span>
              </div>
              <button 
                onClick={() => {
                  EventBus.clearHistory();
                  setEvents([]);
                }}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500 hover:text-rose-400"
                title="Limpiar logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-[10px] italic">
                  Esperando eventos...
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="border border-transparent hover:border-slate-800 rounded-lg transition-all">
                    <button 
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      className="w-full text-left p-2 flex items-center gap-3 hover:bg-slate-800/40"
                    >
                      {expandedEvent === event.id ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-brand-primary truncate">{event.type}</span>
                          <span className="text-[8px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedEvent === event.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-2 pb-2"
                        >
                          <div className="bg-black/40 rounded p-2 text-[9px] text-emerald-400 border border-emerald-900/30">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                            <div className="mt-2 pt-2 border-t border-emerald-900/20 flex gap-4 text-emerald-600 font-bold">
                              <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" /> {event.id}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black tracking-widest uppercase transition-all shadow-xl backdrop-blur-md ${
          isOpen 
            ? 'bg-brand-primary text-slate-900 border-brand-primary' 
            : 'bg-slate-900/80 text-brand-primary border-slate-700 hover:border-brand-primary/50'
        }`}
      >
        <Activity className={`w-3.5 h-3.5 ${events.length > 0 && !isOpen ? 'animate-pulse' : ''}`} />
        Debug Bus
        {events.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 bg-brand-primary text-slate-900 rounded-full text-[8px]">
            {events.length}
          </span>
        )}
      </motion.button>
    </div>
  );
};
