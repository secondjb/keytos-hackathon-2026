export type ResultStatus = 'interaction_found' | 'no_record_found' | 'error';
export type SeverityLevel = 'major' | 'moderate' | 'minor' | 'none';

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
  result_status: ResultStatus;
  dataset_release?: string;
  severity: SeverityLevel;
  severity_score?: number; // 0 to 4+
  onc_high_priority?: boolean;
  mechanism?: string;
  clinical_significance?: string;
  management?: string;
  evidence_level?: string;
  sources?: string[];
  review_status?: string | null;
  disclaimer?: string;
  note?: string;
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
  status: 'success' | 'error';
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
    status: number;
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

export interface RecreationalAdvisoryItem {
  id: string;
  substance1: string;
  substance2: string; // drug or class (e.g., "Anticoagulants", "Benzodiazepines", "SSRIs")
  matchedDrug: string;
  riskTitle: string;
  severity: 'critical' | 'high' | 'moderate';
  mechanism: string;
  harmReductionAdvice: string;
  symptomsToWatch: string[];
}

export interface SymptomCorrelation {
  symptomName: string;
  severity: 'emergency' | 'warning' | 'info';
  relatedDrugs: string[];
  alertMessage: string;
  actionRequired: string;
}
