import { ha }     from "./homeAssistant.js";
import { prisma }  from "../plugins/prisma.js";

// Map: irrigationEventId → NodeJS.Timeout
const timers = new Map<string, NodeJS.Timeout>();

// Callback emitido a los WebSocket subscribers
type StatusCallback = (zoneId: string, status: "running" | "completed" | "cancelled" | "error") => void;
let _onStatus: StatusCallback = () => {};
export function setStatusCallback(cb: StatusCallback) { _onStatus = cb; }

export async function startIrrigation(
  irrigationId: string,
  zoneId: string,
  entityId: string,
  durationMs: number,
) {
  // Encender electroválvula
  await ha.turnOn(entityId);

  // Programar apagado automático
  const timer = setTimeout(async () => {
    await stopIrrigation(irrigationId, zoneId, entityId, "completed");
  }, durationMs);

  timers.set(irrigationId, timer);
}

export async function stopIrrigation(
  irrigationId: string,
  zoneId: string,
  entityId: string,
  status: "completed" | "cancelled" | "error" = "cancelled",
) {
  // Cancelar timer si existía
  const timer = timers.get(irrigationId);
  if (timer) { clearTimeout(timer); timers.delete(irrigationId); }

  // Apagar electroválvula
  try { await ha.turnOff(entityId); } catch (_) {}

  // Actualizar DB
  await prisma.irrigationEvent.update({
    where: { id: irrigationId },
    data: { endedAt: new Date(), status },
  });

  _onStatus(zoneId, status);
}

export function isRunning(irrigationId: string) {
  return timers.has(irrigationId);
}
