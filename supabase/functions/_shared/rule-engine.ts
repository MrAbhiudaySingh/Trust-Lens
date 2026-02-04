// True Lens Rule Engine - Deterministic signal detection
// Philosophy: "Rules decide -> AI explains -> Humans decide"

import { Signal, SignalCategory, AnalysisContext, RiskDomain, BusinessPriorityAssessment, CompanyAssessment, StrategicImportance, AttentionWorthiness } from './types.ts';

/**
 * Severity level for signals (used in scoring)
 */
export type SignalSeverity = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Rule definition for pattern matching
 */
interface Rule {
  id: string;
  category: SignalCategory;
  title: string;
  explanation: string;
  details?: string;
  severity?: SignalSeverity;
  domain?: RiskDomain;
  // Returns true if the rule matches, or returns matched instances for clause-level detection
  match: (content: string, metadata?: RuleMetadata) => boolean | string[];
}

interface RuleMetadata {
  url?: string;
  domain?: string;
  isHttps?: boolean;
  pageTitle?: string;
}

/**
 * Generate unique signal ID
 */
function generateSignalId(): string {
  return crypto.randomUUID();
}

// ============================================
// LEGAL CLAUSE DETECTION RULES
// Clause-level detection for abusive legal patterns
// ============================================

const legalClauseRules: Rule[] = [
  // === VERY HIGH RISK LEGAL CLAUSES ===
  {
    id: 'irrevocable_consent',
    category: 'risk',
    title: 'Irrevocable or Automatic Consent Clause',
    explanation: 'This document contains clauses that grant irrevocable consent or automatically consent on your behalf, removing your ability to withdraw agreement.',
    details: 'Legitimate agreements typically allow you to revoke consent or opt-out. Irrevocable consent clauses are a serious power imbalance.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /irrevocabl[ey]\s+(consent|agree|grant|authorize)/i,
        /automatic(ally)?\s+(consent|agree|opt[\s-]?in)/i,
        /consent\s+(is\s+)?deemed\s+(to\s+be\s+)?given/i,
        /by\s+(using|accessing|continuing).*you\s+(irrevocably\s+)?agree/i,
        /your\s+consent\s+is\s+permanent/i,
        /cannot\s+(be\s+)?(revoked|withdrawn)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'unilateral_modification',
    category: 'risk',
    title: 'Unilateral Modification Without Notice',
    explanation: 'This document allows the provider to change terms at any time without notifying you, meaning your rights can be altered without your knowledge.',
    details: 'Fair agreements require reasonable notice before changes take effect, allowing you to cancel if you disagree.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /modify\s+(these\s+)?(terms|agreement|conditions).*without\s+(prior\s+)?notice/i,
        /change\s+(these\s+)?(terms|agreement).*at\s+(any\s+time|our\s+(sole\s+)?discretion)/i,
        /reserve\s+the\s+right\s+to\s+(modify|change|amend).*without\s+notice/i,
        /terms\s+may\s+(be\s+)?(updated|changed|modified)\s+at\s+any\s+time/i,
        /sole\s+discretion\s+to\s+(modify|alter|change)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'retroactive_charges',
    category: 'risk',
    title: 'Retroactive Fees or Charges',
    explanation: 'This document may allow charges to be applied retroactively or fees to be changed for past services.',
    details: 'Retroactive charging is highly unusual and potentially illegal in many jurisdictions. You should be charged based on terms at time of purchase.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /retroactiv(e|ely)\s+(charge|fee|billing|payment)/i,
        /charge.*for\s+prior\s+(usage|services|periods)/i,
        /fees?\s+(may\s+)?apply\s+retroactively/i,
        /back[\s-]?dated?\s+(charges|fees|billing)/i,
        /adjust\s+(past|previous|prior)\s+(invoices?|bills?|charges)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'waiver_right_to_sue',
    category: 'risk',
    title: 'Waiver of Right to Sue',
    explanation: 'This document requires you to waive your right to take legal action, including class action lawsuits.',
    details: 'While arbitration clauses are common, complete waivers of legal rights can leave you without recourse for serious harm.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /waive.*right\s+to\s+(sue|litigate|legal\s+action)/i,
        /release.*from\s+(any\s+and\s+)?all\s+claims/i,
        /waive.*class[\s-]?action/i,
        /agree\s+not\s+to\s+(sue|bring\s+legal\s+action)/i,
        /give\s+up.*right\s+to\s+(sue|court|legal)/i,
        /covenant\s+not\s+to\s+sue/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'forced_arbitration',
    category: 'risk',
    title: 'Forced Arbitration With No Appeal',
    explanation: 'This document mandates binding arbitration with no right to appeal, limiting your access to the court system.',
    details: 'Forced arbitration often favors companies. The lack of appeal rights means you accept the arbitrator\'s decision as final, even if unfair.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /binding\s+arbitration/i,
        /mandatory\s+arbitration/i,
        /arbitration.*final\s+and\s+binding/i,
        /no\s+(right\s+to\s+)?appeal.*arbitration/i,
        /waive.*right\s+to.*jury\s+trial/i,
        /resolve.*through\s+arbitration.*only/i,
        /arbitration.*exclusive\s+(remedy|means)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'perpetual_data_ownership',
    category: 'risk',
    title: 'Perpetual Data or IP Ownership Transfer',
    explanation: 'This document grants perpetual, transferable rights to your data, content, or intellectual property.',
    details: 'Once granted, perpetual rights cannot be revoked. Your content may be used, sold, or transferred indefinitely without your control.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /perpetual.*license.*to\s+(your|user)\s+(content|data|information)/i,
        /irrevocable.*license.*to\s+(use|distribute|sell)/i,
        /transferable.*rights?\s+to\s+(your|user)/i,
        /worldwide.*perpetual.*license/i,
        /own(ership)?.*transfer.*to\s+(us|the\s+company)/i,
        /grant.*royalty[\s-]?free.*perpetual/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'negligence_indemnification',
    category: 'risk',
    title: 'Indemnification for Provider Negligence',
    explanation: 'This document may require you to indemnify (protect) the provider even for their own negligence or wrongdoing.',
    details: 'This is a significant power imbalance. You should not be liable for damages caused by the company\'s own actions.',
    severity: 'very_high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /indemnify.*including.*negligence/i,
        /hold\s+harmless.*even\s+if.*negligent/i,
        /indemnif(y|ication).*regardless\s+of\s+cause/i,
        /liable.*for.*our\s+(own\s+)?negligence/i,
        /indemnify.*for\s+any\s+and\s+all\s+claims/i,
        /defend.*against.*any.*claims.*including.*our\s+acts/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'survival_clauses',
    category: 'risk',
    title: 'Survival Clauses Beyond Account Deletion',
    explanation: 'This document contains clauses that survive account deletion or extend beyond your death, maintaining obligations indefinitely.',
    details: 'While some survival clauses are normal (e.g., payment obligations), overly broad ones can bind you or your estate permanently.',
    severity: 'high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /survive.*termination.*indefinitely/i,
        /obligations?\s+continue.*after.*death/i,
        /binding.*upon.*heirs.*executors/i,
        /perpetual.*obligations?/i,
        /survive.*in\s+perpetuity/i,
        /clauses?\s+survive.*account\s+deletion/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },

  // === HIGH RISK LEGAL CLAUSES ===
  {
    id: 'unlimited_liability',
    category: 'risk',
    title: 'Unlimited User Liability',
    explanation: 'This document may expose you to unlimited liability while limiting the provider\'s liability.',
    details: 'Fair agreements balance liability. One-sided unlimited liability clauses are predatory.',
    severity: 'high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /you\s+(are|shall\s+be)\s+liable\s+for\s+(all|any)\s+(damages|losses)/i,
        /user.*unlimited\s+liability/i,
        /liable.*without\s+limitation/i,
        /full(y)?\s+responsible\s+for\s+any\s+(and\s+all\s+)?damages/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'automatic_renewal',
    category: 'risk',
    title: 'Automatic Renewal Without Clear Notice',
    explanation: 'This document contains automatic renewal clauses that may renew your subscription without clear advance notice.',
    details: 'Look for clear cancellation windows and notice requirements before automatic renewal.',
    severity: 'high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /automatic(ally)?\s+renew/i,
        /auto[\s-]?renewal/i,
        /renew.*unless.*cancel/i,
        /subscription.*continue.*automatically/i,
      ];
      const hasNotice = /(days?|weeks?)\s+(prior\s+)?notice|notify.*before.*renewal/i.test(content);
      return patterns.some(p => p.test(content)) && !hasNotice;
    },
  },
  {
    id: 'broad_data_sharing',
    category: 'risk',
    title: 'Broad Third-Party Data Sharing',
    explanation: 'This document allows sharing your data with unspecified third parties or "partners" without clear limitations.',
    details: 'Legitimate privacy policies specify categories of third parties and purposes for data sharing.',
    severity: 'high',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /share.*with.*third[\s-]?part(y|ies).*for\s+any\s+purpose/i,
        /disclose.*to.*affiliates.*partners.*vendors/i,
        /sell.*personal\s+(information|data)/i,
        /transfer.*data.*to.*third[\s-]?part(y|ies)/i,
      ];
      const hasLimitations = /(only|solely|limited to|for the purpose of)/i.test(content);
      return patterns.some(p => p.test(content)) && !hasLimitations;
    },
  },
];

// ============================================
// CONSUMER / SCAM DETECTION RULES
// ============================================

