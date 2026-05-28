const BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type Farm = {
  id: string; name: string; description?: string; location?: string;
  createdAt: string; zones: Zone[];
};
export type Zone = {
  id: string; farmId: string; name: string; haEntityId: string;
  color: string; posX: number; posZ: number; width: number; depth: number;
};
export type IrrigationEvent = {
  id: string; zoneId: string; startedAt: string; endedAt?: string;
  durationMs: number; status: string;
};

export const api = {
  farms: {
    list:   ()               => request<Farm[]>("/farms"),
    get:    (id: string)     => request<Farm>(`/farms/${id}`),
    create: (body: Partial<Farm>) => request<Farm>("/farms", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Farm>) => request<Farm>(`/farms/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string)     => request<void>(`/farms/${id}`, { method: "DELETE" }),
  },
  zones: {
    list:   (farmId: string) => request<Zone[]>(`/farms/${farmId}/zones`),
    create: (farmId: string, body: Partial<Zone>) =>
      request<Zone>(`/farms/${farmId}/zones`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Zone>) =>
      request<Zone>(`/zones/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string)     => request<void>(`/zones/${id}`, { method: "DELETE" }),
  },
  irrigations: {
    start:   (zoneId: string, durationMinutes: number) =>
      request<IrrigationEvent>(`/zones/${zoneId}/irrigate`, {
        method: "POST", body: JSON.stringify({ durationMinutes }),
      }),
    stop:    (eventId: string) =>
      request<IrrigationEvent>(`/irrigations/${eventId}/stop`, { method: "POST" }),
    history: (zoneId: string)  => request<IrrigationEvent[]>(`/zones/${zoneId}/irrigations`),
    status:  (zoneId: string)  =>
      request<{ haState: any; runningEvent: IrrigationEvent | null }>(`/zones/${zoneId}/status`),
  },
};
