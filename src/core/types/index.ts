export * from './product.types';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success' | 'ai';
  module: string;
  message: string;
  details?: any;
}

export interface ClinicalSearchInterpretation {
  isScenario: boolean;
  symptoms: string[];
  risks: string[];
  logic: string;
  suggestedFilters: {
    avoid: string[];
    prefer: string[];
  };
}

export interface ConsultationState {
  selectedProducts: string[];
  analysisResult?: string;
  isAnalyzing: boolean;
  lastAnalysisTimestamp?: number;
}
