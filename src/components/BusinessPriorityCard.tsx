import { BusinessPriorityAssessment, CompanyAssessment } from "@/types/trust-lens";
import { motion } from "framer-motion";
import { 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Eye,
  ArrowRight,
  Lightbulb
} from "lucide-react";

interface BusinessPriorityCardProps {
  priority: BusinessPriorityAssessment;
  company?: CompanyAssessment;
}

const importanceConfig = {
  high: { 
    label: 'High Priority', 
    color: 'text-signal-green', 
    bg: 'bg-signal-green/10',
    border: 'border-signal-green/30',
    icon: TrendingUp 
  },
  medium: { 
    label: 'Medium Priority', 
    color: 'text-signal-uncertainty', 
    bg: 'bg-signal-uncertainty/10',
    border: 'border-signal-uncertainty/30',
    icon: Minus 
  },
  low: { 
    label: 'Low Priority', 
    color: 'text-signal-risk', 
    bg: 'bg-signal-risk/10',
    border: 'border-signal-risk/30',
    icon: TrendingDown 
  },
};

const attentionConfig = {
  engage: { 
    label: 'Engage', 
    description: 'Worth active pursuit',
    color: 'text-signal-green', 
    bg: 'bg-signal-green/15',
    icon: CheckCircle2 
  },
  monitor: { 
    label: 'Monitor', 
    description: 'Watch for updates',
    color: 'text-signal-uncertainty', 
    bg: 'bg-signal-uncertainty/15',
    icon: Eye 
  },
  ignore: { 
    label: 'Deprioritize', 
    description: 'Low value for now',
    color: 'text-muted-foreground', 
    bg: 'bg-muted/50',
    icon: XCircle 
  },
};

const balanceConfig = {
  favorable: { label: 'Favorable', color: 'text-signal-green', icon: TrendingUp },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', icon: Minus },
  unfavorable: { label: 'Unfavorable', color: 'text-signal-risk', icon: TrendingDown },
};

const visibilityLabels = {
  high: 'Strong online presence',
  moderate: 'Moderate visibility',
  limited: 'Limited public footprint',
  unknown: 'Unknown visibility',
};

const trackRecordLabels = {
  verified: 'Verified references',
  claimed: 'Claimed but unverified',
  unverified: 'No proof provided',
  concerning: 'Concerning indicators',
};

export function BusinessPriorityCard({ priority, company }: BusinessPriorityCardProps) {
  const importance = importanceConfig[priority.strategicImportance];
  const attention = attentionConfig[priority.attentionWorthiness];
  const balance = balanceConfig[priority.riskToRewardBalance];
  const ImportanceIcon = importance.icon;
  const AttentionIcon = attention.icon;
  const BalanceIcon = balance.icon;

  return (
    <motion.div
      className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">Business Intelligence</h3>
            <p className="text-sm text-muted-foreground">Priority & Time Recommendation</p>
          </div>
        </div>
      </div>

      {/* Main Assessment Grid */}
      <div className="p-6 grid md:grid-cols-3 gap-4">
        {/* Strategic Importance */}
        <div className={`rounded-xl p-4 ${importance.bg} border ${importance.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <ImportanceIcon className={`h-4 w-4 ${importance.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strategic Value</span>
          </div>
          <p className={`text-xl font-bold ${importance.color}`}>{importance.label}</p>
        </div>

        {/* Attention Worthiness */}
        <div className={`rounded-xl p-4 ${attention.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <AttentionIcon className={`h-4 w-4 ${attention.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommendation</span>
          </div>
          <p className={`text-xl font-bold ${attention.color}`}>{attention.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{attention.description}</p>
        </div>

        {/* Risk-to-Reward */}
        <div className="rounded-xl p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <BalanceIcon className={`h-4 w-4 ${balance.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk vs Reward</span>
          </div>
          <p className={`text-xl font-bold ${balance.color}`}>{balance.label}</p>
        </div>
      </div>

      {/* Time Recommendation */}
      <div className="px-6 pb-4">
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm mb-1">Time Investment</p>
              <p className="text-foreground leading-relaxed">{priority.timeRecommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Assessment */}
      {company && (
        <div className="px-6 pb-4">
          <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Company Assessment</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Visibility:</span>{' '}
                <span className={company.visibility === 'high' ? 'text-signal-green' : company.visibility === 'limited' || company.visibility === 'unknown' ? 'text-signal-uncertainty' : 'text-foreground'}>
                  {visibilityLabels[company.visibility]}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Track Record:</span>{' '}
                <span className={company.trackRecord === 'verified' ? 'text-signal-green' : company.trackRecord === 'concerning' ? 'text-signal-risk' : 'text-muted-foreground'}>
                  {trackRecordLabels[company.trackRecord]}
                </span>
              </div>
            </div>
            {company.flags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs font-medium text-signal-uncertainty mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Flags
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {company.flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-signal-uncertainty mt-1">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confidence Factors & Concerns */}
      <div className="px-6 pb-4 grid md:grid-cols-2 gap-4">
        {priority.confidenceFactors.length > 0 && (
          <div className="rounded-xl bg-signal-green/5 border border-signal-green/20 p-4">
            <p className="text-xs font-medium text-signal-green mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confidence Factors
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              {priority.confidenceFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-signal-green mt-1">✓</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {priority.concerns.length > 0 && (
          <div className="rounded-xl bg-signal-risk/5 border border-signal-risk/20 p-4">
            <p className="text-xs font-medium text-signal-risk mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Concerns
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              {priority.concerns.map((concern, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-signal-risk mt-1">•</span>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Comparative Advice */}
      {priority.comparativeAdvice && priority.comparativeAdvice.length > 0 && (
        <div className="px-6 pb-6">
          <div className="rounded-xl bg-signal-ai/5 border border-signal-ai/20 p-4">
            <p className="text-xs font-medium text-signal-ai mb-3 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Strategic Advice
            </p>
            <ul className="text-sm text-foreground space-y-2">
              {priority.comparativeAdvice.map((advice, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-signal-ai mt-0.5 shrink-0" />
                  {advice}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  );
}
