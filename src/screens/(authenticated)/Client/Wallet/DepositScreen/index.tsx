import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  CreditCard,
  Info,
  Loader2,
  Lock,
  QrCode,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import depositService, {
  type DepositProvider,
  type PixDepositResult,
  type StripeDepositIntent,
} from "@/services/deposit.service";

/**
 * Tela de deposito no saldo LevaPay.
 *  - Pix: QR + copia-cola com polling 4s ate status = paid.
 *  - Stripe: PaymentIntent pre-pronto. Hoje usa <MockCardForm />; quando o
 *    @stripe/stripe-react-native entrar, basta trocar o mock pelo <CardField />
 *    e chamar confirmPayment() do SDK.
 */
type Step =
  | "select_amount"
  | "select_method"
  | "processing_pix"
  | "processing_stripe"
  | "success"
  | "error";

const DEFAULT_SUGGESTIONS = [30, 50, 100, 200];

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function maskCentsToBRL(raw: string) {
  // "5000" -> "50,00"  |  "" -> ""
  const d = onlyDigits(raw).slice(0, 9);
  if (!d) return "";
  const cents = parseInt(d, 10);
  const reais = Math.floor(cents / 100);
  const c = cents % 100;
  return reais.toString() + "," + c.toString().padStart(2, "0");
}

