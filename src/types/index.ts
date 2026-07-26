/**
 * Tipos Centralizados de Vademecum AI
 * Archivo único para todos los tipos del proyecto
 */

// ==================== PRODUCTOS ====================

export interface Product {
  sku: string;
  nombre_comercial: string;
  principios_activos?: string[];
  descripcion?: string;
  laboratorio?: string;
  categoria?: string;
  categoria_principal?: string;
  precio?: number;
  presentacion?: string;
  imagen_url?: string;
  tipo_producto?: string;
  posologia?: string;
  contraindicaciones?: string[];
  indicaciones?: string[];
  efectos_secundarios?: string[];
  tags_ia?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AnalyzedProduct extends Product {
  ingredientes_encontrados: string[];
  cobertura_kb: number;
  sinergias_detectadas: string[];
  antagonismos_detectados?: string[];
  kbAnalysis?: ProductAnalysis | null;
  categorias_inferidas?: string[];
  categoryLabels?: string[];
}

// ==================== BASE DE CONOCIMIENTO ====================

export interface KbIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  familia: string;
  tipo: string;
  propiedades: string[];
  sinergias: string[];
  antagonismos: string[];
  contraindicaciones: string[];
  notas: string;
}

export interface KbData {
  version: string;
  description: string;
  lastUpdated: string;
  ingredients: KbIngredient[];
}

export interface KbMetadata {
  version: string;
  totalIngredients: number;
  lastUpdated: string;
}

// ==================== ANÁLISIS ====================

export interface ProductAnalysis {
  found: string[];
  synergies: Synergy[];
  antagonisms: Antagonism[];
  recommendations: string[];
  contraindications: string[];
  description: string;
}

export interface Synergy {
  ingredient1: string;
  ingredient2: string;
  description: string;
  strength?: 'strong' | 'moderate' | 'weak';
}

export interface Antagonism {
  ingredient1: string;
  ingredient2: string;
  description: string;
  severity?: 'high' | 'moderate' | 'low';
}

// ==================== SINERGIA ====================

export interface SynergyNode {
  id: string;
  nombre: string;
  tipo: string;
  conexiones: number;
}

export interface SynergyEdge {
  from: string;
  to: string;
  type: 'synergy' | 'antagonism';
  description?: string;
}

export interface SynergyGraph {
  nodes: SynergyNode[];
  edges: SynergyEdge[];
}

// ==================== CATEGORIZACIÓN ====================

export interface ProductCategory {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  ingredients: string[];
}

export interface CategorizationResult {
  categories: string[];
  categoryLabels: string[];
  matchedIngredients: MatchedIngredient[];
  properties: string[];
  confidence: number;
}

export interface MatchedIngredient {
  principle: string;
  kbMatch: string;
  tipo: string;
}

// ==================== SCRAPING ====================

export interface ScrapingResult {
  success: boolean;
  product?: Partial<Product>;
  error?: string;
}

export type ScrapingState = 'idle' | 'scraping' | 'success' | 'error';

// ==================== SINCRONIZACIÓN ====================

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  progress?: number;
  error?: string;
  lastSyncAt?: string;
}

export interface SyncResult {
  success: boolean;
  localVersion?: string;
  remoteVersion?: string;
  ingredientsCount?: number;
  mergedAt?: string;
  error?: string;
}

// ==================== VISTAS Y NAVEGACIÓN ====================

export type ViewType = 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';

export type LayoutType = 'grid' | 'list';

// ==================== FILTROS ====================

export interface ProductFilters {
  search: string;
  category: string;
  hasIngredients: boolean;
  hasSynergies: boolean;
  hasAntagonisms: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// ==================== ESTADO DE LA APLICACIÓN ====================

export interface AppState {
  products: AnalyzedProduct[];
  loading: boolean;
  error: string | null;
  view: ViewType;
  selectedProduct: AnalyzedProduct | null;
  filters: ProductFilters;
  kbStats: KbStats;
  syncStatus: SyncStatus;
}

export interface KbStats {
  total: number;
  families: number;
  types: number;
  version: string;
}

// ==================== SCRAPER ====================

export interface ScraperConfig {
  url: string;
  selectors: {
    name: string;
    ingredients: string;
    description: string;
    price: string;
  };
}

export interface ScraperResult {
  sku: string;
  data: Partial<Product>;
  timestamp: number;
}

// ==================== UTILIDADES ====================

export type Maybe<T> = T | null | undefined;

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type AsyncStateWithStatus<T> = AsyncState<T> & {
  status: 'idle' | 'loading' | 'success' | 'error';
};
