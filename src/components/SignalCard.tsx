import { Signal, SignalCategory, SignalSeverity } from "@/types/trust-lens";
import { AlertTriangle, HelpCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface SignalCardProps {
  signal: Signal;
  index?: number;
}

const categoryConfig: Record<SignalCategory, {
  icon: typeof AlertTriangle;
  label: string;
  cardClass: string;
  iconClass: string;
}> = {
  risk: {
    icon: AlertTriangle,
    label: "Risk Signal",
    cardClass: "signal-card-risk",
    iconClass: "text-signal-risk",
  },
  uncertainty: {
    icon: HelpCircle,
    label: "Uncertainty Zone",
    cardClass: "signal-card-uncertainty",
    iconClass: "text-signal-uncertainty",
  },
  green: {
    icon: CheckCircle,
    label: "Green Flag",
    cardClass: "signal-card-green",
    iconClass: "text-signal-green",
  },
};

const severityConfig: Record<SignalSeverity, {
  label: string;
  className: string;
}> = {
  very_high: {
    label: "CRITICAL",
    className: "severity-critical",
  },
  high: {
    label: "HIGH",
    className: "severity-high",
  },
  medium: {
    label: "MEDIUM",
    className: "severity-medium",
  },
  low: {
    label: "LOW",
    className: "severity-low",
  },
};

export function SignalCard({ signal, index = 0 }: SignalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = categoryConfig[signal.category];
  const Icon = config.icon;
  const severity = signal.severity || 'medium';
  const severityInfo = severityConfig[severity];

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-4 md:p-5 transition-all duration-300 cursor-pointer",
        config.cardClass
      )}
      onClick={() => signal.details && setIsExpanded(!isExpanded)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start gap-3">
        <motion.div 
          className={cn("mt-0.5 flex-shrink-0 p-2 rounded-lg bg-background/50", config.iconClass)}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{signal.title}</h3>
              {signal.category === 'risk' && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs font-bold", severityInfo.className)}
                >
                  {severityInfo.label}
                </Badge>
              )}
            </div>
            {signal.details && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                aria-label={isExpanded ? "Show less" : "Show more"}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </motion.button>
            )}
          </div>
          
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {signal.explanation}
          </p>
          
          <AnimatePresence>
            {signal.details && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="mt-3 text-sm text-foreground/80 bg-background/50 rounded-xl p-4 leading-relaxed border border-border/50">
                  {signal.details}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
