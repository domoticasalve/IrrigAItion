import type { FastifyInstance } from "fastify";
import { prisma }           from "../plugins/prisma.js";
import { ha }               from "../services/homeAssistant.js";
import { startIrrigation, stopIrrigation, isRunning } from "../services/irrigationTimer.js";
import { z }                from "zod";

const StartBody = z.object({
  durationMinutes: z.number().positive().max(480), // máx 8h
});

export async function irrigationRoutes(app: FastifyInstance) {
  // POST /zones/:zoneId/irrigate  → iniciar riego
  app.post<{ Params: { zoneId: string } }>("/zones/:zoneId/irrigate", async (req, reply) => {
    const { durationMinutes } = StartBody.parse(req.body);
    const zone = await prisma.zone.findUnique({ where: { id: req.params.zoneId } });
    if (!zone) return reply.status(404).send({ error: "Zone not found" });

    // Evitar solapamiento
    const running = await prisma.irrigationEvent.findFirst({
      where: { zoneId: zone.id, status: "running" },
    });
    if (running) return reply.status(409).send({ error: "Already irrigating" });

    const durationMs = durationMinutes * 60 * 1000;
    const event = await prisma.irrigationEvent.create({
      data: { zoneId: zone.id, durationMs, status: "running" },
    });

    await startIrrigation(event.id, zone.id, zone.haEntityId, durationMs);
    reply.status(201).send(event);
  });

  // POST /irrigations/:id/stop  → parar manualmente
  app.post<{ Params: { id: string } }>("/irrigations/:id/stop", async (req, reply) => {
    const event = await prisma.irrigationEvent.findUnique({
      where:   { id: req.params.id },
      include: { zone: true },
    });
    if (!event)              return reply.status(404).send({ error: "Event not found" });
    if (event.status !== "running") return reply.status(409).send({ error: "Not running" });

    await stopIrrigation(event.id, event.zoneId, event.zone.haEntityId, "cancelled");
    return prisma.irrigationEvent.findUnique({ where: { id: event.id } });
  });

  // GET /zones/:zoneId/irrigations  → historial
  app.get<{ Params: { zoneId: string } }>("/zones/:zoneId/irrigations", async (req) => {
    return prisma.irrigationEvent.findMany({
      where:   { zoneId: req.params.zoneId },
      orderBy: { startedAt: "desc" },
      take:    50,
    });
  });

  // GET /zones/:zoneId/status  → estado actual desde HA
  app.get<{ Params: { zoneId: string } }>("/zones/:zoneId/status", async (req, reply) => {
    const zone = await prisma.zone.findUnique({ where: { id: req.params.zoneId } });
    if (!zone) return reply.status(404).send({ error: "Zone not found" });

    const [haState, runningEvent] = await Promise.all([
      ha.getState(zone.haEntityId).catch(() => null),
      prisma.irrigationEvent.findFirst({ where: { zoneId: zone.id, status: "running" } }),
    ]);

    return { haState, runningEvent };
  });
}
