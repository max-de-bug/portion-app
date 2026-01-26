import "dotenv/config";
import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import cors from "@fastify/cors";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
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
      const allowedOrigins = [
        process.env.FRONTEND_URL,
      ].filter(Boolean);

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
    allowedHeaders: ["Content-Type", "Authorization", "X-Payment", "X-Subscription", "X-Session-Token"],
    credentials: true,
  });

  // This loads all plugins defined in plugins
  await fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  await fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };
