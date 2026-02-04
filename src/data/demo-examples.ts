import { DemoExample } from "@/types/trust-lens";

export const demoExamples: DemoExample[] = [
  // CONSUMER RISK EXAMPLES
  {
    id: "scam-message",
    label: "🚨 Suspicious Message",
    description: "A message with urgency and payment red flags",
    context: "consumer_message",
    input: `URGENT: Your account has been compromised! 

Dear Valued Customer,

We detected suspicious activity on your account. To prevent suspension, you must verify your identity IMMEDIATELY.

Act NOW - you only have 24 hours before your account is permanently locked!

Please send $50 in iTunes gift cards to unlock your account. This is the only payment method we accept for security verification.

Don't miss this chance to secure your account. Time is running out!

Best regards,
The Security Team`,
  },
  {
    id: "legitimate-email",
    label: "✅ Professional Email",
    description: "A legitimate business communication with green flags",
    context: "consumer_message",
    input: `Hello,

I'm reaching out from Acme Corporation regarding your software services. We're evaluating vendors for our Q2 2024 project and your platform came up in our research.

Could you schedule a call next week to discuss pricing and implementation timelines? I'm available Tuesday or Thursday afternoon.

You can reach me at john.smith@acme-corp.com or call our office at (555) 123-4567.

Best regards,
John Smith
Senior IT Manager
Acme Corporation
123 Business Park Drive, Suite 400
San Francisco, CA 94105

Unsubscribe from these emails | Privacy Policy | Terms of Service`,
  },
  
  // LEGAL RISK EXAMPLES
  {
    id: "predatory-tos",
    label: "⚖️ Predatory Terms",
    description: "A legal agreement with rights-stripping clauses",
    context: "legal_agreement",
    input: `TERMS OF SERVICE

By using this service, you irrevocably consent to all terms outlined herein. This consent cannot be revoked.

1. BINDING ARBITRATION
Any disputes shall be resolved through binding arbitration. You waive your right to sue or participate in class action lawsuits. The arbitrator's decision is final with no right to appeal.

2. MODIFICATION OF TERMS
We reserve the right to modify these terms at any time at our sole discretion without prior notice to you. Continued use constitutes acceptance.

3. INTELLECTUAL PROPERTY
You grant us a perpetual, irrevocable, transferable, royalty-free license to use, modify, sell, and distribute any content you submit.

4. LIMITATION OF LIABILITY
Under no circumstances shall we be liable for any damages. You agree to indemnify us for any claims, including those arising from our negligence.

5. DATA COLLECTION
We may share your personal data with third parties for any purpose without restriction.

6. TERMINATION
We may terminate your account at any time without notice. All clauses survive account deletion in perpetuity.`,
  },
  
  // BUSINESS RISK EXAMPLES - CLIENT INQUIRY
  {
    id: "vague-inquiry",
    label: "🤔 Vague Client Inquiry",
    description: "A business inquiry with low-quality intent signals",
    context: "client_inquiry",
    input: `Hi there,

I came across your website and I'm interested in what you do. Can we hop on a quick call to discuss?

I'm just exploring options at this stage, no rush. Would love to pick your brain about some ideas I have.

Let me know when you're free!

Thanks`,
  },
  {
    id: "quality-inquiry",
    label: "✅ Quality Client Inquiry",
    description: "A professional business inquiry with clear context",
    context: "client_inquiry",
    input: `Hello,

I'm the Director of Operations at Summit Healthcare (www.summithealth.com), a 200-person medical practice in Seattle.

We need to migrate our patient scheduling system by Q3 2024. Budget is approved at $50K-75K for implementation.

Our requirements:
- Integration with Epic EMR
- HIPAA compliance certification
- Support for 15+ locations
- Mobile access for providers

Could you send a capabilities overview and available time slots for a 30-minute discovery call next week?

Best regards,
Dr. Sarah Chen
Director of Operations
Summit Healthcare
Tel: (206) 555-0192
sarah.chen@summithealth.com`,
  },
  
  // BUSINESS RISK EXAMPLES - VENDOR EVALUATION
  {
    id: "risky-vendor",
    label: "⚠️ Risky Vendor Proposal",
    description: "A vendor proposal with concerning terms",
    context: "vendor_proposal",
    input: `PARTNERSHIP PROPOSAL

Thank you for your interest in our enterprise solution!

REVOLUTIONARY OFFERING:
- Our AI platform guarantees 10x ROI in 90 days
- Trusted by industry leaders (names confidential)
- Award-winning, patented technology

PRICING:
- 3-year minimum commitment required
- Annual fee: $150,000 (payment in full upfront only)
- No refunds under any circumstances

TERMS:
- You assume all integration and deployment risks
- We reserve the right to modify pricing at any time
- No SLA guarantees; support provided "as available"
- Termination requires 12 months written notice plus exit fees

This offer expires in 48 hours. Act now to secure this rate!

Regards,
The Enterprise Team`,
  },
  {
    id: "solid-vendor",
    label: "✅ Solid Vendor Proposal",
    description: "A balanced vendor proposal with safeguards",
    context: "vendor_proposal",
    input: `Dear Team,

Following our discovery call, please find our proposal below:

ABOUT US:
Established in 2015, we serve 450+ enterprise clients including Microsoft, Salesforce, and Adobe. See case studies at vendor.com/cases.

SOLUTION:
- Enterprise analytics dashboard
- 99.9% uptime SLA with credits
- 24/7 priority support

PRICING:
- $5,000/month (annual billing)
- 30-day free pilot available
- Cancel anytime with 30 days notice

TERMS:
- Full refund within first 60 days if unsatisfied
- 90-day notice before any pricing changes
- Data export available at any time
- We maintain SOC 2 Type II and GDPR compliance

NEXT STEPS:
1. Schedule technical deep-dive
2. Start 30-day pilot
3. Review and sign standard MSA

References available upon request.

Best,
Jennifer Walsh
Enterprise Account Manager
jennifer@vendor.com | (555) 987-6543`,
  },
  
  // PARTNERSHIP EXAMPLE
  {
    id: "partnership-risk",
    label: "🤝 Partnership Offer",
    description: "A partnership proposal with dependency concerns",
    context: "partnership_offer",
    input: `STRATEGIC PARTNERSHIP OPPORTUNITY

We're offering an exclusive partnership to distribute your product in APAC.

TERMS:
- Exclusive distribution rights for 5 years
- You cannot partner with any other APAC distributors
- All customer relationships go through us
- Revenue share: 60% to us, 40% to you
- We set all regional pricing
- All marketing materials require our approval
- Early termination fee: 2x annual revenue

This is a limited opportunity. Only 3 partnership slots available.

Let us know within 7 days or we'll approach your competitors.`,
  },
  
  // URL EXAMPLE
  {
    id: "example-url",
    label: "🌐 Test URL",
    description: "Analyze a live website for trust signals",
    input: "https://example.com",
  },
];
