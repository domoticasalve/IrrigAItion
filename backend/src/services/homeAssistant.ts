const HA_URL   = process.env.HA_URL!;
const HA_TOKEN = process.env.HA_TOKEN!;

async function callService(domain: string, service: string, entityId: string) {
  const url = `${HA_URL}/api/services/${domain}/${service}`;
  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${HA_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ entity_id: entityId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HA error ${res.status}: ${text}`);
  }
  return res.json();
}

export const ha = {
  turnOn:  (entityId: string) => callService("switch", "turn_on",  entityId),
  turnOff: (entityId: string) => callService("switch", "turn_off", entityId),

  async getState(entityId: string) {
    const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
      headers: { "Authorization": `Bearer ${HA_TOKEN}` },
    });
    if (!res.ok) throw new Error(`HA getState ${res.status}`);
    return res.json() as Promise<{ state: string; last_updated: string }>;
  },
};
