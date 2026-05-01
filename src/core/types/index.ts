export * from './product.types';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'ai';
  message: string;
  details?: any;
}

export interface ClinicalSearchInterpretation {
  isScenario: boolean;
  concept: string;
  intent: string;
  suggestedFilters: string[];
  clinicalContext?: string;
}

export interface ConsultationState {
  selectedProducts: string[];
  analysisResult?: string;
  isAnalyzing: boolean;
  lastAnalysisTimestamp?: number;
}
