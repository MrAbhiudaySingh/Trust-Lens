// analyze-input: Main orchestrator that routes to URL or text analysis
// Detects input type and coordinates the full analysis pipeline

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeText, analyzeUrl, sortSignals, generateRecommendedActions, detectContext, getPrimaryDomain, generateWhyItMatters, assessCompany, generateBusinessPriorityAssessment } from "../_shared/rule-engine.ts";
import { AnalysisResult, InputType, Signal, AnalysisContext, RiskDomain, BusinessPriorityAssessment, CompanyAssessment } from "../_shared/types.ts";

const SCRAPE_DO_API = "https://api.scrape.do";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Input is required and must be a non-empty string" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const trimmedInput = input.trim();
    
    // Detect input type
    const inputType: InputType = detectInputType(trimmedInput);
    console.log(`Detected input type: ${inputType}`);

    let signals: Signal[] = [];
    let metadata: AnalysisResult['metadata'] = undefined;

    if (inputType === 'url') {
      // URL analysis with scraping
      const urlResult = await analyzeUrlInput(trimmedInput);
      signals = urlResult.signals;
      metadata = urlResult.metadata;
    } else {
      // Text analysis
      signals = analyzeText(trimmedInput);
    }

    // Sort signals by category priority
    const sortedSignals = sortSignals(signals);

    // Detect analysis context
    const detectedContext: AnalysisContext = detectContext(trimmedInput, sortedSignals);
    const primaryDomain: RiskDomain = getPrimaryDomain(sortedSignals, detectedContext);

    // Generate recommended actions based on signals and context
    const recommendedActions = generateRecommendedActions(sortedSignals, detectedContext);

    // Generate "Why It Matters" explanation
    const whyItMatters = generateWhyItMatters(sortedSignals, detectedContext, primaryDomain);

    // Business Priority Assessment for business contexts
    let businessPriority: BusinessPriorityAssessment | undefined;
    let companyAssessment: CompanyAssessment | undefined;
    
    if (detectedContext === 'vendor_proposal' || detectedContext === 'partnership_offer' || detectedContext === 'client_inquiry') {
      // First do pattern-based assessment
      companyAssessment = assessCompany(trimmedInput, sortedSignals);
      
      // Deep verify: Extract and scrape company websites from the proposal
      const deepVerification = await deepVerifyCompany(trimmedInput, companyAssessment);
      if (deepVerification) {
        companyAssessment = deepVerification.enhancedAssessment;
        // Add verification signals to the analysis
        sortedSignals.push(...deepVerification.verificationSignals);
      }
      
      businessPriority = generateBusinessPriorityAssessment(trimmedInput, sortedSignals, detectedContext, companyAssessment);
      console.log('Business Priority Assessment generated:', businessPriority.strategicImportance);
    }

    // Generate AI summary (executive style for business contexts)
    const summary = await generateSummary(sortedSignals, inputType, trimmedInput, detectedContext, businessPriority);

    const result: AnalysisResult = {
      inputType,
      originalInput: trimmedInput,
      signals: sortedSignals,
      summary,
      analyzedAt: new Date().toISOString(),
      recommendedActions,
      detectedContext,
      primaryDomain,
      whyItMatters,
      businessPriority,
      companyAssessment,
      metadata,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-input error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

/**
 * Detect if input is a URL or plain text
 */
function detectInputType(input: string): InputType {
  // Check for URL patterns
  const urlPatterns = [
    /^https?:\/\//i,
    /^www\./i,
  ];
  
  if (urlPatterns.some(p => p.test(input))) {
    return 'url';
  }
  
  // Check if it looks like a domain
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i.test(input)) {
    return 'url';
  }
  
  return 'text';
}

/**
 * Analyze a URL by scraping and running rules
 * Falls back to URL-only analysis if scraping fails
 */
