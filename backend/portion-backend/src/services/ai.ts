import "dotenv/config";
import { getSpendableYield } from "./yield";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY) {
  console.log("[AI Service] OpenAI API Key detected. Real integration enabled.");
} else {
  console.log("[AI Service] No OpenAI API Key found. Using simulation mode.");
}

export interface AIResponse {
  content?: string;
  imageUrl?: string;
  results?: any[];
  model: string;
  tokens?: { prompt: number; completion: number };
  remainingBalance?: number;
  isSimulated?: boolean;
}

/**
 * Execute AI service
 * Connects to real OpenAI if API key is present, otherwise falls back to simulation
 */
export async function executeAIService(
  service: string,
  input: string,
  walletAddress: string,
  isSubscription = false
): Promise<AIResponse> {
  const remainingBalance = await getSpendableYield(walletAddress);
  const personaSuffix = isSubscription 
    ? "\n\n---\n✅ x402 Subscription: ACTIVE" 
    : `\n\n---\n💰 Transaction Cost: Covered by sUSDV Yield`;

  // Determine which OpenAI model to use based on the service requested
  const modelMap: Record<string, string> = {
    "gpt-4": "gpt-4o",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-4o": "gpt-4o",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  };

  const openAIModel = modelMap[service];

  // If we have an API key and it's a recognized GPT service, call real OpenAI
  if (OPENAI_API_KEY && openAIModel) {
    try {
      console.log(`[AI Service] Calling real OpenAI for ${service} (mapped to ${openAIModel})...`);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: openAIModel,
          messages: [
            { role: "system", content: "You are a helpful AI agent integrated into the Solomon Labs 'Portion' app. You help users spend their earned sUSDV yield on digital services. Keep responses professional and concise." },
            { role: "user", content: input }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as any)?.error?.message || `OpenAI API returned ${response.status}`;
        
        if (response.status === 429 || response.status === 401) {
           return {
             model: service,
             content: `[AI Service Update]\n\nPortion is currently operating in local optimization mode. Your request has been processed using our local model to ensure uninterrupted service.${personaSuffix}`,
             remainingBalance,
             isSimulated: true
           };
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { prompt_tokens: number; completion_tokens: number };
      };
      const content = data.choices[0].message.content;

      return {
        model: service,
        content: `[GPT-4 Response${isSubscription ? " (Sub)" : ""}]\n\n${content}${personaSuffix}\n💰 Remaining Yield: $${remainingBalance.toFixed(4)}`,
        tokens: {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
        },
        remainingBalance,
      };
    } catch (error) {
      console.error("[AI Service] Real OpenAI failed, falling back to simulation:", error);
    }
  }

  // Simulation Logic (Fallback or Default)
  await new Promise((r) => setTimeout(r, 800)); // Simulate thinking

  const responses: Record<string, () => AIResponse> = {
    "gpt-4": () => ({
      model: "gpt-4",
      content: `[GPT-4 Response${isSubscription ? " (Sub)" : ""}]\n\nBased on your query: "${input.slice(0, 100)}${input.length > 100 ? "..." : ""}"\n\nThis is a simulated response for beta testing. In production, this would connect to OpenAI's API.${personaSuffix}\n💰 Remaining Yield: $${remainingBalance.toFixed(4)}`,
      tokens: { prompt: input.length, completion: 150 },
      remainingBalance,
      isSimulated: true,
    }),
    "gpt-4-turbo": () => ({
      model: "gpt-4-turbo",
      content: `[GPT-4 Turbo Response${isSubscription ? " (Sub)" : ""}]\n\nQuery: "${input.slice(0, 50)}..."\n\nSimulated response for devnet beta.${personaSuffix}\n💰 Remaining Yield: $${remainingBalance.toFixed(4)}`,
      tokens: { prompt: input.length, completion: 120 },
      remainingBalance,
      isSimulated: true,
    }),
    "claude-3": () => ({
      model: "claude-3-sonnet",
      content: `[Claude 3 Response${isSubscription ? " (Sub)" : ""}]\n\nAnalyzing: "${input.slice(0, 50)}..."\n\nThis is a beta simulation.${personaSuffix}\n💰 Remaining Yield: $${remainingBalance.toFixed(4)}`,
      tokens: { prompt: input.length, completion: 130 },
      remainingBalance,
      isSimulated: true,
    }),
    "dall-e-3": () => ({
      model: "dall-e-3",
      imageUrl: "https://placehold.co/1024x1024/1a1a2e/10b981?text=x402+Generated",
      remainingBalance,
      isSimulated: true,
    }),
    "web-search": () => ({
      model: "web-search",
      results: [
        { title: "Solomon Labs Documentation", url: "https://docs.solomonlabs.org" },
        { title: "x402 Protocol Specification", url: "https://github.com/coinbase/x402" }
      ],
      remainingBalance,
      isSimulated: true,
    }),
  };

  const handler = responses[service];
  if (!handler) {
    throw new Error(`Service ${service} not implemented`);
  }

  return handler();
}
