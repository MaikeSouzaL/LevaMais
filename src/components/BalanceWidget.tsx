import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import driverService, { DriverBalance } from '@/services/driver.service';
import { logger } from '@/utils/logger';

interface BalanceWidgetProps {
  onDepositPress?: () => void;
  onWithdrawPress?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function BalanceWidget({
  onDepositPress,
  onWithdrawPress,
  refreshing = false,
  onRefresh,
}: BalanceWidgetProps) {
  const [balance, setBalance] = useState<DriverBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const data = await driverService.getBalance();
      setBalance(data);
      logger.info('BALANCE_WIDGET', 'Balance loaded', {
        balance: data.balance,
      });
    } catch (error) {
      logger.error('BALANCE_WIDGET', 'Failed to load balance', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Falha ao carregar saldo',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load balance when component mounts
  useEffect(() => {
    loadBalance();
  }, []);

  // Reload balance when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadBalance();
    }, [])
  );

  const handleRefresh = async () => {
    setLocalRefreshing(true);
    try {
      await loadBalance();
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setLocalRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View className="bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] rounded-lg p-6 items-center justify-center h-24">
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  if (!balance) {
    return (
      <View className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-4">
        <Text className="text-[#ef4444] font-bold">Erro ao carregar saldo</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="mt-2 flex-row items-center justify-center bg-[#ef4444] rounded px-4 py-2"
        >
          <Text className="text-white font-bold">Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if balance is low
  const isLowBalance = balance.balance < 10;
  const isCritical = balance.balance === 0;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={localRefreshing || refreshing} onRefresh={handleRefresh} />}
      scrollEnabled={false}
    >
      {/* Main Balance Card */}
      <View
        className={`rounded-2xl p-6 mb-4 border-2 ${
          isCritical
            ? 'bg-[#ef4444]/10 border-[#ef4444]/30'
            : isLowBalance
              ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
              : 'bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] border-[#0ea5e9]'
        }`}
      >
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className={`text-sm font-semibold mb-1 ${isCritical ? 'text-[#ef4444]' : isLowBalance ? 'text-[#f59e0b]' : 'text-white/80'}`}>
              Saldo Disponível
            </Text>
            <Text
              className={`text-4xl font-black ${
                isCritical ? 'text-[#ef4444]' : isLowBalance ? 'text-[#f59e0b]' : 'text-white'
              }`}
            >
              R$ {balance.balance.toFixed(2)}
            </Text>
          </View>
          <MaterialIcons
            name={isCritical ? 'warning' : isLowBalance ? 'info' : 'account-balance-wallet'}
            size={32}
            color={isCritical ? '#ef4444' : isLowBalance ? '#f59e0b' : 'white'}
          />
        </View>

        {/* Status Indicator */}
        {isCritical && (
          <View className="bg-[#ef4444]/20 rounded-lg p-3 flex-row items-center gap-2">
            <MaterialIcons name="error" size={18} color="#ef4444" />
            <Text className="text-[#ef4444] font-bold text-xs flex-1">
              Seu saldo acabou. Faça um depósito para continuar.
            </Text>
          </View>
        )}

        {isLowBalance && !isCritical && (
          <View className="bg-[#f59e0b]/20 rounded-lg p-3 flex-row items-center gap-2">
            <MaterialIcons name="warning" size={18} color="#f59e0b" />
            <Text className="text-[#f59e0b] font-bold text-xs flex-1">
              Saldo baixo. Considere fazer um depósito.
            </Text>
          </View>
        )}
      </View>

      {/* Summary Stats */}
      <View className="flex-row gap-3 mb-4">
        {/* Total Deposits */}
        <View className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg p-4">
          <Text className="text-[#94a3b8] text-xs mb-1">Total em Depósitos</Text>
          <Text className="text-[#02de95] font-bold text-lg">R$ {balance.totalDeposits.toFixed(2)}</Text>
        </View>

        {/* Total Deductions */}
        <View className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg p-4">
          <Text className="text-[#94a3b8] text-xs mb-1">Total em Deduções (Taxa Leva+)</Text>
          <Text className="text-[#f87171] font-bold text-lg">R$ {balance.totalDeductions.toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {/* Deposit Button */}
        <TouchableOpacity
          onPress={onDepositPress}
          disabled={refreshing || localRefreshing}
          className="flex-1 bg-[#02de95] rounded-lg py-3 flex-row items-center justify-center gap-2"
        >
          <MaterialIcons name="add-circle" size={20} color="#091A2F" />
          <Text className="text-[#091A2F] font-bold">Depositar</Text>
        </TouchableOpacity>

        {/* Withdraw Button */}
        <TouchableOpacity
          onPress={onWithdrawPress}
          disabled={refreshing || localRefreshing || balance.balance === 0}
          className={`flex-1 rounded-lg py-3 flex-row items-center justify-center gap-2 ${
            balance.balance === 0
              ? 'bg-[#64748b] opacity-50'
              : 'bg-[#0ea5e9]'
          }`}
        >
          <MaterialIcons name="arrow-downward" size={20} color="white" />
          <Text className="text-white font-bold">Sacar</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-4 mt-4">
        <View className="flex-row items-start gap-3">
          <MaterialIcons name="info" size={18} color="#0ea5e9" />
          <View className="flex-1">
            <Text className="text-[#0ea5e9] font-bold text-sm mb-1">Como funciona</Text>
            <Text className="text-[#0ea5e9]/80 text-xs leading-4">
              A cada corrida completada, a taxa da plataforma (definida pela Leva+) e descontada automaticamente do seu saldo. Mantenha
              sempre um saldo minimo para nao ficar offline.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
