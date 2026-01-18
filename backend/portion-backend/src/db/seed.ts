import { db } from "./index";
import { aiServices } from "./schema";

async function seed() {
  console.log("🌱 Seeding AI Services...");

  const services = [
    {
      id: "gpt-4",
      price: "0.030000",
      platformFee: "0.005000",
      description: "GPT-4 text completion",
    },
    {
      id: "gpt-4-turbo",
      price: "0.010000",
      platformFee: "0.002000",
      description: "GPT-4 Turbo completion",
    },
    {
      id: "claude-3",
      price: "0.025000",
      platformFee: "0.004000",
      description: "Claude 3 Sonnet completion",
    },
    {
      id: "dall-e-3",
      price: "0.040000",
      platformFee: "0.008000",
      description: "DALL-E 3 image generation",
    },
    {
      id: "whisper",
      price: "0.006000",
      platformFee: "0.001000",
      description: "Whisper audio transcription",
    },
    {
      id: "web-search",
      price: "0.000000",
      platformFee: "0.000000",
      description: "Web search",
    },
    {
      id: "solana-agent",
      price: "0.000000",
      platformFee: "0.000000",
      description: "Solana transactions, purchases, and faucet",
    },
  ];

  for (const service of services) {
    await db
      .insert(aiServices)
      .values(service)
      .onConflictDoUpdate({
        target: aiServices.id,
        set: {
          price: service.price,
          platformFee: service.platformFee,
          description: service.description,
        },
      });
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
