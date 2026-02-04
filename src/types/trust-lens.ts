// True Lens Types - Core domain models

/**
 * Risk domains that True Lens analyzes
 * - Consumer: Fraud, scams, pressure tactics
 * - Legal: Contracts, rights-stripping clauses
 * - Business: Time, money, operational and strategic exposure
 */
export type RiskDomain = 'consumer' | 'legal' | 'business';

/**
 * Signal categories following the "Rules decide -> AI explains" pattern
 * - Risk: High-confidence warning patterns detected
 * - Uncertainty: Missing or unverifiable information
 * - Green: Trust-building indicators
 */
export type SignalCategory = 'risk' | 'uncertainty' | 'green';

/**
 * Signal severity for weighted scoring
 */
export type SignalSeverity = 'low' | 'medium' | 'high' | 'very_high';

/**
 * A single signal detected by the rule engine
 * Each signal is deterministic and explainable
 */
export interface Signal {
  id: string;
  category: SignalCategory;
  title: string;
  explanation: string;
  details?: string;
  ruleId: string;
  severity?: SignalSeverity;
  domain?: RiskDomain; // Which risk domain this signal belongs to
}

/**
 * Input type detection result
 */
export type InputType = 'url' | 'text';

/**
 * Analysis context detection result
 */
export type AnalysisContext = 
  | 'consumer_message'
  | 'legal_agreement'
  | 'client_inquiry'
  | 'vendor_proposal'
  | 'partnership_offer'
  | 'general';

/**
 * Analysis request payload
 */
export interface AnalysisRequest {
  input: string;
  inputType?: InputType;
}

/**
 * Strategic importance levels for business proposals
 */
export type StrategicImportance = 'low' | 'medium' | 'high';

/**
 * Attention worthiness levels
 */
export type AttentionWorthiness = 'ignore' | 'monitor' | 'engage';

/**
 * Business Priority Assessment for proposals/inquiries
 */
export interface BusinessPriorityAssessment {
  strategicImportance: StrategicImportance;
  attentionWorthiness: AttentionWorthiness;
  riskToRewardBalance: 'unfavorable' | 'neutral' | 'favorable';
  timeRecommendation: string;
  confidenceFactors: string[];
  concerns: string[];
  comparativeAdvice?: string[];
}

/**
 * Company credibility assessment
 */
export interface CompanyAssessment {
  visibility: 'high' | 'moderate' | 'limited' | 'unknown';
  maturity: 'established' | 'growth' | 'startup' | 'unknown';
  trackRecord: 'verified' | 'claimed' | 'unverified' | 'concerning';
  publicFootprint: string[];
  flags: string[];
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  inputType: InputType;
  originalInput: string;
  signals: Signal[];
  summary: string;
  analyzedAt: string;
  recommendedActions: string[];
  detectedContext: AnalysisContext;
  primaryDomain: RiskDomain;
  whyItMatters?: string;
  businessPriority?: BusinessPriorityAssessment;
  companyAssessment?: CompanyAssessment;
  metadata?: {
    url?: string;
    domain?: string;
    pageTitle?: string;
    isHttps?: boolean;
  };
  // Severity-first fields
  overall_level?: string;
  concernCount?: number;
  severityLevel?: 'critical' | 'high' | 'moderate' | 'low';
}

/**
 * Scraped website content from scrape.do
 */
export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  statusCode: number;
}

/**
 * Demo input examples for testing
 */
export interface DemoExample {
  id: string;
  label: string;
  description: string;
  input: string;
  context?: AnalysisContext;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  code?: string;
}
