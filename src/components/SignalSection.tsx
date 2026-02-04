import { Signal, SignalCategory } from "@/types/trust-lens";
import { SignalCard } from "./SignalCard";
import { AlertTriangle, HelpCircle, CheckCircle, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SignalSectionProps {
  category: SignalCategory;
  signals: Signal[];
}

const sectionConfig: Record<SignalCategory, {
  icon: typeof AlertTriangle;
  title: string;
  emptyMessage: string;
  description?: string;
  iconColorClass: string;
}> = {
  risk: {
    icon: AlertOctagon,
    title: "Risk Signals",
    emptyMessage: "No risk signals detected",
    description: "Patterns that may limit your rights or expose you to harm",
    iconColorClass: "text-signal-risk",
  },
  uncertainty: {
    icon: HelpCircle,
    title: "Uncertainty Zones",
    emptyMessage: "No uncertainty zones detected",
    description: "Missing or ambiguous information that increases risk",
    iconColorClass: "text-signal-uncertainty",
  },
  green: {
    icon: CheckCircle,
    title: "Green Flags",
    emptyMessage: "No green flags detected",
    description: "Patterns that suggest user protections are present",
    iconColorClass: "text-signal-green",
  },
};

export function SignalSection({ category, signals }: SignalSectionProps) {
  const config = sectionConfig[category];
  const Icon = config.icon;
  const filteredSignals = signals.filter((s) => s.category === category);

  // Count critical signals for risk section
  const criticalCount = category === 'risk' 
    ? filteredSignals.filter(s => s.severity === 'very_high').length 
    : 0;

  return (
    <motion.section 
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl bg-muted", config.iconColorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {config.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                {filteredSignals.length}
              </span>
              {criticalCount > 0 && (
                <motion.span 
                  className="px-2.5 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  {criticalCount} CRITICAL
                </motion.span>
              )}
            </div>
            {config.description && filteredSignals.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {filteredSignals.length > 0 ? (
        <div className="space-y-3">
          {filteredSignals.map((signal, index) => (
            <SignalCard key={signal.id} signal={signal} index={index} />
          ))}
        </div>
      ) : (
        <motion.div 
          className="py-8 text-center rounded-2xl border border-dashed border-border bg-muted/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-muted-foreground italic">
            {config.emptyMessage}
          </p>
        </motion.div>
      )}
    </motion.section>
  );
}
