import { Signal, SignalSeverity } from "@/types/trust-lens";

/**
 * CRITICAL risk rule IDs - these trigger hard score floors
 * These represent severe power imbalances or rights-stripping clauses
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

/**
 * MAJOR risk rule IDs - significant but not critical
 */
const MAJOR_RISK_RULE_IDS = [
  'unlimited_liability',
  'automatic_renewal',
  'broad_data_sharing',
  'unusual_payment',
  'suspicious_payment',
  'too_good_to_be_true',
  'impersonation_patterns',
  'personal_info_request',
];

/**
 * Classify a signal's effective severity
 * Maps rule IDs to CRITICAL/MAJOR/MEDIUM/LOW tiers
 */
function classifySignalSeverity(signal: Signal): 'critical' | 'major' | 'medium' | 'low' {
  if (CRITICAL_RISK_RULE_IDS.includes(signal.ruleId)) {
    return 'critical';
  }
  if (MAJOR_RISK_RULE_IDS.includes(signal.ruleId)) {
    return 'major';
  }
  if (signal.severity === 'very_high' || signal.severity === 'high') {
    return 'major';
  }
  if (signal.severity === 'medium') {
    return 'medium';
  }
  return 'low';
}

/**
 * Get base weight for severity
 */
function getSeverityWeight(severity: SignalSeverity = 'medium'): number {
  const weights: Record<SignalSeverity, number> = {
    low: 4,
    medium: 8,
    high: 15,
    very_high: 25,
  };
  return weights[severity];
}

/**
 * Calculate a RISK score from 0-100 based on detected signals
 * HIGHER score = HIGHER risk
 * 
 * CORE PRINCIPLE: Legal risk is NON-LINEAR
 * A single CRITICAL clause can dominate the assessment
 * 
 * HARD FLOOR RULES (MANDATORY - these OVERRIDE additive scoring):
 * - ANY CRITICAL signal → minimum score 60
 * - CRITICAL + any additional risk/uncertainty → minimum score 70
 * - Multiple CRITICAL or stacked MAJOR → minimum score 80
 * 
 * Labels are derived from score (strict alignment):
 * - 0-24: Low Concern
 * - 25-49: Mixed Signals
 * - 50-69: Elevated Concern
 * - 70-100: High Concern
 */
