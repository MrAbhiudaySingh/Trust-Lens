// True Lens Types - Shared between edge functions

export type RiskDomain = 'consumer' | 'legal' | 'business';

export type SignalCategory = 'risk' | 'uncertainty' | 'green';

export type SignalSeverity = 'low' | 'medium' | 'high' | 'very_high';

export interface Signal {
  id: string;
  category: SignalCategory;
  title: string;
  explanation: string;
  details?: string;
  ruleId: string;
  severity?: SignalSeverity;
  domain?: RiskDomain;
}

export type InputType = 'url' | 'text';

export type AnalysisContext = 
  | 'consumer_message'
  | 'legal_agreement'
  | 'client_inquiry'
  | 'vendor_proposal'
  | 'partnership_offer'
  | 'general';

export interface AnalysisRequest {
  input: string;
  inputType?: InputType;
}

export type StrategicImportance = 'low' | 'medium' | 'high';
export type AttentionWorthiness = 'ignore' | 'monitor' | 'engage';

export interface BusinessPriorityAssessment {
  strategicImportance: StrategicImportance;
  attentionWorthiness: AttentionWorthiness;
  riskToRewardBalance: 'unfavorable' | 'neutral' | 'favorable';
  timeRecommendation: string;
  confidenceFactors: string[];
  concerns: string[];
  comparativeAdvice?: string[];
}

export interface CompanyAssessment {
  visibility: 'high' | 'moderate' | 'limited' | 'unknown';
  maturity: 'established' | 'growth' | 'startup' | 'unknown';
  trackRecord: 'verified' | 'claimed' | 'unverified' | 'concerning';
  publicFootprint: string[];
  flags: string[];
}

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
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  statusCode: number;
}

export interface TextAnalysisResult {
  signals: Signal[];
  content: string;
}

export interface UrlAnalysisResult {
  signals: Signal[];
  scrapedContent: ScrapedContent;
  metadata: {
    url: string;
    domain: string;
    pageTitle: string;
    isHttps: boolean;
  };
}
