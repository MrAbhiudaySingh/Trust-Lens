// analyze-url: Scrapes a URL using scrape.do and analyzes the content
// Uses deterministic rule engine for pattern detection

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeUrl, sortSignals } from "../_shared/rule-engine.ts";
import { UrlAnalysisResult, ScrapedContent } from "../_shared/types.ts";

const SCRAPE_DO_API = "https://api.scrape.do";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required and must be a string" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get scrape.do API key
    const SCRAPE_DO_API_KEY = Deno.env.get("SCRAPE_DO_API_KEY");
    if (!SCRAPE_DO_API_KEY) {
      console.error("SCRAPE_DO_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Scraping service not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Scrape the URL using scrape.do
    const scrapeUrl = `${SCRAPE_DO_API}?token=${SCRAPE_DO_API_KEY}&url=${encodeURIComponent(url)}&render=false`;
    
    console.log(`Scraping URL: ${url}`);
    
    const scrapeResponse = await fetch(scrapeUrl, {
      method: "GET",
      headers: {
        "Accept": "text/html",
      },
    });

    if (!scrapeResponse.ok) {
      console.error(`Scrape.do error: ${scrapeResponse.status}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to scrape URL (status: ${scrapeResponse.status})` 
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const htmlContent = await scrapeResponse.text();
    
    // Extract text content from HTML (basic extraction)
    const textContent = extractTextFromHtml(htmlContent);
    const pageTitle = extractTitle(htmlContent);

    const scrapedContent: ScrapedContent = {
      url: url,
      title: pageTitle,
      content: textContent,
      statusCode: scrapeResponse.status,
    };

    // Prepare metadata for rule engine
    const metadata = {
      url: url,
      domain: parsedUrl.hostname,
      pageTitle: pageTitle,
      isHttps: parsedUrl.protocol === "https:",
    };

    // Run the deterministic rule engine
    const signals = analyzeUrl(textContent, metadata);
    const sortedSignals = sortSignals(signals);

    const result: UrlAnalysisResult = {
      signals: sortedSignals,
      scrapedContent: scrapedContent,
      metadata: metadata,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-url error:", error);
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
 * Extract readable text from HTML
 * Removes scripts, styles, and HTML tags
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  
  // Remove HTML tags but keep content
  text = text.replace(/<[^>]+>/g, " ");
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  
  // Clean up whitespace
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
