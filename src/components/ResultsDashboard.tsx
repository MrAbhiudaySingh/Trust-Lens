import { AnalysisResult, AnalysisContext } from "@/types/trust-lens";
import { SignalSection } from "./SignalSection";
import { SignalCompositionBar } from "./SignalCompositionBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, FileText, AlertTriangle, CheckCircle, Scale, Briefcase, Users } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const contextLabels: Record<AnalysisContext, { label: string; icon: typeof Globe }> = {
  consumer_message: { label: "Message Analysis", icon: Users },
  legal_agreement: { label: "Agreement Analysis", icon: Scale },
  client_inquiry: { label: "Client Inquiry", icon: Briefcase },
  vendor_proposal: { label: "Vendor Proposal", icon: Briefcase },
  partnership_offer: { label: "Partnership Offer", icon: Briefcase },
  general: { label: "Content Analysis", icon: FileText },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const { 
    signals, 
    summary, 
    inputType, 
    originalInput, 
    recommendedActions, 
    detectedContext, 
    whatYouMightMiss,
    overall_level,
    concernCount,
    severityLevel
  } = result;
  
  const contextInfo = contextLabels[detectedContext || 'general'];
  const ContextIcon = contextInfo.icon;
  
  const riskSignals = signals.filter(s => s.category === 'risk');
  const greenSignals = signals.filter(s => s.category === 'green');
  
  // Determine colors based on severity
  const isCritical = severityLevel === 'critical';
  const isHigh = severityLevel === 'high';
  const isSevere = isCritical || isHigh;

  return (
    <motion.div 
      className="w-full max-w-3xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
        <Button variant="ghost" onClick={onReset} className="gap-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
          New Analysis
        </Button>
        <motion.div className="context-badge" whileHover={{ scale: 1.02 }}>
          <ContextIcon className="h-3.5 w-3.5" />
          {contextInfo.label}
        </motion.div>
      </motion.div>

      {/* SEVERITY BANNER - Prominent */}
      <motion.div 
        className={`rounded-2xl p-6 border-2 ${
          isCritical ? 'bg-red-950/30 border-red-500/50' :
          isHigh ? 'bg-orange-950/30 border-orange-500/50' :
          'bg-green-950/30 border-green-500/30'
        }`}
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            isCritical ? 'bg-red-500/20' :
            isHigh ? 'bg-orange-500/20' :
            'bg-green-500/20'
          }`}>
            {isSevere ? (
              <AlertTriangle className={`h-8 w-8 ${
                isCritical ? 'text-red-400' : 'text-orange-400'
              }`} />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-400" />
            )}
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              isCritical ? 'text-red-400' :
              isHigh ? 'text-orange-400' :
              'text-green-400'
            }`}>
              {overall_level}
            </h2>
            <p className="text-muted-foreground">
              {concernCount > 0 ? `${concernCount} concerning ${concernCount === 1 ? 'pattern' : 'patterns'} detected` : 'No significant concerns'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input Summary */}
      <motion.div className="p-4 rounded-xl bg-muted/50 border border-border/50" variants={itemVariants}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-background">
            {inputType === "url" ? <Globe className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {originalInput.substring(0, 200)}{originalInput.length > 200 ? "…" : ""}
          </p>
        </div>
      </motion.div>

      {/* AI INTERPRETATION - Compound Risk */}
      <motion.div className="rounded-2xl border border-border/60 bg-card p-6" variants={itemVariants}>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Risk Assessment
        </h3>
        <p className="text-foreground leading-relaxed text-lg">{summary}</p>
      </motion.div>

      {/* WHAT YOU MIGHT MISS - Consequence Focused */}
      {whatYouMightMiss && (
        <motion.div 
          className={`rounded-2xl border p-6 space-y-4 ${
            isSevere ? 'border-red-500/30 bg-red-950/10' : 'border-border/60 bg-card'
          }`}
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isSevere ? 'text-red-400' : 'text-muted-foreground'}`} />
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isSevere ? 'text-red-400' : 'text-foreground'}`}>
              What You Might Miss
            </h3>
          </div>
          <p className="text-foreground leading-relaxed">{whatYouMightMiss}</p>
        </motion.div>
      )}

      {/* RECOMMENDED ACTIONS - Decision Oriented */}
      {recommendedActions && recommendedActions.length > 0 && (
        <motion.div className="rounded-2xl border border-border/60 bg-card p-6" variants={itemVariants}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Recommended Actions
          </h3>
          <div className="space-y-3">
            {recommendedActions.map((action, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                action.includes('🛑') ? 'bg-red-950/20 border border-red-500/20' :
                action.includes('⚠️') ? 'bg-orange-950/20 border border-orange-500/20' :
                'bg-muted/30'
              }`}>
                <span className="text-lg shrink-0">{action.match(/^[🛑⚠️📋🔍✋📄⚖️💡]/)?.[0] || '•'}</span>
                <p className="text-sm text-foreground leading-relaxed">{action.replace(/^[🛑⚠️📋🔍✋📄⚖️💡]\s*/, '')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Signal Breakdown */}
      {(riskSignals.length > 0 || greenSignals.length > 0) && (
        <motion.div className="space-y-4 pt-4 border-t border-border/50" variants={itemVariants}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Detailed Signal Breakdown
          </h3>
          {riskSignals.length > 0 && <SignalSection category="risk" signals={signals} />}
          {greenSignals.length > 0 && <SignalSection category="green" signals={signals} />}
        </motion.div>
      )}

      {/* Footer */}
      <motion.div className="text-center pt-4 border-t border-border/50" variants={itemVariants}>
        <p className="text-xs text-muted-foreground">
          Rules detect patterns. AI explains. You decide what to do.
        </p>
      </motion.div>
    </motion.div>
  );
}
