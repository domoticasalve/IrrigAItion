import type { FastifyInstance } from "fastify";
import { prisma } from "../plugins/prisma.js";
import { z }      from "zod";

const CreateZone = z.object({
  name:       z.string().min(1),
  haEntityId: z.string().min(1),
  color:      z.string().default("#4ade80"),
  posX:       z.number().default(0),
  posZ:       z.number().default(0),
  width:      z.number().positive().default(2),
  depth:      z.number().positive().default(2),
});

export async function zoneRoutes(app: FastifyInstance) {
  // GET /farms/:farmId/zones
  app.get<{ Params: { farmId: string } }>("/farms/:farmId/zones", async (req) => {
    return prisma.zone.findMany({
      where:   { farmId: req.params.farmId },
      orderBy: { createdAt: "asc" },
    });
  });

  // POST /farms/:farmId/zones
  app.post<{ Params: { farmId: string } }>("/farms/:farmId/zones", async (req, reply) => {
    const body = CreateZone.parse(req.body);
    const zone = await prisma.zone.create({
      data: { ...body, farmId: req.params.farmId },
    });
    reply.status(201).send(zone);
  });

  // PUT /zones/:id
  app.put<{ Params: { id: string } }>("/zones/:id", async (req) => {
    const body = CreateZone.partial().parse(req.body);
    return prisma.zone.update({ where: { id: req.params.id }, data: body });
  });

  // DELETE /zones/:id
  app.delete<{ Params: { id: string } }>("/zones/:id", async (_req, reply) => {
    await prisma.zone.delete({ where: { id: _req.params.id } });
    reply.status(204).send();
  });
}
