export * from './product.types';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'ai';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  details?: LogDetails;
}

export type LogDetails = 
  | { type: 'error'; error: Error }
  | { type: 'data'; data: Record<string, unknown> }
  | { type: 'count'; count: number }
  | { type: 'string'; value: string }
  | null
  | undefined;

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
