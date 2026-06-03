import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { formatBRL } from '@/utils/mappers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'ride_payment' | 'refund' | 'adjustment';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  rideId?: string;
  orderId?: string;
}

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  loading?: boolean;
  onLoadMore?: () => void;
  onTransactionPress?: (transaction: WalletTransaction) => void;
  style?: ViewStyle;
}

const getTransactionIcon = (type: WalletTransaction['type']) => {
  switch (type) {
    case 'topup':
      return <Icon name="add-circle" size={20} color="#02de95" />;
    case 'ride_payment':
      return <Icon name="car" size={20} color="#ef4444" />;
    case 'refund':
      return <Icon name="account-balance-wallet" size={20} color="#fbbf24" />;
    case 'adjustment':
      return <Icon name="tune" size={20} color="#60a5fa" />;
    default:
      return <Icon name="help" size={20} color="#999" />;
  }
};

const getTransactionLabel = (type: WalletTransaction['type']) => {
  switch (type) {
    case 'topup':
      return 'Recarga de Saldo';
    case 'ride_payment':
      return 'Pagamento de Corrida';
    case 'refund':
      return 'Reembolso';
    case 'adjustment':
      return 'Ajuste de Saldo';
    default:
      return 'Transação';
  }
};

const TransactionItem: React.FC<{
  transaction: WalletTransaction;
  onPress?: (t: WalletTransaction) => void;
}> = ({ transaction, onPress }) => {
  const isIncome = transaction.type === 'topup' || transaction.type === 'refund';
  const dateObj = new Date(transaction.date);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      style={styles.transactionItem}
    >
      <View style={styles.transactionIcon}>
        {getTransactionIcon(transaction.type)}
      </View>

      <View style={styles.transactionInfo}>
        <Text style={styles.transactionLabel}>
          {getTransactionLabel(transaction.type)}
        </Text>
        <Text style={styles.transactionDescription}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionDate}>
          {format(dateObj, 'dd MMM yyyy, HH:mm', { locale: ptBR })}
        </Text>
      </View>

      <View style={styles.transactionAmount}>
        <Text
          style={[
            styles.amount,
            {
              color: isIncome ? '#02de95' : '#ef4444',
            },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatBRL(transaction.amount)}
        </Text>
        {transaction.status === 'pending' && (
          <Text style={styles.status}>Pendente</Text>
        )}
        {transaction.status === 'failed' && (
          <Text style={[styles.status, { color: '#ef4444' }]}>Falhou</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  loading = false,
  onLoadMore,
  onTransactionPress,
  style,
}) => {
  if (transactions.length === 0 && !loading) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Icon name="history" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={styles.emptyTitle}>Sem transações</Text>
        <Text style={styles.emptyDescription}>
          Suas transações aparecerão aqui
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TransactionItem transaction={item} onPress={onTransactionPress} />
      )}
      contentContainerStyle={style}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
};

// Wallet Balance Card
interface WalletBalanceCardProps {
  balance: number;
  onTopupPress?: () => void;
  onWithdrawPress?: () => void;
  style?: ViewStyle;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  balance,
  onTopupPress,
  onWithdrawPress,
  style,
}) => {
  return (
    <View style={[styles.balanceCard, style]}>
      <View>
        <Text style={styles.balanceLabel}>Saldo Disponível</Text>
        <Text style={styles.balanceAmount}>{formatBRL(balance)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.topupButton]}
          onPress={onTopupPress}
        >
          <Icon name="add-circle" size={20} color="white" />
          <Text style={styles.actionButtonText}>Recarga</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.withdrawButton]}
          onPress={onWithdrawPress}
        >
          <Icon name="call-made" size={20} color="white" />
          <Text style={styles.actionButtonText}>Sacar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: spacing.md,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  transactionLabel: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  transactionDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
  },
  transactionDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: fontSize.xs,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  status: {
    color: '#fbbf24',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  emptyDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.sm,
  },
  balanceCard: {
    backgroundColor: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    color: 'white',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  topupButton: {
    backgroundColor: '#02de95',
  },
  withdrawButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
});
