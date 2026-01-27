import Fastify from "fastify";
import app from "../src/app.js";

const fastify = Fastify({
  logger: true,
});

// Register the main application logic with error handling
const startPromise = (async () => {
  try {
    await fastify.register(app);
    await fastify.ready();
    console.log("[Backend] Server successfully initialized.");
  } catch (err) {
    console.error("[Backend] Critical initialization failure:", err);
    // We don't rethrow here to allow the handler to catch it and return a 500
    return err;
  }
})();

export default async function handler(req: any, res: any) {
  const initError = await startPromise;
  if (initError instanceof Error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: "Backend failed to initialize. Check if DATABASE_URL is correct.",
      details: initError.message
    }));
    return;
  }
  fastify.server.emit("request", req, res);
}
