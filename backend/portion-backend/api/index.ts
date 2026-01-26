import Fastify from "fastify";
import app from "../src/app.js";

const fastify = Fastify({
  logger: true,
});

// Register the main application logic
const startPromise = (async () => {
  await fastify.register(app);
  await fastify.ready();
})();

export default async function handler(req: any, res: any) {
  await startPromise;
  fastify.server.emit("request", req, res);
}
