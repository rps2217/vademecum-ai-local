import { describe, it, expect } from 'vitest';
import { normalizeProductName } from '@/core/catalog';

describe('normalizeProductName', () => {
  describe('casos básicos de capitalización', () => {
    it('convierte TODO MAYÚSCULAS a Title Case', () => {
      expect(normalizeProductName('ARNICA UNGÜENTO')).toBe('Arnica Ungüento');
    });

    it('capitaliza todo minúsculas', () => {
      expect(normalizeProductName('magnesio quelado')).toBe('Magnesio Quelado');
    });

    it('normaliza mezcla de mayúsculas y minúsculas', () => {
      expect(normalizeProductName('Valeriana EXTRACTO Natural')).toBe('Valeriana Extracto Natural');
    });

    it('deja Title Case ya correcto sin cambios', () => {
      expect(normalizeProductName('Vitamina C Natural')).toBe('Vitamina C Natural');
    });
  });

  describe('unidades de medida', () => {
    it('normaliza unidades sueltas (MG, ML, UI)', () => {
      expect(normalizeProductName('Magnesio 400 MG')).toBe('Magnesio 400 mg');
      expect(normalizeProductName('Jarabe 125 ML')).toBe('Jarabe 125 ml');
      expect(normalizeProductName('Vitamina D 1000 UI')).toBe('Vitamina D 1000 ui');
    });

    it('lowercase número+unidad pegados (400MG → 400mg)', () => {
      expect(normalizeProductName('Magnesio 400MG')).toBe('Magnesio 400mg');
      expect(normalizeProductName('Aceite 125ML')).toBe('Aceite 125ml');
      expect(normalizeProductName('Hierro 5UI')).toBe('Hierro 5ui');
    });

    it('normaliza gramo pegado: GR, GRS, G → g', () => {
      expect(normalizeProductName('Ungüento 35GR')).toBe('Ungüento 35g');
      expect(normalizeProductName('Crema 50GRS')).toBe('Crema 50g');
      expect(normalizeProductName('Pote 100G')).toBe('Pote 100g');
    });

    it('preserva decimales en dosis (2.5MG → 2.5mg)', () => {
      expect(normalizeProductName('Melatonina 2.5MG')).toBe('Melatonina 2.5mg');
      expect(normalizeProductName('Hierro 1,5MG')).toBe('Hierro 1,5mg');
    });
  });

  describe('siglas y vitaminas (preservar)', () => {
    it('preserva vitaminas letra+número (B6, D3, B12)', () => {
      expect(normalizeProductName('Vitamina B6')).toBe('Vitamina B6');
      expect(normalizeProductName('Vitamina D3 1000UI')).toBe('Vitamina D3 1000ui');
      expect(normalizeProductName('Complejo B12')).toBe('Complejo B12');
    });

    it('preserva siglas todo-mayúsculas (OMS, OTC, FPS)', () => {
      expect(normalizeProductName('Protector FPS 50')).toBe('Protector FPS 50');
      expect(normalizeProductName('Producto OTC')).toBe('Producto OTC');
    });

    it('preserva diluciones homeopáticas (C200, D4, CH30)', () => {
      expect(normalizeProductName('Influenzinum C200')).toBe('Influenzinum C200');
      expect(normalizeProductName('Nux Vomica D4')).toBe('Nux Vomica D4');
      expect(normalizeProductName('Arnica CH30')).toBe('Arnica CH30');
    });
  });

  describe('conectores en minúsculas', () => {
    it('lowercase DE, Y, CON, etc. en posición media', () => {
      expect(normalizeProductName('ACEITE DE Masaje')).toBe('Aceite de Masaje');
      expect(normalizeProductName('Te Verde Y Rojo')).toBe('Te Verde y Rojo');
      expect(normalizeProductName('Crema CON Calendula')).toBe('Crema con Calendula');
      expect(normalizeProductName('Jarabe PARA Tos')).toBe('Jarabe para Tos');
    });

    it('preserva "x" minúscula como abreviatura de "por"', () => {
      expect(normalizeProductName('Calcio 500 MG x 90 porciones'))
        .toBe('Calcio 500 mg x 90 Porciones');
      expect(normalizeProductName('Vitamina C 500 mg X 120 porciones'))
        .toBe('Vitamina C 500 mg x 120 Porciones');
    });

    it('capitaliza conector si es la primera palabra', () => {
      expect(normalizeProductName('de Talco')).toBe('De Talco');
      expect(normalizeProductName('Yodo Topico')).toBe('Yodo Topico');
    });
  });

  describe('limpieza de espacios', () => {
    it('colapsa espacios múltiples', () => {
      expect(normalizeProductName('Arnica   Ungüento')).toBe('Arnica Ungüento');
      expect(normalizeProductName('  Magnesio  400mg  ')).toBe('Magnesio 400mg');
    });

    it('trim espacios y tabs', () => {
      expect(normalizeProductName('\tArnica\n')).toBe('Arnica');
    });

    it('devuelve string vacío sin romper', () => {
      expect(normalizeProductName('')).toBe('');
      expect(normalizeProductName('   ')).toBe('');
    });
  });

  describe('acentos (UTF-16 safe)', () => {
    it('preserva acentos en Title Case', () => {
      expect(normalizeProductName('UNGÜENTO')).toBe('Ungüento');
      expect(normalizeProductName('análisis')).toBe('Análisis');
      expect(normalizeProductName('PRÓPOLIS')).toBe('Própolis');
      expect(normalizeProductName('CÚRCUMA')).toBe('Cúrcuma');
    });
  });

  describe('idempotencia', () => {
    it('aplicar dos veces produce el mismo resultado', () => {
      const cases = [
        'ARNICA UNGÜENTO 35GR',
        'magnesio quelado 400MG',
        'Vitamina B6 100 Comp',
        'ACEITE de Masaje 125 ML',
        'Influenzinum C200',
        'Complejo B12 1000UI',
      ];
      for (const c of cases) {
        const once = normalizeProductName(c);
        const twice = normalizeProductName(once);
        expect(twice).toBe(once);
      }
    });
  });

  describe('casos realistas del catálogo', () => {
    it('normaliza nombres típicos de farmacia', () => {
      expect(normalizeProductName('PROPOLIS JARABE 125 ML'))
        .toBe('Propolis Jarabe 125 ml');
      expect(normalizeProductName('magnesio quelado 400mg'))
        .toBe('Magnesio Quelado 400mg');
      expect(normalizeProductName('Ungüento ARNICA Pote 35 Gr'))
        .toBe('Ungüento Arnica Pote 35 g');
      expect(normalizeProductName('VALERIANA EXTRACTO 30 COMP'))
        .toBe('Valeriana Extracto 30 Comp');
    });
  });
});
