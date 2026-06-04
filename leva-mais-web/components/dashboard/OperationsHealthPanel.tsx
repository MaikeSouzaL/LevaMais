import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { OperationsSummary } from "@/services/ridesService";

type OperationHealth = {
  label: string;
  className: string;
  description: string;
};

type OperationsHealthPanelProps = {
  operations: OperationsSummary | null;
  operationHealth: OperationHealth;
};

export function OperationsHealthPanel({ operations, operationHealth }: OperationsHealthPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="font-extrabold text-gray-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Saúde Operacional da Fase C
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Fila, pagamento, motoristas disponíveis e cobertura de rastreamento.
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wide ${operationHealth.className}`}>
            {operationHealth.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <OperationStat label="GPS vencido" value={operations?.drivers.staleLocations ?? 0} />
          <OperationStat label="Rotas cobertas" value={`${operations?.tracking.coveragePct ?? 100}%`} />
          <OperationStat label="Pagamentos pendentes" value={operations?.rides.paymentPending ?? 0} />
          <OperationStat label="Fila envelhecida" value={operations?.rides.waitingRequests ?? 0} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
        <h3 className="font-extrabold text-gray-950 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Alertas
        </h3>
        {!operations?.alerts.length ? (
          <p className="text-xs text-gray-500 font-semibold py-4">{operationHealth.description}</p>
        ) : (
          <div className="space-y-3">
            {operations.alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border ${
                  alert.severity === "critical"
                    ? "bg-red-50 border-red-100 text-red-800"
                    : "bg-amber-50 border-amber-100 text-amber-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black">{alert.title}</p>
                  <span className="text-xs font-black">{alert.value}</span>
                </div>
                <p className="text-[11px] font-semibold opacity-75 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OperationStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-950 mt-1">{value}</p>
    </div>
  );
}
