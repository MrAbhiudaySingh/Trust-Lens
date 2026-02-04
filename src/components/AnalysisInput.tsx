import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Mail, FileText, Briefcase, ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalysisInputProps {
  onAnalyze: (input: string) => Promise<void>;
  isLoading: boolean;
}

type AnalysisMode = 'message' | 'agreement' | 'proposal';

const modes: { id: AnalysisMode; label: string; description: string; icon: typeof Mail; placeholder: string }[] = [
  { 
    id: 'message', 
    label: 'Message', 
    description: 'Email, DM, or SMS',
    icon: Mail,
    placeholder: 'Paste the message you received…'
  },
  { 
    id: 'agreement', 
    label: 'Agreement', 
    description: 'Contract, ToS, or policy',
    icon: FileText,
    placeholder: 'Paste the agreement or terms…'
  },
  { 
    id: 'proposal', 
    label: 'Proposal', 
    description: 'Vendor, client, or partner',
    icon: Briefcase,
    placeholder: 'Paste the business proposal…'
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AnalysisInput({ onAnalyze, isLoading }: AnalysisInputProps) {
  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<AnalysisMode | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      await onAnalyze(input.trim());
    }
  };

  const selectedModeData = modes.find(m => m.id === selectedMode);

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section - Question-based, not marketing */}
      <motion.div className="text-center space-y-5" variants={itemVariants}>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          What's hiding in this{" "}
          <span className="text-gradient">
            {selectedMode === 'message' ? 'message' : 
             selectedMode === 'agreement' ? 'agreement' : 
             selectedMode === 'proposal' ? 'proposal' : 
             'message'}
          </span>?
        </h1>
        
        <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          True Lens surfaces <span className="text-foreground font-medium">risk signals</span>, <span className="text-foreground font-medium">missing information</span>, and <span className="text-foreground font-medium">manipulation patterns</span>—so you see what you're not seeing.
        </p>

        <p className="text-sm text-muted-foreground/80 font-medium">
          Rules detect. AI explains. You decide.
        </p>
      </motion.div>

      {/* Step 1: Context Selection */}
      <motion.div className="space-y-3" variants={itemVariants}>
        <p className="text-sm font-medium text-muted-foreground text-center">
          What are you analyzing?
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            
            return (
              <motion.button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                disabled={isLoading}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn(
                      "font-semibold text-sm transition-colors",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {mode.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 2: Input (appears after mode selection) */}
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        variants={itemVariants}
      >
        <motion.div 
          className={cn(
            "relative transition-all duration-300",
            selectedMode ? "opacity-100" : "opacity-40 pointer-events-none"
          )}
          animate={{ 
            height: selectedMode ? 'auto' : 'auto',
            filter: selectedMode ? 'none' : 'blur(1px)'
          }}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedModeData?.placeholder || "Select what you're analyzing first…"}
              className="relative min-h-[180px] text-base resize-none rounded-xl border-border bg-card focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:border-primary/50 placeholder:text-muted-foreground/50"
              disabled={isLoading || !selectedMode}
            />
          </div>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            disabled={!input.trim() || isLoading || !selectedMode}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Detecting signals...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Surface what's hidden
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.form>

      {/* How it works - transparent mechanism */}
      <motion.div 
        className="pt-2"
        variants={itemVariants}
      >
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-signal-risk" />
            <span>Risk signals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-signal-uncertainty" />
            <span>Uncertainty zones</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-signal-green" />
            <span>Trust indicators</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
