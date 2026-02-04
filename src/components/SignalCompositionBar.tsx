import { Signal } from "@/types/trust-lens";
import { motion } from "framer-motion";
import { AlertTriangle, HelpCircle, CheckCircle } from "lucide-react";

interface SignalCompositionBarProps {
  signals: Signal[];
}

export function SignalCompositionBar({ signals }: SignalCompositionBarProps) {
  const riskCount = signals.filter(s => s.category === 'risk').length;
  const uncertaintyCount = signals.filter(s => s.category === 'uncertainty').length;
  const greenCount = signals.filter(s => s.category === 'green').length;
  const total = signals.length || 1;

  const riskPercent = (riskCount / total) * 100;
  const uncertaintyPercent = (uncertaintyCount / total) * 100;
  const greenPercent = (greenCount / total) * 100;

  return (
    <div className="space-y-4">
      {/* Section Label */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          What We Detected
        </h3>
        <span className="text-xs text-muted-foreground">
          {total} signal{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Composition Bar */}
      <div className="relative">
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          {riskCount > 0 && (
            <motion.div 
              className="h-full bg-signal-risk"
              initial={{ width: 0 }}
              animate={{ width: `${riskPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
          {uncertaintyCount > 0 && (
            <motion.div 
              className="h-full bg-signal-uncertainty"
              initial={{ width: 0 }}
              animate={{ width: `${uncertaintyPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          )}
          {greenCount > 0 && (
            <motion.div 
              className="h-full bg-signal-green"
              initial={{ width: 0 }}
              animate={{ width: `${greenPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            />
          )}
        </div>
      </div>

      {/* Signal Counts */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div 
          className="flex items-center gap-2 p-3 rounded-lg bg-signal-risk/10 border border-signal-risk/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AlertTriangle className="h-4 w-4 text-signal-risk shrink-0" />
          <div>
            <p className="text-lg font-bold text-signal-risk">{riskCount}</p>
            <p className="text-xs text-muted-foreground">Risk</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 p-3 rounded-lg bg-signal-uncertainty/10 border border-signal-uncertainty/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HelpCircle className="h-4 w-4 text-signal-uncertainty shrink-0" />
          <div>
            <p className="text-lg font-bold text-signal-uncertainty">{uncertaintyCount}</p>
            <p className="text-xs text-muted-foreground">Uncertain</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 p-3 rounded-lg bg-signal-green/10 border border-signal-green/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CheckCircle className="h-4 w-4 text-signal-green shrink-0" />
          <div>
            <p className="text-lg font-bold text-signal-green">{greenCount}</p>
            <p className="text-xs text-muted-foreground">Trust</p>
          </div>
        </motion.div>
      </div>

      {/* Interpretation hint */}
      <p className="text-xs text-muted-foreground text-center italic">
        This shows the composition of detected patterns—you interpret the balance.
      </p>
    </div>
  );
}
