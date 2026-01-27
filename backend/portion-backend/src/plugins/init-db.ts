import fp from "fastify-plugin";
import { db } from "../db/index.js";
import { aiServices } from "../db/schema.js";
import { count } from "drizzle-orm";

/**
 * Database Initialization Plugin
 * 
 * Ensures that critical data like AI service definitions are present 
 * in the database on startup. This allows for a self-healing system 
 * that doesn't require manual seeding.
 */
export default fp(async (fastify) => {
  try {
    const [serviceCount] = await db.select({ value: count() }).from(aiServices);
    
    if (serviceCount.value === 0) {
      console.log("[Database] No AI services found. Auto-seeding default services...");
      
      const defaultServices = [
        {
          id: "gpt-4",
          price: "0.030000",
          platformFee: "0.005000",
          description: "Advanced reasoning and complex problem solving.",
          category: "text",
          pricingScheme: "pay-per-use",
          prepaidDiscount: 10,
        },
        {
          id: "gpt-4-turbo",
          price: "0.010000",
          platformFee: "0.002000",
          description: "Fast, efficient responses for daily tasks.",
          category: "text",
          pricingScheme: "pay-per-use",
          prepaidDiscount: 10,
        },
        {
          id: "claude-3",
          price: "0.025000",
          platformFee: "0.004000",
          description: "Nuanced conversation and technical writing.",
          category: "text",
          pricingScheme: "pay-per-use",
          prepaidDiscount: 10,
        },
        {
          id: "dall-e-3",
          price: "0.040000",
          platformFee: "0.008000",
          description: "High-quality image generation from text.",
          category: "image",
          pricingScheme: "pay-per-use",
          prepaidDiscount: 10,
        },
        {
          id: "whisper",
          price: "0.006000",
          platformFee: "0.001000",
          description: "Accurate audio transcription and translation.",
          category: "audio",
          pricingScheme: "pay-per-use",
          prepaidDiscount: 10,
        },
        {
          id: "solana-agent",
          price: "0.000000",
          platformFee: "0.000000",
          description: "Solana transactions, purchases, and test token faucet.",
          category: "search",
          pricingScheme: "pay-per-use",
          prepaidDiscount: 0,
        }
      ];

      for (const service of defaultServices) {
        await db.insert(aiServices).values(service);
        console.log(`[Database] Seeded service: ${service.id}`);
      }
      
      console.log("[Database] Auto-seeding complete.");
    } else {
      console.log(`[Database] Found ${serviceCount.value} AI services. Skipping auto-seed.`);
    }
  } catch (error) {
    console.error("[Database] Failed to check/seed AI services:", error);
  }
});
