export {
  IngredientSearchService,
  ingredientSearchService,
  useSearchIndex,
  type SearchFilters,
  type SearchResult,
} from './IngredientSearchService';
export {
  ProductSearchService,
  productSearchService,
  useProductIndex,
  type ProductSearchResult,
  type ProductFacet,
  SAFETY_FACET_FIELDS,
  type SafetyFacetField,
} from './ProductSearchService';
export {
  SynergySearchService,
  synergySearchService,
  useSynergyIndex,
  type SynergySearchFilters,
  type SynergySearchResult,
} from './SynergySearchService';
export {
  OmniSearchService,
  omniSearchService,
  useOmniSearchIndex,
  type OmniCategory,
  type OmniSearchResult,
  type OmniProductResult,
  type OmniExplanationResult,
  type OmniIngredientResult,
  type OmniPathologyResult,
  type OmniSearchOptions,
} from './OmniSearchService';
