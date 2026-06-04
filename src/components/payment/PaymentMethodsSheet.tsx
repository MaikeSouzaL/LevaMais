import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  ArrowLeft,
  ShieldCheck,
  Wallet,
  Star,
  XCircle,
  QrCode,
  Tag,
  Banknote,
  CreditCard,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react-native";

export type PaymentMethod = "cash" | "pix" | "card_machine" | "wallet";

export interface PaymentMethodsSheetProps {
  /** Controla a exibição do overlay em tela cheia. */
  visible: boolean;
  /** Método de pagamento selecionado. */
  value: PaymentMethod;
  /** Chamado ao selecionar um método. */
  onChange: (method: PaymentMethod) => void;
  /** Fecha o overlay (botão voltar). */
  onClose: () => void;
  /** Ação do botão "Confirmar pagamento". Padrão: fechar. */
  onConfirm?: () => void;
  /** Subtítulo do header. Ex.: "Escolha como pagar sua corrida". */
  subtitle?: string;
  /** Saldo LevaPay disponível. Padrão: 0. */
  balance?: number;
  /** Valor do desconto ao usar saldo. Padrão: 4. */
  discountAmount?: number;
  /** Ação do botão "Depositar". Padrão: Toast informativo. */
  onDeposit?: () => void;
  /** Ação do card "Adicionar cartão". Padrão: Toast informativo. */
  onAddCard?: () => void;
  /** Preço total da corrida/entrega para verificar suficiência do saldo. */
  totalPrice?: number;
  /** Valor retido em escrow (corridas em andamento). Mostrado como informação. */
  held?: number;
  /** Taxa de cancelamento pendente do cliente. Exibe um aviso quando > 0. */
  pendingDebt?: number;
}

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Tela de seleção de forma de pagamento (overlay em tela cheia).
 * Reutilizada nos fluxos de corrida e entrega. Header sempre 100% branco
 * (incluindo a área da status bar).
 */
