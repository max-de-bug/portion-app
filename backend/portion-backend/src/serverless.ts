import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { join } from "node:path";
import AutoLoad from "@fastify/autoload";

// Create Fastify instance
const fastify = Fastify({
  logger: false, // Disable logging in serverless for performance
});

// Flag to track if plugins are registered
let isReady = false;

// Initialize the app
async function initApp() {
  if (isReady) return;

  // Enable CORS for frontend requests
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

      // In development, allow but log for debugging
      if (process.env.NODE_ENV === "development") {
        console.warn(`[CORS] Allowing origin despite mismatch: ${origin}`);
        cb(null, true);
        return;
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      cb(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Payment",
      "X-Subscription",
    ],
    credentials: true,
  });

  // Load plugins
  await fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: {},
  });

  // Load routes
  await fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: {},
  });

  await fastify.ready();
  isReady = true;
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await initApp();

  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Payment, X-Subscription"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
    return;
  }

  // Forward request to Fastify
  await fastify.ready();
  fastify.server.emit("request", req, res);
}
