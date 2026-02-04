import { AnalysisResult, InputType, AnalysisContext, Signal, SignalCategory } from "@/types/trust-lens";

const API_BASE_URL = "http://localhost:8000";

function detectInputType(input: string): InputType {
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  return urlPattern.test(input.trim()) ? 'url' : 'text';
}

function convertSignals(backendSignals: any[]): Signal[] {
  if (!backendSignals) return [];
  return backendSignals.map((sig, index) => ({
    id: `sig-${index}`,
    category: sig.level === 'red' ? 'risk' : sig.level === 'yellow' ? 'uncertainty' : 'green' as SignalCategory,
    title: sig.name,
    explanation: sig.message,
    ruleId: sig.name?.toLowerCase().replace(/\s+/g, '-') || `rule-${index}`,
    severity: sig.level === 'red' ? 'high' : sig.level === 'yellow' ? 'medium' : 'low',
  }));
}

export async function analyzeInput(input: string): Promise<AnalysisResult> {
  const inputType = detectInputType(input);
  
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input, content_type: inputType }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    const data = await response.json();
    
    console.log("Backend response:", data);
    
    const signals = convertSignals(data.signals);
    const detectedContext: AnalysisContext = data.detectedContext || 'general';
    
    return {
      inputType,
      originalInput: input,
      signals,
      summary: data.summary,
      analyzedAt: new Date().toISOString(),
      recommendedActions: data.recommendedActions || ['Verify through official channels'],
      detectedContext,
      primaryDomain: detectedContext === 'legal_agreement' ? 'legal' : 
                     ['partnership_offer', 'client_inquiry', 'vendor_proposal'].includes(detectedContext) ? 'business' : 'consumer',
      whyItMatters: data.whatYouMightMiss,
      metadata: data.metadata,
      // New fields from severity-first backend
      overall_level: data.overall_level || 'Unknown',
      concernCount: data.concernCount || 0,
      severityLevel: data.severityLevel || 'low',
    } as AnalysisResult;

  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error("Backend not connected. Start it on port 8000.");
  }
}