export default function DepositScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const onSuccess = route?.params?.onSuccess;
  const defaultAmount: number | undefined = route?.params?.defaultAmount;
  const suggestions: number[] =
    route?.params?.suggestedAmounts ?? DEFAULT_SUGGESTIONS;

  const [step, setStep] = useState<Step>("select_amount");
  const [amountText, setAmountText] = useState<string>(
    defaultAmount ? maskCentsToBRL(String(Math.round(defaultAmount * 100))) : "",
  );
  const [provider, setProvider] = useState<DepositProvider | null>(null);
  const [pixData, setPixData] = useState<PixDepositResult | null>(null);
  const [stripeIntent, setStripeIntent] = useState<StripeDepositIntent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amount = useMemo(() => {
    const cents = onlyDigits(amountText);
    return cents ? parseInt(cents, 10) / 100 : 0;
  }, [amountText]);

  const minAmount = 5;
  const maxAmount = 2000;
  const amountValid = amount >= minAmount && amount <= maxAmount;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleContinue = () => {
    if (!amountValid) {
      Toast.show({
        type: "error",
        text1: "Valor invalido",
        text2: `Informe entre ${formatBRL(minAmount)} e ${formatBRL(maxAmount)}.`,
      });
      return;
    }
    setStep("select_method");
  };

  const handleSelectProvider = async (p: DepositProvider) => {
    setProvider(p);
    setErrorMsg(null);
    setBusy(true);
    try {
      if (p === "pix") {
        const pix = await depositService.createPixDeposit(amount);
        setPixData(pix);
        setStep("processing_pix");
        startPixPolling(pix.transactionId);
      } else {
        const intent = await depositService.createStripeIntent(amount, "brl");
        setStripeIntent(intent);
        setStep("processing_stripe");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Falha ao iniciar o deposito.");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const startPixPolling = (txId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await depositService.getPixDepositStatus(txId);
        if (status.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("success");
          onSuccess?.();
        } else if (status.status === "expired" || status.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setErrorMsg(
            status.status === "expired"
              ? "QR Code expirado. Tente novamente."
              : "Pagamento nao confirmado.",
          );
          setStep("error");
        }
      } catch {
        /* silenciado */
      }
    }, 4000);
  };

  const handleStripePay = async () => {
    if (!stripeIntent) return;
    setBusy(true);
    try {
      const result = await depositService.confirmStripePayment(stripeIntent.paymentIntentId);
      if (result.status === "succeeded") {
        setStep("success");
        onSuccess?.();
      } else if (result.status === "processing") {
        Toast.show({ type: "info", text1: "Processando...", text2: "Vamos avisar assim que confirmar." });
      } else {
        setErrorMsg(result.message ?? "Pagamento nao autorizado.");
        setStep("error");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Falha ao confirmar pagamento.");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData) return;
    try {
      // @ts-ignore - expo-clipboard pode nao estar instalado
      const Clipboard = await import("expo-clipboard").catch(() => null);
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(pixData.pixCode);
        Toast.show({ type: "success", text1: "Codigo PIX copiado!" });
      } else {
        await Share.share({ message: pixData.pixCode });
      }
    } catch {}
  };

  const handleBack = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (step === "select_method") {
      setStep("select_amount");
      setProvider(null);
    } else if (step === "processing_pix" || step === "processing_stripe" || step === "error") {
      setStep("select_method");
      setPixData(null);
      setStripeIntent(null);
      setErrorMsg(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#EEF1F4",
        }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: "#F1F4F7",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ChevronLeft size={22} color="#0F172A" strokeWidth={2.4} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 }}>
            Depositar no LevaPay
          </Text>
          <Text style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>
            Escolha um valor e um metodo de pagamento
          </Text>
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: "#ECFDF5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wallet size={20} color="#059669" strokeWidth={2.4} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "select_amount" && (
            <AmountStep
              amountText={amountText}
              onChangeAmount={setAmountText}
              suggestions={suggestions}
              amount={amount}
              amountValid={amountValid}
              minAmount={minAmount}
              maxAmount={maxAmount}
              onContinue={handleContinue}
            />
          )}

          {step === "select_method" && (
            <MethodStep amount={amount} busy={busy} onSelect={handleSelectProvider} />
          )}

          {step === "processing_pix" && pixData && (
            <PixProcessingStep data={pixData} onCopy={handleCopyPix} />
          )}

          {step === "processing_stripe" && stripeIntent && (
            <StripeProcessingStep
              intent={stripeIntent}
              amount={amount}
              busy={busy}
              onPay={handleStripePay}
            />
          )}

          {step === "success" && (
            <SuccessStep
              amount={amount}
              provider={provider}
              onDone={() => {
                onSuccess?.();
                navigation.goBack();
              }}
            />
          )}

          {step === "error" && (
            <ErrorStep
              message={errorMsg}
              onRetry={() => {
                setErrorMsg(null);
                if (provider) handleSelectProvider(provider);
                else setStep("select_method");
              }}
              onChangeMethod={() => {
                setErrorMsg(null);
                setStep("select_method");
              }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================================================
// Subcomponentes
// =============================================================================

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EEF1F4",
        shadowColor: "#0F172A",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

// --- Etapa 1: valor ---------------------------------------------------------

function AmountStep(props: {
  amountText: string;
  onChangeAmount: (v: string) => void;
  suggestions: number[];
  amount: number;
  amountValid: boolean;
  minAmount: number;
  maxAmount: number;
  onContinue: () => void;
}) {
  return (
    <View>
      <Card style={{ padding: 20, marginTop: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: "#ECFDF5",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Sparkles size={22} color="#059669" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 }}>
              Adicione saldo ao LevaPay
            </Text>
            <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              Use em corridas e entregas. Sem taxa via Pix.
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: "#64748B",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Valor do deposito
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: props.amountValid || props.amount === 0 ? "#E2E8F0" : "#FECACA",
            backgroundColor: "#F8FAFC",
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#94A3B8", marginRight: 10 }}>
            R$
          </Text>
          <TextInput
            value={props.amountText}
            onChangeText={(v) => props.onChangeAmount(maskCentsToBRL(v))}
            keyboardType="numeric"
            placeholder="0,00"
            placeholderTextColor="#CBD5E1"
            style={{
              flex: 1,
              fontSize: 34,
              fontWeight: "900",
              color: "#0F172A",
              letterSpacing: -0.5,
              paddingVertical: 0,
            }}
            selectionColor="#059669"
          />
          {props.amountText.length > 0 && (
            <Pressable
              onPress={() => props.onChangeAmount("")}
              hitSlop={10}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#E2E8F0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#475569" strokeWidth={2.6} />
            </Pressable>
          )}
        </View>

        <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 8, marginLeft: 2 }}>
          Min. {formatBRL(props.minAmount)} - Max. {formatBRL(props.maxAmount)}
        </Text>
      </Card>

      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: "#64748B",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginTop: 20,
          marginBottom: 10,
          marginLeft: 4,
        }}
      >
        Valores sugeridos
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
        {props.suggestions.map((s) => {
          const active = Math.abs(props.amount - s) < 0.001;
          return (
            <Pressable
              key={s}
              onPress={() => props.onChangeAmount(maskCentsToBRL(String(s * 100)))}
              style={{
                minWidth: "47%",
                flexGrow: 1,
                margin: 4,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: active ? "#ECFDF5" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: active ? "#10B981" : "#EEF1F4",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              {active && (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#10B981",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: active ? "#047857" : "#0F172A",
                  letterSpacing: -0.1,
                }}
              >
                {formatBRL(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ marginTop: 18, padding: 14, flexDirection: "row" }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: "#FEF3C7",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Zap size={18} color="#D97706" strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }}>
            Desconto de ate 10% nas corridas
          </Text>
          <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Usando saldo LevaPay voce paga menos nas viagens.
          </Text>
        </View>
      </Card>

      <Pressable
        onPress={props.onContinue}
        disabled={!props.amountValid}
        style={{
          marginTop: 22,
          height: 56,
          borderRadius: 18,
          backgroundColor: props.amountValid ? "#02DE95" : "#CBD5E1",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          shadowColor: "#02DE95",
          shadowOpacity: props.amountValid ? 0.35 : 0,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: props.amountValid ? 4 : 0,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A", letterSpacing: -0.2 }}>
          Continuar
        </Text>
        <ArrowRight size={20} color="#0F172A" strokeWidth={2.8} style={{ marginLeft: 8 }} />
      </Pressable>
    </View>
  );
}

// --- Etapa 2: metodo --------------------------------------------------------

function MethodStep(props: {
  amount: number;
  busy: boolean;
  onSelect: (p: DepositProvider) => void;
}) {
  return (
    <View>
      <Card style={{ padding: 18, alignItems: "center" }}>
        <Text style={{ fontSize: 12, color: "#64748B", fontWeight: "600" }}>Valor a depositar</Text>
        <Text
          style={{
            fontSize: 36,
            fontWeight: "900",
            color: "#0F172A",
            letterSpacing: -0.6,
            marginTop: 4,
          }}
        >
          {formatBRL(props.amount)}
        </Text>
      </Card>

      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: "#64748B",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginTop: 22,
          marginBottom: 10,
          marginLeft: 4,
        }}
      >
        Escolha o metodo
      </Text>

      <MethodCard
        icon={<QrCode size={22} color="#FFFFFF" strokeWidth={2.4} />}
        iconBg="#10B981"
        title="Pix"
        subtitle="Instantaneo - sem taxas"
        badge="Recomendado"
        onPress={() => props.onSelect("pix")}
        disabled={props.busy}
      />
      <View style={{ height: 10 }} />
      <MethodCard
        icon={<CreditCard size={22} color="#FFFFFF" strokeWidth={2.4} />}
        iconBg="#0F172A"
        title="Cartao de credito"
        subtitle="Stripe - pre-pronto para integracao"
        onPress={() => props.onSelect("stripe")}
        disabled={props.busy}
      />

      <View
        style={{
          marginTop: 18,
          padding: 12,
          backgroundColor: "#F8FAFC",
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <Info size={16} color="#64748B" strokeWidth={2.2} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: "#64748B", lineHeight: 16 }}>
          O saldo LevaPay vale para todas as corridas e entregas. Em caso de
          estorno, devolvemos o valor para a origem em ate 5 dias uteis.
        </Text>
      </View>
    </View>
  );
}

function MethodCard(props: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => ({
        opacity: props.disabled ? 0.6 : pressed ? 0.9 : 1,
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#EEF1F4",
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          backgroundColor: props.iconBg,
        }}
      >
        {props.icon}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A", letterSpacing: -0.1 }}>
            {props.title}
          </Text>
          {props.badge && (
            <View
              style={{
                marginLeft: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: "#ECFDF5",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "900",
                  color: "#047857",
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                {props.badge}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{props.subtitle}</Text>
      </View>
      {props.disabled ? (
        <ActivityIndicator size="small" color="#10B981" />
      ) : (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowRight size={16} color="#475569" strokeWidth={2.6} />
        </View>
      )}
    </Pressable>
  );
}

// --- Etapa 3a: Pix em processamento ----------------------------------------

function PixProcessingStep(props: { data: PixDepositResult; onCopy: () => void }) {
  return (
    <View>
      <Card style={{ alignItems: "center", padding: 22 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: "#ECFDF5",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Loader2 size={28} color="#059669" strokeWidth={2.4} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 }}>
          Aguardando pagamento
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#64748B",
            textAlign: "center",
            marginTop: 6,
            lineHeight: 19,
            maxWidth: 280,
          }}
        >
          Escaneie o QR Code ou copie o codigo abaixo. Vamos creditar
          automaticamente assim que o banco confirmar.
        </Text>
      </Card>

      <Card style={{ alignItems: "center", padding: 22, marginTop: 14 }}>
        <View
          style={{
            width: 220,
            height: 220,
            borderRadius: 22,
            backgroundColor: "#F8FAFC",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#EEF1F4",
            padding: 14,
          }}
        >
          <QrCode size={180} color="#0F172A" strokeWidth={1.8} />
        </View>
        <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, fontWeight: "600" }}>
          QR Code gerado ha poucos segundos
        </Text>
      </Card>

      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: "#64748B",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginTop: 20,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        Pix copia e cola
      </Text>
      <Pressable
        onPress={props.onCopy}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#EEF1F4",
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
        })}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Copy size={18} color="#0F172A" strokeWidth={2.4} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 12,
            color: "#475569",
            fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
          }}
        >
          {props.data.pixCode}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "800",
            color: "#047857",
            marginLeft: 8,
            letterSpacing: 0.3,
          }}
        >
          COPIAR
        </Text>
      </Pressable>

      <Card style={{ marginTop: 18, padding: 14, flexDirection: "row", alignItems: "center" }}>
        <ActivityIndicator size="small" color="#10B981" />
        <Text style={{ marginLeft: 10, fontSize: 12, color: "#475569", flex: 1 }}>
          Verificando automaticamente a cada 4 segundos...
        </Text>
      </Card>
    </View>
  );
}

