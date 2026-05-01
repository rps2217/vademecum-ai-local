
/**
 * Mapa de sinónimos clínicos para mejorar la búsqueda terapéutica.
 * Permite relacionar conceptos que tienen el mismo propósito clínico pero distinta terminología.
 */
export const CLINICAL_SYNONYMS: Record<string, string[]> = {
  "gripe": ["resfrío", "resfriado", "influenza", "catarro", "congestion", "virosis respiratoria", "estado gripal"],
  "resfrio": ["gripe", "resfriado", "catarro", "influenza", "congestion nasal"],
  "gota": ["hiperuricemia", "acido urico", "artritis urica", "tofos"],
  "hipertension": ["presion alta", "tension arterial alta", "hipertensivo"],
  "dolor": ["analgesico", "algias", "inflamacion", "cefalea", "jaqueca", "migraña"],
  "migraña": ["dolor de cabeza", "cefalea", "jaqueca", "algias vasculares"],
  "artrosis": ["artritis", "dolor articular", "reumatismo", "osteoartritis", "desgaste articular"],
  "acne": ["espinillas", "granos", "barros", "pustulas", "seborrea"],
  "insomnio": ["trastornos del sueño", "dificultad para dormir", "desvelo", "sedante", "inductor del sueño"],
  "estres": ["nerviosismo", "ansiedad", "tension", "irritabilidad"],
  "ansiedad": ["nerviosismo", "estres", "angustia", "sedacion"],
  "fatiga": ["cansancio", "agotamiento", "astenia", "debilidad", "revitalizante"],
  "sobrepeso": ["obesidad", "adelgazar", "control de peso", "quemador de grasa", "saciedad"],
  "diarrea": ["tránsito lento", "colitis", "disentería", "restitución de flora", "probiótico"],
  "gastritis": ["acidez", "reflujo", "pirosis", "ardor estomacal", "antiacido"],
  "tos": ["expectorante", "mucolitico", "antitusivo", "flemas", "bronquitis"],
  "alergia": ["antihistaminico", "rinitis", "urticaria", "prurito", "picazon"]
};

/**
 * Obtiene todos los términos relacionados para una query dada, incluyendo la propia query.
 */
export function getRelatedClinicalTerms(query: string): string[] {
  const normalized = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const synonyms = CLINICAL_SYNONYMS[normalized] || [];
  return [normalized, ...synonyms];
}
