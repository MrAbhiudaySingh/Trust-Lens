import { Signal } from "@/types/trust-lens";
import { calculateRiskScore, getScoreDetails, getSeverityCounts } from "@/utils/scoring";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldCheck, ShieldAlert, Shield, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TrustScoreDisplayProps {
  signals: Signal[];
}

export function TrustScoreDisplay({ signals }: TrustScoreDisplayProps) {
  const score = calculateRiskScore(signals);
  const { label, description, colorClass } = getScoreDetails(score);
  const severityCounts = getSeverityCounts(signals);
  const [animatedScore, setAnimatedScore] = useState(0);

  const uncertaintyCount = signals.filter(s => s.category === 'uncertainty').length;
  const greenCount = signals.filter(s => s.category === 'green').length;

  // Animate score counting
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);

  // Calculate the stroke dasharray for the circular progress
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Choose icon based on risk level
  const ScoreIcon = score >= 70 ? AlertOctagon : score >= 50 ? ShieldAlert : score >= 25 ? AlertTriangle : ShieldCheck;

  // Get score color based on level
  const getScoreColor = () => {
    if (score >= 70) return "text-score-high";
    if (score >= 50) return "text-score-elevated";
    if (score >= 25) return "text-score-mixed";
    return "text-score-low";
  };

  const getScoreStrokeColor = () => {
    if (score >= 70) return "stroke-score-high";
    if (score >= 50) return "stroke-score-elevated";
    if (score >= 25) return "stroke-score-mixed";
    return "stroke-score-low";
  };

  return (
    <motion.div 
      className="hero-score-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {/* Animated Circular Score */}
        <motion.div 
          className="relative flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <svg className="w-36 h-36 md:w-44 md:h-44 transform -rotate-90" viewBox="0 0 120 120">
            {/* Outer glow effect */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(getScoreStrokeColor(), "score-glow")}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: "stroke-dashoffset 0.1s ease-out",
              }}
              filter="url(#glow)"
            />
          </svg>
          
          {/* Score number and icon in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className={cn("text-5xl md:text-6xl font-bold", getScoreColor())}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {animatedScore}
            </motion.span>
            <span className="text-xs text-muted-foreground font-medium mt-1">RISK SCORE</span>
          </div>
        </motion.div>

        {/* Score Details */}
        <motion.div 
          className="flex-1 text-center md:text-left space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <ScoreIcon className={cn("h-6 w-6", getScoreColor())} />
              <h2 className={cn("text-2xl md:text-3xl font-bold", getScoreColor())}>{label}</h2>
            </div>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
          
          {/* Visual Risk Breakdown */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
            {severityCounts.critical > 0 && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="w-3 h-3 rounded-full bg-score-high shadow-lg shadow-score-high/50" />
                <span className="text-sm font-semibold text-foreground">{severityCounts.critical} Critical</span>
              </motion.div>
            )}
            {severityCounts.major > 0 && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 }}
              >
                <span className="w-3 h-3 rounded-full bg-score-elevated shadow-lg shadow-score-elevated/50" />
                <span className="text-sm text-muted-foreground">{severityCounts.major} Major</span>
              </motion.div>
            )}
            {(severityCounts.medium + severityCounts.low > 0) && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="w-3 h-3 rounded-full bg-score-mixed" />
                <span className="text-sm text-muted-foreground">{severityCounts.medium + severityCounts.low} Other</span>
              </motion.div>
            )}
            {uncertaintyCount > 0 && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
              >
                <span className="w-3 h-3 rounded-full bg-signal-uncertainty" />
                <span className="text-sm text-muted-foreground">{uncertaintyCount} Uncertain</span>
              </motion.div>
            )}
            {greenCount > 0 && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <span className="w-3 h-3 rounded-full bg-signal-green" />
                <span className="text-sm text-muted-foreground">{greenCount} Green</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Disclaimer */}
      <motion.p 
        className="relative z-10 text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Risk score reflects detected patterns. Higher = more risk. Review signals below for details.
      </motion.p>
    </motion.div>
  );
}
