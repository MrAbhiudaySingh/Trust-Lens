import { useState } from "react";
import { AnalysisInput } from "@/components/AnalysisInput";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { analyzeInput } from "@/services/analysis";
import { AnalysisResult } from "@/types/trust-lens";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (input: string) => {
    setIsLoading(true);
    try {
      const analysisResult = await analyzeInput(input);
      setResult(analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to analyze input"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none" />
      
      {/* Gradient orbs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="p-2 rounded-xl bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg">True Lens</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-xs text-muted-foreground hidden sm:block">
              Decision Intelligence
            </span>
            <ThemeToggle />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container max-w-4xl mx-auto px-4 py-10 md:py-16">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsDashboard result={result} onReset={handleReset} />
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalysisInput onAnalyze={handleAnalyze} isLoading={isLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/50 mt-auto">
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            True Lens doesn't decide for you. It helps you see risk clearly before you do.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Built with precision • No data stored • Your privacy respected
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
