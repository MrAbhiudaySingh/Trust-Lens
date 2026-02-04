import { Signal } from "@/types/trust-lens";
import { motion } from "framer-motion";
import { Scale, AlertTriangle, CheckCircle2, FileText, Shield } from "lucide-react";

interface LegalAnalysisCardProps {
  signals: Signal[];
}

export function LegalAnalysisCard({ signals }: LegalAnalysisCardProps) {
  const riskSignals = signals.filter(s => s.category === 'risk');
  const hasRiskyClauses = riskSignals.length > 0;

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
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">Legal Analysis</h3>
            <p className="text-sm text-muted-foreground">Rights & Risk Assessment</p>
          </div>
        </div>
      </div>

      {/* Risk Level */}
      <div className="p-6">
        {hasRiskyClauses ? (
          <div className="rounded-xl bg-signal-risk/10 border border-signal-risk/30 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-signal-risk" />
              <span className="font-semibold text-signal-risk">Concerning Clauses Detected</span>
            </div>
            <p className="text-sm text-foreground">
              This agreement contains {riskSignals.length} clause{riskSignals.length > 1 ? 's' : ''} that may significantly affect your rights.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-signal-green/10 border border-signal-green/30 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-signal-green" />
              <span className="font-semibold text-signal-green">Standard Language</span>
            </div>
            <p className="text-sm text-foreground">
              No unusual or concerning clauses detected. Standard agreement language.
            </p>
          </div>
        )}

        {/* Key Points */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Document Type</p>
              <p className="text-sm text-muted-foreground">Terms of Service / User Agreement</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Your Rights</p>
              <p className="text-sm text-muted-foreground">
                {hasRiskyClauses 
                  ? "Some provisions may limit your rights. Review carefully." 
                  : "Standard consumer protections appear to be in place."}
              </p>
            </div>
          </div>
        </div>

        {/* Flagged Clauses */}
        {riskSignals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-sm font-medium text-foreground mb-3">Flagged Provisions:</p>
            <ul className="space-y-2">
              {riskSignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-signal-risk mt-1">•</span>
                  <div>
                    <span className="font-medium text-foreground">{signal.title}</span>
                    <p className="text-muted-foreground">{signal.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
