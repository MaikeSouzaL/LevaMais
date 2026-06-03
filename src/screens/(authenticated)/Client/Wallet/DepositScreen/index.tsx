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
  Info,
  Loader2,
  QrCode,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";

import depositService, {
  type PixDepositResult,
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

/**
 * Tela de deposito no saldo LevaPay.
 *  - Pix: QR + copia-cola com polling 4s ate status = paid.
 */
type Step =
  | "select_amount"
  | "processing_pix"
  | "success"
  | "error";

const DEFAULT_SUGGESTIONS = [30, 50, 100, 200];

// Tokens do tema claro (re-exportados para uso local)
const t = colors.light;
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
  const defaultAmount: number | undefined = route?.params?.defaultAmount;
  const suggestions: number[] =
    route?.params?.suggestedAmounts ?? DEFAULT_SUGGESTIONS;

  const [step, setStep] = useState<Step>("select_amount");
  const [amountText, setAmountText] = useState<string>(
    defaultAmount ? maskCentsToBRL(String(Math.round(defaultAmount * 100))) : "",
  );
  const [pixData, setPixData] = useState<PixDepositResult | null>(null);
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
    handleGeneratePix();
  };

  const handleGeneratePix = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const pix = await depositService.createPixDeposit(amount);
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
    if (step === "processing_pix" || step === "error") {
      setStep("select_amount");
      setPixData(null);
      setErrorMsg(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background.secondary }} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.background.secondary} />

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

          {step === "processing_pix" && pixData && (
            <PixProcessingStep data={pixData} onCopy={handleCopyPix} />
          )}

          {step === "success" && (
            <SuccessStep
              amount={amount}
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
                setTimeout(() => handleGeneratePix(), 0);
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
            borderRadius: br.xl + 2,
            backgroundColor: t.surface.card,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: t.border.subtle,
            padding: sp.md + 2,
          }}
        >
          {props.data.pixCode ? (
            <QRCode
              value={props.data.pixCode}
              size={188}
              backgroundColor={t.surface.card}
              color={t.text.primary}
            />
          ) : (
            <QrCode size={180} color={t.text.primary} strokeWidth={1.8} />
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
  onDone: () => void;
}) {
  return (
    <Card variant="elevated" style={{ padding: sp.xl + 4, alignItems: "center", marginTop: sp.xl + 4 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 28,
          backgroundColor: t.surface.successSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircle2 size={56} color={t.icon.brand} strokeWidth={2.2} />
      </View>
      <Text
        style={{
          fontSize: fs['2xl'] - 2,
          fontWeight: fw.black,
          color: t.text.primary,
          marginTop: sp.lg,
          letterSpacing: -0.4,
        }}
      >
        Deposito confirmado!
      </Text>
      <Text
        style={{
          fontSize: fs.base - 2,
          color: t.text.tertiary,
          textAlign: "center",
          marginTop: sp.sm,
          lineHeight: 20,
          maxWidth: 280,
        }}
      >
        <Text style={{ fontWeight: fw.black, color: t.text.primary }}>{formatBRL(props.amount)}</Text> ja
        esta disponivel no seu saldo LevaPay.
      </Text>

      <View
        style={{
          marginTop: sp.lg + 2,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.surface.input,
          paddingHorizontal: sp.md,
          paddingVertical: sp.sm,
          borderRadius: borderRadius.full,
        }}
      >
        <Sparkles size={14} color={t.icon.warning} strokeWidth={2.4} />
        <Text
          style={{
            marginLeft: sp.sm - 2,
            fontSize: 11,
            color: t.text.secondary,
            fontWeight: fw.bold,
          }}
        >
          Desconto de ate 10% nas proximas viagens
        </Text>
      </View>

      <Pressable
        onPress={props.onDone}
        accessibilityRole="button"
        accessibilityLabel="Concluir e voltar"
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          marginTop: sp.xl - 2,
          height: 54,
          paddingHorizontal: sp['2xl'],
          borderRadius: br.lg + 2,
          backgroundColor: colors.primary[500],
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          shadowColor: colors.primary[500],
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        })}
      >
        <Text
          style={{
            fontSize: fs.base - 1,
            fontWeight: fw.black,
            color: t.icon.onBrand,
            letterSpacing: -0.1,
          }}
        >
          Concluir
        </Text>
        <ArrowRight
          size={18}
          color={t.icon.onBrand}
          strokeWidth={2.8}
          style={{ marginLeft: sp.sm }}
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
