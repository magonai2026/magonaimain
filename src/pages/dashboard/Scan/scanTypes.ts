// ─── Shared Scan Types ────────────────────────────────────────────────────────

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  file_path: string;
  line_number?: number;
  description: string;
  cwe_id?: string;
  cvss_score?: number;
  vulnerable_code?: string;
  fix_suggestion: string;
  cross_file_impact?: string;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface CategoryResult {
  category: string;
  description: string;
  files: string[];
  vulnerabilities: Vulnerability[];
  summary: string;
}

export interface DeepScanResult {
  scan_id: string;
  repo_url: string;
  status: string;
  total_files: number;
  total_lines: number;
  estimated_tokens?: number;   // not always present in SSE complete payload
  total_categories: number;
  phases_completed?: number;   // stored in MongoDB stub, not always in SSE complete payload
  category_results: CategoryResult[];
  vulnerabilities: Vulnerability[];
  severity_counts: SeverityCounts;
  architectural_summary?: string;
  summary: string;
  error?: string;
}

export type ScanPhase =
  | 'idle' | 'launching' | 'cloning'
  | 'phase1' | 'phase2' | 'phase3' | 'phase4'
  | 'complete' | 'error';

export interface ScanProgress {
  phase: ScanPhase;
  message: string;
  categoriesComplete: string[];
  result: DeepScanResult | null;
  error: string | null;
}