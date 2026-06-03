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
