"use client";

import { useEffect, useState } from "react";
import { X, FileText, Printer, ShieldCheck, Landmark } from "lucide-react";
import { ridesService } from "@/services/ridesService";

interface NfseModalProps {
  rideId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NfseModal({ rideId, isOpen, onClose }: NfseModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !rideId) return;

    let active = true;
    setLoading(true);
    setError(null);

    ridesService.getNfse(rideId)
      .then((res) => {
        if (active) {
          if (res.success && res.nfse) {
            setData(res.nfse);
          } else {
            setError("Não foi possível carregar os dados da NFS-e simulada.");
          }
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || "Erro na comunicação com o servidor.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, rideId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Recibo Fiscal Simulado (NFS-e)</h2>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[80vh] print:max-h-none print:p-0 print:overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Gerando nota fiscal eletrônica simulada...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
                <X className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Erro ao carregar recibo fiscal</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
            </div>
          ) : !data ? null : (
            
            /* NFS-e Layout (A4 style) */
            <div className="bg-white border-2 border-slate-800 p-6 font-mono text-slate-900 shadow-sm max-w-[21cm] mx-auto print:border-0 print:p-0">
              
              {/* Top Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-slate-800 pb-4 gap-4 items-center">
                <div className="md:col-span-1 flex flex-col items-center justify-center border-r-0 md:border-r-2 border-slate-800 pr-2 text-center">
                  <Landmark className="w-12 h-12 text-slate-800 mb-1" />
                  <span className="text-[10px] font-bold">PREFEITURA MUNICIPAL SIMULADA</span>
                </div>
                <div className="md:col-span-2 text-center flex flex-col justify-center">
                  <h1 className="text-md font-black tracking-tight">NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e</h1>
                  <span className="text-xs font-bold bg-slate-100 border border-slate-300 py-0.5 px-2 rounded mt-1.5 self-center">
                    LEVA+ TRANSPORTE E TECNOLOGIA
                  </span>
                </div>
                <div className="md:col-span-1 flex flex-col text-xs font-bold pl-0 md:pl-4 justify-center border-l-0 md:border-l-2 border-slate-800">
                  <div>Nº da Nota: <span className="text-slate-600">{data.number}</span></div>
                  <div className="mt-1">Emissão: <span className="text-slate-600">{data.issuedAt}</span></div>
                  <div className="mt-1">Cod. Verif: <span className="text-slate-600 font-bold">{data.verificationCode}</span></div>
                </div>
              </div>

              {/* Prestador */}
              <div className="border-b-2 border-slate-800 py-3 text-xs">
                <div className="font-black text-slate-900 uppercase tracking-wider mb-2 border-b border-dashed border-slate-400 pb-1">
                  1. PRESTADOR DE SERVIÇOS
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-semibold">
                  <div>Nome/Razão Social: <span className="text-slate-700 font-normal">{data.provider.name}</span></div>
                  <div>CPF/CNPJ: <span className="text-slate-700 font-normal">{data.provider.cpf}</span></div>
                  <div>Telefone: <span className="text-slate-700 font-normal">{data.provider.phone}</span></div>
                  <div>Atividade: <span className="text-slate-700 font-normal">{data.provider.role}</span></div>
                </div>
              </div>

              {/* Tomador */}
              <div className="border-b-2 border-slate-800 py-3 text-xs">
                <div className="font-black text-slate-900 uppercase tracking-wider mb-2 border-b border-dashed border-slate-400 pb-1">
                  2. TOMADOR DE SERVIÇOS
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-semibold">
                  <div>Nome/Razão Social: <span className="text-slate-700 font-normal">{data.taker.name}</span></div>
                  <div>CPF/CNPJ: <span className="text-slate-700 font-normal">{data.taker.cpf}</span></div>
                  <div className="md:col-span-2">E-mail: <span className="text-slate-700 font-normal">{data.taker.email}</span></div>
                </div>
              </div>

              {/* Descriminação dos Serviços */}
              <div className="border-b-2 border-slate-800 py-4 text-xs">
                <div className="font-black text-slate-900 uppercase tracking-wider mb-2 border-b border-dashed border-slate-400 pb-1">
                  3. DISCRIMINAÇÃO DOS SERVIÇOS
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {data.serviceDescription}
                </p>
              </div>

              {/* Detalhes Financeiros */}
              <div className="border-b-2 border-slate-800 py-3 text-xs">
                <div className="font-black text-slate-900 uppercase tracking-wider mb-2 border-b border-dashed border-slate-400 pb-1">
                  4. VALORES E IMPOSTOS
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center border border-slate-300 p-3 rounded-lg bg-slate-50">
                  <div className="border-r border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Valor do Serviço</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">R$ {Number(data.financial.totalValue).toFixed(2)}</div>
                  </div>
                  <div className="border-r border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Base de Cálculo</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">R$ {Number(data.financial.calculationBase).toFixed(2)}</div>
                  </div>
                  <div className="border-r border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Alíquota ISS</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">{data.financial.issRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Valor do ISS</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">R$ {Number(data.financial.issValue).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Intermediário / Rodapé da NFS-e */}
              <div className="pt-3 text-[10px] text-slate-500 leading-relaxed font-semibold flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span>Intermediador do Serviço: <span className="text-slate-800">{data.intermediary.name} (CNPJ: {data.intermediary.cnpj})</span></span>
                  <span>{data.intermediary.city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200/50 py-1.5 px-3 rounded-lg self-start">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Documento simulado para fins fiscais internos da plataforma Leva+ (Homologação: {data.status})</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
