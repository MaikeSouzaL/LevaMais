import { Clock, FileText } from "lucide-react";
import type { OperationsSummary, Ride } from "@/services/ridesService";

type OperationsFeedProps = {
  operations: OperationsSummary | null;
  rides: Ride[];
  onOpenNfse: (rideId: string) => void;
};

type FeedEvent = {
  id: string;
  serviceType: string;
  status: string;
  clientName: string;
  pickup: string;
  dropoff: string;
  total: number;
};

function toFallbackEvents(rides: Ride[]): FeedEvent[] {
  return rides.slice(0, 7).map((ride) => ({
    id: ride._id,
    serviceType: ride.serviceType,
    status: ride.status,
    clientName: ride.clientId?.name || "Cliente",
    pickup: ride.pickup?.address || "",
    dropoff: ride.dropoff?.address || "",
    total: Number(ride.pricing?.total || 0),
  }));
}

function getEventStyle(event: FeedEvent) {
  const serviceLabel = event.serviceType === "delivery" ? "Entrega" : "Corrida";
  let labelColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
  let actionDesc = "foi iniciada na plataforma";

  if (event.status === "completed") {
    labelColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    actionDesc = `foi concluída com sucesso. Total: R$ ${Number(event.total || 0).toFixed(2)}`;
  } else if (String(event.status || "").startsWith("cancelled")) {
    labelColor = "bg-rose-50 text-rose-700 border-rose-100";
    actionDesc = "foi cancelada";
  } else if (event.status === "payment_pending") {
    labelColor = "bg-amber-50 text-amber-800 border-amber-100";
    actionDesc = "aguarda confirmação de pagamento";
  } else if (event.status === "in_progress") {
    labelColor = "bg-blue-50 text-blue-700 border-blue-100";
    actionDesc = "está em rota";
  }

  return { serviceLabel, labelColor, actionDesc };
}

export function OperationsFeed({ operations, rides, onOpenNfse }: OperationsFeedProps) {
  const events = operations?.recentEvents?.length ? operations.recentEvents : toFallbackEvents(rides);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex flex-col justify-between">
      <div className="border-b border-gray-100 pb-3 mb-4">
        <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600 animate-spin-slow" />
          Feed Operacional ao Vivo
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Últimas ações e ocorrências registradas no Leva+.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-2">
        {events.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-10 font-semibold">Nenhuma atividade registrada hoje.</p>
        ) : (
          events.slice(0, 7).map((event) => {
            const { serviceLabel, labelColor, actionDesc } = getEventStyle(event);

            return (
              <div key={event.id} className="flex gap-3 text-xs border-b border-gray-100 pb-3 last:border-b-0">
                <div className={`px-2 py-1 rounded-lg border font-bold text-[10px] tracking-wide self-start shrink-0 ${labelColor}`}>
                  {serviceLabel.toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold leading-relaxed">
                    A {serviceLabel.toLowerCase()} de <span className="font-extrabold">{event.clientName}</span> {actionDesc}.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    De: {event.pickup.split(",")[0] || "-"} {"->"} Para: {event.dropoff.split(",")[0] || "-"}
                  </p>
                  {event.status === "completed" && (
                    <button
                      onClick={() => onOpenNfse(event.id)}
                      className="mt-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1.5 transition-colors"
                    >
                      <FileText size={11} />
                      Visualizar NFS-e
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4 text-center">
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-block tracking-wider uppercase">
          {operations?.generatedAt
            ? `Resumo gerado às ${new Date(operations.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Sincronizado via telemetria"}
        </span>
      </div>
    </div>
  );
}
