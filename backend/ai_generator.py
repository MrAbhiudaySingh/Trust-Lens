"""
Trust Lens Enhanced AI Integration - Severity-First Reasoning
"""

import httpx
import json
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class Signal(BaseModel):
    id: str
    category: str
    title: str
    explanation: str
    details: Optional[str] = None
    ruleId: str
    severity: Optional[str] = None
    domain: Optional[str] = None

class AIInput(BaseModel):
    inputType: str
    originalInput: str
    detectedContext: str
    signals: List[Signal]
    businessPriority: Optional[Dict] = None
    companyAssessment: Optional[Dict] = None
    concernCount: int = 0
    severityLevel: str = "low"

class AIOutput(BaseModel):
    summary: str
    whatYouMightMiss: str
    actions: List[str]

class TrustLensAI:
    """AI explainer with severity-first reasoning"""
    
    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    SEVERITY_CONFIG = {
        "critical": {
            "label": "CRITICAL RISK",
            "color": "🔴",
            "threshold": 6
        },
        "high": {
            "label": "HIGH CONCERN",
            "color": "🟠",
            "threshold": 3
        },
        "moderate": {
            "label": "MODERATE RISK",
            "color": "🟡",
            "threshold": 1
        },
        "low": {
            "label": "LOW RISK",
            "color": "🟢",
            "threshold": 0
        }
    }
    
    IMPACT_TITLES = {
        "legal": {
            "critical": "Systemic Rights Erosion Structure",
            "high": "Rights-Stripping Clause Cluster",
            "moderate": "Concerning Legal Provisions",
            "low": "Standard Legal Language"
        },
        "business": {
            "critical": "Critical Partnership Risk",
            "high": "High-Risk Engagement Structure",
            "moderate": "Mixed-Signal Opportunity",
            "low": "Credible Business Approach"
        },
        "consumer": {
            "critical": "Predatory Pattern System",
            "high": "High-Pressure Manipulation",
            "moderate": "Suspicious Indicators Present",
            "low": "No Significant Concerns"
        }
    }
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
    
    def _determine_severity(self, input_data: AIInput) -> str:
        """Determine overall severity based on concern count"""
        count = input_data.concernCount
        
        if count >= 6:
            return "critical"
        elif count >= 3:
            return "high"
        elif count >= 1:
            return "moderate"
        return "low"
    
    def _build_compound_explanation(self, signals: List[Signal], context: str, severity: str) -> str:
        """Build explanation of how multiple clauses interact"""
        
        if severity == "critical":
            return """The combined presence of multiple high-impact clauses creates a systemic power imbalance. Individually, each provision might appear in standard contracts, but together they form a structure that: (1) eliminates your ability to dispute or seek remedy, (2) grants the other party unilateral control over terms and access, and (3) extends obligations beyond reasonable limits. This is not a balanced agreement."""
        
        elif severity == "high":
            return """Several concerning provisions work together to shift significant control away from you. While not every clause is problematic on its own, their combination creates substantial risk exposure—particularly around dispute resolution, data rights, and unilateral changes. The structure favors the drafting party heavily."""
        
        elif severity == "moderate":
            risk_signals = [s for s in signals if s.category == 'risk']
            if risk_signals:
                return f"""Detected {len(risk_signals)} area{'s' if len(risk_signals) > 1 else ''} of concern: {', '.join([s.title for s in risk_signals[:2]])}. These provisions warrant careful review before proceeding."""
            return "Some indicators suggest caution is warranted. Review the specific signals detected."
        
        return "No significant risk patterns detected. Standard verification practices apply."
    
    def _build_what_you_might_miss(self, signals: List[Signal], context: str, severity: str) -> str:
        """Build consequence-focused 'what you might miss' section"""
        
        if context == "legal_agreement":
            if severity in ["critical", "high"]:
                return """What you might miss: These clauses don't just limit your current rights—they systematically remove your ability to challenge problems later. The binding arbitration clause means you cannot sue in court, even for serious harm. The unilateral change provision allows them to alter terms after you've committed, leaving you with no recourse. The data license grant is perpetual and irrevocable, extending beyond account closure. Combined, these create a legal structure where you bear all risk while they retain all control."""
            else:
                return """No major red flags detected, but always verify: (1) Can you exit easily? (2) What happens to your data? (3) Can terms change without notice? Standard agreements should allow dispute resolution in court and limit data use to service provision."""
        
        elif context in ["partnership_offer", "vendor_proposal", "client_inquiry"]:
            if severity in ["critical", "high"]:
                return """What you might miss: The urgency pressure combined with limited verifiability is a classic pattern. Legitimate opportunities don't require immediate decisions without due diligence. The lack of corporate infrastructure (no verifiable domain, no LinkedIn presence) means you're taking on partnership risk without validation. If this were credible, they would provide references and allow time for verification."""
            else:
                return """Key verification steps: Confirm company registration, check for active social presence, request references from past partners. Credible businesses provide this information proactively."""
        
        else:  # consumer_message
            if severity in ["critical", "high"]:
                return """What you might miss: Urgency + personal info requests + unknown sender = classic social engineering. The pressure to act fast is specifically designed to bypass your critical thinking. Legitimate entities don't operate this way—they provide time, verifiable contact information, and don't demand sensitive data via unsolicited messages."""
            else:
                return """Verify sender identity through official channels (not reply links). Check for pressure tactics. When in doubt, pause and verify independently."""
    
    def _build_actions(self, context: str, severity: str, signals: List[Signal]) -> List[str]:
        """Build decision-oriented action items"""
        
        actions = []
        
        if context == "legal_agreement":
            if severity == "critical":
                actions = [
                    "🛑 DO NOT ACCEPT without attorney review—this agreement contains systemic risk",
                    "📋 Specifically challenge: binding arbitration clause, unilateral change rights, broad data license",
                    "⚖️ Compare against industry-standard terms (e.g., major platform ToS)",
                    "✋ Consider opting out—few services are worth surrendering these rights",
                    "📄 Request modified terms removing arbitration and limiting data use"
                ]
            elif severity == "high":
                actions = [
                    "⚠️ Do not accept without understanding each flagged clause",
                    "📋 Mark specific sections for legal review (arbitration, liability, data rights)",
                    "🔍 Compare data handling and dispute terms against 2-3 similar services",
                    "📧 Request clarification on: unilateral changes, termination, data retention",
                    "✋ If protections are absent, consider alternative providers"
                ]
            else:
                actions = [
                    "✓ Review standard sections (liability, data use, termination)",
                    "📋 Ensure you can delete account and data",
                    "🔍 Verify dispute resolution is in court, not just arbitration"
                ]
        
        elif context in ["partnership_offer", "vendor_proposal"]:
            if severity in ["critical", "high"]:
                actions = [
                    "🛑 Do not proceed without verification—high-pressure + low-verifiability is a warning pattern",
                    "📋 Request: Company registration, LinkedIn profiles, 2-3 references",
                    "⏰ Insist on time for due diligence—legitimate partners allow this",
                    "🔍 Search company name + 'scam' or 'complaint'",
                    "✋ If they resist verification, disengage immediately"
                ]
            else:
                actions = [
                    "📋 Request company website and LinkedIn verification",
                    "📞 Schedule call after confirming company exists",
                    "🔍 Check references before sharing proprietary information"
                ]
        
        else:  # consumer_message
            if severity in ["critical", "high"]:
                actions = [
                    "🛑 DO NOT CLICK links or respond—this shows classic manipulation patterns",
                    "🗑️ Delete message and block sender",
                    "🔍 Verify independently through official website (not reply links)",
                    "💡 Report to platform if applicable",
                    "⚠️ If you already clicked, scan device and change passwords"
                ]
            else:
                actions = [
                    "⚠️ Verify sender through official channels",
                    "⏰ Take time—ignore urgency pressure",
                    "🔍 Search message content for known scams"
                ]
        
        return actions
    
    async def generate_summary(self, input_data: AIInput) -> AIOutput:
        """Generate comprehensive severity-aligned output"""
        
        severity = self._determine_severity(input_data)
        signals = input_data.signals
        context = input_data.detectedContext
        
        # Build compound explanation
        summary = self._build_compound_explanation(signals, context, severity)
        
        # Build what you might miss
        what_you_might_miss = self._build_what_you_might_miss(signals, context, severity)
        
        # Build actions
        actions = self._build_actions(context, severity, signals)
        
        # If Gemini is available, enhance the summary
        if self.api_key and severity in ["critical", "high"]:
            try:
                enhanced = await self._enhance_with_gemini(input_data, summary, severity)
                if enhanced:
                    summary = enhanced
            except:
                pass  # Use rule-based summary if API fails
        
        return AIOutput(
            summary=summary,
            whatYouMightMiss=what_you_might_miss,
            actions=actions
        )
    
    async def _enhance_with_gemini(self, input_data: AIInput, base_summary: str, severity: str) -> Optional[str]:
        """Enhance summary with Gemini for high-severity cases"""
        
        concern_titles = [s.title for s in input_data.signals if s.category == 'risk']
        
        prompt = f"""You are a legal risk analyst. Rewrite this summary to be clearer and more impactful.

SEVERITY: {severity.upper()}
CONCERNS: {', '.join(concern_titles[:4])}

CURRENT SUMMARY:
{base_summary}

REQUIREMENTS:
1. Be direct about the severity—don't soften it
2. Explain how clauses work together to create risk
3. Use clear, serious language
4. Keep it to 2-3 sentences
5. Focus on user protection, not neutrality

IMPROVED SUMMARY:"""

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.API_URL}?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.2,
                            "maxOutputTokens": 150
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if 'candidates' in result:
                        return result['candidates'][0]['content']['parts'][0]['text'].strip()
        except:
            pass
        
        return None

ai_generator = TrustLensAI()