export function PaymentMethodsSheet({
  visible,
  value,
  onChange,
  onClose,
  onConfirm,
  subtitle = "Escolha como pagar",
  balance = 0,
  discountAmount = 4,
  onDeposit,
  onAddCard,
  totalPrice = 0,
  held = 0,
  pendingDebt = 0,
}: PaymentMethodsSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const insufficient = balance < totalPrice || balance <= 0;

  const handleDeposit =
    onDeposit ||
    (() => Toast.show({ type: "info", text1: "Depósito via Pix", text2: "Recurso em desenvolvimento." }));

  return (
    <View style={{ position: "absolute", inset: 0, zIndex: 50, elevation: 60, backgroundColor: "#F2F4F7" }}>
      {/* ───── Header 100% branco (inclui a status bar) ───── */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingTop: insets.top + 10,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F3F5",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#F4F5F6", alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a", letterSpacing: -0.3 }}>Formas de pagamento</Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "500", marginTop: 1 }}>{subtitle}</Text>
          </View>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#EDFAF5", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={20} color="#02de95" />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}>
        {/* ───── Aviso de taxa de cancelamento pendente ───── */}
        {pendingDebt > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, backgroundColor: "#FFF1F2", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#FECDD3" }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#f43f5e", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <AlertTriangle size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#be123c" }}>Taxa de cancelamento pendente</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#9f1239", marginTop: 1 }}>
                {formatBRL(pendingDebt)} — será cobrada no seu próximo pedido ou quitada com seu saldo LevaPay.
              </Text>
            </View>
          </View>
        )}

        {/* ───── Card LevaPay ───── */}
        <View style={{ borderRadius: 24, overflow: "hidden", marginBottom: 20, backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}>
          {/* Faixa verde do topo */}
          <View style={{ backgroundColor: "#02de95", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.15)", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                  <Wallet size={17} color="#fff" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#0f172a", letterSpacing: 0.3 }}>LevaPay</Text>
              </View>
              <View style={{ backgroundColor: "rgba(0,0,0,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: "row", alignItems: "center" }}>
                <Star size={10} color="#0f172a" fill="#0f172a" />
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#0f172a", marginLeft: 4 }}>Recomendado</Text>
              </View>
            </View>
          </View>

          {/* Card flutuante do saldo */}
          <View style={{ marginHorizontal: 14, marginTop: -22, marginBottom: 14 }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#F0F2F5", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Saldo disponível</Text>
                  <Text style={{ fontSize: 28, fontWeight: "900", color: "#0f172a", marginTop: 2 }}>{formatBRL(balance)}</Text>
                  {insufficient && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <XCircle size={13} color="#f43f5e" />
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#f43f5e", marginLeft: 4 }}>Saldo insuficiente</Text>
                    </View>
                  )}
                  {held > 0 && (
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#94a3b8", marginTop: 4 }}>
                      {formatBRL(held)} retido em corridas em andamento
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleDeposit}
                  activeOpacity={0.9}
                  style={{ backgroundColor: "#0f172a", borderRadius: 14, paddingHorizontal: 14, height: 44, flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <QrCode size={16} color="#02de95" />
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#02de95" }}>Depositar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Banner de desconto */}
          <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 14, marginBottom: 16, backgroundColor: "#EDFAF5", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Tag size={13} color="#fff" />
            </View>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: "#059669" }}>
              Economize {formatBRL(discountAmount)} usando seu saldo LevaPay
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginLeft: 2 }}>Pague ao motorista</Text>

        <PayOption
          selected={value === "wallet"}
          disabled={insufficient}
          onPress={() => {
            if (insufficient) {
              Toast.show({
                type: "error",
                text1: "Saldo insuficiente",
                text2: "Você precisa depositar saldo primeiro antes de continuar.",
              });
            } else {
              onChange("wallet");
            }
          }}
          iconBg="#02de95"
          iconEl={<Wallet size={20} color="#fff" />}
          title="Saldo LevaPay"
          subtitle={insufficient ? "Adicione saldo para pagar" : `${formatBRL(balance)} disponível`}
          badge={insufficient ? undefined : "LevaPay"}
        />
        <View style={{ height: 10 }} />

        <PayOption
          selected={value === "pix"}
          onPress={() => onChange("pix")}
          iconBg="#02de95"
          iconEl={<QrCode size={20} color="#fff" />}
          title="Pix"
          subtitle="Pague via Pix direto ao motorista no fim"
        />
        <View style={{ height: 10 }} />

        <PayOption
          selected={value === "cash"}
          onPress={() => onChange("cash")}
          iconBg="#f59e0b"
          iconEl={<Banknote size={20} color="#fff" />}
          title="Dinheiro"
          subtitle="Pague em espécie ao final da viagem"
        />
        <View style={{ height: 10 }} />
        <PayOption
          selected={value === "card_machine"}
          onPress={() => onChange("card_machine")}
          iconBg="#f97316"
          iconEl={<CreditCard size={20} color="#fff" />}
          title="Maquininha de cartão"
          subtitle="Crédito ou débito na maquininha"
        />
      </ScrollView>

      {/* ───── Rodapé ───── */}
      <View style={{ backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16), borderTopWidth: 1, borderTopColor: "#F1F3F5" }}>
        <TouchableOpacity
          onPress={() => {
            if (value === "wallet" && insufficient) {
              Toast.show({
                type: "error",
                text1: "Saldo insuficiente",
                text2: "Você precisa depositar saldo primeiro antes de continuar.",
              });
              return;
            }
            if (onConfirm) onConfirm();
            else onClose();
          }}
          activeOpacity={0.9}
          style={{ backgroundColor: "#02de95", borderRadius: 18, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#02de95", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
        >
          <CheckCircle2 size={22} color="#0f172a" />
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#0f172a", marginLeft: 8 }}>Confirmar pagamento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Linha de opção de pagamento selecionável. */
function PayOption({
  selected,
  onPress,
  iconBg,
  iconEl,
  title,
  subtitle,
  badge,
  disabled,
}: {
  selected: boolean;
  onPress: () => void;
  iconBg: string;
  iconEl: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.85}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: selected ? "#EDFAF5" : "#fff",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? "#02de95" : "#EEF0F3",
        shadowColor: "#0f172a",
        shadowOpacity: selected ? 0 : 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: selected ? 0 : 1,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        {iconEl}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e293b" }}>{title}</Text>
          {badge && (
            <View style={{ marginLeft: 8, backgroundColor: "#02de95", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#0f172a" }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{subtitle}</Text>
      </View>

      {selected ? (
        <CheckCircle2 size={26} color="#02de95" style={{ opacity: disabled ? 0.4 : 1 }} />
      ) : (
        <Circle size={26} color="#d1d5db" style={{ opacity: disabled ? 0.4 : 1 }} />
      )}
    </TouchableOpacity>
  );
}

export default PaymentMethodsSheet;
