export { generateClinicalExplanation } from '@/core/analysis/clinicalExplanation';
export { DRUG_NUTRIENT_INTERACTIONS, type DrugNutrientInteraction } from '@/core/analysis/drugNutrientInteractions';
export { 
    findInteractions, 
    evaluateWarnings, 
    findUntestedPairs, 
    isBeneficial, 
    isRisky,
    type InteractionResult,
    type SafetyWarning
} from '@/core/analysis/InteractionChecker';
export { recommendationEngine } from '@/core/analysis/RecommendationEngine';
