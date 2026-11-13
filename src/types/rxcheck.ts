export type ResultStatus = 'interaction_found' | 'no_record_found' | 'error';
export type SeverityLevel = 'contraindicated' | 'major' | 'moderate' | 'minor' | 'none';

export interface DrugNormalization {
  term_type?: string;
  concept_type?: string;
  ambiguous?: boolean;
  candidate_count?: number;
}

export interface DrugQueryInfo {
  input: string;
  resolved_name?: string;
  rxcui?: string;
  resolution_method?: string;
  normalization?: DrugNormalization;
}

export interface InteractionDetail {
  found: boolean;
  result_status?: ResultStatus;
  dataset_release?: string;
  severity: SeverityLevel;
  severity_score?: number;
  onc_high_priority?: boolean;
  mechanism?: string | null;
  clinical_significance?: string | null;
  management?: string | null;
  evidence_level?: string | null;
  sources?: string[];
  review_status?: string | null;
  disclaimer?: string | null;
  note?: string | null;
}

export interface ApiMeta {
  response_time_ms?: number;
  cache_hit?: boolean;
  queries_used?: number;
  queries_remaining?: number;
  tier?: string;
  data_version?: string;
}

export interface RxCheckApiResponse {
  status?: 'success' | 'error';
  result_status: ResultStatus;
  dataset_release?: string;
  disclaimer?: string;
  query?: {
    drug1: DrugQueryInfo;
    drug2: DrugQueryInfo;
  };
  interaction?: InteractionDetail;
  meta?: ApiMeta;
  error?: {
    code: string;
    message: string;
    request_id?: string;
    upgrade_url?: string;
  };
}

export interface EvaluatedDrugPair {
  id: string; // "drug1::drug2"
  drug1: string;
  drug2: string;
  status: ResultStatus;
  severity: SeverityLevel;
  severityScore: number;
  isHighPriority: boolean;
  resolvedDrug1: string;
  resolvedDrug2: string;
  mechanism: string;
  clinicalSignificance: string;
  management: string;
  evidenceLevel: string;
  sources: string[];
  disclaimer: string;
  fromCache?: boolean;
  timestamp: number;
}

export interface RxCheckDrugSearchResult {
  name: string;
  rxcui: string | null;
  generic_name: string | null;
  brand_names: string[];
  drug_class: string | null;
  source?: 'rxcheck' | 'drugs.com' | 'both';
  code?: string;
  ddc_id?: number;
  brand_name_id?: number;
}

export interface ScrapedInteractionItem {
  title: string;
  subtitle?: string;
  applies_to?: string[];
  text: string;
  severity?: 'Major' | 'Moderate' | 'Minor' | 'Unknown';
}

export interface ScrapedInteractionReport {
  url: string;
  title: string;
  drug_interactions: ScrapedInteractionItem[];
  duplications: ScrapedInteractionItem[];
  food_interactions: ScrapedInteractionItem[];
  disease_interactions: ScrapedInteractionItem[];
  resolved_drugs?: Array<{ code: string; name: string }>;
  error?: string | null;
}

export interface RxCheckPolypharmacySummary {
  total_pairs: number;
  interactions_found: number;
  no_record_count: number;
  max_severity: SeverityLevel;
  onc_high_priority_count: number;
}

export interface RxCheckPolypharmacyResponse {
  results: EvaluatedDrugPair[];
  summary: RxCheckPolypharmacySummary;
  tier_mode: 'native_growth_api' | 'n_choose_2_evaluated';
  server_endpoint_used: string;
}

export interface RxCheckUsageInfo {
  tier: string;
  monthly_limit: number;
  queries_used: number;
  queries_remaining: number;
  evaluated_pairs_used?: number;
  evaluated_pairs_remaining?: number;
  features?: {
    batch: boolean;
    batch_size: number | null;
    polypharmacy: boolean;
    webhooks: boolean;
  };
  limit_resets_at?: string;
}

export interface ExtractedClinicalSymptom {
  id: string;
  symptomName: string;
  contextSnippet: string;
  isRedFlag: boolean;
  sourcePair: string;
  severity: SeverityLevel;
}
