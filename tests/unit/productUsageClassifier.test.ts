import { describe, it, expect } from 'vitest';
import {
  classifyProductRoute,
  scoreProductForPathology,
  selectCounterRecommendations,
} from '@/core/catalog/productUsageClassifier';
import type { DbProduct, DbPathology } from '@/db/schema';
import type { PathologyProduct } from '@/hooks/useProductsForPathology';

describe('productUsageClassifier — Clasificación de Vías y Formatos', () => {
  it('clasifica correctamente productos tópicos según presentación o nombre', () => {
    const prodGel: DbProduct = {
      sku: 'PROD-GEL-ARN',
      nombreComercial: 'Gel de Árnica Alivio Rápido',
      principiosActivos: ['arnica_montana'],
      indicaciones: ['golpes', 'dolor_muscular'],
      contraindicaciones: [],
      embarazo: 'apto',
      lactancia: 'apto',
      pediatria: 'apto',
      hipertension: 'apto',
      diabetes: 'apto',
      celiacos: 'apto',
      source: 'local',
      data: { presentacion: 'Tubo 60 g gel dérmico' },
      lamport: 1,
      deviceId: 'dev',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    expect(classifyProductRoute(prodGel)).toBe('topico');
  });

  it('clasifica productos orales como cápsulas y comprimidos', () => {
    const prodOral: DbProduct = {
      sku: 'PROD-CUR-CAP',
      nombreComercial: 'Curcumina Complex',
      principiosActivos: ['curcuma'],
      indicaciones: ['artrosis', 'inflamacion'],
      contraindicaciones: [],
      embarazo: 'evitar',
      lactancia: 'evitar',
      pediatria: 'evitar',
      hipertension: 'apto',
      diabetes: 'apto',
      celiacos: 'apto',
      source: 'local',
      data: { presentacion: 'Caja 60 cápsulas vegetales' },
      posologia: 'Tomar 1 cápsula en el desayuno con agua',
      lamport: 1,
      deviceId: 'dev',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    expect(classifyProductRoute(prodOral)).toBe('oral');
  });

  it('clasifica productos respiratorios y bucales', () => {
    const prodNasal: DbProduct = {
      sku: 'PROD-NAS-SEA',
      nombreComercial: 'Agua de Mar Spray Nasal Hipertónico',
      principiosActivos: ['agua_mar'],
      indicaciones: ['congestion_nasal', 'rinitis'],
      contraindicaciones: [],
      embarazo: 'apto',
      lactancia: 'apto',
      pediatria: 'apto',
      hipertension: 'apto',
      diabetes: 'apto',
      celiacos: 'apto',
      source: 'local',
      data: { presentacion: 'Frasco spray 100 ml' },
      lamport: 1,
      deviceId: 'dev',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    const prodBucal: DbProduct = {
      sku: 'PROD-PRO-GAR',
      nombreComercial: 'Propóleo Spray Garganta con Miel',
      principiosActivos: ['propoleo'],
      indicaciones: ['irritacion_garganta', 'faringitis'],
      contraindicaciones: [],
      embarazo: 'apto',
      lactancia: 'apto',
      pediatria: 'apto',
      hipertension: 'apto',
      diabetes: 'apto',
      celiacos: 'apto',
      source: 'local',
      data: { presentacion: 'Nebulizador bucofaríngeo 30 ml' },
      lamport: 1,
      deviceId: 'dev',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    expect(classifyProductRoute(prodNasal)).toBe('respiratorio');
    expect(classifyProductRoute(prodBucal)).toBe('bucal');
  });

  it('selecciona la estrategia de mostrador jerarquizada (Oral + Tópico + Natural)', () => {
    const mockPathology: DbPathology = {
      id: 'artrosis',
      nombre: 'Artrosis y Dolor Articular',
      definicion: 'Degeneración del cartílago articular',
      sistemas: ['musculoesqueletico'],
      evidencia: 'A',
      sintomas: ['dolor articular', 'rigidez'],
      causas: ['desgaste'],
      tratamientoNatural: {
        fitoterapia: ['curcuma'],
        suplementos: ['glucosamina'],
        homeopatia: ['arnica_montana'],
        aceites: [],
      },
      tratamientoAlopatico: {
        primeraLinea: ['Paracetamol'],
        segundaLinea: [],
        efectosSecundarios: [],
      },
      prevencion: [],
      cuandoConsultar: '',
      alertasFarmaceuticas: [],
      poblacionesEspeciales: [],
      lamport: 1,
      deviceId: 'dev',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    const mockProducts: PathologyProduct[] = [
      {
        product: {
          sku: 'PROD-CURC-1',
          nombreComercial: 'Curcumina Articular Cápsulas',
          categoria: 'fitoterapia',
          principiosActivos: ['curcuma'],
          indicaciones: ['artrosis', 'dolor articular'],
          contraindicaciones: [],
          embarazo: 'apto',
          lactancia: 'apto',
          pediatria: 'apto',
          hipertension: 'apto',
          diabetes: 'apto',
          celiacos: 'apto',
          source: 'local',
          data: { presentacion: 'Frasco 60 cápsulas' },
          lamport: 1,
          deviceId: 'dev',
          updatedAt: Date.now(),
          createdAt: Date.now(),
          tombstone: 0,
        },
        matchedCount: 2,
      },
      {
        product: {
          sku: 'PROD-ARN-GEL',
          nombreComercial: 'Gel Masaje Árnica Forte',
          categoria: 'fitoterapia',
          principiosActivos: ['arnica_montana'],
          indicaciones: ['golpes', 'dolor articular'],
          contraindicaciones: [],
          embarazo: 'apto',
          lactancia: 'apto',
          pediatria: 'apto',
          hipertension: 'apto',
          diabetes: 'apto',
          celiacos: 'apto',
          source: 'local',
          data: { presentacion: 'Tubo 100 ml gel dérmico' },
          lamport: 1,
          deviceId: 'dev',
          updatedAt: Date.now(),
          createdAt: Date.now(),
          tombstone: 0,
        },
        matchedCount: 1,
      },
      {
        product: {
          sku: 'PROD-HARP-EXT',
          nombreComercial: 'Harpagofito Extracto Puro',
          categoria: 'fitoterapia',
          principiosActivos: ['harpagofito'],
          indicaciones: ['inflamacion', 'artrosis'],
          contraindicaciones: [],
          embarazo: 'apto',
          lactancia: 'apto',
          pediatria: 'apto',
          hipertension: 'apto',
          diabetes: 'apto',
          celiacos: 'apto',
          source: 'local',
          data: { presentacion: 'Gotero 50 ml' },
          lamport: 1,
          deviceId: 'dev',
          updatedAt: Date.now(),
          createdAt: Date.now(),
          tombstone: 0,
        },
        matchedCount: 1,
      },
    ];

    const strategy = selectCounterRecommendations(mockProducts, mockPathology);

    expect(strategy.length).toBeGreaterThanOrEqual(2);
    // Rol 1: Principal (Oral)
    expect(strategy[0].role).toBe('principal');
    expect(strategy[0].route).toBe('oral');
    // Rol 2: Alivio local inmediato (Tópico)
    expect(strategy[1].role).toBe('alivio_local');
    expect(strategy[1].route).toBe('topico');
  });

  it('penaliza productos contraindicados para el perfil de seguridad del paciente', () => {
    const mockPathology: DbPathology = {
      id: 'gripe',
      nombre: 'Gripe y Resfriado',
      definicion: 'Infección viral aguda',
      sistemas: ['respiratorio'],
      evidencia: 'A',
      sintomas: ['fiebre'],
      causas: ['virus'],
      tratamientoNatural: { fitoterapia: [], suplementos: [], homeopatia: [], aceites: [] },
      tratamientoAlopatico: { primeraLinea: [], segundaLinea: [], efectosSecundarios: [] },
      prevencion: [],
      cuandoConsultar: '',
      alertasFarmaceuticas: [],
      poblacionesEspeciales: [],
      lamport: 1,
      deviceId: 'dev',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    const prodIbu: PathologyProduct = {
      product: {
        sku: 'PROD-IBU',
        nombreComercial: 'Ibuprofeno 600',
        principiosActivos: ['ibuprofeno'],
        indicaciones: ['gripe'],
        contraindicaciones: ['hipertension'],
        embarazo: 'contraindicado',
        lactancia: 'apto',
        pediatria: 'apto',
        hipertension: 'evitar',
        diabetes: 'apto',
        celiacos: 'apto',
        source: 'local',
        data: {},
        lamport: 1,
        deviceId: 'dev',
        updatedAt: Date.now(),
        createdAt: Date.now(),
        tombstone: 0,
      },
      matchedCount: 1,
    };

    const scoreNormal = scoreProductForPathology(prodIbu, mockPathology, null);
    const scoreHipertenso = scoreProductForPathology(prodIbu, mockPathology, { hipertension: true });

    expect(scoreHipertenso).toBeLessThan(scoreNormal - 100);
  });
});