// --- Etapa 3b: Stripe em processamento --------------------------------------

function StripeProcessingStep(props: {
  intent: StripeDepositIntent;
  amount: number;
  busy: boolean;
  onPay: () => void;
}) {
  return (
    <View>
      <Card style={{ alignItems: "center", padding: 20 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: "#0F172A",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <CreditCard size={26} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 }}>
          Pagar com cartao
        </Text>
        <Text style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Total: <Text style={{ fontWeight: "800", color: "#0F172A" }}>{formatBRL(props.amount)}</Text>
        </Text>
      </Card>

      <MockCardForm />

      <View
        style={{
          marginTop: 14,
          padding: 12,
          backgroundColor: "#FFFBEB",
          borderWidth: 1,
          borderColor: "#FDE68A",
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <Info size={16} color="#B45309" strokeWidth={2.4} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: "#92400E", lineHeight: 16 }}>
          Modo pre-integracao Stripe. O backend deve expor{" "}
          <Text style={{ fontWeight: "800" }}>/payments/deposit/stripe/intent</Text> e{" "}
          <Text style={{ fontWeight: "800" }}>/confirm</Text>. A UI ja esta pronta
          para plugar o <Text style={{ fontWeight: "800" }}>@stripe/stripe-react-native</Text>.
        </Text>
      </View>

      <Pressable
        onPress={props.onPay}
        disabled={props.busy}
        style={({ pressed }) => ({
          opacity: props.busy ? 0.8 : pressed ? 0.9 : 1,
          marginTop: 18,
          height: 56,
          borderRadius: 18,
          backgroundColor: props.busy ? "#475569" : "#0F172A",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        })}
      >
        {props.busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Lock size={18} color="#FFFFFF" strokeWidth={2.4} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "900",
                marginLeft: 10,
                letterSpacing: -0.2,
              }}
            >
              Pagar {formatBRL(props.amount)}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function MockCardForm() {
  const [number, setNumber] = useState("4242 4242 4242 4242");
  const [name, setName] = useState("CLIENTE TESTE");
  const [exp, setExp] = useState("12/30");
  const [cvc, setCvc] = useState("123");
  return (
    <Card style={{ marginTop: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <CreditCard size={18} color="#0F172A" strokeWidth={2.4} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }}>Dados do cartao</Text>
      </View>
      <Field label="Numero do cartao" value={number} onChange={setNumber} keyboardType="numeric" />
      <Field label="Nome no cartao" value={name} onChange={setName} autoCapitalize="characters" />
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Field label="Validade" value={exp} onChange={setExp} />
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Field label="CVC" value={cvc} onChange={setCvc} keyboardType="numeric" />
        </View>
      </View>
    </Card>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "characters";
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          color: "#64748B",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize ?? "none"}
        style={{
          borderWidth: 1.5,
          borderColor: "#E2E8F0",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 15,
          color: "#0F172A",
          fontWeight: "600",
          backgroundColor: "#FFFFFF",
        }}
        selectionColor="#059669"
      />
    </View>
  );
}