async function analyzeUrlInput(url: string): Promise<{ signals: Signal[]; metadata: AnalysisResult['metadata']; scrapeError?: string }> {
  // Ensure URL has protocol
  let fullUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    fullUrl = 'https://' + url;
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(fullUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  const metadata = {
    url: fullUrl,
    domain: parsedUrl.hostname,
    pageTitle: "Could not fetch page",
    isHttps: parsedUrl.protocol === "https:",
  };

  // Try to scrape the URL
  const SCRAPE_DO_API_KEY = Deno.env.get("SCRAPE_DO_API_KEY");
  
  if (!SCRAPE_DO_API_KEY) {
    console.warn("SCRAPE_DO_API_KEY not configured, using URL-only analysis");
    return analyzeUrlOnly(metadata);
  }

  try {
    const scrapeUrl = `${SCRAPE_DO_API}?token=${SCRAPE_DO_API_KEY}&url=${encodeURIComponent(fullUrl)}`;
    
    console.log(`Scraping URL: ${fullUrl}`);
    
    const scrapeResponse = await fetch(scrapeUrl, {
      method: "GET",
      headers: { "Accept": "text/html" },
    });

    if (!scrapeResponse.ok) {
      console.warn(`Scrape.do returned ${scrapeResponse.status}, falling back to URL-only analysis`);
      return analyzeUrlOnly(metadata, `Website could not be reached (status: ${scrapeResponse.status})`);
    }

    const htmlContent = await scrapeResponse.text();
    
    // Check if we got actual content
    if (!htmlContent || htmlContent.length < 100) {
      console.warn("Scrape returned minimal content, falling back to URL-only analysis");
      return analyzeUrlOnly(metadata, "Website returned minimal content");
    }

    const textContent = extractTextFromHtml(htmlContent);
    const pageTitle = extractTitle(htmlContent);
    
    metadata.pageTitle = pageTitle;

    // Run URL-specific rules + text rules on scraped content
    const signals = analyzeUrl(textContent, metadata);

    return { signals, metadata };
  } catch (error) {
    console.warn("Scraping failed:", error);
    return analyzeUrlOnly(metadata, "Could not connect to website");
  }
}

/**
 * Analyze URL without scraping (domain analysis only)
 * Used as fallback when scraping fails
 */
function analyzeUrlOnly(metadata: { url: string; domain: string; pageTitle: string; isHttps: boolean }, scrapeError?: string): { signals: Signal[]; metadata: AnalysisResult['metadata']; scrapeError?: string } {
  const signals: Signal[] = [];
  
  // Analyze the domain name for suspicious patterns
  const domain = metadata.domain.toLowerCase();
  
  // Check for suspicious TLDs often used in scams
  const suspiciousTlds = ['.xyz', '.top', '.click', '.link', '.work', '.gq', '.ml', '.cf', '.tk', '.ga'];
  if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
    signals.push({
      id: crypto.randomUUID(),
      category: 'uncertainty',
      title: 'Uncommon Domain Extension',
      explanation: `The domain uses a less common extension (${domain.split('.').pop()}) that is sometimes associated with temporary or low-trust websites.`,
      details: 'While not inherently malicious, these extensions are often used for disposable sites. Established businesses typically use .com, .org, or country-specific domains.',
      ruleId: 'suspicious_tld',
      domain: 'consumer',
    });
  }
  
  // Check for suspicious keywords in domain
  const scamKeywords = ['reward', 'prize', 'winner', 'free', 'urgent', 'verify', 'secure', 'update', 'confirm', 'suspended'];
  const domainHasScamKeyword = scamKeywords.some(keyword => domain.includes(keyword));
  if (domainHasScamKeyword) {
    signals.push({
      id: crypto.randomUUID(),
      category: 'risk',
      title: 'Suspicious Domain Name',
      explanation: 'The domain name contains words commonly associated with phishing or scam websites.',
      details: 'Legitimate businesses rarely use urgent or reward-related terminology in their domain names.',
      ruleId: 'suspicious_domain_keywords',
      domain: 'consumer',
    });
  }
  
  // Check for random-looking domains (lots of numbers or hyphens)
  const hasExcessiveNumbers = (domain.match(/\d/g) || []).length > 3;
  const hasExcessiveHyphens = (domain.match(/-/g) || []).length > 2;
  if (hasExcessiveNumbers || hasExcessiveHyphens) {
    signals.push({
      id: crypto.randomUUID(),
      category: 'uncertainty',
      title: 'Domain Looks Auto-Generated',
      explanation: 'The domain contains many numbers or hyphens, which can indicate an auto-generated or temporary website.',
      details: 'Established businesses typically use memorable, clean domain names.',
      ruleId: 'autogenerated_domain',
      domain: 'consumer',
    });
  }
  
  // Add HTTPS check
  if (metadata.isHttps) {
    signals.push({
      id: crypto.randomUUID(),
      category: 'green',
      title: 'Secure Connection (HTTPS)',
      explanation: 'The website uses HTTPS encryption to protect your data in transit.',
      details: 'HTTPS is a basic security requirement. While it doesn\'t guarantee legitimacy, its absence is concerning.',
      ruleId: 'https_secure',
      domain: 'consumer',
    });
  } else {
    signals.push({
      id: crypto.randomUUID(),
      category: 'risk',
      title: 'No HTTPS Encryption',
      explanation: 'The website does not use HTTPS, meaning your connection is not encrypted.',
      details: 'Modern websites should always use HTTPS. Its absence is a significant warning sign.',
      ruleId: 'no_https',
      domain: 'consumer',
    });
  }
  
  // Add note about failed scraping
  if (scrapeError) {
    signals.push({
      id: crypto.randomUUID(),
      category: 'uncertainty',
      title: 'Website Content Unavailable',
      explanation: scrapeError + '. Analysis is limited to URL patterns only.',
      details: 'The website may be offline, blocking automated access, or simply unreachable. This limits our ability to analyze the actual content.',
      ruleId: 'scrape_failed',
    });
  }
  
  return { signals: sortSignals(signals), metadata, scrapeError };
}

