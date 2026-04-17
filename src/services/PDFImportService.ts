import { Product, SafetyStatus } from '../core/types/product.types';

/**
 * Servicio para integrar datos extraídos del PDF del Vademécum Knop.
 * Estos datos han sido procesados y validados para asegurar la calidad de la base de datos.
 */
export const PDFImportService = {
  /**
   * Importa una selección de productos clave del Vademécum PDF.
   */
  async importVademecumData() {
    const products: Product[] = [
      {
        sku: 'KNOP-001',
        nombre_comercial: 'ACEITE CALENDULA MANZANILLA',
        categoria_principal: 'Otro',
        descripcion: 'Antiséptico, antiinflamatorio, analgésico. Aplicación local.',
        principios_activos: ['Caléndula', 'Manzanilla'],
        indicaciones: ['Otalgias', 'Dolor de oído', 'Otitis', 'Acné'],
        posologia: 'Aplicar 2-3 gotas cada oído 3 veces al día.',
        advertencias: 'Uso externo únicamente.',
        apto_embarazo: SafetyStatus.SI,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.SI,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Antiséptico', 'Antiinflamatorio', 'Dermatología', 'ORL'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-002',
        nombre_comercial: 'ACEITE DE ARNICA',
        categoria_principal: 'Otro',
        descripcion: 'Antiinflamatorio de uso local (Aplicación local friegas).',
        principios_activos: ['Arnica'],
        indicaciones: ['Contusiones', 'Dolores musculares', 'Tortícolis', 'Dolores osteoarticulares', 'Sabañones', 'Hematomas'],
        posologia: 'Local 20 gotas 3 veces al día sobre zona afectada.',
        advertencias: 'No aplicar sobre heridas abiertas.',
        apto_embarazo: SafetyStatus.SI,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.SI,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Traumatología', 'Dolor muscular', 'Antiinflamatorio'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-003',
        nombre_comercial: 'ACIDUM PHOSPHORICUM D6',
        categoria_principal: 'Homeopatía',
        descripcion: 'Coadyuvante en el tratamiento del deterioro cerebral y pérdida de memoria.',
        principios_activos: ['Acidum Phosphoricum'],
        indicaciones: ['Deterioro cerebral', 'Alzheimer', 'Pérdida de memoria', 'Incapacidad de concentración'],
        posologia: '2 comprimidos cada 8 horas.',
        advertencias: 'Consultar al médico si los síntomas persisten.',
        apto_embarazo: SafetyStatus.SI,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.SI,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Salud mental', 'Memoria', 'Tercera edad'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-004',
        nombre_comercial: 'ACIDUM SULFURICUM COMPUESTO',
        categoria_principal: 'Homeopatía',
        descripcion: 'Tratamiento coadyuvante en cuadros de alcoholismo y sus síntomas asociados.',
        principios_activos: ['Acidum Sulfuricum'],
        indicaciones: ['Antialcohólica', 'Temblor', 'Delirio', 'Agotamiento', 'Gastritis alcohólica', 'Náuseas', 'Edema'],
        posologia: '15 gotas 3 veces al día.',
        advertencias: 'Mantener fuera del alcance de los niños.',
        apto_embarazo: SafetyStatus.NO,
        apto_lactancia: SafetyStatus.NO,
        apto_pediatria: SafetyStatus.NO,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Adicciones', 'Gastroenterología', 'Desintoxicación'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-005',
        nombre_comercial: 'ACONITUM',
        categoria_principal: 'Homeopatía',
        descripcion: 'Indicado en estados febriles agudos y síntomas de enfriamiento.',
        principios_activos: ['Aconitum Napellus'],
        indicaciones: ['Estados febriles', 'Fiebre', 'Calofríos', 'Enfriamientos', 'Ansiedad', 'Neuralgias', 'Gripe', 'Resfríos'],
        posologia: 'Ver descripción (Comprimidos: 2 comp. 3 veces al día).',
        advertencias: 'No exceder la dosis recomendada.',
        apto_embarazo: SafetyStatus.SI,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.SI,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Fiebre', 'Gripe', 'Resfrío', 'Ansiedad'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-006',
        nombre_comercial: 'ACTAEA RACEMOSA D6',
        categoria_principal: 'Homeopatía',
        descripcion: 'Coadyuvante en trastornos del ciclo menstrual y menopausia.',
        principios_activos: ['Actaea Racemosa'],
        indicaciones: ['Síndrome premenstrual', 'Dismenorrea', 'Menopausia', 'Distonías neurovegetativas'],
        posologia: '2 comprimidos cada 8 horas.',
        advertencias: 'Uso bajo supervisión si hay antecedentes hormonales.',
        apto_embarazo: SafetyStatus.NO,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.NO,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Salud femenina', 'Ginecología', 'Menopausia'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-007',
        nombre_comercial: 'ADONIS COMPUESTO',
        categoria_principal: 'Homeopatía',
        descripcion: 'Cardiotónico coadyuvante en la insuficiencia cardíaca leve.',
        principios_activos: ['Adonis Vernalis'],
        indicaciones: ['Insuficiencia cardíaca', 'Cardiotónico', 'Cansancio', 'Ahogos', 'Taquicardia', 'Neurosis cardíaca'],
        posologia: '15 gotas 3 veces al día.',
        advertencias: 'No reemplaza el tratamiento cardiológico de base.',
        apto_embarazo: SafetyStatus.NO,
        apto_lactancia: SafetyStatus.NO,
        apto_pediatria: SafetyStatus.NO,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Cardiología', 'Corazón', 'Circulación'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-008',
        nombre_comercial: 'ALFALFA PASSIFLORA COMPUESTA',
        categoria_principal: 'Homeopatía',
        descripcion: 'Sedante natural y tónico general para el agotamiento.',
        principios_activos: ['Alfalfa', 'Passiflora'],
        indicaciones: ['Ansiolítico', 'Insomnio', 'Alteraciones nerviosas', 'Neurastenia', 'Agotamiento físico', 'Tónico general'],
        posologia: '15 gotas 3 veces al día.',
        advertencias: 'Puede provocar somnolencia.',
        apto_embarazo: SafetyStatus.SI,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.SI,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Ansiedad', 'Sueño', 'Estrés', 'Energía'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-009',
        nombre_comercial: 'ALLIUM SATIVA T.M.',
        categoria_principal: 'Suplemento',
        descripcion: 'Coadyuvante en el tratamiento de la hipertensión y el colesterol elevado.',
        principios_activos: ['Allium Sativum (Ajo)'],
        indicaciones: ['Hipercolesterolemia', 'Hipertensión arterial', 'Arteriosclerosis'],
        posologia: '20 gotas cada 8 horas.',
        advertencias: 'Precaución en personas con trastornos de la coagulación.',
        apto_embarazo: SafetyStatus.SI,
        apto_lactancia: SafetyStatus.SI,
        apto_pediatria: SafetyStatus.SI,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Colesterol', 'Hipertensión', 'Corazón'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      },
      {
        sku: 'KNOP-010',
        nombre_comercial: 'ALOE LAX',
        categoria_principal: 'Medicamento',
        descripcion: 'Laxante natural indicado para el estreñimiento ocasional.',
        principios_activos: ['Aloe Vera'],
        indicaciones: ['Estreñimiento', 'Laxante natural', 'Heces blandas'],
        posologia: '1-2 cápsulas al acostarse.',
        advertencias: 'No usar en caso de dolor abdominal agudo o fiebre.',
        apto_embarazo: SafetyStatus.NO,
        apto_lactancia: SafetyStatus.NO,
        apto_pediatria: SafetyStatus.NO,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        tags_ia: ['Digestión', 'Estreñimiento', 'Laxante'],
        vectores: [],
        sugerencia_complementaria: '',
        skus_relacionados: [],
        synergy_analyzed: false
      }
    ];

    for (const product of products) {
      // Sincronizar con Backend
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      } catch (e) {
        console.warn(`No se pudo sincronizar ${product.sku} con el backend:`, e);
      }
    }

    window.dispatchEvent(new CustomEvent('db_updated'));
    return products.length;
  }
};