// --- Etapa 4: sucesso ------------------------------------------------------

function SuccessStep(props: {
  amount: number;
  provider: DepositProvider | null;
  onDone: () => void;
}) {
  return (
    <Card style={{ padding: 28, alignItems: "center", marginTop: 24 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 28,
          backgroundColor: "#ECFDF5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircle2 size={56} color="#059669" strokeWidth={2.2} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#0F172A",
          marginTop: 16,
          letterSpacing: -0.4,
        }}
      >
        Deposito confirmado!
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#64748B",
          textAlign: "center",
          marginTop: 8,
          lineHeight: 20,
          maxWidth: 280,
        }}
      >
        <Text style={{ fontWeight: "800", color: "#0F172A" }}>{formatBRL(props.amount)}</Text> ja
        esta disponivel no seu saldo LevaPay.
      </Text>

      <View
        style={{
          marginTop: 18,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
        }}
      >
        <Sparkles size={14} color="#D97706" strokeWidth={2.4} />
        <Text style={{ marginLeft: 6, fontSize: 11, color: "#475569", fontWeight: "700" }}>
          Desconto de ate 10% nas proximas viagens
        </Text>
      </View>

      <Pressable
        onPress={props.onDone}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          marginTop: 22,
          height: 54,
          paddingHorizontal: 32,
          borderRadius: 18,
          backgroundColor: "#02DE95",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          shadowColor: "#02DE95",
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        })}
      >
        <Text style={{ fontSize: 15, fontWeight: "900", color: "#0F172A", letterSpacing: -0.1 }}>
          Concluir
        </Text>
        <ArrowRight size={18} color="#0F172A" strokeWidth={2.8} style={{ marginLeft: 8 }} />
      </Pressable>
    </Card>
  );
}

