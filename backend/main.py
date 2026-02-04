"""
Trust Lens Enhanced Backend - Severity-First Decision Intelligence
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
import re
import hashlib
import httpx
import asyncio
import os

from ai_generator import TrustLensAI, AIInput, AIOutput, Signal as AISignal

app = FastAPI(title="Trust Lens API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_generator = TrustLensAI()

# ============ DATA MODELS ============

class SignalLevel(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"

class Signal(BaseModel):
    name: str
    level: SignalLevel
    message: str
    confidence: float

class BusinessPriorityAssessment(BaseModel):
    strategicImportance: str
    attentionWorthiness: str
    riskToRewardBalance: str
    timeRecommendation: str
    confidenceFactors: List[str]
    concerns: List[str]

class CompanyAssessment(BaseModel):
    visibility: str
    trackRecord: str
    flags: List[str]
    confidenceFactors: List[str]

class TrustAnalysis(BaseModel):
    overall_score: int
    overall_level: str  # Changed to string for severity labels
    signals: List[Signal]
    external_checks: List[Dict]
    summary: str
    whatYouMightMiss: str
    recommendedActions: List[str]
    businessPriority: Optional[BusinessPriorityAssessment] = None
    companyAssessment: Optional[CompanyAssessment] = None
    detectedContext: str = "general"
    concernCount: int = 0
    severityLevel: str = "low"

class AnalysisRequest(BaseModel):
    content: str
    content_type: str = "text"

# ============ WEBSITE SCRAPER ============

class WebsiteScraper:
    SCRAPE_DO_API_KEY = os.getenv("SCRAPE_DO_API_KEY", "")
    
    async def scrape(self, url: str) -> Dict[str, Any]:
        try:
            if not self.SCRAPE_DO_API_KEY:
                return {"success": False, "error": "SCRAPE_DO_API_KEY not set"}
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                scrape_url = f"http://api.scrape.do?token={self.SCRAPE_DO_API_KEY}&url={url}"
                response = await client.get(scrape_url)
                
                if response.status_code != 200:
                    return {"success": False, "error": f"Scrape.do error: HTTP {response.status_code}"}
                
                html = response.text
                title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
                title = title_match.group(1).strip() if title_match else "Unknown"
                
                desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)', html, re.IGNORECASE)
                description = desc_match.group(1) if desc_match else ""
                
                has_contact = bool(re.search(r'(contact|email|phone|address)', html, re.IGNORECASE))
                has_about = bool(re.search(r'href=["\'][^"\']*about', html, re.IGNORECASE))
                social_patterns = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com']
                social_links = [s for s in social_patterns if s in html.lower()]
                
                return {
                    "success": True,
                    "title": title,
                    "description": description,
                    "has_contact": has_contact,
                    "has_about": has_about,
                    "social_links": social_links,
                    "domain": self._extract_domain(url)
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _extract_domain(self, url: str) -> str:
        match = re.search(r'https?://([^/]+)', url)
        return match.group(1) if match else url

# ============ CONTEXT DETECTOR ============

def detect_context(content: str, content_type: str) -> str:
    lower = content.lower()
    
    legal_markers = ['terms of service', 'user agreement', 'privacy policy', 'legal agreement', 
                     'contract', 'terms and conditions', 'terms of use', 'binding arbitration',
                     'liability waiver', 'indemnification', 'intellectual property']
    legal_count = sum(1 for marker in legal_markers if marker in lower)
    
    if legal_count >= 2 or 'terms of service' in lower or 'user agreement' in lower:
        return 'legal_agreement'
    
    if any(word in lower for word in ['partnership', 'collaboration', 'synergy', 'strategic alliance']):
        return 'partnership_offer'
    
    if any(word in lower for word in ['client inquiry', 'customer inquiry', 'interested in your services']):
        return 'client_inquiry'
    
    if any(word in lower for word in ['vendor', 'supplier', 'quote', 'pricing']) and 'contract' not in lower:
        return 'vendor_proposal'
    
    if any(word in lower for word in ['job offer', 'employment', 'hiring', 'position', 'salary']):
        return 'consumer_message'
    
    return 'consumer_message'

# ============ SEVERITY-FIRST RULE ENGINE ============

class TrustRule:
    def __init__(self, name: str, weight: float = 1.0):
        self.name = name
        self.weight = weight
    
    def evaluate(self, content: str, content_type: str, context: str) -> Optional[Signal]:
        raise NotImplementedError

class LegalClauseRule(TrustRule):
    """Detects concerning legal clauses - returns MULTIPLE signals"""
    
    CONCERNING_PATTERNS = [
        (r'irrevocably agree|binding arbitration.*waive.*(court|trial|jury)', "Binding Arbitration & Rights Waiver", "VERY_HIGH"),
        (r'class action.*waive|waive.*class action', "Class Action Waiver", "VERY_HIGH"),
        (r'unilateral.*change|modify.*without notice|without notification', "Unilateral Modification Rights", "HIGH"),
        (r'sell.*data|monetize.*data|third.parties.*without restriction|transferable.*license.*data', "Data Monetization Rights", "VERY_HIGH"),
        (r'perpetual.*irrevocable.*license|worldwide.*license.*content', "Irrevocable Content License", "HIGH"),
        (r'non.refundable.*error|no.*refund.*error|payments.*non.refundable', "No-Refund Policy", "MEDIUM"),
        (r'forfeit.*(balance|credits)|void.*(benefits|rewards)|no compensation', "Asset Forfeiture on Termination", "HIGH"),
        (r'not liable.*(theft|breach|loss)|waiver.*liability.*negligence', "Broad Liability Waiver", "VERY_HIGH"),
        (r'indemnif.*(our negligence|our errors)|hold harmless.*negligence', "Indemnification of Negligence", "VERY_HIGH"),
        (r'private arbitration|no.*(jury|court|appeal)', "Private Arbitration Mandate", "HIGH"),
        (r'intellectual property.*become.*ours|assign.*all rights', "IP Assignment Clause", "HIGH"),
        (r'silence.*consent|deemed.*acceptance|failure.*object.*consent', "Silence-as-Consent", "HIGH"),
        (r'survive.*termination|survive.*death|perpetual.*obligation', "Perpetual Obligation", "MEDIUM"),
        (r'consent.*future.*terms|terms not yet written', "Future Terms Consent", "VERY_HIGH"),
    ]
    
    def evaluate_all(self, content: str, context: str) -> List[Signal]:
        """Return ALL detected concerning clauses as separate signals"""
        if context != 'legal_agreement':
            return []
        
        lower = content.lower()
        signals = []
        
        for pattern, name, severity in self.CONCERNING_PATTERNS:
            if re.search(pattern, lower):
                level = SignalLevel.RED if severity in ["VERY_HIGH", "HIGH"] else SignalLevel.YELLOW
                confidence = 0.95 if severity == "VERY_HIGH" else 0.85 if severity == "HIGH" else 0.75
                
                signals.append(Signal(
                    name=name,
                    level=level,
                    message=f"{severity} RISK: {name} - This provision significantly affects your rights and recourse options.",
                    confidence=confidence
                ))
        
        return signals

class HighPressurePatternRule(TrustRule):
    """Detects high-pressure manipulation patterns"""
    
    def evaluate(self, content: str, content_type: str, context: str) -> Optional[Signal]:
        lower = content.lower()
        
        # Check for urgency + action combination
        urgency = bool(re.search(r'\b(urgent|asap|immediately|now|today|hurry|rush)\b', lower))
        action_demand = bool(re.search(r'\b(click|respond|reply|act|confirm)\b', lower))
        consequence = bool(re.search(r'\b(expire|lose|miss out|forfeit|limited)\b', lower))
        
        if urgency and action_demand and consequence:
            return Signal(
                name="Predatory Pressure Pattern",
                level=SignalLevel.RED,
                message="URGENT + ACTION DEMAND + CONSEQUENCE = classic manipulation tactic designed to bypass critical thinking.",
                confidence=0.95
            )
        elif urgency and action_demand:
            return Signal(
                name="High-Pressure Tactics",
                level=SignalLevel.RED,
                message="Urgency combined with action demands is a common social engineering pattern.",
                confidence=0.85
            )
        
        return None

class VerifiabilityRule(TrustRule):
    """Checks for verifiable information in business contexts"""
    
    def evaluate(self, content: str, content_type: str, context: str) -> Optional[Signal]:
        if context not in ['partnership_offer', 'client_inquiry', 'vendor_proposal']:
            return None
        
        has_website = bool(re.search(r'https?://[^\s]+', content))
        has_linkedin = bool(re.search(r'linkedin\.com', content.lower()))
        has_domain_email = bool(re.search(r'@[\w]+\.(com|io|ai|co|org|net)', content))
        has_company_name = bool(re.search(r'\b(Inc\.?|LLC|Ltd\.?|Corp\.?|Company)\b', content))
        
        verifiable_count = sum([has_website, has_linkedin, has_domain_email, has_company_name])
        
        if verifiable_count == 0:
            return Signal(
                name="Zero Verifiable Identity",
                level=SignalLevel.RED,
                message="No company website, LinkedIn, corporate email, or legal name provided. Cannot verify legitimacy.",
                confidence=0.9
            )
        elif verifiable_count <= 2:
            return Signal(
                name="Limited Verifiability",
                level=SignalLevel.YELLOW,
                message=f"Only {verifiable_count}/4 verification elements present. Request additional proof of legitimacy.",
                confidence=0.75
            )
        
        return None

# ============ BUSINESS ASSESSMENT FUNCTIONS ============

def assess_business_priority(signals: List[Signal], context: str, severity_level: str) -> BusinessPriorityAssessment:
    """Assess business priority based on signals and severity"""
    
    risk_count = sum(1 for s in signals if s.level == SignalLevel.RED)
    green_count = sum(1 for s in signals if s.level == SignalLevel.GREEN)
    
    # Override based on severity
    if severity_level in ['critical', 'high']:
        strategic = "low"
        attention = "ignore"
        risk_reward = "unfavorable"
        time_rec = "Deprioritize—high risk indicators present"
    elif green_count >= 2 and risk_count == 0:
        strategic = "high"
        attention = "engage"
        risk_reward = "favorable"
        time_rec = "Warrants prompt attention"
    elif green_count >= 1 and risk_count <= 1:
        strategic = "medium"
        attention = "monitor"
        risk_reward = "neutral"
        time_rec = "Evaluate alongside other opportunities"
    else:
        strategic = "low"
        attention = "ignore"
        risk_reward = "unfavorable"
        time_rec = "Does not merit significant time investment"
    
    confidence_factors = []
    concerns = []
    
    for sig in signals:
        if sig.level == SignalLevel.GREEN:
            confidence_factors.append(sig.name)
        elif sig.level in [SignalLevel.RED, SignalLevel.YELLOW]:
            concerns.append(sig.name)
    
    return BusinessPriorityAssessment(
        strategicImportance=strategic,
        attentionWorthiness=attention,
        riskToRewardBalance=risk_reward,
        timeRecommendation=time_rec,
        confidenceFactors=confidence_factors if confidence_factors else ["Limited positive indicators"],
        concerns=concerns if concerns else ["No specific concerns flagged"]
    )

def assess_company(content: str, scraped: Optional[Dict] = None) -> CompanyAssessment:
    """Assess company credibility"""
    
    flags = []
    confidence_factors = []
    
    # Check for corporate email
    corp_email = re.search(r'[\w.]+@([\w]+\.(com|io|ai|co|org|net))', content)
    if corp_email:
        domain = corp_email.group(1)
        if domain not in ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']:
            confidence_factors.append("Corporate email domain")
            track_record = "claimed"
        else:
            flags.append("Using personal email provider")
            track_record = "unverified"
    else:
        flags.append("No corporate email provided")
        track_record = "unknown"
    
    # Check for company name
    company_patterns = re.findall(r'(?:at|from|of)\s+([A-Z][\w\s]+(?:Inc|LLC|Ltd|Corp|Company|Solutions|Technologies|AI|Labs))', content)
    if company_patterns:
        confidence_factors.append("Company name provided")
    else:
        flags.append("Limited public visibility")
    
    # Visibility assessment
    if scraped and scraped.get("success"):
        if scraped.get("social_links"):
            visibility = "moderate"
            confidence_factors.append("Active social media presence")
        else:
            visibility = "limited"
            flags.append("Limited online presence")
    else:
        visibility = "unknown"
    
    return CompanyAssessment(
        visibility=visibility,
        trackRecord=track_record,
        flags=flags,
        confidenceFactors=confidence_factors
    )

# ============ ENGINE ============

class TrustLensEngine:
    def __init__(self):
        self.rules = [
            LegalClauseRule("Legal Risk Analysis"),
            HighPressurePatternRule("Manipulation Pattern Detection"),
            VerifiabilityRule("Identity Verification"),
        ]
        self.scraper = WebsiteScraper()
    
    async def analyze(self, content: str, content_type: str = "text") -> TrustAnalysis:
        context = detect_context(content, content_type)
        
        # Extract and scrape URLs
        urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', content)
        scraped = None
        if urls:
            scraped = await self.scraper.scrape(urls[0])
        
        # Run all rules - collect ALL signals
        signals = []
        for rule in self.rules:
            if isinstance(rule, LegalClauseRule):
                # Legal rule returns multiple signals
                legal_signals = rule.evaluate_all(content, context)
                signals.extend(legal_signals)
            else:
                signal = rule.evaluate(content, content_type, context)
                if signal:
                    signals.append(signal)
        
        # Calculate severity
        concern_count = sum(1 for s in signals if s.level == SignalLevel.RED)
        
        if concern_count >= 6:
            severity_level = "critical"
            overall_level = "🔴 CRITICAL RISK"
            score = 15
        elif concern_count >= 3:
            severity_level = "high"
            overall_level = "🟠 HIGH CONCERN"
            score = 35
        elif concern_count >= 1:
            severity_level = "moderate"
            overall_level = "🟡 MODERATE RISK"
            score = 55
        else:
            severity_level = "low"
            overall_level = "🟢 LOW RISK"
            score = 80
        
        # Generate AI explanation
        ai_input = AIInput(
            inputType=content_type,
            originalInput=content,
            detectedContext=context,
            signals=[AISignal(
                id=f"sig-{i}",
                category="risk" if s.level == SignalLevel.RED else "uncertainty" if s.level == SignalLevel.YELLOW else "green",
                title=s.name,
                explanation=s.message,
                ruleId=type(self.rules[i % len(self.rules)]).__name__,
                severity="high" if s.level == SignalLevel.RED else "medium"
            ) for i, s in enumerate(signals)],
            concernCount=concern_count,
            severityLevel=severity_level
        )
        
        ai_result = await ai_generator.generate_summary(ai_input)
        
        # Generate business assessments for business contexts
        business_priority = None
        company_assessment = None
        print(f"DEBUG: context={context}, checking if in business contexts")
        if context in ['partnership_offer', 'client_inquiry', 'vendor_proposal']:
            print(f"DEBUG: Generating business assessments")
            business_priority = assess_business_priority(signals, context, severity_level)
            company_assessment = assess_company(content, scraped)
            print(f"DEBUG: business_priority={business_priority is not None}, company_assessment={company_assessment is not None}")
        
        return TrustAnalysis(
            overall_score=score,
            overall_level=overall_level,
            signals=signals,
            external_checks=[],
            summary=ai_result.summary,
            whatYouMightMiss=ai_result.whatYouMightMiss,
            recommendedActions=ai_result.actions,
            businessPriority=business_priority,
            companyAssessment=company_assessment,
            detectedContext=context,
            concernCount=concern_count,
            severityLevel=severity_level
        )

engine = TrustLensEngine()

# ============ API ENDPOINTS ============

@app.get("/")
def root():
    return {"message": "Trust Lens API", "version": "3.0.0", "features": ["severity-first", "compound-risk", "action-oriented"]}

@app.get("/health")
def health():
    return {"status": "healthy", "rules_loaded": len(engine.rules)}

@app.post("/analyze")
async def analyze_content(request: AnalysisRequest):
    result = await engine.analyze(request.content, request.content_type)
    return result

# ============ AI GENERATION ENDPOINT (for frontend compatibility) ============

class AIGenerateRequest(BaseModel):
    inputType: str
    originalInput: str
    detectedContext: str
    signals: List[Dict]
    businessPriority: Optional[Dict] = None
    companyAssessment: Optional[Dict] = None

class AIGenerateResponse(BaseModel):
    summary: str
    modelUsed: str
    fallback: bool

@app.post("/api/generate-summary", response_model=AIGenerateResponse)
async def generate_summary(request: AIGenerateRequest):
    """Generate AI summary - now handled by main analyze endpoint, this is for compatibility"""
    try:
        # Convert signals format
        ai_signals = []
        for sig in request.signals:
            ai_signals.append(AISignal(
                id=sig.get('id', 'unknown'),
                category=sig.get('category', 'uncertainty'),
                title=sig.get('title', 'Unknown'),
                explanation=sig.get('explanation', ''),
                ruleId=sig.get('ruleId', 'unknown'),
                severity=sig.get('severity', 'medium')
            ))
        
        # Build input
        ai_input = AIInput(
            inputType=request.inputType,
            originalInput=request.originalInput,
            detectedContext=request.detectedContext,
            signals=ai_signals,
            concernCount=len([s for s in request.signals if s.get('category') == 'risk']),
            severityLevel='low'
        )
        
        # Generate
        result = await ai_generator.generate_summary(ai_input)
        
        return AIGenerateResponse(
            summary=result.summary,
            modelUsed="trustlens-v3",
            fallback=False
        )
    except Exception as e:
        return AIGenerateResponse(
            summary="Analysis complete. Review the detected signals.",
            modelUsed="fallback",
            fallback=True
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