const consumerRiskRules: Rule[] = [
  {
    id: 'urgency_language',
    category: 'risk',
    title: 'Urgency Language Detected',
    explanation: 'The content uses pressure tactics like "act now", "limited time", or "don\'t miss out" that may rush you into a decision.',
    details: 'Legitimate offers typically give you time to think. High-pressure tactics are common in scams.',
    severity: 'medium',
    domain: 'consumer',
    match: (content) => {
      const patterns = [
        /act\s+(now|fast|immediately|quickly)/i,
        /limited\s+time/i,
        /don'?t\s+miss\s+(out|this)/i,
        /only\s+\d+\s+(left|remaining|available)/i,
        /expires?\s+(today|soon|in\s+\d+)/i,
        /hurry/i,
        /last\s+chance/i,
        /urgent/i,
        /immediately/i,
        /right\s+now/i,
        /before\s+it'?s\s+too\s+late/i,
        /time\s+is\s+running\s+out/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'unusual_payment',
    category: 'risk',
    title: 'Unusual Payment Method Requested',
    explanation: 'The content mentions payment methods like gift cards, wire transfers, or cryptocurrency that are hard to reverse or trace.',
    details: 'Legitimate businesses accept standard payment methods. Untraceable payments are a major scam indicator.',
    severity: 'high',
    domain: 'consumer',
    match: (content) => {
      const patterns = [
        /gift\s*card/i,
        /wire\s*transfer/i,
        /western\s*union/i,
        /money\s*gram/i,
        /bitcoin|btc|cryptocurrency|crypto\s*payment/i,
        /zelle|venmo|cash\s*app/i,
        /prepaid\s*(debit|card)/i,
        /pay\s+in\s+(cash|bitcoin)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'too_good_to_be_true',
    category: 'risk',
    title: 'Offer Seems Too Good To Be True',
    explanation: 'The content promises unusually high returns, guaranteed profits, or free money with little effort.',
    details: 'If something sounds too good to be true, it usually is. Legitimate opportunities acknowledge risks.',
    severity: 'high',
    domain: 'consumer',
    match: (content) => {
      const patterns = [
        /guaranteed\s+(returns?|profit|income|money)/i,
        /100%\s+(safe|guaranteed|profit)/i,
        /risk[\s-]*free\s+(investment|opportunity|money)/i,
        /double\s+your\s+money/i,
        /free\s+money/i,
        /get\s+rich\s+(quick|fast)/i,
        /make\s+\$?\d{4,}\s+(per|a)\s+(day|week|month)/i,
        /passive\s+income.*(\$\d{3,}|thousands)/i,
        /no\s+risk/i,
        /instant\s+(wealth|riches|millionaire)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'impersonation_patterns',
    category: 'risk',
    title: 'Potential Impersonation Detected',
    explanation: 'The content contains patterns often used when impersonating banks, government agencies, or tech companies.',
    details: 'Scammers often pretend to be trusted organizations. Verify by contacting the organization directly through official channels.',
    severity: 'high',
    domain: 'consumer',
    match: (content) => {
      const patterns = [
        /your\s+account\s+(has\s+been|will\s+be)\s+(suspended|locked|compromised)/i,
        /verify\s+your\s+(identity|account|information)\s+(immediately|now|urgently)/i,
        /irs|internal\s+revenue\s+service.*call/i,
        /social\s+security.*suspended/i,
        /microsoft.*technical\s+support/i,
        /apple.*security\s+alert/i,
        /we\s+detected\s+(unusual|suspicious)\s+activity/i,
        /confirm\s+your\s+(password|ssn|social\s+security)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'personal_info_request',
    category: 'risk',
    title: 'Sensitive Information Requested',
    explanation: 'The content asks for sensitive personal information like SSN, passwords, or financial details.',
    details: 'Legitimate organizations rarely ask for sensitive info via email or message. When in doubt, contact them directly.',
    severity: 'high',
    domain: 'consumer',
    match: (content) => {
      const patterns = [
        /send\s+(me\s+)?your\s+(password|pin|ssn)/i,
        /provide\s+(your\s+)?credit\s+card/i,
        /need\s+your\s+(bank|account)\s+(details|information|number)/i,
        /click\s+(here|the\s+link)\s+to\s+verify/i,
        /update\s+your\s+(payment|billing)\s+information/i,
        /confirm\s+your\s+(bank|credit\s+card)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
];

// ============================================
// BUSINESS RISK RULES - CLIENT INQUIRY SCREENING
// ============================================

const clientInquiryRules: Rule[] = [
  {
    id: 'low_intent_inquiry',
    category: 'risk',
    title: 'Low Inquiry Quality',
    explanation: 'This inquiry lacks specific details about needs, timeline, or business context, suggesting early exploration rather than genuine buying intent.',
    details: 'High-quality inquiries typically include specific requirements, timeline, budget indicators, and clear business context.',
    severity: 'medium',
    domain: 'business',
    match: (content) => {
      const vaguePatterns = [
        /just\s+(exploring|looking|curious)/i,
        /pick\s+your\s+brain/i,
        /quick\s+(call|chat|question)/i,
        /no\s+rush/i,
        /when(ever)?\s+you('re|\s+are)\s+free/i,
        /let\s+me\s+know\s+when/i,
      ];
      const hasSpecifics = /(budget|timeline|deadline|requirement|by\s+q[1-4]|by\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i.test(content);
      return vaguePatterns.some(p => p.test(content)) && !hasSpecifics;
    },
  },
  {
    id: 'missing_business_context',
    category: 'risk',
    title: 'Missing Client Context',
    explanation: 'The inquiry doesn\'t include company name, role, or organizational details, making it difficult to assess legitimacy.',
    details: 'Professional inquiries typically include sender\'s role, company name, and sometimes company size or industry.',
    severity: 'medium',
    domain: 'business',
    match: (content) => {
      const hasCompany = /(our\s+company|at\s+\w+|from\s+\w+\s+(inc|llc|ltd|corp)|www\.\w+)/i.test(content);
      const hasRole = /(ceo|cto|cfo|director|manager|vp|head\s+of|founder|owner|lead)/i.test(content);
      const hasContact = /(@[a-z0-9.-]+\.[a-z]{2,}|\(\d{3}\)\s*\d{3}|\d{3}[-.]?\d{3}[-.]?\d{4})/i.test(content);
      const wordCount = content.split(/\s+/).length;
      
      // Short messages without any context
      return wordCount > 15 && !hasCompany && !hasRole && !hasContact;
    },
  },
  {
    id: 'unrealistic_expectations',
    category: 'risk',
    title: 'Unrealistic Scope or Timeline',
    explanation: 'The inquiry suggests unrealistic expectations about scope, timeline, or deliverables.',
    details: 'Inquiries with unrealistic expectations often lead to scope creep, delayed projects, or difficult client relationships.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /need\s+(this|it)\s+(asap|urgently|tomorrow|this\s+week)/i,
        /simple\s+(app|website|system|project)/i,
        /shouldn'?t\s+(take|be)\s+(long|hard|difficult)/i,
        /just\s+a\s+(quick|small|simple)/i,
        /how\s+hard\s+can\s+it\s+be/i,
        /by\s+(tomorrow|monday|next\s+week)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'bypass_process',
    category: 'risk',
    title: 'Process Bypass Attempt',
    explanation: 'The inquiry attempts to bypass standard business processes like pricing, proposals, or discovery calls.',
    details: 'Clients who try to skip standard processes may be price-shopping, testing boundaries, or not serious about engagement.',
    severity: 'medium',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /skip\s+(the\s+)?(call|meeting|proposal)/i,
        /just\s+send\s+(me\s+)?(a\s+)?(price|quote|rate)/i,
        /ball\s*park\s+(figure|estimate|number)/i,
        /rough\s+(estimate|idea|cost)/i,
        /can\s+you\s+just/i,
        /without\s+(meeting|talking|a\s+call)/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'generic_inquiry',
    category: 'uncertainty',
    title: 'Generic Copy-Paste Inquiry',
    explanation: 'This inquiry appears to be a generic template sent to multiple vendors rather than a targeted request.',
    details: 'Generic inquiries often indicate early research phase or low-priority exploration.',
    severity: 'low',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /came\s+across\s+your\s+(website|company)/i,
        /interested\s+in\s+what\s+you\s+do/i,
        /looking\s+for\s+someone\s+who/i,
        /services\s+you\s+offer/i,
        /more\s+information\s+about\s+your/i,
      ];
      const isVeryGeneric = patterns.filter(p => p.test(content)).length >= 2;
      const hasSpecifics = /(our\s+project|specifically|particular|exact|require)/i.test(content);
      return isVeryGeneric && !hasSpecifics;
    },
  },
];

// ============================================
// BUSINESS RISK RULES - SUBSTANCE DEFICIT DETECTION
// ============================================

const substanceDeficitRules: Rule[] = [
  {
    id: 'low_substance_proposal',
    category: 'risk',
    title: 'Low Substance Proposal',
    explanation: 'This proposal lacks essential verifiable details: company identity, named sender, clear scope, specific offering, or evidence of past work.',
    details: 'Low-information proposals protect the sender while exposing you to decision risk. Vagueness is not neutrality—it shifts the burden of discovery onto you.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      // Check for essential substance markers
      const hasCompanyName = /our\s+company\s+(\w+)|at\s+(\w+\s+)?(inc|llc|ltd|corp|co\.|gmbh|pty|limited)/i.test(content) ||
                            /^(?:we\s+are\s+|i(?:'m|\s+am)\s+(?:with|from)\s+)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/m.test(content);
      const hasNamedSender = /(?:^|\n)(?:regards|sincerely|best|thanks),?\s*\n+\s*([A-Z][a-z]+\s+[A-Z][a-z]+)|my\s+name\s+is\s+([A-Z][a-z]+)/i.test(content);
      const hasClearOffering = /(we\s+provide|we\s+offer|our\s+(service|product|solution|platform)\s+is|specifically,?\s+we|our\s+pricing|deliverables?\s+include)/i.test(content);
      const hasConcreteScope = /(scope|deliverables?|phase\s+\d|milestone|timeline.*(?:week|month|q[1-4])|budget.*\$\d+)/i.test(content);
      const hasEvidenceOfWork = /(case\s+study|portfolio|client\s+list|reference|previously\s+(?:worked|delivered)|completed\s+(?:project|work))/i.test(content);
      const hasCorporateEmail = /@(?!gmail|yahoo|hotmail|outlook|icloud|proton|aol)[a-z0-9-]+\.(com|org|io|co|net|ai)/i.test(content);
      
      // Count substance markers
      const substanceMarkers = [hasCompanyName, hasNamedSender, hasClearOffering, hasConcreteScope, hasEvidenceOfWork, hasCorporateEmail];
      const substanceCount = substanceMarkers.filter(Boolean).length;
      
      // Low substance if missing 4+ of the 6 markers AND content is significant (>100 chars)
      return content.length > 100 && substanceCount <= 2;
    },
  },
  {
    id: 'confidence_without_evidence',
    category: 'risk',
    title: 'Confidence Without Evidence',
    explanation: 'This proposal uses assertive, confident language without providing verifiable evidence or specific proof.',
    details: 'High-confidence copy without proof is designed to bypass scrutiny. Professional-sounding language can mask a lack of real substance.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      // Confidence patterns
      const confidencePatterns = [
        /we\s+(can|will|are\s+able\s+to)\s+(definitely|certainly|absolutely|guaranteed)/i,
        /you('ll|\s+will)\s+(definitely|certainly|absolutely)\s+(see|get|benefit)/i,
        /proven\s+(track\s+record|results|success)/i,
        /exceptional\s+(results|outcomes|performance)/i,
        /guaranteed\s+(results|roi|success|outcomes)/i,
        /we\s+have\s+(?:extensive|deep|significant)\s+experience/i,
        /industry[\s-]?leading/i,
        /best[\s-]?in[\s-]?class/i,
        /world[\s-]?class/i,
        /cutting[\s-]?edge/i,
      ];
      
      // Evidence patterns
      const evidencePatterns = [
        /case\s+study/i,
        /for\s+example,?\s+(?:we|our|with)/i,
        /specifically,?\s+(?:we|our)/i,
        /\$[\d,]+\s+(?:in\s+)?(?:savings|revenue|growth|results)/i,
        /increased\s+(?:\w+\s+)?by\s+\d+%/i,
        /see\s+our\s+(?:portfolio|work|results)/i,
        /reference(?:s)?.*available/i,
        /client(?:s)?.*include/i,
      ];
      
      const hasConfidence = confidencePatterns.filter(p => p.test(content)).length >= 2;
      const hasEvidence = evidencePatterns.some(p => p.test(content));
      
      return hasConfidence && !hasEvidence;
    },
  },
  {
    id: 'vague_value_proposition',
    category: 'risk',
    title: 'Vague Value Proposition',
    explanation: 'The proposal describes benefits in abstract terms without explaining how value will be delivered or measured.',
    details: 'Buzzwords like "synergy", "alignment", and "exposure" describe outcomes, not mechanisms. Ask: what specifically will they do, and how will you measure it?',
    severity: 'medium',
    domain: 'business',
    match: (content) => {
      const buzzwordPatterns = [
        /strategic\s+(alignment|synergy|partnership|value)/i,
        /synergy|synergies/i,
        /leverage\s+(your|our|the)\s+(brand|reach|network|expertise)/i,
        /exposure\s+to\s+(new|wider|larger)/i,
        /unlock\s+(value|potential|growth)/i,
        /drive\s+(growth|value|results)/i,
        /maximize\s+(your|the)\s+(potential|value|roi)/i,
        /transform(ative)?\s+(your|the)\s+(business|organization)/i,
        /elevate\s+(your|the)/i,
        /next[\s-]?level/i,
        /game[\s-]?changer/i,
      ];
      
      const specificPatterns = [
        /we\s+will\s+(?:specifically|concretely)\s+(?:provide|deliver|do)/i,
        /deliverables?\s+include/i,
        /pricing.*\$[\d,]+/i,
        /scope\s+includes?/i,
        /phase\s+\d/i,
        /by\s+(?:week|month|q[1-4])\s+\d/i,
      ];
      
      const hasBuzzwords = buzzwordPatterns.filter(p => p.test(content)).length >= 2;
      const hasSpecifics = specificPatterns.some(p => p.test(content));
      
      return hasBuzzwords && !hasSpecifics;
    },
  },
  {
    id: 'urgency_without_substance',
    category: 'risk',
    title: 'Urgency Without Substance',
    explanation: 'The proposal creates time pressure while providing insufficient detail to support fast decision-making.',
    details: 'Urgency is a pressure tactic. Legitimate time constraints come with proportional detail; artificial urgency comes with vague promises.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const urgencyPatterns = [
        /moving\s+(fast|quickly)/i,
        /decision\s+(this|next)\s+week/i,
        /need\s+(?:a\s+)?(?:quick|fast)\s+(?:answer|decision|response)/i,
        /time[\s-]?sensitive/i,
        /limited\s+(?:time\s+)?(?:offer|opportunity|slots?|availability)/i,
        /closing\s+(?:this|the)\s+(?:round|opportunity)\s+(?:soon|shortly)/i,
        /(?:act|decide|respond)\s+(?:now|quickly|fast)/i,
        /opportunity\s+(?:won't|will\s+not)\s+(?:last|wait)/i,
      ];
      
      // Substance check - same as low_substance_proposal
      const hasCompanyName = /our\s+company\s+(\w+)|at\s+(\w+\s+)?(inc|llc|ltd|corp|co\.|gmbh|pty|limited)/i.test(content);
      const hasClearOffering = /(we\s+provide|we\s+offer|our\s+(service|product|solution|platform)\s+is|specifically,?\s+we)/i.test(content);
      const hasConcreteScope = /(scope|deliverables?|phase\s+\d|milestone|timeline.*(?:week|month|q[1-4]))/i.test(content);
      
      const hasUrgency = urgencyPatterns.some(p => p.test(content));
      const substanceCount = [hasCompanyName, hasClearOffering, hasConcreteScope].filter(Boolean).length;
      
      return hasUrgency && substanceCount < 2;
    },
  },
  {
    id: 'unverifiable_identity',
    category: 'risk',
    title: 'Unverifiable Sender Identity',
    explanation: 'The sender does not provide verifiable identity: no full name, company email, or LinkedIn profile.',
    details: 'Anonymous or hard-to-verify senders shift risk to you. Legitimate business contacts provide traceable identities.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const hasFullName = /(?:^|\n)(?:regards|sincerely|best|thanks|cheers),?\s*\n+\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i.test(content) ||
                         /my\s+name\s+is\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i.test(content) ||
                         /^([A-Z][a-z]+\s+[A-Z][a-z]+),?\s*\n/m.test(content);
      const hasCorporateEmail = /@(?!gmail|yahoo|hotmail|outlook|icloud|proton|aol|mail)[a-z0-9-]+\.(com|org|io|co|net|ai)/i.test(content);
      const hasLinkedIn = /linkedin\.com/i.test(content);
      const hasWebsite = /(?:www\.|https?:\/\/)(?!gmail|yahoo|google)[a-z0-9-]+\.[a-z]{2,}/i.test(content);
      
      // Only flag if none of these identity markers exist AND content is significant
      return content.length > 150 && !hasFullName && !hasCorporateEmail && !hasLinkedIn && !hasWebsite;
    },
  },
  {
    id: 'compliance_mimicry',
    category: 'uncertainty',
    title: 'Compliance Mimicry',
    explanation: 'The proposal mentions compliance frameworks (GDPR, SOC2, HIPAA) without verifiable links or certification details.',
    details: 'Mentioning compliance is not the same as demonstrating it. Legitimate vendors provide certification numbers, audit reports, or verification links.',
    severity: 'medium',
    domain: 'business',
    match: (content) => {
      const compliancePatterns = [
        /gdpr\s+compliant/i,
        /soc\s*2\s+(type\s+[12i]|certified|compliant)/i,
        /hipaa\s+compliant/i,
        /iso\s*27001/i,
        /pci[\s-]?dss/i,
      ];
      
      const verificationPatterns = [
        /certificate\s+(?:number|id|#)/i,
        /audit\s+report/i,
        /verification\s+(?:link|url|page)/i,
        /see\s+our\s+(?:security|compliance|trust)\s+page/i,
        /trustcenter|securityscorecard|vanta|drata/i,
      ];
      
      const hasMention = compliancePatterns.some(p => p.test(content));
      const hasVerification = verificationPatterns.some(p => p.test(content));
      
      return hasMention && !hasVerification;
    },
  },
  {
    id: 'false_authority',
    category: 'uncertainty',
    title: 'False Authority Framing',
    explanation: 'The proposal uses authority-signaling language without specific, verifiable claims.',
    details: '"Trusted by industry leaders" and "as seen on" are marketing phrases, not proof. Real authority comes with names and verifiable references.',
    severity: 'low',
    domain: 'business',
    match: (content) => {
      const authorityPatterns = [
        /trusted\s+by\s+(industry\s+)?leaders/i,
        /as\s+(?:seen|featured)\s+(?:on|in)/i,
        /recognized\s+(?:by|as)/i,
        /award[\s-]?winning/i,
        /leading\s+(?:provider|company|platform)/i,
        /industry[\s-]?leading/i,
        /top[\s-]?rated/i,
      ];
      
      const specificAuthorityPatterns = [
        /microsoft|google|amazon|apple|meta|salesforce|oracle|ibm/i,
        /forbes|inc\.\s+magazine|techcrunch|wsj|nytimes/i,
        /gartner|forrester|g2|capterra/i,
        /\d+\+?\s+(?:clients|customers|companies)/i,
      ];
      
      const hasVagueAuthority = authorityPatterns.some(p => p.test(content));
      const hasSpecificAuthority = specificAuthorityPatterns.some(p => p.test(content));
      
      return hasVagueAuthority && !hasSpecificAuthority;
    },
  },
];

// ============================================
// BUSINESS RISK RULES - VENDOR EVALUATION
// ============================================

const vendorEvaluationRules: Rule[] = [
  {
    id: 'asymmetric_obligation',
    category: 'risk',
    title: 'Asymmetric Obligation Risk',
    explanation: 'This proposal places significantly more obligations and risks on you than on the vendor.',
    details: 'Fair vendor relationships balance obligations. Heavy one-sided commitments may indicate predatory terms.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /you\s+(must|shall|are\s+required\s+to|agree\s+to)/i,
        /client\s+assumes?\s+(all\s+)?risk/i,
        /at\s+your\s+(own\s+)?risk/i,
        /you\s+are\s+(solely\s+)?responsible/i,
        /we\s+(are\s+)?not\s+(liable|responsible)/i,
        /no\s+(warranty|guarantee).*provided/i,
      ];
      const hasMutuality = /(mutual|both\s+parties|each\s+party)/i.test(content);
      return patterns.filter(p => p.test(content)).length >= 2 && !hasMutuality;
    },
  },
  {
    id: 'missing_sla',
    category: 'risk',
    title: 'Missing Commercial Safeguards',
    explanation: 'This proposal lacks essential commercial protections like SLAs, uptime guarantees, or support commitments.',
    details: 'Professional vendors typically provide clear SLAs, support response times, and service guarantees.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const hasPricing = /(price|pricing|\$\d+|cost|fee|payment)/i.test(content);
      const hasSLA = /(sla|service\s+level|uptime|availability|99\.\d+%)/i.test(content);
      const hasSupport = /(support|response\s+time|24\/7|business\s+hours)/i.test(content);
      const hasGuarantee = /(guarantee|warranty|money[\s-]?back|refund)/i.test(content);
      
      // Has pricing but missing safeguards
      return hasPricing && !hasSLA && !hasSupport && !hasGuarantee;
    },
  },
  {
    id: 'overpromising',
    category: 'risk',
    title: 'Overpromising Without Evidence',
    explanation: 'This proposal makes bold claims about results without providing evidence, case studies, or realistic caveats.',
    details: 'Legitimate vendors back claims with data, references, or realistic projections that acknowledge variables.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /guarantee[ds]?\s+(\d+x|results|roi|success)/i,
        /proven\s+(system|method|formula)/i,
        /never\s+fails?/i,
        /100%\s+(success|satisfaction|guarantee)/i,
        /\d+x\s+(roi|return|growth)/i,
        /revolutionary|game[\s-]?chang/i,
      ];
      const hasEvidence = /(case\s+study|testimonial|reference|data\s+shows|according\s+to)/i.test(content);
      return patterns.some(p => p.test(content)) && !hasEvidence;
    },
  },
  {
    id: 'credibility_gaps',
    category: 'uncertainty',
    title: 'Credibility or Proof Gaps',
    explanation: 'The vendor claims experience or clients but doesn\'t provide verifiable details.',
    details: 'Established vendors typically name recognizable clients, provide references, or link to verifiable case studies.',
    severity: 'medium',
    domain: 'business',
    match: (content) => {
      const vagueCredentials = [
        /industry\s+leaders/i,
        /major\s+clients/i,
        /trusted\s+by\s+(many|companies|businesses)/i,
        /years?\s+of\s+experience/i,
        /award[\s-]?winning/i,
        /names?\s+confidential/i,
      ];
      const hasSpecificRefs = /(microsoft|google|amazon|apple|fortune\s+\d+|case\s+study\s+at|see\s+our|www\.\w+\.com\/case)/i.test(content);
      return vagueCredentials.some(p => p.test(content)) && !hasSpecificRefs;
    },
  },
  {
    id: 'dependency_lockin',
    category: 'risk',
    title: 'Dependency or Lock-in Risk',
    explanation: 'This proposal creates significant dependency through exclusivity, long terms, or difficult exit conditions.',
    details: 'Watch for multi-year commitments, exclusivity clauses, high exit fees, or proprietary formats that make switching difficult.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /exclusive\s+(rights|partnership|agreement)/i,
        /(\d+|multi)[\s-]?year\s+(commitment|contract|agreement)/i,
        /(early\s+)?termination\s+fee/i,
        /exit\s+fee/i,
        /proprietary\s+(format|system|platform)/i,
        /cannot\s+(export|migrate|transfer)/i,
        /minimum\s+commitment/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'no_refund_vendor',
    category: 'risk',
    title: 'No Refund or Cancellation Options',
    explanation: 'This proposal does not offer refund options, trial periods, or reasonable cancellation terms.',
    details: 'Reputable vendors typically offer satisfaction guarantees, pilot programs, or reasonable cancellation policies.',
    severity: 'high',
    domain: 'business',
    match: (content) => {
      const patterns = [
        /no\s+refund/i,
        /non[\s-]?refundable/i,
        /all\s+sales\s+final/i,
        /payment.*upfront.*only/i,
        /payment\s+in\s+full/i,
      ];
      const hasRefundOption = /(refund|money[\s-]?back|trial|pilot|cancel\s+(at\s+)?any\s+time)/i.test(content);
      return patterns.some(p => p.test(content)) || (content.length > 200 && !hasRefundOption && /\$\d+/i.test(content));
    },
  },
];

// ============================================
// UNCERTAINTY & GREEN FLAG RULES
// ============================================

const uncertaintyRules: Rule[] = [
  {
    id: 'vague_sender',
    category: 'uncertainty',
    title: 'Vague or Missing Sender Identity',
    explanation: 'The sender\'s identity is unclear or generic (e.g., "Support Team", "Customer Service").',
    details: 'Legitimate communications typically include specific sender details and contact information.',
    severity: 'medium',
    match: (content) => {
      const patterns = [
        /^(dear\s+)?(sir|madam|customer|user|valued\s+customer)/im,
        /from:?\s*(the\s+)?(team|support|admin|customer\s+service)/i,
        /regards,?\s*(the\s+)?(team|management|admin)/i,
        /signed,?\s*(the\s+)?support/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'unverifiable_claims',
    category: 'uncertainty',
    title: 'Unverifiable Claims Made',
    explanation: 'The content makes claims that cannot be easily verified, such as unnamed sources or vague credentials.',
    details: 'Look for specific, verifiable details. Vague claims may indicate misleading information.',
    severity: 'low',
    match: (content) => {
      const patterns = [
        /studies\s+show/i,
        /experts\s+agree/i,
        /doctors\s+(recommend|say)/i,
        /research\s+proves/i,
        /scientifically\s+proven/i,
        /everyone\s+(knows|is\s+doing)/i,
      ];
      const hasCitation = /\[(source|ref|\d+)\]|according\s+to\s+[A-Z]/i.test(content);
      return patterns.some(p => p.test(content)) && !hasCitation;
    },
  },
];

const greenFlagRules: Rule[] = [
  // NOTE: professional_tone is NO LONGER a green flag by itself
  // Professional tone without substance is a known manipulation pattern
  {
    id: 'professional_tone_with_substance',
    category: 'green',
    title: 'Professional Communication With Substance',
    explanation: 'The content uses professional language AND provides verifiable details like company name, specific offering, or contact information.',
    details: 'Professional tone only indicates legitimacy when paired with verifiable information. Tone alone can be mimicked.',
    domain: 'business',
    match: (content) => {
      // Check professional tone
      const hasGreeting = /^(dear|hello|hi|good\s+(morning|afternoon|evening))/im.test(content);
      const hasClosing = /(sincerely|regards|best|thank\s+you|yours)/im.test(content);
      const noExcessiveCaps = (content.match(/[A-Z]{4,}/g) || []).length < 3;
      const noExcessiveExclamation = (content.match(/!/g) || []).length < 5;
      const hasProfessionalTone = hasGreeting && hasClosing && noExcessiveCaps && noExcessiveExclamation;
      
      // Check for substance (REQUIRED for this green flag)
      const hasCompanyName = /our\s+company\s+(\w+)|at\s+(\w+\s+)?(inc|llc|ltd|corp|co\.|gmbh|pty|limited)/i.test(content) ||
                            /^(?:we\s+are\s+|i(?:'m|\s+am)\s+(?:with|from)\s+)([A-Z][a-zA-Z]+)/m.test(content);
      const hasCorporateEmail = /@(?!gmail|yahoo|hotmail|outlook|icloud|proton|aol)[a-z0-9-]+\.(com|org|io|co|net|ai)/i.test(content);
      const hasClearOffering = /(we\s+provide|we\s+offer|our\s+(service|product|solution|platform)\s+is|specifically,?\s+we|deliverables?\s+include)/i.test(content);
      const hasLinkedIn = /linkedin\.com/i.test(content);
      const hasWebsite = /(?:www\.|https?:\/\/)(?!gmail|yahoo|google)[a-z0-9-]+\.[a-z]{2,}/i.test(content);
      
      const substanceCount = [hasCompanyName, hasCorporateEmail, hasClearOffering, hasLinkedIn, hasWebsite].filter(Boolean).length;
      
      // Require professional tone AND at least 2 substance markers
      return hasProfessionalTone && substanceCount >= 2;
    },
  },
  {
    id: 'verifiable_details',
    category: 'green',
    title: 'Contains Verifiable Details',
    explanation: 'The content includes specific, verifiable information like order numbers, dates, or reference IDs.',
    details: 'Specific details can be verified through official channels, which is a positive sign.',
    match: (content) => {
      const patterns = [
        /(order|reference|confirmation|tracking)\s*(#|number|no\.?:?)\s*[A-Z0-9-]+/i,
        /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
        /invoice\s*(#|number|no\.?:?)\s*\w+/i,
        /case\s*(#|number|no\.?:?)\s*\w+/i,
      ];
      return patterns.some(p => p.test(content));
    },
  },
  {
    id: 'clear_business_context',
    category: 'green',
    title: 'Clear Business Context',
    explanation: 'The inquiry includes specific company information, role, and contact details.',
    details: 'Professional inquiries with clear context are more likely to be legitimate and high-intent.',
    domain: 'business',
    match: (content) => {
      const hasCompany = /(our\s+company|at\s+\w+|from\s+\w+\s+(inc|llc|ltd|corp)|www\.\w+)/i.test(content);
      const hasRole = /(ceo|cto|cfo|director|manager|vp|head\s+of|founder|owner|lead)/i.test(content);
      const hasContact = /(@[a-z0-9.-]+\.[a-z]{2,}|\(\d{3}\)\s*\d{3}|\d{3}[-.]?\d{3}[-.]?\d{4})/i.test(content);
      
      return hasCompany && (hasRole || hasContact);
    },
  },
  {
    id: 'specific_requirements',
    category: 'green',
    title: 'Specific Requirements Provided',
    explanation: 'The inquiry includes specific requirements, timeline, or budget information.',
    details: 'Detailed requirements indicate serious intent and make for more productive business discussions.',
    domain: 'business',
    match: (content) => {
      const hasTimeline = /(by\s+q[1-4]|deadline|timeline|by\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|within\s+\d+\s+(weeks?|months?))/i.test(content);
      const hasBudget = /(budget|approved|allocated|\$\d+k?|\d+k\s+(budget|allocated))/i.test(content);
      const hasRequirements = /(requirements?|need\s+to|must\s+have|should\s+support|integration\s+with)/i.test(content);
      
      return (hasTimeline && hasRequirements) || (hasBudget && hasRequirements);
    },
  },
  {
    id: 'vendor_transparency',
    category: 'green',
    title: 'Vendor Transparency',
    explanation: 'The proposal includes transparent pricing, clear terms, and verifiable references.',
    details: 'Transparent vendors are more likely to be reliable partners.',
    domain: 'business',
    match: (content) => {
      const hasClearPricing = /\$\d+.*\/(month|year|user)|pricing.*transparent/i.test(content);
      const hasTrial = /(trial|pilot|free.*\d+.*day|cancel\s+any\s+time)/i.test(content);
      const hasReferences = /(reference|case\s+study|testimonial|see\s+our)/i.test(content);
      const hasCompliance = /(soc\s*2|gdpr|hipaa|iso\s*27001|compliance)/i.test(content);
      
      return [hasClearPricing, hasTrial, hasReferences, hasCompliance].filter(Boolean).length >= 2;
    },
  },
  {
    id: 'explicit_user_protections',
    category: 'green',
    title: 'Explicit User Protections Found',
    explanation: 'The document includes explicit protections for users, such as clear opt-out rights, data deletion options, or user-favorable dispute resolution.',
    details: 'Documents that clearly outline user rights and protections are more trustworthy.',
    domain: 'legal',
    match: (content) => {
      const patterns = [
        /right\s+to\s+(delete|erase|remove)\s+(your\s+)?data/i,
        /opt[\s-]?out\s+at\s+any\s+time/i,
        /you\s+may\s+cancel\s+at\s+any\s+time/i,
        /full\s+refund\s+within/i,
        /money[\s-]?back\s+guarantee/i,
        /30[\s-]?day\s+notice\s+before/i,
      ];
      return patterns.filter(p => p.test(content)).length >= 2;
    },
  },
];

// ============================================
// URL/WEBSITE ANALYSIS RULES
// ============================================

const urlRules: Rule[] = [
  {
    id: 'missing_contact',
    category: 'risk',
    title: 'No Contact Information Found',
    explanation: 'The website lacks clear contact information like a phone number, physical address, or contact form.',
    details: 'Legitimate businesses typically provide multiple ways to contact them.',
    severity: 'medium',
    match: (content) => {
      const hasPhone = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(content);
      const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(content);
      const hasAddress = /\d+\s+[A-Za-z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr)/i.test(content);
      const hasContactPage = /(contact\s+us|get\s+in\s+touch|reach\s+out)/i.test(content);
      
      return !hasPhone && !hasEmail && !hasAddress && !hasContactPage;
    },
  },
  {
    id: 'https_secure',
    category: 'green',
    title: 'Secure Connection (HTTPS)',
    explanation: 'The website uses HTTPS encryption to protect your data in transit.',
    details: 'HTTPS is a basic security requirement. While it doesn\'t guarantee legitimacy, its absence is concerning.',
    match: (_content, metadata) => {
      return metadata?.isHttps === true;
    },
  },
  {
    id: 'clear_contact',
    category: 'green',
    title: 'Clear Contact Information',
    explanation: 'The website provides multiple ways to contact them including phone, email, or physical address.',
    details: 'Multiple contact options suggest a legitimate, reachable business.',
    match: (content) => {
      let contactMethods = 0;
      if (/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(content)) contactMethods++;
      if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(content)) contactMethods++;
      if (/\d+\s+[A-Za-z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd)/i.test(content)) contactMethods++;
      if (/live\s+chat|chat\s+with\s+us/i.test(content)) contactMethods++;
      
      return contactMethods >= 2;
    },
  },
];

// ============================================
// CONTEXT DETECTION
// ============================================

/**
 * Detect the analysis context based on content patterns
 */
export function detectContext(content: string, signals: Signal[]): AnalysisContext {
  const lowerContent = content.toLowerCase();
  
  // Legal agreement detection
  const legalPatterns = [
    /terms\s+(of\s+)?(service|use)/i,
    /privacy\s+policy/i,
    /user\s+agreement/i,
    /license\s+agreement/i,
    /binding\s+arbitration/i,
    /hereby\s+agree/i,
    /by\s+(using|accessing).*you\s+agree/i,
    /legal\s+terms/i,
  ];
  if (legalPatterns.some(p => p.test(content))) {
    return 'legal_agreement';
  }
  
  // Partnership offer detection (check before vendor to catch partnership-specific language)
  const partnershipPatterns = [
    /partnership\s+(opportunity|proposal|offer)/i,
    /strategic\s+(partnership|alliance)/i,
    /exclusive\s+(distribution|rights|partnership)/i,
    /joint\s+venture/i,
    /revenue\s+share/i,
    /distribution\s+rights/i,
  ];
  if (partnershipPatterns.some(p => p.test(content))) {
    return 'partnership_offer';
  }
  
  // Client inquiry detection - expanded patterns
  const inquiryPatterns = [
    /interested\s+in\s+(your|working)/i,
    /looking\s+for\s+(a\s+)?(vendor|partner|developer|agency|consultant)/i,
    /can\s+we\s+(schedule|set\s+up)\s+a\s+call/i,
    /our\s+(company|team|organization)\s+(needs?|is\s+looking)/i,
    /request\s+for\s+(proposal|quote|information)/i,
    /rfp|rfi|rfq/i,
    /discovery\s+call/i,
    /capabilities\s+overview/i,
    /we\s+need\s+to\s+(migrate|implement|build|develop)/i,
    /budget\s+(is\s+)?(approved|allocated)/i,
    /our\s+requirements/i,
    /could\s+you\s+send/i,
    /reaching\s+out\s+(from|regarding)/i,
    /evaluating\s+(vendors|solutions|options)/i,
    /looking\s+to\s+(hire|engage|work\s+with)/i,
  ];
  if (inquiryPatterns.some(p => p.test(content))) {
    return 'client_inquiry';
  }
  
  // Vendor proposal detection
  const vendorPatterns = [
    /proposal/i,
    /our\s+(solution|platform|service|product)\s+(can|will)/i,
    /pricing/i,
    /package\s+(includes?|offers?)/i,
    /we\s+(offer|provide|specialize)/i,
    /sign\s+up\s+(now|today)/i,
    /enterprise\s+(solution|offering)/i,
    /our\s+pricing/i,
    /minimum\s+commitment/i,
    /annual\s+fee/i,
  ];
  if (vendorPatterns.some(p => p.test(content))) {
    return 'vendor_proposal';
  }
  
  // Consumer message (default for scam-like patterns)
  const hasConsumerRisks = signals.some(s => 
    s.domain === 'consumer' || 
    ['unusual_payment', 'impersonation_patterns', 'too_good_to_be_true'].includes(s.ruleId)
  );
  if (hasConsumerRisks) {
    return 'consumer_message';
  }
  
  // Fallback: If we have business signals, treat as client inquiry
  const hasBusinessSignals = signals.some(s => s.domain === 'business');
  const hasBusinessGreenFlags = signals.some(s => 
    s.ruleId === 'clear_business_context' || 
    s.ruleId === 'specific_requirements' ||
    s.ruleId === 'vendor_transparency'
  );
  if (hasBusinessSignals || hasBusinessGreenFlags) {
    return 'client_inquiry';
  }
  
  return 'general';
}

/**
 * Determine the primary risk domain from signals
 */
export function getPrimaryDomain(signals: Signal[], context: AnalysisContext): RiskDomain {
  // Count signals by domain
  const domainCounts: Record<RiskDomain, number> = {
    consumer: 0,
    legal: 0,
    business: 0,
  };
  
  for (const signal of signals) {
    if (signal.domain) {
      domainCounts[signal.domain]++;
    }
  }
  
  // Context can override
  if (context === 'legal_agreement') return 'legal';
  if (context === 'client_inquiry' || context === 'vendor_proposal' || context === 'partnership_offer') return 'business';
  if (context === 'consumer_message') return 'consumer';
  
  // Otherwise, use highest signal count
  if (domainCounts.legal >= domainCounts.consumer && domainCounts.legal >= domainCounts.business) {
    return 'legal';
  }
  if (domainCounts.business >= domainCounts.consumer) {
    return 'business';
  }
  return 'consumer';
}

/**
 * Generate "Why It Matters" explanation
 * UPDATED: Better messaging for substance-deficient proposals
 */
export function generateWhyItMatters(signals: Signal[], context: AnalysisContext, domain: RiskDomain): string {
  const riskCount = signals.filter(s => s.category === 'risk').length;
  const criticalCount = signals.filter(s => s.severity === 'very_high').length;
  
  // Check for substance-deficit signals specifically
  const hasSubstanceDeficit = signals.some(s => 
    s.ruleId === 'low_substance_proposal' || 
    s.ruleId === 'confidence_without_evidence' ||
    s.ruleId === 'vague_value_proposition' ||
    s.ruleId === 'unverifiable_identity'
  );
  
  const hasUrgencyWithoutSubstance = signals.some(s => s.ruleId === 'urgency_without_substance');
  
  // IMPORTANT: Never say "no risk detected" when dealing with low-substance business content
  if (riskCount === 0) {
    if (context === 'vendor_proposal' || context === 'partnership_offer' || context === 'client_inquiry') {
      return "While no explicit fraud signals were detected, the lack of concrete information introduces decision risk and potential time waste. Absence of red flags is not the same as presence of credibility.";
    }
    return "No significant risk patterns were detected in this content. This doesn't guarantee safety, but it means our detection rules didn't find common warning signs.";
  }
  
  // Substance-deficit specific messaging
  if (hasSubstanceDeficit && (context === 'vendor_proposal' || context === 'partnership_offer')) {
    if (hasUrgencyWithoutSubstance) {
      return "This proposal uses confident language and time pressure but lacks concrete details. The cost of time investment may outweigh the unclear upside. Request specifics before any commitment.";
    }
    return "The proposal uses professional-sounding language but lacks verifiable substance. Missing: company identity, clear scope, evidence of past work. This vagueness shifts decision risk onto you.";
  }
  
  const contextPhrases: Record<AnalysisContext, string> = {
    consumer_message: 'This could lead to financial loss, identity theft, or privacy violations.',
    legal_agreement: 'These patterns could limit your legal rights, expose you to liability, or lock you into unfavorable terms.',
    client_inquiry: 'Engaging with low-quality inquiries can waste valuable time and resources without resulting in revenue.',
    vendor_proposal: 'These concerns could lead to budget overruns, project failures, or being locked into unfavorable contracts.',
    partnership_offer: 'These patterns suggest power imbalances that could harm your business strategically or financially.',
    general: 'These patterns warrant careful review before proceeding.',
  };
  
  if (criticalCount >= 2) {
    return `CRITICAL: Multiple severe risk patterns detected. ${contextPhrases[context]} We strongly recommend independent review before proceeding.`;
  }
  
  if (criticalCount === 1) {
    return `A critical risk pattern was detected alongside other concerns. ${contextPhrases[context]}`;
  }
  
  return contextPhrases[context];
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Count power imbalance clauses for escalation
 */
function countPowerImbalanceClauses(signals: Signal[]): number {
  const powerImbalanceRuleIds = [
    'irrevocable_consent',
    'unilateral_modification',
    'retroactive_charges',
    'waiver_right_to_sue',
    'forced_arbitration',
    'perpetual_data_ownership',
    'negligence_indemnification',
    'survival_clauses',
    'unlimited_liability',
  ];
  return signals.filter(s => powerImbalanceRuleIds.includes(s.ruleId)).length;
}

/**
 * Check for user protections in content
 */
function hasUserProtections(content: string): { 
  hasOptOut: boolean; 
  hasDispute: boolean; 
  hasRefund: boolean; 
  hasNotice: boolean;
  protectionCount: number;
} {
  const hasOptOut = /opt[\s-]?out|you\s+may\s+(cancel|withdraw|revoke)/i.test(content);
  const hasDispute = /(dispute\s+resolution|mediation|small\s+claims\s+court)/i.test(content);
  const hasRefund = /(refund|money[\s-]?back|return\s+policy|full\s+refund)/i.test(content);
  const hasNotice = /(\d+)\s+(days?|weeks?)\s+(prior\s+)?notice|notify.*before.*changes/i.test(content);
  
  const protectionCount = [hasOptOut, hasDispute, hasRefund, hasNotice].filter(Boolean).length;
  
  return { hasOptOut, hasDispute, hasRefund, hasNotice, protectionCount };
}

/**
 * Run text analysis rules against content
 */
export function analyzeText(content: string): Signal[] {
  const signals: Signal[] = [];
  
  // Run all rule sets
  const allRules = [
    ...legalClauseRules,
    ...consumerRiskRules,
    ...clientInquiryRules,
    ...vendorEvaluationRules,
    ...substanceDeficitRules, // NEW: Low-substance and confidence-without-content detection
    ...uncertaintyRules,
    ...greenFlagRules,
  ];
  
  for (const rule of allRules) {
    const result = rule.match(content);
    if (result === true || (Array.isArray(result) && result.length > 0)) {
      signals.push({
        id: generateSignalId(),
        category: rule.category,
        title: rule.title,
        explanation: rule.explanation,
        details: rule.details,
        ruleId: rule.id,
        severity: rule.severity,
        domain: rule.domain,
      });
    }
  }
  
  // Check for stacked power imbalance escalation
  const powerImbalanceCount = countPowerImbalanceClauses(signals);
  if (powerImbalanceCount >= 3) {
    signals.unshift({
      id: generateSignalId(),
      category: 'risk',
      title: 'Potentially Abusive Legal Agreement',
      explanation: `This document contains ${powerImbalanceCount} clauses that create significant power imbalances favoring the provider. The cumulative effect of these clauses may strip you of important legal rights.`,
      details: 'When multiple one-sided clauses appear together, they often indicate a predatory agreement designed to maximize provider power while minimizing user recourse.',
      ruleId: 'stacked_power_imbalance',
      severity: 'very_high',
      domain: 'legal',
    });
  }
  
  // Check for structural imbalance
  const protections = hasUserProtections(content);
  const hasProviderFavoringClauses = powerImbalanceCount >= 1;
  
  if (hasProviderFavoringClauses && protections.protectionCount === 0) {
    const missingItems: string[] = [];
    if (!protections.hasOptOut) missingItems.push('opt-out mechanisms');
    if (!protections.hasDispute) missingItems.push('user-friendly dispute resolution');
    if (!protections.hasRefund) missingItems.push('refund or termination protections');
    if (!protections.hasNotice) missingItems.push('advance notice of changes');
    
    signals.push({
      id: generateSignalId(),
      category: 'risk',
      title: 'Abusive or Rights-Stripping Legal Structure Detected',
      explanation: `This document contains provider-favoring clauses but lacks essential user protections: ${missingItems.join(', ')}.`,
      details: 'A fair legal agreement balances provider protections with clear user rights. The absence of basic protections alongside unilateral power clauses indicates a structurally imbalanced agreement.',
      ruleId: 'structural_imbalance',
      severity: 'very_high',
      domain: 'legal',
    });
  } else if (hasProviderFavoringClauses && protections.protectionCount === 1) {
    signals.push({
      id: generateSignalId(),
      category: 'uncertainty',
      title: 'Limited User Protections',
      explanation: 'While some provider-favoring clauses are present, very few user protections were found in this document.',
      details: 'Consider whether the available protections adequately balance the rights granted to the provider.',
      ruleId: 'limited_protections',
      severity: 'medium',
      domain: 'legal',
    });
  }
  
  return signals;
}

/**
 * Run URL/website analysis rules against scraped content
 */
export function analyzeUrl(content: string, metadata: RuleMetadata = {}): Signal[] {
  const signals: Signal[] = [];
  
  // Run URL-specific rules
  for (const rule of urlRules) {
    const result = rule.match(content, metadata);
    if (result === true || (Array.isArray(result) && result.length > 0)) {
      signals.push({
        id: generateSignalId(),
        category: rule.category,
        title: rule.title,
        explanation: rule.explanation,
        details: rule.details,
        ruleId: rule.id,
        severity: rule.severity,
        domain: rule.domain,
      });
    }
  }
  
  // Also run text rules on website content
  const textSignals = analyzeText(content);
  signals.push(...textSignals);
  
  return signals;
}

/**
 * Sort signals by category priority: risk > uncertainty > green
 * Within risk, sort by severity
 */
export function sortSignals(signals: Signal[]): Signal[] {
  const categoryPriority: Record<SignalCategory, number> = {
    risk: 0,
    uncertainty: 1,
    green: 2,
  };
  
  const severityPriority: Record<SignalSeverity, number> = {
    very_high: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  return [...signals].sort((a, b) => {
    const catDiff = categoryPriority[a.category] - categoryPriority[b.category];
    if (catDiff !== 0) return catDiff;
    
    const aSev = a.severity || 'medium';
    const bSev = b.severity || 'medium';
    return severityPriority[aSev] - severityPriority[bSev];
  });
}

/**
 * CRITICAL risk rule IDs
 */
const CRITICAL_RISK_RULE_IDS = [
  'irrevocable_consent',
  'unilateral_modification',
  'retroactive_charges',
  'waiver_right_to_sue',
  'forced_arbitration',
  'perpetual_data_ownership',
  'negligence_indemnification',
  'survival_clauses',
  'stacked_power_imbalance',
  'structural_imbalance',
];

function countCriticalSignals(signals: Signal[]): number {
  return signals.filter(s => 
    s.category === 'risk' && CRITICAL_RISK_RULE_IDS.includes(s.ruleId)
  ).length;
}

/**
 * Generate context-aware recommended actions
 * UPDATED: Stricter actions for substance-deficit proposals
 */
export function generateRecommendedActions(signals: Signal[], context: AnalysisContext): string[] {
  const actions: string[] = [];
  const riskSignals = signals.filter(s => s.category === 'risk');
  const uncertaintySignals = signals.filter(s => s.category === 'uncertainty');
  const criticalCount = countCriticalSignals(signals);
  
  // Get specific detected issues
  const hasIrrevocableConsent = signals.some(s => s.ruleId === 'irrevocable_consent');
  const hasUnilateralMod = signals.some(s => s.ruleId === 'unilateral_modification');
  const hasWaiverToSue = signals.some(s => s.ruleId === 'waiver_right_to_sue');
  const hasForcedArbitration = signals.some(s => s.ruleId === 'forced_arbitration');
  const hasPerpetualData = signals.some(s => s.ruleId === 'perpetual_data_ownership');
  const hasStructuralImbalance = signals.some(s => s.ruleId === 'structural_imbalance');
  const hasStackedImbalance = signals.some(s => s.ruleId === 'stacked_power_imbalance');
  const hasUnusualPayment = signals.some(s => s.ruleId === 'unusual_payment');
  const hasImpersonation = signals.some(s => s.ruleId === 'impersonation_patterns');
  const hasTooGoodToBeTrue = signals.some(s => s.ruleId === 'too_good_to_be_true');
  const hasLowIntent = signals.some(s => s.ruleId === 'low_intent_inquiry');
  const hasMissingContext = signals.some(s => s.ruleId === 'missing_business_context');
  const hasUnrealistic = signals.some(s => s.ruleId === 'unrealistic_expectations');
  const hasDependencyRisk = signals.some(s => s.ruleId === 'dependency_lockin');
  const hasMissingSLA = signals.some(s => s.ruleId === 'missing_sla');
  const hasOverpromising = signals.some(s => s.ruleId === 'overpromising');
  
  // NEW: Substance deficit detection
  const hasLowSubstance = signals.some(s => s.ruleId === 'low_substance_proposal');
  const hasConfidenceWithoutEvidence = signals.some(s => s.ruleId === 'confidence_without_evidence');
  const hasVagueValue = signals.some(s => s.ruleId === 'vague_value_proposition');
  const hasUrgencyWithoutSubstance = signals.some(s => s.ruleId === 'urgency_without_substance');
  const hasUnverifiableIdentity = signals.some(s => s.ruleId === 'unverifiable_identity');
  
  const substanceDeficitCount = [
    hasLowSubstance,
    hasConfidenceWithoutEvidence,
    hasVagueValue,
    hasUrgencyWithoutSubstance,
    hasUnverifiableIdentity,
  ].filter(Boolean).length;
  
  const hasSignificantSubstanceDeficit = substanceDeficitCount >= 2 || hasLowSubstance;
  
  // CRITICAL: Substance-deficit actions for business proposals (FIRST PRIORITY)
  if (hasSignificantSubstanceDeficit && (context === 'vendor_proposal' || context === 'partnership_offer')) {
    actions.push('⚠️ Request detailed company information before any call or meeting.');
    if (hasUnverifiableIdentity) {
      actions.push('Sender identity is unverifiable. Request full name, corporate email, and LinkedIn profile before proceeding.');
    }
    if (hasConfidenceWithoutEvidence) {
      actions.push('Claims lack evidence. Request specific case studies, client references, and measurable results.');
    }
    if (hasVagueValue) {
      actions.push('Value proposition is vague. Ask: "What specifically will you deliver, and how will we measure success?"');
    }
    if (hasUrgencyWithoutSubstance) {
      actions.push('Reject artificial urgency. Do not commit to timelines without understanding scope and deliverables.');
    }
    actions.push('Deprioritize until proof of credibility is provided.');
    actions.push('Avoid investing time without clearer scope and evidence.');
  } else if (substanceDeficitCount >= 1 && (context === 'vendor_proposal' || context === 'partnership_offer')) {
    // Partial substance deficit
    actions.push('Some information is missing. Request clarification on company background, specific offering, and track record before engaging further.');
  }
  
  // CRITICAL legal risks - strong protective actions
  if (criticalCount >= 1 && (context === 'legal_agreement' || context === 'general')) {
    if (hasStackedImbalance || hasStructuralImbalance || criticalCount >= 2) {
      actions.push('🚨 STOP: Do not accept this agreement without independent legal review. Multiple critical rights-stripping clauses have been detected.');
    } else {
      actions.push('⚠️ Because this agreement contains critical risk patterns, consider consulting a legal professional before accepting.');
    }
  }
  
  // Context-specific actions for CLIENT INQUIRIES
  if (context === 'client_inquiry') {
    if (hasLowSubstance || hasLowIntent || hasMissingContext) {
      actions.push('Because this inquiry lacks specific business context, request more details before investing significant time: company name, budget range, and timeline.');
    }
    if (hasUnrealistic) {
      actions.push('Due to unrealistic expectations in this inquiry, set clear scope boundaries and timeline expectations before proceeding.');
    }
    if (signals.some(s => s.ruleId === 'generic_inquiry')) {
      actions.push('This appears to be a generic inquiry. Consider using a qualification questionnaire to assess serious intent before scheduling calls.');
    }
    if (riskSignals.filter(s => s.domain === 'business').length >= 2) {
      actions.push('Multiple business risk signals suggest this may be a low-priority inquiry. Prioritize accordingly.');
    }
  }
  
  // Context-specific actions for VENDOR PROPOSALS (non-substance-deficit issues)
  if ((context === 'vendor_proposal' || context === 'partnership_offer') && !hasSignificantSubstanceDeficit) {
    if (hasDependencyRisk) {
      actions.push('Due to lock-in risks, negotiate for shorter terms, data portability, and clear exit provisions before signing.');
    }
    if (hasMissingSLA) {
      actions.push('Because essential commercial safeguards are missing, request written SLAs, support commitments, and uptime guarantees.');
    }
    if (hasOverpromising) {
      actions.push('Due to unsubstantiated claims, request specific case studies, references, and realistic projections before proceeding.');
    }
    if (signals.some(s => s.ruleId === 'no_refund_vendor')) {
      actions.push('Because no refund or trial options are offered, negotiate for a pilot program or satisfaction guarantee.');
    }
    if (signals.some(s => s.ruleId === 'asymmetric_obligation')) {
      actions.push('Due to asymmetric obligations, negotiate for more balanced terms or seek alternative vendors.');
    }
  }
  
  // Legal-specific actions
  if (hasIrrevocableConsent) {
    actions.push('Because this agreement includes irrevocable consent, understand exactly what you\'re consenting to before accepting.');
  }
  if (hasForcedArbitration && hasWaiverToSue) {
    actions.push('Because this agreement waives your right to sue AND mandates binding arbitration, look for opt-out procedures.');
  }
  if (hasPerpetualData) {
    actions.push('Due to perpetual data ownership clauses, avoid providing content you aren\'t prepared to permanently surrender.');
  }
  
  // Consumer-specific actions
  if (context === 'consumer_message') {
    if (hasUnusualPayment) {
      actions.push('Due to unusual payment methods, use only payment methods with buyer protection.');
    }
    if (hasImpersonation || hasTooGoodToBeTrue) {
      actions.push('Because this shows signs of potential fraud, verify the sender through official channels before providing any information.');
    }
  }
  
  // Uncertainty amplification (skip if already handling substance deficit)
  if (!hasSignificantSubstanceDeficit && riskSignals.length > 0 && uncertaintySignals.length > 0) {
    actions.push('Note: Detected uncertainty zones alongside risks suggest important details may be ambiguous. Request clarification.');
  }
  
  // No significant risks - but be more careful for business contexts
  if (riskSignals.length === 0) {
    if (context === 'vendor_proposal' || context === 'partnership_offer') {
      // Even without explicit risks, be cautious
      actions.push('While no explicit fraud signals were detected, always verify company background and request references before significant engagement.');
    } else if (context === 'client_inquiry') {
      actions.push('This inquiry appears legitimate. Proceed with standard qualification process.');
    } else {
      actions.push('No significant risk signals detected. Always verify important details independently.');
    }
  }
  
  return actions.slice(0, 6);
}

// ============================================
// DEEP BUSINESS PROPOSAL INTELLIGENCE
// ============================================

/**
 * Assess company visibility and credibility based on content patterns
 */
export function assessCompany(content: string, signals: Signal[]): CompanyAssessment {
  const flags: string[] = [];
  const publicFootprint: string[] = [];
  
  // Website/online presence detection
  const hasWebsite = /www\.\w+\.(com|org|io|co|net)|https?:\/\/\w+/i.test(content);
  const hasLinkedIn = /linkedin\.com/i.test(content);
  const hasCompanyEmail = /@[a-z0-9-]+\.(com|org|io|co|net)/i.test(content);
  
  if (hasWebsite) publicFootprint.push('Has website');
  if (hasLinkedIn) publicFootprint.push('LinkedIn presence');
  if (hasCompanyEmail) publicFootprint.push('Corporate email domain');
  
  // Maturity indicators
  const establishedPatterns = [
    /founded\s+(in\s+)?(19|20)\d{2}/i,
    /established\s+(in\s+)?(19|20)\d{2}/i,
    /\d{2,3}\+?\s+(years?|employees?)/i,
    /fortune\s+\d+/i,
    /publicly\s+traded/i,
    /nasdaq|nyse|ftse/i,
  ];
  const startupPatterns = [
    /seed\s+(round|funding)/i,
    /series\s+[a-c]/i,
    /early[\s-]?stage/i,
    /pre[\s-]?launch/i,
    /mvp|beta|pilot/i,
  ];
  
  const isEstablished = establishedPatterns.some(p => p.test(content));
  const isStartup = startupPatterns.some(p => p.test(content));
  
  let maturity: CompanyAssessment['maturity'] = 'unknown';
  if (isEstablished) {
    maturity = 'established';
    publicFootprint.push('Established company indicators');
  } else if (isStartup) {
    maturity = 'startup';
    publicFootprint.push('Startup/early-stage indicators');
  } else if (publicFootprint.length >= 2) {
    maturity = 'growth';
  }
  
  // Visibility assessment
  let visibility: CompanyAssessment['visibility'] = 'unknown';
  if (publicFootprint.length >= 3) {
    visibility = 'high';
  } else if (publicFootprint.length >= 2) {
    visibility = 'moderate';
  } else if (publicFootprint.length >= 1) {
    visibility = 'limited';
  }
  
  // Track record indicators
  const hasVerifiedRefs = /(microsoft|google|amazon|apple|meta|salesforce|oracle|ibm|fortune\s+\d+)/i.test(content);
  const hasClaimedRefs = /(industry\s+leaders|major\s+clients|trusted\s+by|award[\s-]?winning)/i.test(content);
  const hasCaseStudies = /(case\s+study|testimonial|see\s+our\s+work|portfolio)/i.test(content);
  const hasVagueHistory = /(names?\s+confidential|under\s+nda|cannot\s+disclose)/i.test(content);
  
  let trackRecord: CompanyAssessment['trackRecord'] = 'unverified';
  if (hasVerifiedRefs || (hasCaseStudies && hasCompanyEmail)) {
    trackRecord = 'verified';
    publicFootprint.push('Verifiable references');
  } else if (hasClaimedRefs && !hasVagueHistory) {
    trackRecord = 'claimed';
    flags.push('Claims experience without verifiable proof');
  } else if (hasVagueHistory) {
    trackRecord = 'concerning';
    flags.push('References hidden behind confidentiality');
  }
  
  // Red flags
  if (signals.some(s => s.ruleId === 'overpromising')) {
    flags.push('Overpromising without evidence');
  }
  if (signals.some(s => s.ruleId === 'credibility_gaps')) {
    flags.push('Credibility gaps detected');
  }
  if (!hasCompanyEmail && content.length > 300) {
    flags.push('No corporate email provided');
  }
  if (visibility === 'unknown' || visibility === 'limited') {
    flags.push('Limited public visibility');
  }
  
  return {
    visibility,
    maturity,
    trackRecord,
    publicFootprint,
    flags,
  };
}

/**
 * Generate Business Priority Assessment for vendor/partnership proposals
 * UPDATED: Substance-deficit proposals CANNOT be medium/high priority
 */
export function generateBusinessPriorityAssessment(
  content: string,
  signals: Signal[],
  context: AnalysisContext,
  companyAssessment: CompanyAssessment
): BusinessPriorityAssessment {
  const riskSignals = signals.filter(s => s.category === 'risk');
  const greenSignals = signals.filter(s => s.category === 'green');
  const businessRisks = riskSignals.filter(s => s.domain === 'business');
  const uncertaintySignals = signals.filter(s => s.category === 'uncertainty');
  
  const confidenceFactors: string[] = [];
  const concerns: string[] = [];
  const comparativeAdvice: string[] = [];
  
  // CRITICAL: Check for substance-deficit signals - these FORCE low priority
  const hasLowSubstance = signals.some(s => s.ruleId === 'low_substance_proposal');
  const hasConfidenceWithoutEvidence = signals.some(s => s.ruleId === 'confidence_without_evidence');
  const hasVagueValue = signals.some(s => s.ruleId === 'vague_value_proposition');
  const hasUrgencyWithoutSubstance = signals.some(s => s.ruleId === 'urgency_without_substance');
  const hasUnverifiableIdentity = signals.some(s => s.ruleId === 'unverifiable_identity');
  
  // Count substance deficit signals
  const substanceDeficitCount = [
    hasLowSubstance,
    hasConfidenceWithoutEvidence,
    hasVagueValue,
    hasUrgencyWithoutSubstance,
    hasUnverifiableIdentity,
  ].filter(Boolean).length;
  
  const hasSignificantSubstanceDeficit = substanceDeficitCount >= 2 || hasLowSubstance;
  
  // Add substance deficit concerns
  if (hasLowSubstance) concerns.push('Low substance proposal');
  if (hasConfidenceWithoutEvidence) concerns.push('Confidence without evidence');
  if (hasVagueValue) concerns.push('Vague value proposition');
  if (hasUrgencyWithoutSubstance) concerns.push('Urgency without substance');
  if (hasUnverifiableIdentity) concerns.push('Unverifiable sender identity');
  
  // Calculate strategic importance
  let importanceScore = 50; // Start neutral
  
  // CRITICAL: Substance deficit causes major penalty
  if (hasSignificantSubstanceDeficit) {
    importanceScore -= 40; // Force into low territory
  } else if (substanceDeficitCount >= 1) {
    importanceScore -= 20;
  }
  
  // Boost for clear requirements/specifics (only if not substance-deficient)
  if (!hasSignificantSubstanceDeficit) {
    if (signals.some(s => s.ruleId === 'specific_requirements')) {
      importanceScore += 20;
      confidenceFactors.push('Clear requirements and specifics provided');
    }
    if (signals.some(s => s.ruleId === 'clear_business_context')) {
      importanceScore += 15;
      confidenceFactors.push('Strong business context');
    }
    if (signals.some(s => s.ruleId === 'vendor_transparency')) {
      importanceScore += 15;
      confidenceFactors.push('Vendor transparency demonstrated');
    }
    if (signals.some(s => s.ruleId === 'professional_tone_with_substance')) {
      importanceScore += 10;
      confidenceFactors.push('Professional communication with substance');
    }
  }
  
  // Company assessment impact
  if (companyAssessment.trackRecord === 'verified' && !hasSignificantSubstanceDeficit) {
    importanceScore += 15;
    confidenceFactors.push('Verifiable track record');
  } else if (companyAssessment.trackRecord === 'concerning') {
    importanceScore -= 20;
    concerns.push('Track record concerns');
  } else if (companyAssessment.trackRecord === 'unverified') {
    importanceScore -= 10;
    concerns.push('Unverified track record');
  }
  
  if (companyAssessment.maturity === 'established' && !hasSignificantSubstanceDeficit) {
    importanceScore += 10;
    confidenceFactors.push('Established organization');
  } else if (companyAssessment.maturity === 'unknown') {
    importanceScore -= 10;
    concerns.push('Company maturity unclear');
  }
  
  if (companyAssessment.visibility === 'unknown' || companyAssessment.visibility === 'limited') {
    importanceScore -= 10;
    if (!concerns.includes('Limited public visibility')) {
      concerns.push('Limited public visibility');
    }
  }
  
  // Other risk impact
  businessRisks.forEach(risk => {
    // Skip substance deficit signals - already counted above
    if (['low_substance_proposal', 'confidence_without_evidence', 'vague_value_proposition', 'urgency_without_substance', 'unverifiable_identity'].includes(risk.ruleId)) {
      return;
    }
    if (risk.severity === 'very_high') {
      importanceScore -= 25;
      if (!concerns.includes(risk.title)) concerns.push(risk.title);
    } else if (risk.severity === 'high') {
      importanceScore -= 15;
      if (!concerns.includes(risk.title)) concerns.push(risk.title);
    } else if (risk.severity === 'medium') {
      importanceScore -= 8;
    }
  });
  
  // Uncertainty amplification
  if (uncertaintySignals.length > 2 && businessRisks.length > 0) {
    importanceScore -= 10;
    if (!concerns.includes('Multiple uncertainty zones')) {
      concerns.push('Multiple uncertainty zones');
    }
  }
  
  // Green flag boost (only if substance exists)
  if (!hasSignificantSubstanceDeficit) {
    greenSignals.forEach(() => {
      importanceScore += 5;
    });
  }
  
  // Clamp score
  importanceScore = Math.max(0, Math.min(100, importanceScore));
  
  // Determine strategic importance - FORCED LOW for substance deficit
  let strategicImportance: StrategicImportance;
  if (hasSignificantSubstanceDeficit) {
    strategicImportance = 'low'; // CANNOT be medium or high
  } else if (importanceScore >= 70) {
    strategicImportance = 'high';
  } else if (importanceScore >= 40) {
    strategicImportance = 'medium';
  } else {
    strategicImportance = 'low';
  }
  
  // Determine attention worthiness - FORCED IGNORE for significant substance deficit
  let attentionWorthiness: AttentionWorthiness;
  if (hasSignificantSubstanceDeficit) {
    attentionWorthiness = 'ignore'; // DEPRIORITIZE
  } else if (strategicImportance === 'high' && concerns.length <= 1) {
    attentionWorthiness = 'engage';
  } else if (strategicImportance === 'low' || concerns.length >= 3) {
    attentionWorthiness = 'ignore';
  } else {
    attentionWorthiness = 'monitor';
  }
  
  // Override for critical risks
  if (riskSignals.some(s => s.severity === 'very_high')) {
    if (attentionWorthiness === 'engage') {
      attentionWorthiness = 'monitor';
    }
  }
  
  // Monitoring only allowed if partial substance AND clear potential upside
  if (attentionWorthiness === 'monitor' && substanceDeficitCount >= 1 && confidenceFactors.length === 0) {
    attentionWorthiness = 'ignore';
  }
  
  // Determine risk-to-reward balance
  let riskToRewardBalance: BusinessPriorityAssessment['riskToRewardBalance'];
  const riskWeight = businessRisks.length * 2 + uncertaintySignals.length + (substanceDeficitCount * 3);
  const rewardWeight = greenSignals.length + confidenceFactors.length;
  
  if (hasSignificantSubstanceDeficit) {
    riskToRewardBalance = 'unfavorable'; // Cannot be favorable without substance
  } else if (rewardWeight > riskWeight + 2) {
    riskToRewardBalance = 'favorable';
  } else if (riskWeight > rewardWeight + 2) {
    riskToRewardBalance = 'unfavorable';
  } else {
    riskToRewardBalance = 'neutral';
  }
  
  // Generate time recommendation - STRICT for substance deficit
  let timeRecommendation: string;
  if (hasSignificantSubstanceDeficit) {
    if (hasUrgencyWithoutSubstance) {
      timeRecommendation = 'Do not invest time. The urgency lacks justification and the proposal lacks substance. This is not worth your attention.';
    } else {
      timeRecommendation = 'Minimal or no time investment warranted. Request concrete details before any further engagement.';
    }
  } else if (attentionWorthiness === 'engage' && riskToRewardBalance === 'favorable') {
    timeRecommendation = 'High potential — worth deeper engagement and due diligence.';
  } else if (attentionWorthiness === 'engage') {
    timeRecommendation = 'Promising but requires validation before significant time investment.';
  } else if (attentionWorthiness === 'monitor' && concerns.length <= 2) {
    timeRecommendation = 'Request clarification on open questions before proceeding.';
  } else if (attentionWorthiness === 'monitor') {
    timeRecommendation = 'Low clarity — not worth immediate attention. Revisit if they provide more specifics.';
  } else {
    timeRecommendation = 'Does not merit significant time investment based on current information.';
  }
  
  // Generate comparative advice - STRICTER for low-substance
  if (hasSignificantSubstanceDeficit) {
    comparativeAdvice.push('Request detailed company information before any call or meeting.');
    comparativeAdvice.push('Deprioritize until proof of credibility is provided.');
    comparativeAdvice.push('Avoid investing time without clearer scope and evidence.');
  } else if (context === 'vendor_proposal') {
    comparativeAdvice.push('Consider comparing with 2-3 similar vendors before committing.');
    if (companyAssessment.trackRecord !== 'verified') {
      comparativeAdvice.push('Request client references or case studies for validation.');
    }
    if (signals.some(s => s.ruleId === 'dependency_lockin')) {
      comparativeAdvice.push('Negotiate for a pilot program before full commitment.');
    }
  } else if (context === 'partnership_offer') {
    comparativeAdvice.push('Evaluate opportunity cost against other partnership opportunities.');
    if (businessRisks.length > 0) {
      comparativeAdvice.push('Consider shorter initial terms to validate the relationship.');
    }
  } else if (context === 'client_inquiry') {
    if (strategicImportance === 'low') {
      comparativeAdvice.push('Use a qualification questionnaire before investing call time.');
    }
    if (signals.some(s => s.ruleId === 'low_intent_inquiry')) {
      comparativeAdvice.push('Request specific requirements and timeline before scheduling.');
    }
  }
  
  return {
    strategicImportance,
    attentionWorthiness,
    riskToRewardBalance,
    timeRecommendation,
    confidenceFactors: confidenceFactors.slice(0, 4),
    concerns: concerns.slice(0, 5), // Allow 5 concerns for substance issues
    comparativeAdvice: comparativeAdvice.slice(0, 3),
  };
}
