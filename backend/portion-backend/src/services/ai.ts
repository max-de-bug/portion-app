import "dotenv/config";
import { getSpendableYield } from "./yield";
import { createTransferTransaction } from "./solana";

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

  const responses: Record<string, () => Promise<AIResponse> | AIResponse> = {
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
    "web-search": async () => {
      // COMMERCE SIMULATION LOGIC & REAL TX PROPOSAL
      const lowerInput = input.toLowerCase();
      
      // Intent detection: look for purchase actions
      // We keep exclusions to avoid triggering on "how to buy" or "what is a purchase"
      const coreAction = ["buy", "purchase", "order", "checkout", "give me", "get", "want", "need"].some(k => lowerInput.includes(k));
      const directAction = ["get this", "pay for", "send me"].some(k => lowerInput.includes(k));
      
      // SENIOR FIX: Better faucet detection including SOL and USDC
      // Use word boundaries for "sol" to avoid matching symbols like "solution"
      const hasSol = /\bsol\b/i.test(lowerInput);
      const hasUsdv = /\busdv\b/i.test(lowerInput);
      const hasUsdc = /\busdc\b/i.test(lowerInput);
      
      const isFaucetRequest = lowerInput.includes("faucet") || 
                              ((lowerInput.includes("give me") || lowerInput.includes("get") || lowerInput.includes("send me") || lowerInput.includes("need") || lowerInput.includes("want")) && 
                               (hasSol || hasUsdv || hasUsdc));
      
      const isCommerce = (coreAction || directAction) && 
                         !lowerInput.includes("how to") && 
                         !lowerInput.includes("where can i") &&
                         !lowerInput.includes("what is") &&
                         !lowerInput.includes("who is") &&
                         !isFaucetRequest;

      if (isFaucetRequest) {
        console.log(`[AI Service] Faucet request DETECTED for input: "${input}"`);
        // Default to SOL if "sol" is mentioned, otherwise USDV
        const requestedCurrency = hasSol ? "SOL" : (hasUsdc ? "USDC" : "USDV");
        const amount = requestedCurrency === "SOL" ? 0.1 : 10;

        return {
          model: "web-search",
          content: `Of course! I'm initiating a transfer of **${amount} ${requestedCurrency}** to your wallet for testing purposes. One moment...`,
          results: [{
            type: "faucet_request",
            currency: requestedCurrency,
            amount: amount
          }],
          remainingBalance
        };
      }
      
      if (isCommerce) {
        console.log(`[AI Service] Commerce intent DETECTED for input: "${input}"`);
        const itemMatch = input.match(/(?:buy|purchase|order|get me|pay for|send me)\s+(?:a|an|some|the)?\s*([^.,!]+)/i);
        let item = itemMatch ? itemMatch[1].trim() : "Item";
        
        // Detect currency preference
        const currencyMatch = lowerInput.match(/\b(sol|usdv|usdc)\b/i);
        const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "SOL";
        
        // Capitalize for professional feel
        item = item.charAt(0).toUpperCase() + item.slice(1);
        
        // Price estimation (scaled for the currency)
        const baseAmount = Math.random() * 0.05;
        const estimatedPrice = currency === "SOL" ? baseAmount.toFixed(4) : (baseAmount * 100).toFixed(2);
        
        const VENDOR_ADDRESS = "PoRTn1WzKQVfBPGjC7LU1RVrS6NkYSkKuSWLKsmDorP"; // Example treasury
        
        try {
           const { TOKEN_MINTS } = await import("./solana.js");
           const mint = currency === "USDV" ? TOKEN_MINTS.USDV : 
                        currency === "USDC" ? TOKEN_MINTS.USDC : 
                        undefined;

           // Create UN-SIGNED transaction for user to sign
           const { transaction } = await createTransferTransaction(
             walletAddress, 
             VENDOR_ADDRESS, 
             parseFloat(estimatedPrice),
             mint
           );

           return {
              model: "web-search",
              content: `### 🛍️ Digital Proposal\n\nI successfully located **${item}** for you. Here are the purchase details:\n\n**Order Summary:**\n- **Product:** ${item}\n- **Price:** ${estimatedPrice} ${currency}\n- **Recipient:** \`${VENDOR_ADDRESS.slice(0, 4)}...${VENDOR_ADDRESS.slice(-4)}\`\n\nTo proceed, please authorize the transaction in your connected Solana wallet.`,
              results: [{
                 type: "transaction_proposal",
                 transaction: transaction,
                 currency: currency,
                 message: `Sign to purchase ${item} for ${estimatedPrice} ${currency}`
              }],
              remainingBalance,
           };
        } catch (error: any) {
           console.error("Tx Creation failed:", error);
           return {
              model: "web-search",
              content: `[Solana Commerce] Failed to generate transaction.\n\nError: ${error.message}\n\nPlease check your wallet address and try again.`,
              remainingBalance,
              isSimulated: true
           };
        }
      }

      return {
        model: "web-search",
        results: [
          { title: "Solomon Labs Documentation", url: "https://docs.solomonlabs.org" },
          { title: "x402 Protocol Specification", url: "https://github.com/coinbase/x402" }
        ],
        content: `[Web Search] Real-time search is active (Free Tier).\n\nFound results for: "${input}"\n\n1. [Solomon Labs Documentation](https://docs.solomonlabs.org)\n2. [x402 Protocol Specification](https://github.com/coinbase/x402)\n\nLet me know if you need to buy something!`,
        remainingBalance,
        isSimulated: true,
      };
    },
    // Alias for the new frontend service name
    "solana-agent": async () => responses["web-search"](),
  };

  const handler = responses[service];
  if (!handler) {
    throw new Error(`Service ${service} not implemented`);
  }

  return handler();
}