export function calculateRiskScore(signals: Signal[]): number {
  const riskSignals = signals.filter(s => s.category === 'risk');
  const uncertaintySignals = signals.filter(s => s.category === 'uncertainty');
  const greenSignals = signals.filter(s => s.category === 'green');
  
  // STEP 1: Classify all signals by severity tier
  const criticalSignals = riskSignals.filter(s => classifySignalSeverity(s) === 'critical');
  const majorSignals = riskSignals.filter(s => classifySignalSeverity(s) === 'major');
  const mediumSignals = riskSignals.filter(s => classifySignalSeverity(s) === 'medium');
  
  const criticalCount = criticalSignals.length;
  const majorCount = majorSignals.length;
  const totalRiskCount = riskSignals.length;
  const totalUncertaintyCount = uncertaintySignals.length;
  
  // STEP 2: Calculate additive base score
  let score = 0;
  
  for (const signal of riskSignals) {
    const weight = getSeverityWeight(signal.severity);
    score += weight;
  }
  
  // Uncertainty signals contribute when risks are present (amplification rule)
  for (const signal of uncertaintySignals) {
    const baseWeight = getSeverityWeight(signal.severity) * 0.5;
    // Amplify uncertainty contribution if CRITICAL or MAJOR risks exist
    const amplifier = (criticalCount > 0 || majorCount > 0) ? 1.5 : 1.0;
    score += baseWeight * amplifier;
  }
  
  // Green flags provide minor reduction (capped at 12 points)
  const greenReduction = Math.min(greenSignals.length * 4, 12);
  score -= greenReduction;
  
  // STEP 3: Apply HARD FLOOR RULES (MANDATORY - these override additive scoring)
  // These floors are NON-NEGOTIABLE
  
  // Floor Rule 1: ANY CRITICAL signal → minimum 60
  if (criticalCount >= 1) {
    score = Math.max(score, 60);
  }
  
  // Floor Rule 2: CRITICAL + any additional risk OR uncertainty → minimum 70
  if (criticalCount >= 1 && (totalRiskCount > 1 || totalUncertaintyCount > 0)) {
    score = Math.max(score, 70);
  }
  
  // Floor Rule 3: Multiple CRITICAL OR (CRITICAL + multiple MAJOR) → minimum 80
  if (criticalCount >= 2 || (criticalCount >= 1 && majorCount >= 2)) {
    score = Math.max(score, 80);
  }
  
  // Floor Rule 4: 3+ CRITICAL signals → minimum 85
  if (criticalCount >= 3) {
    score = Math.max(score, 85);
  }
  
  // Floor Rule 5: Stacked power imbalance or structural imbalance → minimum 80
  const hasStackedImbalance = riskSignals.some(s => s.ruleId === 'stacked_power_imbalance');
  const hasStructuralImbalance = riskSignals.some(s => s.ruleId === 'structural_imbalance');
  if (hasStackedImbalance || hasStructuralImbalance) {
    score = Math.max(score, 80);
  }
  
  // STEP 4: Compound power imbalance escalation
  // Check for structural abuse patterns: unilateral + permanence + no recourse
  const hasUnilateral = riskSignals.some(s => 
    s.ruleId === 'unilateral_modification' || s.ruleId === 'automatic_renewal'
  );
  const hasPermanence = riskSignals.some(s => 
    s.ruleId === 'irrevocable_consent' || s.ruleId === 'perpetual_data_ownership' || s.ruleId === 'survival_clauses'
  );
  const hasNoRecourse = riskSignals.some(s => 
    s.ruleId === 'waiver_right_to_sue' || s.ruleId === 'forced_arbitration'
  );
  
  const compoundFactors = [hasUnilateral, hasPermanence, hasNoRecourse].filter(Boolean).length;
  if (compoundFactors >= 2) {
    // Escalate by 10 points when compound abuse patterns detected
    score += 10;
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Legacy function name for backwards compatibility
 */
export function calculateTrustScore(signals: Signal[]): number {
  return calculateRiskScore(signals);
}

/**
 * Get score label and color based on RISK score value
 * 
 * STRICT ALIGNMENT (MANDATORY - labels MUST match these ranges):
 * - Low Concern: 0–24
 * - Mixed Signals: 25–49
 * - Elevated Concern: 50–69
 * - High Concern: 70–100
 * 
 * It is FORBIDDEN to output:
 * - "High Concern" with a score < 70
 * - "Mixed Signals" when CRITICAL risks are present
 */
export function getScoreDetails(score: number): {
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
  ringClass: string;
} {
  if (score >= 70) {
    return {
      label: "High Concern",
      description: "Critical rights-stripping patterns detected",
      colorClass: "text-signal-risk",
      bgClass: "bg-signal-risk-bg",
      ringClass: "ring-signal-risk/30",
    };
  } else if (score >= 50) {
    return {
      label: "Elevated Concern",
      description: "Significant risk patterns identified",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-50 dark:bg-orange-950/30",
      ringClass: "ring-orange-500/30",
    };
  } else if (score >= 25) {
    return {
      label: "Mixed Signals",
      description: "Review the detected patterns carefully",
      colorClass: "text-signal-uncertainty",
      bgClass: "bg-signal-uncertainty-bg",
      ringClass: "ring-signal-uncertainty/30",
    };
  } else {
    return {
      label: "Low Concern",
      description: "Few risk patterns detected",
      colorClass: "text-signal-green",
      bgClass: "bg-signal-green-bg",
      ringClass: "ring-signal-green/30",
    };
  }
}

/**
 * Get severity tier counts for display
 */
export function getSeverityCounts(signals: Signal[]): {
  critical: number;
  major: number;
  medium: number;
  low: number;
} {
  const riskSignals = signals.filter(s => s.category === 'risk');
  return {
    critical: riskSignals.filter(s => classifySignalSeverity(s) === 'critical').length,
    major: riskSignals.filter(s => classifySignalSeverity(s) === 'major').length,
    medium: riskSignals.filter(s => classifySignalSeverity(s) === 'medium').length,
    low: riskSignals.filter(s => classifySignalSeverity(s) === 'low').length,
  };
}
