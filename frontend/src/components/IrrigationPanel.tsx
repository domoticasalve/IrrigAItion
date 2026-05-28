import { useState, useEffect } from "react";
import { api, Zone, IrrigationEvent } from "../api/client";

interface Props {
  zone: Zone;
  onClose: () => void;
  onIrrigationChange: (zoneId: string, running: boolean, eventId?: string) => void;
}

const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export default function IrrigationPanel({ zone, onClose, onIrrigationChange }: Props) {
  const [duration, setDuration]         = useState(15);
  const [status, setStatus]             = useState<"idle" | "loading" | "running">("idle");
  const [runningEvent, setRunningEvent] = useState<IrrigationEvent | null>(null);
  const [elapsed, setElapsed]           = useState(0);
  const [history, setHistory]           = useState<IrrigationEvent[]>([]);
  const [error, setError]               = useState<string | null>(null);

  // Cargar estado actual y historial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stat, hist] = await Promise.all([
          api.irrigations.status(zone.id),
          api.irrigations.history(zone.id),
        ]);
        if (cancelled) return;
        if (stat.runningEvent) {
          setRunningEvent(stat.runningEvent);
          setStatus("running");
          onIrrigationChange(zone.id, true, stat.runningEvent.id);
        }
        setHistory(hist);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [zone.id]);

  // Contador regresivo
  useEffect(() => {
    if (status !== "running" || !runningEvent) return;
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - new Date(runningEvent.startedAt).getTime();
      setElapsed(elapsedMs);
      if (elapsedMs >= runningEvent.durationMs) {
        setStatus("idle");
        setRunningEvent(null);
        onIrrigationChange(zone.id, false);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [status, runningEvent]);

  const handleStart = async () => {
    setError(null);
    setStatus("loading");
    try {
      const event = await api.irrigations.start(zone.id, duration);
      setRunningEvent(event);
      setStatus("running");
      setElapsed(0);
      onIrrigationChange(zone.id, true, event.id);
    } catch (e: any) {
      setError(e.message);
      setStatus("idle");
    }
  };

  const handleStop = async () => {
    if (!runningEvent) return;
    setStatus("loading");
    try {
      await api.irrigations.stop(runningEvent.id);
      setStatus("idle");
      setRunningEvent(null);
      onIrrigationChange(zone.id, false);
    } catch (e: any) {
      setError(e.message);
      setStatus("running");
    }
  };

  const remaining = runningEvent
    ? Math.max(0, runningEvent.durationMs - elapsed)
    : 0;
  const progress = runningEvent
    ? Math.min(100, (elapsed / runningEvent.durationMs) * 100)
    : 0;
  const fmtMs = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-lg p-5 w-80 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: zone.color }} />
          <span className="font-semibold text-on-surface">{zone.name}</span>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="text-xs text-on-surface-variant font-mono bg-surface-container px-2 py-1 rounded">
        {zone.haEntityId}
      </div>

      {/* Estado corriendo */}
      {status === "running" && runningEvent && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-secondary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              Regando…
            </span>
            <span className="font-mono text-on-surface">{fmtMs(remaining)}</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={handleStop}
            className="w-full py-2 rounded-lg border border-error text-error text-sm font-semibold hover:bg-error-container transition-colors"
          >
            Detener riego
          </button>
        </div>
      )}

      {/* Selector duración + botón iniciar */}
      {status === "idle" && (
        <>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
              Duración
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors
                    ${duration === d
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

          <button
            onClick={handleStart}
            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-semibold text-sm
                       flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">water_drop</span>
            Regar {duration} min
          </button>
        </>
      )}

      {status === "loading" && (
        <div className="flex items-center justify-center py-4 gap-2 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined animate-spin">refresh</span>
          Conectando con Home Assistant…
        </div>
      )}

      {/* Historial reciente */}
      {history.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            Últimos riegos
          </div>
          <div className="flex flex-col gap-1">
            {history.slice(0, 3).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{new Date(ev.startedAt).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium
                  ${ev.status === "completed" ? "bg-primary-fixed text-primary" :
                    ev.status === "running"   ? "bg-secondary-container text-on-secondary" :
                    "bg-surface-container text-on-surface-variant"}`}>
                  {ev.status === "completed" ? `${Math.round(ev.durationMs / 60000)} min` : ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
