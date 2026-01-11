import { FastifyPluginAsync } from "fastify";
import { db } from "../../db";
import { waitlist } from "../../db/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "../../services/email";

const newsletterRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: { email: string };
  }>("/subscribe", async (request, reply) => {
    const { email } = request.body;

    if (!email || !email.includes("@")) {
      return reply.status(400).send({ error: "Invalid email address" });
    }

    try {
      // Check if already exists
      const existing = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, email))
        .limit(1);

      if (existing.length > 0) {
        return reply.send({ success: true, message: "Already subscribed" });
      }

      // Insert new
      await db.insert(waitlist).values({ email });

      console.log(`[Newsletter] New subscription: ${email}`);
      
      // Send welcome email (async, don't block response)
      sendWelcomeEmail(email).catch(err => {
        console.error("[Newsletter] Failed to send welcome email:", err);
      });

      return reply.send({ success: true, message: "Subscription successful" });
    } catch (error) {
      console.error("[Newsletter] Subscription error:", error);
      // If DB is not connected, fallback to success for UX but log it
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Internal/Admin: List all participants
  fastify.get("/participants", async (request, reply) => {
    // In production, add auth here
    try {
      const all = await db.select().from(waitlist);
      return reply.send({ participants: all });
    } catch (error) {
      return reply.status(500).send({ error: "Could not fetch participants" });
    }
  });
};

export default newsletterRoutes;
