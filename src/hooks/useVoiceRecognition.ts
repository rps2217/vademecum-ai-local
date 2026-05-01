import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/LoggerService';

export const useVoiceRecognition = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSupported(true);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      logger.info('Reconocimiento de voz iniciado');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      logger.info('Resultado de voz:', text);
      onResult(text);
    };

    recognition.onerror = (event: any) => {
      logger.error('Error en reconocimiento de voz:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      logger.error('Error al iniciar reconocimiento vocal:', err);
      setIsListening(false);
    }
  }, [onResult]);

  return { isListening, supported, startListening };
};