/**
 * Generate AI summary of detected signals
 */
async function generateSummary(signals: Signal[], inputType: InputType, originalInput: string, context: AnalysisContext, businessPriority?: BusinessPriorityAssessment): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY not configured, skipping AI summary");
    return generateFallbackSummary(signals, context, businessPriority);
  }

  try {
    const prompt = buildSummaryPrompt(signals, inputType, originalInput, context, businessPriority);
    const isBusinessContext = context === 'vendor_proposal' || context === 'partnership_offer' || context === 'client_inquiry';

    const systemPrompt = isBusinessContext
      ? `You are True Lens, an AI providing executive-style briefings on business proposals and inquiries.

IMPORTANT RULES:
1. Write like a senior analyst advising a founder or executive
2. Be concise, strategic, and non-alarmist
3. Focus on opportunity vs risk balance
4. Do NOT frame everything as a scam unless fraud signals exist
5. Keep summaries to 2-4 sentences
6. Mention what makes this worth (or not worth) attention

Your philosophy: "True Lens helps you allocate attention, time, and trust intelligently."`
      : `You are True Lens, an AI that helps users understand what signals were detected in content they submitted for analysis.

IMPORTANT RULES:
1. You summarize what the rule engine detected - you do NOT make risk judgments
2. You explain how signals might interact or relate to each other
3. You maintain a calm, neutral, informative tone
4. You never tell users what to do - only what to notice
5. Keep summaries concise (2-4 sentences)
6. Adapt your tone to the context: consumer messages, legal agreements, client inquiries, or vendor proposals

Your philosophy: "True Lens doesn't tell you what to do — it shows you what to notice before you decide."`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return generateFallbackSummary(signals, context, businessPriority);
    }

    const aiResponse = await response.json();
    return aiResponse.choices?.[0]?.message?.content || generateFallbackSummary(signals, context, businessPriority);
  } catch (error) {
    console.error("Summary generation error:", error);
    return generateFallbackSummary(signals, context, businessPriority);
  }
}

/**
 * Build prompt for AI summary
 */
function buildSummaryPrompt(signals: Signal[], inputType: InputType, originalInput: string, context: AnalysisContext, businessPriority?: BusinessPriorityAssessment): string {
  const riskSignals = signals.filter(s => s.category === 'risk');
  const uncertaintySignals = signals.filter(s => s.category === 'uncertainty');
  const greenSignals = signals.filter(s => s.category === 'green');

  const contextLabels: Record<AnalysisContext, string> = {
    consumer_message: 'a consumer message',
    legal_agreement: 'a legal agreement',
    client_inquiry: 'a client/business inquiry',
    vendor_proposal: 'a vendor proposal',
    partnership_offer: 'a partnership offer',
    general: 'general content',
  };

  const inputDescription = inputType === 'url' 
    ? `a website URL: ${originalInput.substring(0, 100)}` 
    : `${contextLabels[context]} (${originalInput.length} characters)`;

  let prompt = `The user submitted ${inputDescription} for analysis. Detected signals:\n\n`;

  if (riskSignals.length > 0) {
    prompt += `🔴 RISK (${riskSignals.length}): ${riskSignals.map(s => s.title).join(', ')}\n`;
  }
  if (uncertaintySignals.length > 0) {
    prompt += `🟡 UNCERTAINTY (${uncertaintySignals.length}): ${uncertaintySignals.map(s => s.title).join(', ')}\n`;
  }
  if (greenSignals.length > 0) {
    prompt += `🟢 GREEN (${greenSignals.length}): ${greenSignals.map(s => s.title).join(', ')}\n`;
  }
  if (signals.length === 0) {
    prompt += "No specific signals detected.\n";
  }

  // Add business context for executive-style summaries
  if (businessPriority) {
    prompt += `\nBusiness Assessment:`;
    prompt += `\n- Strategic Importance: ${businessPriority.strategicImportance}`;
    prompt += `\n- Attention Recommendation: ${businessPriority.attentionWorthiness}`;
    prompt += `\n- Risk/Reward: ${businessPriority.riskToRewardBalance}`;
    if (businessPriority.confidenceFactors.length > 0) {
      prompt += `\n- Strengths: ${businessPriority.confidenceFactors.join(', ')}`;
    }
    if (businessPriority.concerns.length > 0) {
      prompt += `\n- Concerns: ${businessPriority.concerns.join(', ')}`;
    }
    prompt += `\n\nProvide a brief executive-style summary (2-4 sentences) focused on whether this is worth the user's time and what makes it stand out. Be direct about value and concerns.`;
  } else {
    prompt += `\nProvide a brief 2-4 sentence neutral summary. Do NOT provide verdicts or tell the user what to do.`;
  }

  return prompt;
}

