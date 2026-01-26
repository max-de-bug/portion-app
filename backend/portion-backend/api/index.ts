import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "../src/plugins/sensible.js";
import support from "../src/plugins/support.js";
import root from "../src/routes/root.js";
import api from "../src/routes/api/index.js";
import x402 from "../src/routes/x402/index.js";
import newsletter from "../src/routes/newsletter/index.js";

const fastify = Fastify({
  logger: true,
});

// Setup CORS
const startPromise = (async () => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow if there's no origin (e.g., local tools, server-to-server)
      if (!origin) {
        cb(null, true);
        return;
      }

      // Allow localhost/127.0.0.1 for development
      if (/localhost|127\.0\.0\.1|::1/.test(origin)) {
        cb(null, true);
        return;
      }

      // Allow Vercel deployments (preview and production)
      if (/\.vercel\.app$/.test(origin)) {
        cb(null, true);
        return;
      }

      // Allow explicitly configured frontend URL
      const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      cb(null, true); // Fallback to allowing for now to debug, but log it
      console.warn(`[CORS] Allowing potentially unauthorized origin: ${origin}`);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Payment",
      "X-Subscription",
      "X-Session-Token",
    ],
    credentials: true,
  });

  // Register plugins explicitly
  await fastify.register(sensible);
  await fastify.register(support);

  // Register routes explicitly with correct prefixes
  await fastify.register(root);
  await fastify.register(api, { prefix: "/api" });
  await fastify.register(x402, { prefix: "/x402" });
  await fastify.register(newsletter, { prefix: "/newsletter" });

  await fastify.ready();
})();

export default async function handler(req: any, res: any) {
  await startPromise;
  fastify.server.emit("request", req, res);
}
