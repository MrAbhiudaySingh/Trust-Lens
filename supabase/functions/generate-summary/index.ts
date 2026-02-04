// generate-summary: Uses Lovable AI to create human-readable summaries
// The AI explains what the deterministic rules detected - it does NOT decide risk levels

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { Signal } from "../_shared/types.ts";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signals, inputType, originalInput } = await req.json();

    if (!signals || !Array.isArray(signals)) {
      return new Response(
        JSON.stringify({ error: "Signals array is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Build the summary prompt
    const prompt = buildSummaryPrompt(signals as Signal[], inputType, originalInput);

    // Call Lovable AI
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are Trust Lens, an AI that helps users understand what signals were detected in content they submitted for analysis.

IMPORTANT RULES:
1. You summarize what the rule engine detected - you do NOT make risk judgments
2. You explain how signals might interact or relate to each other
3. You maintain a calm, neutral, informative tone
4. You never tell users what to do - only what to notice
5. You clearly distinguish between risk signals, uncertainty zones, and green flags
6. Keep summaries concise (2-4 sentences)

CRITICAL RULES FOR BUSINESS PROPOSALS:
- NEVER praise "clarity" or "professional tone" when the proposal lacks substance (company name, specific offering, evidence of work)
- If risk signals mention "low substance", "confidence without evidence", or "vague value proposition", your summary MUST acknowledge the lack of concrete details
- DO NOT soften the message. If the proposal is vague, say so directly: "The proposal uses confident language but lacks concrete details" or "This appears speculative and requires significant clarification"
- Professional tone alone is NOT a positive indicator. Tone can be mimicked; substance cannot.

Your philosophy: "Trust Lens doesn't tell you what to do — it shows you what to notice before you decide."`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const aiResponse = await response.json();
    const summary = aiResponse.choices?.[0]?.message?.content || "Unable to generate summary.";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-summary error:", error);
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
 * Build a prompt for the AI to summarize detected signals
 */
function buildSummaryPrompt(signals: Signal[], inputType: string, originalInput: string): string {
  const riskSignals = signals.filter(s => s.category === 'risk');
  const uncertaintySignals = signals.filter(s => s.category === 'uncertainty');
  const greenSignals = signals.filter(s => s.category === 'green');

  const inputDescription = inputType === 'url' 
    ? `a website URL: ${originalInput.substring(0, 100)}` 
    : `a text message (${originalInput.length} characters)`;

  let prompt = `The user submitted ${inputDescription} for analysis. Our rule engine detected the following signals:\n\n`;

  if (riskSignals.length > 0) {
    prompt += `🔴 RISK SIGNALS (${riskSignals.length}):\n`;
    riskSignals.forEach(s => {
      prompt += `- ${s.title}: ${s.explanation}\n`;
    });
    prompt += "\n";
  }

  if (uncertaintySignals.length > 0) {
    prompt += `🟡 UNCERTAINTY ZONES (${uncertaintySignals.length}):\n`;
    uncertaintySignals.forEach(s => {
      prompt += `- ${s.title}: ${s.explanation}\n`;
    });
    prompt += "\n";
  }

  if (greenSignals.length > 0) {
    prompt += `🟢 GREEN FLAGS (${greenSignals.length}):\n`;
    greenSignals.forEach(s => {
      prompt += `- ${s.title}: ${s.explanation}\n`;
    });
    prompt += "\n";
  }

  if (signals.length === 0) {
    prompt += "No specific signals were detected by our rule engine.\n\n";
  }

  prompt += `Please provide a brief, neutral summary (2-4 sentences) that:
1. Mentions the overall mix of signals detected
2. Notes any particularly important patterns or interactions between signals
3. Reminds the user that this is informational - they make the final decision

Do NOT provide a verdict or risk score. Do NOT tell the user what to do.`;

  return prompt;
}