/**
 * Generate a fallback summary without AI
 */
function generateFallbackSummary(signals: Signal[], context: AnalysisContext, businessPriority?: BusinessPriorityAssessment): string {
  const riskCount = signals.filter(s => s.category === 'risk').length;
  const uncertaintyCount = signals.filter(s => s.category === 'uncertainty').length;
  const greenCount = signals.filter(s => s.category === 'green').length;

  if (signals.length === 0) {
    return "Our analysis didn't detect any specific signals in this content. This doesn't mean it's safe or unsafe — just that no patterns from our rule set were matched.";
  }

  const contextPhrases: Record<AnalysisContext, string> = {
    consumer_message: 'this message',
    legal_agreement: 'this agreement',
    client_inquiry: 'this inquiry',
    vendor_proposal: 'this proposal',
    partnership_offer: 'this partnership offer',
    general: 'this content',
  };

  const parts: string[] = [];
  if (riskCount > 0) parts.push(`${riskCount} risk signal${riskCount > 1 ? 's' : ''}`);
  if (uncertaintyCount > 0) parts.push(`${uncertaintyCount} uncertainty zone${uncertaintyCount > 1 ? 's' : ''}`);
  if (greenCount > 0) parts.push(`${greenCount} green flag${greenCount > 1 ? 's' : ''}`);

  // Add business context for executive-style fallback
  if (businessPriority) {
    const priorityPhrase = businessPriority.strategicImportance === 'high' 
      ? 'This appears to be a high-priority opportunity worth engagement.'
      : businessPriority.strategicImportance === 'low'
      ? 'This may not warrant significant time investment.'
      : 'This warrants careful evaluation before proceeding.';
    
    return `Our analysis of ${contextPhrases[context]} detected ${parts.join(', ')}. ${priorityPhrase}`;
  }

  return `Our analysis of ${contextPhrases[context]} detected ${parts.join(', ')}. Review each signal to understand what patterns were found, then make your own informed decision.`;
}

/**
 * Extract readable text from HTML
 */
function extractTextFromHtml(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Extract page title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "Unknown Title";
}

// ============================================
// DEEP COMPANY VERIFICATION
// Scrapes company websites to verify claims
// ============================================

interface DeepVerificationResult {
  enhancedAssessment: CompanyAssessment;
  verificationSignals: Signal[];
  scrapedSites: { url: string; success: boolean; content?: string }[];
}

/**
 * Extract potential company URLs from proposal text
 */
