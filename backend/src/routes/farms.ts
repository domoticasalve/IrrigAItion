import type { FastifyInstance } from "fastify";
import { prisma } from "../plugins/prisma.js";
import { z }      from "zod";

const CreateFarm = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  location:    z.string().optional(),
});

export async function farmRoutes(app: FastifyInstance) {
  // GET /farms
  app.get("/farms", async () => {
    return prisma.farm.findMany({
      include: { zones: true },
      orderBy: { createdAt: "desc" },
    });
  });

  // GET /farms/:id
  app.get<{ Params: { id: string } }>("/farms/:id", async (req, reply) => {
    const farm = await prisma.farm.findUnique({
      where:   { id: req.params.id },
      include: { zones: { include: { irrigations: { orderBy: { startedAt: "desc" }, take: 5 } } } },
    });
    if (!farm) return reply.status(404).send({ error: "Farm not found" });
    return farm;
  });

  // POST /farms
  app.post("/farms", async (req, reply) => {
    const body = CreateFarm.parse(req.body);
    const farm = await prisma.farm.create({ data: body });
    reply.status(201).send(farm);
  });

  // PUT /farms/:id
  app.put<{ Params: { id: string } }>("/farms/:id", async (req, reply) => {
    const body = CreateFarm.partial().parse(req.body);
    const farm = await prisma.farm.update({ where: { id: req.params.id }, data: body });
    return farm;
  });

  // DELETE /farms/:id
  app.delete<{ Params: { id: string } }>("/farms/:id", async (req, reply) => {
    await prisma.farm.delete({ where: { id: req.params.id } });
    reply.status(204).send();
  });
}
