import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface RecommendedActionsProps {
  actions: string[];
}

export function RecommendedActions({ actions }: RecommendedActionsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  // Check if any action contains critical warning keywords
  const hasCriticalAction = actions.some(action => 
    action.toLowerCase().includes('stop') || 
    action.toLowerCase().includes('do not proceed') ||
    action.toLowerCase().includes('critical')
  );

  return (
    <motion.div 
      className="insight-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="insight-card-header">
        <div className={`insight-card-icon ${hasCriticalAction ? 'bg-signal-risk/20' : 'bg-primary/10'}`}>
          {hasCriticalAction ? (
            <AlertTriangle className="h-5 w-5 text-signal-risk" />
          ) : (
            <Shield className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Recommended Actions
          </h3>
          <p className="text-xs text-muted-foreground">
            Your decision checklist based on detected patterns
          </p>
        </div>
      </div>
      
      <ul className="space-y-3">
        {actions.map((action, index) => {
          const isCritical = action.toLowerCase().includes('stop') || 
                            action.toLowerCase().includes('do not proceed');
          
          return (
            <motion.li 
              key={index} 
              className={`action-item ${isCritical ? 'border-signal-risk/30 bg-signal-risk-bg' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`action-number ${isCritical ? 'bg-signal-risk' : ''}`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm leading-relaxed ${isCritical ? 'text-foreground font-medium' : 'text-foreground/90'}`}>
                  {action}
                </span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            </motion.li>
          );
        })}
      </ul>
      
      <motion.p 
        className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        These recommendations are for awareness only and do not constitute legal advice.
      </motion.p>
    </motion.div>
  );
}
