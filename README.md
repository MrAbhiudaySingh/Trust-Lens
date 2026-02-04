# Trust Lens

A decision-intelligence tool that highlights risk signals, uncertainty, and trust indicators in links and text.

## Overview

Trust Lens uses a severity-first approach to analyze:
- **Legal agreements** (Terms of Service, contracts)
- **Business proposals** (partnerships, vendor pitches, client inquiries)
- **Consumer messages** (emails, DMs, potential scams)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)

### Backend
- Python 3.12
- FastAPI
- Pydantic (data validation)

### AI & External Services
- Google Gemini API (AI summaries)
- Scrape.do (website content extraction)

## Setup

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set environment variables:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export SCRAPE_DO_API_KEY="your-scrape-do-api-key"
```

Run backend:
```bash
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

### 2. Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs on http://localhost:8080

## API Keys Required

1. **Google Gemini API**: https://makersuite.google.com/app/apikey
2. **Scrape.do**: https://scrape.do/

## How It Works

### Severity-First Detection

| Concern Count | Severity | Label |
|--------------|----------|-------|
| ≥6 | 🔴 CRITICAL | "Systemic Rights Erosion" |
| ≥3 | 🟠 HIGH | "Rights-Stripping Clause Cluster" |
| 1-2 | 🟡 MODERATE | "Concerning Provisions" |
| 0 | 🟢 LOW | "Standard Language" |

### Legal Clause Detection (14 Patterns)

- Binding Arbitration & Rights Waiver
- Class Action Waiver
- Unilateral Modification Rights
- Data Monetization Rights
- Irrevocable Content License
- No-Refund Policy
- Asset Forfeiture on Termination
- Broad Liability Waiver
- Indemnification of Negligence
- Private Arbitration Mandate
- IP Assignment Clause
- Silence-as-Consent
- Perpetual Obligation
- Future Terms Consent

### Business Intelligence

For partnership/vendor/client contexts:
- Strategic Importance assessment
- Risk-to-Reward Balance
- Time Investment recommendation
- Company credibility verification
- Confidence Factors & Concerns

## Features

✅ **Compound Risk Reasoning** - Explains how multiple clauses interact  
✅ **Consequence-Focused** - "What You Might Miss" explains long-term impact  
✅ **Action-Oriented** - Specific next steps, not vague warnings  
✅ **Business Intelligence** - Priority & time recommendations for proposals  
✅ **Website Scraping** - Automatic verification via Scrape.do  

## Philosophy

> "Rules decide. AI explains. Humans decide."

Trust Lens doesn't label things "safe" or "unsafe." It surfaces signals and context so users can make better-informed choices.

## License

Educational and demonstrative purposes.