// --- Etapa 5: erro ----------------------------------------------------------

function ErrorStep(props: {
  message: string | null;
  onRetry: () => void;
  onChangeMethod: () => void;
}) {
  return (
    <View>
      <Card style={{ padding: 26, alignItems: "center", marginTop: 24 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: "#FEF2F2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={48} color="#DC2626" strokeWidth={2.2} />
        </View>
        <Text
          style={{
            fontSize: 19,
            fontWeight: "900",
            color: "#0F172A",
            marginTop: 14,
            letterSpacing: -0.3,
          }}
        >
          Nao foi possivel concluir
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#64748B",
            textAlign: "center",
            marginTop: 8,
            lineHeight: 19,
            maxWidth: 280,
          }}
        >
          {props.message ?? "Tente novamente em instantes."}
        </Text>
      </Card>

      <Pressable
        onPress={props.onRetry}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          marginTop: 18,
          height: 54,
          borderRadius: 18,
          backgroundColor: "#0F172A",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900", letterSpacing: -0.1 }}>
          Tentar novamente
        </Text>
      </Pressable>
      <Pressable onPress={props.onChangeMethod} style={{ marginTop: 14, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: "#64748B", fontWeight: "700" }}>
          Escolher outro metodo
        </Text>
      </Pressable>
    </View>
  );
}