function extractCompanyUrls(content: string): string[] {
  const urls: string[] = [];
  
  // Match explicit URLs
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const explicitUrls = content.match(urlPattern) || [];
  urls.push(...explicitUrls);
  
  // Match www. domains
  const wwwPattern = /www\.[a-z0-9-]+\.[a-z]{2,}/gi;
  const wwwDomains = content.match(wwwPattern) || [];
  wwwDomains.forEach(d => urls.push(`https://${d}`));
  
  // Match domain-like patterns (company.com, company.io, etc.)
  const domainPattern = /\b([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)\.(com|io|co|org|net|dev|app)\b/gi;
  const domains = content.match(domainPattern) || [];
  domains.forEach(d => {
    // Avoid common false positives
    if (!['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com'].includes(d.toLowerCase())) {
      urls.push(`https://${d}`);
    }
  });
  
  // Dedupe and clean
  const unique = [...new Set(urls.map(u => u.toLowerCase().replace(/\/$/, '')))];
  return unique.slice(0, 3); // Max 3 URLs to avoid rate limits
}

/**
 * Deep verify company by scraping their website
 */
async function deepVerifyCompany(
  proposalContent: string,
  initialAssessment: CompanyAssessment
): Promise<DeepVerificationResult | null> {
  const SCRAPE_DO_API_KEY = Deno.env.get("SCRAPE_DO_API_KEY");
  if (!SCRAPE_DO_API_KEY) {
    console.log("SCRAPE_DO_API_KEY not configured, skipping deep verification");
    return null;
  }
  
  const urls = extractCompanyUrls(proposalContent);
  if (urls.length === 0) {
    console.log("No company URLs found in proposal");
    return null;
  }
  
  console.log(`Deep verification: Found ${urls.length} company URLs:`, urls);
  
  const verificationSignals: Signal[] = [];
  const scrapedSites: { url: string; success: boolean; content?: string }[] = [];
  const enhancedAssessment = { ...initialAssessment };
  
  // Track what we find across all scraped sites
  let foundAboutPage = false;
  let foundTeamInfo = false;
  let foundContactInfo = false;
  let foundCaseStudies = false;
  let foundPricing = false;
  let foundFounding = false;
  let claimsVerified: string[] = [];
  let claimsContradicted: string[] = [];
  
  // Scrape each URL
  for (const url of urls) {
    try {
      const scrapeUrl = `${SCRAPE_DO_API}?token=${SCRAPE_DO_API_KEY}&url=${encodeURIComponent(url)}`;
      console.log(`Scraping company site: ${url}`);
      
      const response = await fetch(scrapeUrl, {
        method: "GET",
        headers: { "Accept": "text/html" },
      });
      
      if (!response.ok) {
        console.log(`Failed to scrape ${url}: ${response.status}`);
        scrapedSites.push({ url, success: false });
        continue;
      }
      
      const html = await response.text();
      if (!html || html.length < 200) {
        scrapedSites.push({ url, success: false });
        continue;
      }
      
      const siteContent = extractTextFromHtml(html).toLowerCase();
      scrapedSites.push({ url, success: true, content: siteContent.substring(0, 2000) });
      
      // Check for legitimacy indicators
      if (/about\s*(us|our|the)?\s*(company|team|story)?/i.test(siteContent)) foundAboutPage = true;
      if (/team|leadership|founders?|executives?|ceo|cto/i.test(siteContent)) foundTeamInfo = true;
      if (/contact|email|phone|address|headquarters/i.test(siteContent)) foundContactInfo = true;
      if (/case\s*stud(y|ies)|testimonial|client|customer\s*stories/i.test(siteContent)) foundCaseStudies = true;
      if (/pricing|plans?|subscription|cost|quote/i.test(siteContent)) foundPricing = true;
      if (/founded|established|since\s*\d{4}|\d{4}\s*-\s*(present|now)/i.test(siteContent)) foundFounding = true;
      
      // Cross-reference claims from proposal
      // Check if they claim established clients
      const claimedClients = proposalContent.match(/(microsoft|google|amazon|apple|meta|salesforce|fortune\s*500)/gi) || [];
      for (const client of claimedClients) {
        if (siteContent.includes(client.toLowerCase())) {
          claimsVerified.push(`${client} mentioned on website`);
        } else {
          claimsContradicted.push(`${client} claimed but not found on website`);
        }
      }
      
      // Check if they claim awards/recognition
      if (/award|recognized|certified/i.test(proposalContent)) {
        if (/award|recognized|certified|badge|accredit/i.test(siteContent)) {
          claimsVerified.push('Awards/certifications mentioned on website');
        }
      }
      
      // Check for years in business claims
      const yearsMatch = proposalContent.match(/(\d+)\+?\s*years?\s*(of\s+)?(experience|in\s+business)/i);
      if (yearsMatch) {
        const claimedYears = parseInt(yearsMatch[1]);
        const foundedMatch = siteContent.match(/(founded|established|since)\s*:?\s*(\d{4})/i);
        if (foundedMatch) {
          const foundedYear = parseInt(foundedMatch[2]);
          const actualYears = new Date().getFullYear() - foundedYear;
          if (Math.abs(actualYears - claimedYears) <= 2) {
            claimsVerified.push(`Years in business verified (since ${foundedYear})`);
          } else if (actualYears < claimedYears - 2) {
            claimsContradicted.push(`Claims ${claimedYears} years but website shows founded ${foundedYear}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      scrapedSites.push({ url, success: false });
    }
  }
  
  // Update assessment based on deep verification
  const successfulScrapes = scrapedSites.filter(s => s.success).length;
  
  if (successfulScrapes > 0) {
    // Add verification signal
    verificationSignals.push({
      id: crypto.randomUUID(),
      category: 'green',
      title: 'Company Website Verified',
      explanation: `Successfully accessed and analyzed ${successfulScrapes} company website(s) to cross-reference claims.`,
      details: `Scraped: ${scrapedSites.filter(s => s.success).map(s => s.url).join(', ')}`,
      ruleId: 'deep_verification_success',
      domain: 'business',
    });
    
    // Upgrade visibility if we found good indicators
    const legitimacyIndicators = [foundAboutPage, foundTeamInfo, foundContactInfo, foundCaseStudies, foundPricing, foundFounding];
    const indicatorCount = legitimacyIndicators.filter(Boolean).length;
    
    if (indicatorCount >= 4) {
      enhancedAssessment.visibility = 'high';
      enhancedAssessment.publicFootprint.push('Website shows strong legitimacy indicators');
      verificationSignals.push({
        id: crypto.randomUUID(),
        category: 'green',
        title: 'Strong Website Legitimacy',
        explanation: `Company website includes ${indicatorCount}/6 key trust indicators: About page, team info, contact details, case studies, pricing, and founding date.`,
        ruleId: 'website_legitimacy_strong',
        domain: 'business',
      });
    } else if (indicatorCount >= 2) {
      if (enhancedAssessment.visibility === 'unknown' || enhancedAssessment.visibility === 'limited') {
        enhancedAssessment.visibility = 'moderate';
      }
      enhancedAssessment.publicFootprint.push('Website partially verified');
    } else {
      verificationSignals.push({
        id: crypto.randomUUID(),
        category: 'uncertainty',
        title: 'Sparse Company Website',
        explanation: 'Company website lacks key legitimacy indicators (about page, team info, contact details).',
        ruleId: 'website_legitimacy_weak',
        domain: 'business',
      });
    }
    
    // Add verification results
    if (claimsVerified.length > 0) {
      enhancedAssessment.trackRecord = 'verified';
      enhancedAssessment.publicFootprint.push(...claimsVerified.slice(0, 2));
      verificationSignals.push({
        id: crypto.randomUUID(),
        category: 'green',
        title: 'Claims Cross-Referenced',
        explanation: `${claimsVerified.length} claim(s) from the proposal were verified against the company website.`,
        details: claimsVerified.join('; '),
        ruleId: 'claims_verified',
        domain: 'business',
      });
    }
    
    if (claimsContradicted.length > 0) {
      if (enhancedAssessment.trackRecord !== 'concerning') {
        enhancedAssessment.trackRecord = 'concerning';
      }
      enhancedAssessment.flags.push('Discrepancies found during verification');
      verificationSignals.push({
        id: crypto.randomUUID(),
        category: 'risk',
        title: 'Claim Discrepancies Found',
        explanation: `${claimsContradicted.length} claim(s) from the proposal could not be verified or contradicted website content.`,
        details: claimsContradicted.join('; '),
        ruleId: 'claims_contradicted',
        domain: 'business',
        severity: 'high',
      });
    }
    
    // Team/leadership presence
    if (foundTeamInfo) {
      enhancedAssessment.publicFootprint.push('Named team/leadership on website');
    }
    
    // Case studies presence
    if (foundCaseStudies) {
      enhancedAssessment.publicFootprint.push('Case studies available on website');
    }
    
  } else if (urls.length > 0) {
    // Couldn't scrape any sites
    verificationSignals.push({
      id: crypto.randomUUID(),
      category: 'uncertainty',
      title: 'Company Website Unreachable',
      explanation: `Could not access company website(s) for verification: ${urls.join(', ')}`,
      details: 'The website may be offline, blocking automated access, or misconfigured.',
      ruleId: 'deep_verification_failed',
      domain: 'business',
    });
    enhancedAssessment.flags.push('Website could not be verified');
  }
  
  return {
    enhancedAssessment,
    verificationSignals,
    scrapedSites,
  };
}
