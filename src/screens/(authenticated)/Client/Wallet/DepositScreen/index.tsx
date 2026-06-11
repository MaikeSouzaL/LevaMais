import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Linking,
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
  Info,
  Loader2,
  QrCode,
  Sparkles,
  Wallet,
  X,
  Zap,
  FileText,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";

import depositService, {
  type PixDepositResult,
  type BoletoDepositResult,
} from "@/services/deposit.service";
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  textStyles,
  touchTargets,
} from "@/theme";

type Step =
  | "select_amount"
  | "select_method"
  | "enter_cpf"
  | "processing_pix"
  | "processing_boleto"
  | "success"
  | "error";

const DEFAULT_SUGGESTIONS = [30, 50, 100, 200];

// Tokens do tema escuro premium para alinhar com o restante do aplicativo LevaMais
const t = {
  background: {
    primary: '#091A2F',
    secondary: '#091A2F',
    tertiary: '#11253E',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.70)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    muted: 'rgba(255, 255, 255, 0.40)',
    inverse: '#091A2F',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
    focus: '#02de95',
    danger: '#ef4444',
  },
  surface: {
    card: '#11253E',
    input: '#1E2D3D',
    disabled: 'rgba(255, 255, 255, 0.06)',
    warning: 'rgba(245, 158, 11, 0.06)',
    warningStrong: 'rgba(245, 158, 11, 0.12)',
    successSoft: 'rgba(2, 222, 149, 0.10)',
    dangerSoft: 'rgba(239, 68, 68, 0.10)',
  },
  icon: {
    brand: '#02de95',
    brandStrong: '#02de95',
    onBrand: '#091A2F',
    muted: 'rgba(255, 255, 255, 0.45)',
    warning: '#f59e0b',
    warningStrong: '#f59e0b',
    onWarning: '#f59e0b',
    danger: '#ef4444',
  },
  shadow: {
    card: '#000000',
  },
};
const sp = spacing;
const br = borderRadius;
const fs = fontSize;
const fw = fontWeight;
const ts = textStyles;
const tt = touchTargets;

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
  // Conta de destino: "wallet" (cliente) ou "driver_balance" (recarga do motorista).
  const depositAccount: "wallet" | "driver_balance" =
    route?.params?.account === "driver_balance" ? "driver_balance" : "wallet";
  const defaultAmount: number | undefined = route?.params?.defaultAmount;
  const suggestions: number[] =
    route?.params?.suggestedAmounts ?? DEFAULT_SUGGESTIONS;

  const [step, setStep] = useState<Step>("select_amount");
  const [amountText, setAmountText] = useState<string>(
    defaultAmount ? maskCentsToBRL(String(Math.round(defaultAmount * 100))) : "",
  );
  const [pixData, setPixData] = useState<PixDepositResult | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoDepositResult | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
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

  const handleGeneratePix = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const pix = await depositService.createPixDeposit(amount, depositAccount);
      setPixData(pix);
      setStep("processing_pix");
      startPixPolling(pix.transactionId);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Falha ao iniciar o deposito.");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateBoleto = async (enteredCpf: string) => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const cleanCpf = enteredCpf.replace(/\D/g, "");
      const boleto = await depositService.createBoletoDeposit(amount, {
        account: depositAccount,
        taxId: cleanCpf,
      });
      setBoletoData(boleto);
      setStep("processing_boleto");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Falha ao gerar boleto.");
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
          if (status.receiptUrl) {
            setReceiptUrl(status.receiptUrl);
          }
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
    } else if (step === "enter_cpf") {
      setStep("select_method");
    } else if (step === "processing_pix" || step === "processing_boleto" || step === "error") {
      setStep("select_amount");
      setPixData(null);
      setBoletoData(null);
      setErrorMsg(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background.secondary }} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View
        style={{
          backgroundColor: t.background.secondary,
          paddingHorizontal: sp.lg,
          paddingTop: sp.md + 2,
          paddingBottom: sp.lg,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: t.border.subtle,
        }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={{
            width: tt.minimum - 4,
            height: tt.minimum - 4,
            borderRadius: br.md + 2,
            backgroundColor: t.surface.input,
            alignItems: "center",
            justifyContent: "center",
            marginRight: sp.md,
          }}
        >
          <ChevronLeft size={22} color={t.text.primary} strokeWidth={2.4} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fs.lg,
              fontWeight: fw.black,
              color: t.text.primary,
              letterSpacing: -0.2,
            }}
          >
            Depositar no LevaPay
          </Text>
          <Text
            style={{
              fontSize: fs.xs,
              color: t.text.tertiary,
              marginTop: 1,
            }}
          >
            Escolha um valor e um metodo de pagamento
          </Text>
        </View>
        <View
          style={{
            width: tt.minimum - 4,
            height: tt.minimum - 4,
            borderRadius: br.md + 2,
            backgroundColor: t.surface.successSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wallet size={20} color={t.icon.brand} strokeWidth={2.4} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: sp.lg, paddingBottom: insets.bottom + sp.xl }}
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
            <MethodSelectStep
              amount={amount}
              onSelectMethod={(method) => {
                if (method === "pix") {
                  handleGeneratePix();
                } else {
                  setStep("enter_cpf");
                }
              }}
              onBack={handleBack}
            />
          )}

          {step === "enter_cpf" && (
            <EnterCpfStep
              onSubmit={(enteredCpf) => {
                handleGenerateBoleto(enteredCpf);
              }}
              onBack={handleBack}
              busy={busy}
            />
          )}

          {step === "processing_pix" && pixData && (
            <PixProcessingStep data={pixData} onCopy={handleCopyPix} />
          )}

          {step === "processing_boleto" && boletoData && (
            <BoletoProcessingStep data={boletoData} onBack={handleBack} />
          )}

          {step === "success" && (
            <SuccessStep
              amount={amount}
              transactionId={pixData?.transactionId || boletoData?.transactionId}
              receiptUrl={receiptUrl}
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
                setStep("select_amount");
              }}
              onChangeAmount={() => {
                setErrorMsg(null);
                setStep("select_amount");
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

type CardVariant = "default" | "elevated";

function Card({
  children,
  style,
  variant = "default",
}: {
  children: React.ReactNode;
  style?: any;
  variant?: CardVariant;
}) {
  const isElevated = variant === "elevated";
  return (
    <View
      style={{
        backgroundColor: t.surface.card,
        borderRadius: br.xl,
        padding: sp.lg,
        borderWidth: 1,
        borderColor: t.border.subtle,
        ...(isElevated ? shadows.md : shadows.sm),
        ...style,
      }}
    >
      {children}
    </View>
  );
}

// Helper: label uppercase padronizado
function SectionLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: fw.black,
        color: t.text.tertiary,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </Text>
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
  const borderColor = props.amountValid || props.amount === 0
    ? t.border.default
    : t.border.danger;

  return (
    <View>
      <Card variant="elevated" style={{ padding: sp.lg + 4, marginTop: sp.xs }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: sp.md + 2,
          }}
        >
          <View
            style={{
              width: tt.minimum + sp.xs,
              height: tt.minimum + sp.xs,
              borderRadius: br.lg,
              backgroundColor: t.surface.successSoft,
              alignItems: "center",
              justifyContent: "center",
              marginRight: sp.md,
            }}
          >
            <Sparkles size={22} color={t.icon.brand} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fs.base,
                fontWeight: fw.black,
                color: t.text.primary,
                letterSpacing: -0.2,
              }}
            >
              Adicione saldo ao LevaPay
            </Text>
            <Text
              style={{
                fontSize: fs.xs,
                color: t.text.tertiary,
                marginTop: 2,
              }}
            >
              Use em corridas e entregas. Sem taxa via Pix.
            </Text>
          </View>
        </View>

        <SectionLabel style={{ marginBottom: sp.sm }}>Valor do deposito</SectionLabel>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderColor,
            backgroundColor: t.surface.input,
            borderRadius: br.lg + 2,
            paddingHorizontal: sp.lg + 2,
            paddingVertical: sp.lg + 2,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: fw.black,
              color: t.text.muted,
              marginRight: sp.sm + 2,
            }}
          >
            R$
          </Text>
          <TextInput
            value={props.amountText}
            onChangeText={(v) => props.onChangeAmount(maskCentsToBRL(v))}
            keyboardType="numeric"
            placeholder="0,00"
            placeholderTextColor={t.text.muted}
            accessibilityLabel="Valor do deposito em reais"
            style={{
              flex: 1,
              fontSize: 34,
              fontWeight: fw.black,
              color: t.text.primary,
              letterSpacing: -0.5,
              paddingVertical: 0,
            }}
            selectionColor={t.icon.brand}
          />
          {props.amountText.length > 0 && (
            <Pressable
              onPress={() => props.onChangeAmount("")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Limpar valor"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: t.surface.disabled,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={t.text.secondary} strokeWidth={2.6} />
            </Pressable>
          )}
        </View>

        <Text
          style={{
            fontSize: 11,
            color: t.text.muted,
            marginTop: sp.sm,
            marginLeft: 2,
          }}
        >
          Min. {formatBRL(props.minAmount)} - Max. {formatBRL(props.maxAmount)}
        </Text>
      </Card>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: sp.xl - sp.xs,
          marginBottom: sp.sm + 2,
          marginLeft: sp.xs,
        }}
      >
        <SectionLabel>Valores sugeridos</SectionLabel>
        <Text
          style={{
            fontSize: 11,
            color: t.text.muted,
            fontWeight: fw.semibold,
            marginRight: sp.xs,
          }}
        >
          Toque para usar
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {props.suggestions.map((s) => {
          const active = Math.abs(props.amount - s) < 0.001;
          return (
            <Pressable
              key={s}
              onPress={() => props.onChangeAmount(maskCentsToBRL(String(s * 100)))}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar valor sugerido ${formatBRL(s)}`}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                width: "48%",
                marginBottom: sp.sm + 2,
                paddingVertical: sp.md + 4,
                paddingHorizontal: sp.md,
                borderRadius: br.lg + 2,
                backgroundColor: active ? t.surface.successSoft : t.surface.card,
                borderWidth: 1.5,
                borderColor: active ? t.border.focus : t.border.subtle,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                ...shadows.sm,
                transform: pressed ? [{ scale: 0.97 }] : undefined,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              {active && (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: t.border.focus,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: sp.sm,
                  }}
                >
                  <Check size={14} color={t.text.inverse} strokeWidth={3} />
                </View>
              )}
              <Text
                style={{
                  fontSize: fs.base,
                  fontWeight: fw.black,
                  color: active ? t.icon.brandStrong : t.text.primary,
                  letterSpacing: -0.1,
                }}
              >
                {formatBRL(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ marginTop: sp.lg + 2, padding: sp.md + 2, flexDirection: "row" }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: br.md,
            backgroundColor: t.surface.warningStrong,
            alignItems: "center",
            justifyContent: "center",
            marginRight: sp.md,
          }}
        >
          <Zap size={18} color={t.icon.warning} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fs.sm - 1,
              fontWeight: fw.black,
              color: t.text.primary,
            }}
          >
            Desconto de ate 10% nas corridas
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: t.text.tertiary,
              marginTop: 2,
            }}
          >
            Usando saldo LevaPay voce paga menos nas viagens.
          </Text>
        </View>
      </Card>

      <Pressable
        onPress={props.onContinue}
        disabled={!props.amountValid}
        accessibilityRole="button"
        accessibilityLabel="Continuar e gerar QR Code Pix"
        accessibilityState={{ disabled: !props.amountValid }}
        style={{
          marginTop: sp.xl - 2,
          height: 56,
          borderRadius: br.xl,
          backgroundColor: colors.primary[500],
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          shadowColor: colors.primary[500],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: props.amountValid ? 0.3 : 0,
          shadowRadius: 12,
          elevation: props.amountValid ? 6 : 0,
        }}
      >
        <Text
          style={{
            fontSize: fs.base,
            fontWeight: fw.black,
            color: t.icon.onBrand,
            letterSpacing: -0.2,
            flexShrink: 0,
          }}
        >
          Continuar
        </Text>
        <ArrowRight
          size={18}
          color={t.icon.onBrand}
          strokeWidth={3}
          style={{ marginLeft: sp.sm }}
        />
      </Pressable>
    </View>
  );
}

// --- Etapa 2: Pix em processamento ----------------------------------------

function PixProcessingStep(props: { data: PixDepositResult; onCopy: () => void }) {
  return (
    <View>
      <Card variant="elevated" style={{ alignItems: "center", padding: sp.xl - 2 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: br.lg + 2,
            backgroundColor: t.surface.successSoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: sp.md,
          }}
        >
          <Loader2 size={28} color={t.icon.brand} strokeWidth={2.4} />
        </View>
        <Text
          style={{
            fontSize: fs.lg,
            fontWeight: fw.black,
            color: t.text.primary,
            letterSpacing: -0.2,
          }}
        >
          Aguardando pagamento
        </Text>
        <Text
          style={{
            fontSize: fs.sm - 1,
            color: t.text.tertiary,
            textAlign: "center",
            marginTop: sp.sm + 2,
            lineHeight: 19,
            maxWidth: 280,
          }}
        >
          Escaneie o QR Code ou copie o codigo abaixo. Vamos creditar
          automaticamente assim que o banco confirmar.
        </Text>
      </Card>

      <Card variant="elevated" style={{ alignItems: "center", padding: sp.xl - 2, marginTop: sp.md + 2 }}>
        <View
          style={{
            width: 220,
            height: 220,
            borderRadius: br.xl,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            padding: sp.md,
          }}
        >
          {props.data.pixCode ? (
            <QRCode
              value={props.data.pixCode}
              size={180}
              backgroundColor="#FFFFFF"
              color="#0F172A"
            />
          ) : (
            <QrCode size={180} color="#0F172A" strokeWidth={1.8} />
          )}
        </View>
        <Text
          style={{
            fontSize: 11,
            color: t.text.muted,
            marginTop: sp.md,
            fontWeight: fw.semibold,
          }}
        >
          QR Code gerado ha poucos segundos
        </Text>
      </Card>

      <SectionLabel style={{ marginTop: sp.xl, marginBottom: sp.sm, marginLeft: sp.xs }}>
        Pix copia e cola
      </SectionLabel>
      <Pressable
        onPress={props.onCopy}
        accessibilityRole="button"
        accessibilityLabel="Copiar codigo PIX"
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          backgroundColor: t.surface.card,
          borderRadius: br.lg,
          borderWidth: 1,
          borderColor: t.border.subtle,
          padding: sp.md,
          flexDirection: "row",
          alignItems: "center",
        })}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: br.md,
            backgroundColor: t.surface.input,
            alignItems: "center",
            justifyContent: "center",
            marginRight: sp.md,
          }}
        >
          <Copy size={18} color={t.text.primary} strokeWidth={2.4} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: fs.xs,
            color: t.text.secondary,
            fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
          }}
        >
          {props.data.pixCode}
        </Text>
        <Text
          style={{
            fontSize: fs.xs,
            fontWeight: fw.black,
            color: t.icon.brandStrong,
            marginLeft: sp.sm,
            letterSpacing: 0.3,
          }}
        >
          COPIAR
        </Text>
      </Pressable>

      <Card
        variant="elevated"
        style={{ marginTop: sp.lg + 2, padding: sp.md + 2, flexDirection: "row", alignItems: "center" }}
      >
        <ActivityIndicator size="small" color={t.border.focus} />
        <Text
          style={{
            marginLeft: sp.sm + 2,
            fontSize: fs.xs,
            color: t.text.secondary,
            flex: 1,
          }}
        >
          Verificando automaticamente a cada 4 segundos...
        </Text>
      </Card>
    </View>
  );
}

// --- Etapa 3: sucesso ------------------------------------------------------

function SuccessStep(props: {
  amount: number;
  transactionId?: string;
  receiptUrl?: string | null;
  onDone: () => void;
}) {
  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleOpenReceipt = async () => {
    if (props.receiptUrl) {
      try {
        await Linking.openURL(props.receiptUrl);
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Erro ao abrir link",
          text2: "Não foi possível abrir o recibo no navegador.",
        });
      }
    }
  };

  return (
    <Card variant="elevated" style={{ padding: 24, alignItems: "center", marginTop: 12 }}>
      {/* Icon checkmark with glow */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(2, 222, 149, 0.12)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "rgba(2, 222, 149, 0.3)",
          shadowColor: "#02de95",
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 6,
          marginBottom: 16,
        }}
      >
        <CheckCircle2 size={48} color="#02de95" strokeWidth={2.5} />
      </View>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#ffffff",
          textAlign: "center",
          letterSpacing: -0.3,
          marginBottom: 8,
        }}
      >
        Depósito Confirmado!
      </Text>

      {/* Recibo digital premium */}
      <View
        style={{
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.06)",
          padding: 16,
          marginVertical: 16,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.08)", paddingBottom: 12 }}>
          <Text style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: 11, textTransform: "uppercase", fontWeight: "700", letterSpacing: 1 }}>
            Valor Adicionado
          </Text>
          <Text style={{ color: "#02de95", fontSize: 32, fontWeight: "900", marginTop: 4 }}>
            {formatBRL(props.amount)}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12 }}>Método de Pagamento</Text>
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>PIX (Stripe)</Text>
          </View>

          {props.transactionId && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12 }}>ID da Transação</Text>
              <Text numberOfLines={1} style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }), maxWidth: 140 }}>
                {props.transactionId}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12 }}>Data e Hora</Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12 }}>{formattedDate}</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12 }}>Status</Text>
            <View style={{ backgroundColor: "rgba(2, 222, 149, 0.15)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "900" }}>PAGO</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Banner de Benefício */}
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1E2D3D",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.04)",
        }}
      >
        <Sparkles size={16} color="#fbbf24" strokeWidth={2.4} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.75)",
            fontWeight: "700",
          }}
        >
          Desconto de até 10% nas próximas viagens
        </Text>
      </View>

      {props.receiptUrl && (
        <Pressable
          onPress={handleOpenReceipt}
          accessibilityRole="button"
          accessibilityLabel="Abrir recibo oficial do Stripe"
          style={({ pressed }) => ({
            opacity: pressed ? 0.75 : 1,
            marginTop: 8,
            marginBottom: 4,
            height: 48,
            width: "100%",
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: "rgba(2, 222, 149, 0.4)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            backgroundColor: "transparent",
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: "#02de95",
            }}
          >
            Visualizar Recibo Oficial
          </Text>
        </Pressable>
      )}

      {/* Botão Concluir Sólido */}
      <Pressable
        onPress={props.onDone}
        accessibilityRole="button"
        accessibilityLabel="Concluir e voltar"
        style={({ pressed }) => ({
          opacity: pressed ? 0.95 : 1,
          marginTop: 20,
          height: 54,
          width: "100%",
          borderRadius: 16,
          backgroundColor: "#02de95",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          shadowColor: "#02de95",
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        })}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "900",
            color: "#091A2F",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Concluir
        </Text>
        <ArrowRight
          size={18}
          color="#091A2F"
          strokeWidth={3}
          style={{ marginLeft: 8 }}
        />
      </Pressable>
    </Card>
  );
}

// --- Etapa 4: erro ----------------------------------------------------------

function ErrorStep(props: {
  message: string | null;
  onRetry: () => void;
  onChangeAmount: () => void;
}) {
  return (
    <View>
      <Card variant="elevated" style={{ padding: sp.xl + 2, alignItems: "center", marginTop: sp.xl + 4 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: t.surface.dangerSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={48} color={t.icon.danger} strokeWidth={2.2} />
        </View>
        <Text
          style={{
            fontSize: fs.lg + 1,
            fontWeight: fw.black,
            color: t.text.primary,
            marginTop: sp.md + 2,
            letterSpacing: -0.3,
          }}
        >
          Nao foi possivel concluir
        </Text>
        <Text
          style={{
            fontSize: fs.sm - 1,
            color: t.text.tertiary,
            textAlign: "center",
            marginTop: sp.sm,
            lineHeight: 19,
            maxWidth: 280,
          }}
        >
          {props.message ?? "Tente novamente em instantes."}
        </Text>
      </Card>

      <Pressable
        onPress={props.onRetry}
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          marginTop: sp.lg + 2,
          height: 54,
          borderRadius: br.lg + 2,
          backgroundColor: t.text.primary,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Text
          style={{
            color: t.text.inverse,
            fontSize: fs.base - 1,
            fontWeight: fw.black,
            letterSpacing: -0.1,
          }}
        >
          Tentar novamente
        </Text>
      </Pressable>
      <Pressable
        onPress={props.onChangeAmount}
        accessibilityRole="button"
        accessibilityLabel="Alterar valor do deposito"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          marginTop: sp.md + 2,
          alignItems: "center",
        })}
      >
        <Text
          style={{
            fontSize: fs.sm - 1,
            color: t.text.tertiary,
            fontWeight: fw.bold,
          }}
        >
          Alterar valor
        </Text>
      </Pressable>
    </View>
  );
}

function MethodSelectStep(props: {
  amount: number;
  onSelectMethod: (method: "pix" | "boleto") => void;
  onBack: () => void;
}) {
  return (
    <View style={{ gap: sp.md }}>
      {/* Target Amount Header Card */}
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderRadius: br.xl,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.06)",
          padding: sp.lg,
          alignItems: "center",
          marginBottom: sp.xs,
        }}
      >
        <Text style={{ fontSize: 11, color: t.text.tertiary, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }}>
          Valor a ser adicionado
        </Text>
        <Text style={{ fontSize: 32, fontWeight: "900", color: t.icon.brand, marginTop: 4 }}>
          {formatBRL(props.amount)}
        </Text>
      </View>

      <Text
        style={{
          fontSize: fs.base - 1,
          fontWeight: fw.black,
          color: t.text.primary,
          marginBottom: sp.xs,
          marginLeft: 2,
        }}
      >
        Escolha o método de pagamento
      </Text>

      {/* PIX (Stripe) Option Card */}
      <Pressable
        onPress={() => props.onSelectMethod("pix")}
        style={({ pressed }) => ({
          backgroundColor: t.surface.card,
          borderRadius: br.xl,
          padding: sp.lg,
          borderWidth: 1.5,
          borderColor: pressed ? t.border.focus : "rgba(2, 222, 149, 0.15)",
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.95 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 2,
        })}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: br.lg,
            backgroundColor: "rgba(2, 222, 149, 0.12)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: sp.md,
          }}
        >
          <Zap size={24} color={t.icon.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ fontSize: fs.base, fontWeight: fw.black, color: t.text.primary }}>
              PIX (Stripe)
            </Text>
            <View style={{ backgroundColor: "rgba(2, 222, 149, 0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: t.icon.brand, fontSize: 9, fontWeight: "900" }}>RÁPIDO</Text>
            </View>
          </View>
          <Text style={{ fontSize: fs.xs, color: t.text.tertiary, marginTop: 4, lineHeight: 16 }}>
            Aprovação imediata e sem taxas adicionais.
          </Text>
        </View>
        <ArrowRight size={18} color={t.text.secondary} />
      </Pressable>

      {/* Boleto (Stripe) Option Card */}
      <Pressable
        onPress={() => props.onSelectMethod("boleto")}
        style={({ pressed }) => ({
          backgroundColor: t.surface.card,
          borderRadius: br.xl,
          padding: sp.lg,
          borderWidth: 1.5,
          borderColor: pressed ? t.border.focus : t.border.subtle,
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.95 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 2,
        })}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: br.lg,
            backgroundColor: "rgba(96, 165, 250, 0.12)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: sp.md,
          }}
        >
          <FileText size={24} color="#60a5fa" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fs.base, fontWeight: fw.black, color: t.text.primary }}>
            Boleto (Stripe)
          </Text>
          <Text style={{ fontSize: fs.xs, color: t.text.tertiary, marginTop: 4, lineHeight: 16 }}>
            Compensação entre 1 a 2 dias úteis.
          </Text>
        </View>
        <ArrowRight size={18} color={t.text.secondary} />
      </Pressable>

      {/* Back button */}
      <Pressable
        onPress={props.onBack}
        style={({ pressed }) => ({
          marginTop: sp.md,
          alignItems: "center",
          paddingVertical: sp.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: t.text.secondary, fontWeight: fw.bold, fontSize: fs.sm }}>
          Voltar e alterar valor
        </Text>
      </Pressable>
    </View>
  );
}

function EnterCpfStep(props: {
  onSubmit: (cpf: string) => void;
  onBack: () => void;
  busy: boolean;
}) {
  const [cpfText, setCpfText] = useState("");
  const isValid = cpfText.replace(/\D/g, "").length === 11;

  const handleTextChange = (text: string) => {
    const raw = text.replace(/\D/g, "").slice(0, 11);
    let masked = raw;
    if (raw.length > 9) {
      masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    } else if (raw.length > 6) {
      masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    } else if (raw.length > 3) {
      masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
    }
    setCpfText(masked);
  };

  return (
    <View style={{ gap: sp.md }}>
      <Card variant="elevated">
        <Text
          style={{
            fontSize: fs.base,
            fontWeight: fw.black,
            color: t.text.primary,
            marginBottom: sp.xs,
          }}
        >
          Informe seu CPF
        </Text>
        <Text style={{ fontSize: fs.xs, color: t.text.tertiary, marginBottom: sp.md }}>
          O CPF é obrigatório para emissão de boleto bancário (Stripe).
        </Text>

        <TextInput
          value={cpfText}
          onChangeText={handleTextChange}
          keyboardType="numeric"
          placeholder="000.000.000-00"
          placeholderTextColor={t.text.muted}
          style={{
            backgroundColor: t.surface.input,
            borderRadius: br.lg,
            borderWidth: 1.5,
            borderColor: isValid ? t.border.focus : t.border.default,
            color: t.text.primary,
            fontSize: fs.base,
            fontWeight: fw.bold,
            paddingHorizontal: sp.md,
            paddingVertical: sp.md,
          }}
        />
      </Card>

      <Pressable
        onPress={() => props.onSubmit(cpfText)}
        disabled={!isValid || props.busy}
        style={({ pressed }) => ({
          backgroundColor: isValid && !props.busy ? colors.primary[500] : t.surface.disabled,
          height: 54,
          borderRadius: br.xl,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {props.busy ? (
          <ActivityIndicator color={t.icon.onBrand} />
        ) : (
          <>
            <Text style={{ fontSize: fs.base, fontWeight: fw.black, color: t.icon.onBrand }}>
              Gerar Boleto
            </Text>
            <ArrowRight size={18} color={t.icon.onBrand} style={{ marginLeft: sp.sm }} />
          </>
        )}
      </Pressable>

      <Pressable
        onPress={props.onBack}
        style={{ alignItems: "center", paddingVertical: sp.sm }}
      >
        <Text style={{ color: t.text.secondary, fontWeight: fw.bold, fontSize: fs.sm }}>
          Voltar
        </Text>
      </Pressable>
    </View>
  );
}

function BoletoProcessingStep(props: {
  data: BoletoDepositResult;
  onBack: () => void;
}) {
  const handleCopyBarcode = async () => {
    if (!props.data.number) return;
    try {
      // @ts-ignore - expo-clipboard pode nao estar instalado
      const Clipboard = await import("expo-clipboard").catch(() => null);
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(props.data.number);
        Toast.show({ type: "success", text1: "Linha digitável copiada!" });
      } else {
        await Share.share({ message: props.data.number });
      }
    } catch {}
  };

  const handleOpenPdf = async () => {
    if (props.data.pdf) {
      try {
        await Linking.openURL(props.data.pdf);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao abrir PDF",
          text2: "Não foi possível abrir o link do boleto.",
        });
      }
    }
  };

  return (
    <View style={{ gap: sp.md }}>
      <Card variant="elevated" style={{ alignItems: "center", padding: sp.xl - 2 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: br.lg + 2,
            backgroundColor: "rgba(59,130,246,0.1)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: sp.md,
          }}
        >
          <FileText size={28} color="#60a5fa" strokeWidth={2.4} />
        </View>
        <Text
          style={{
            fontSize: fs.lg,
            fontWeight: fw.black,
            color: t.text.primary,
            letterSpacing: -0.2,
          }}
        >
          Boleto Gerado!
        </Text>
        <Text
          style={{
            fontSize: fs.sm - 1,
            color: t.text.tertiary,
            textAlign: "center",
            marginTop: sp.sm + 2,
            lineHeight: 19,
            maxWidth: 280,
          }}
        >
          Copie o código de barras abaixo ou abra o arquivo PDF para realizar o pagamento. A
          compensação leva de 1 a 2 dias úteis.
        </Text>
      </Card>

      {props.data.number && (
        <>
          <SectionLabel style={{ marginLeft: sp.xs }}>Código de barras</SectionLabel>
          <Pressable
            onPress={handleCopyBarcode}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              backgroundColor: t.surface.card,
              borderRadius: br.lg,
              borderWidth: 1,
              borderColor: t.border.subtle,
              padding: sp.md,
              flexDirection: "row",
              alignItems: "center",
            })}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: br.md,
                backgroundColor: t.surface.input,
                alignItems: "center",
                justifyContent: "center",
                marginRight: sp.md,
              }}
            >
              <Copy size={18} color={t.text.primary} strokeWidth={2.4} />
            </View>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: fs.xs,
                color: t.text.secondary,
                fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
              }}
            >
              {props.data.number}
            </Text>
            <Text
              style={{
                fontSize: fs.xs,
                fontWeight: fw.black,
                color: t.icon.brandStrong,
                marginLeft: sp.sm,
                letterSpacing: 0.3,
              }}
            >
              COPIAR
            </Text>
          </Pressable>
        </>
      )}

      {props.data.pdf && (
        <Pressable
          onPress={handleOpenPdf}
          style={({ pressed }) => ({
            backgroundColor: "#02de95",
            height: 54,
            borderRadius: br.xl,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            opacity: pressed ? 0.9 : 1,
            marginTop: sp.sm,
          })}
        >
          <Text style={{ fontSize: fs.base, fontWeight: fw.black, color: "#091A2F" }}>
            Visualizar Boleto (PDF)
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={props.onBack}
        style={{ alignItems: "center", paddingVertical: sp.sm, marginTop: sp.md }}
      >
        <Text style={{ color: t.text.secondary, fontWeight: fw.bold, fontSize: fs.sm }}>
          Voltar ao início
        </Text>
      </Pressable>
    </View>
  );
}
