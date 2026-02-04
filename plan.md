## Trust Lens — Implementation Overview

Trust Lens is a decision-intelligence web app that helps users identify **risk signals**, **uncertainty zones**, and **trust indicators** in URLs and text.

Rather than issuing verdicts, it highlights what users should notice before making a decision.

---

### How It Works

User Input → Rule Engine → Signal Aggregation → AI Summary → Results UI

markdown
Copy code

- **Frontend**: React + Tailwind with a clean, professional UI  
- **Backend**: Supabase Edge Functions  
- **Integrations**: Firecrawl (website content), Lovable AI (summaries)

---

### Core Features

- **Smart Input Detection**  
  Single input box that automatically detects URLs or plain text.

- **Deterministic Rule Engine**  
  Rule-based checks identify patterns related to urgency, transparency, credibility, and payment behavior.

- **Three Signal Categories**  
  - 🔴 Risk Signals — high-confidence warning patterns  
  - 🟡 Uncertainty Zones — missing or unverifiable information  
  - 🟢 Green Flags — trust-building indicators  

- **AI Explanation Layer**  
  An AI-generated summary explains how the detected signals relate to one another, without making decisions or judgments.

- **Results Dashboard**  
  Clear, card-based display of signals with human-readable explanations.

---

### Design Principles

- Explainable by design  
- No black-box scoring  
- No data storage  
- Human-in-the-loop decision-making  

> *Trust Lens doesn’t tell you what to do — it shows you what to notice before you decide.*
