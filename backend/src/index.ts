import Fastify        from "fastify";
import cors           from "@fastify/cors";
import websocket      from "@fastify/websocket";
import { farmRoutes }       from "./routes/farms.js";
import { zoneRoutes }       from "./routes/zones.js";
import { irrigationRoutes } from "./routes/irrigations.js";
import { setStatusCallback } from "./services/irrigationTimer.js";
import { prisma }           from "./plugins/prisma.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
});

await app.register(websocket);

// ── WebSocket: emitir actualizaciones en tiempo real ──────────────
const wsClients = new Set<any>();

app.get("/ws", { websocket: true }, (socket) => {
  wsClients.add(socket);
  socket.on("close", () => wsClients.delete(socket));
});

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  wsClients.forEach((ws) => {
    try { ws.send(msg); } catch (_) {}
  });
}

setStatusCallback((zoneId, status) => {
  broadcast({ type: "irrigation_status", zoneId, status });
});

// ── Rutas REST ────────────────────────────────────────────────────
app.register(farmRoutes,      { prefix: "/api" });
app.register(zoneRoutes,      { prefix: "/api" });
app.register(irrigationRoutes,{ prefix: "/api" });

app.get("/api/health", async () => ({ status: "ok", ts: new Date() }));

// ── Arranque ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`AgroFlow backend running on :${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
