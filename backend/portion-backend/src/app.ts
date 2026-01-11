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
      // Allow if there's no origin (e.g., local tools) 
      // or if it matches localhost/127.0.0.1 for development
      if (!origin || /localhost|127\.0\.0\.1|::1/.test(origin)) {
        cb(null, true);
        return;
      }
      
      const allowedOrigins = [
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      
      // Still allow but log for debugging if needed
      if (process.env.NODE_ENV === "development") {
        console.warn(`[CORS] Allowing origin despite mismatch: ${origin}`);
        cb(null, true);
        return;
      }

      cb(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Payment", "X-Subscription"],
    credentials: true,
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };
