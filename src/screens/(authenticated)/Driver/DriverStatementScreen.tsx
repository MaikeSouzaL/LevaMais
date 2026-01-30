import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, Animated } from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { DriverScreen } from "./components/DriverScreen";
import walletService, { StatementItem } from "../../../services/wallet.service";
import styleTheme from "../../../theme";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverStatementScreen() {
  const [items, setItems] = useState<StatementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  
  // Animation for filter change
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadStatement();
  }, []);

  const loadStatement = async () => {
    try {
      setLoading(true);
      const data = await walletService.getStatement();
      setItems(data);
    } catch (error) {
        Toast.show({
            type: "error",
            text1: "Erro ao carregar extrato"
        });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
      if (filter === "all") return items;
      if (filter === "credit") return items.filter(i => i.amount >= 0);
      return items.filter(i => i.amount < 0);
  }, [items, filter]);

  const summary = useMemo(() => {
      const total = filteredItems.reduce((acc, item) => acc + item.amount, 0);
      const count = filteredItems.length;
      return { total, count };
  }, [filteredItems]);

  const handleFilterChange = (newFilter: typeof filter) => {
      if (newFilter === filter) return;
      Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      setFilter(newFilter);
  };

  const sections = useMemo(() => {
    const groups: { [key: string]: StatementItem[] } = {};
    const now = new Date();
    
    filteredItems.forEach(item => {
        const d = new Date(item.date);
        let key = d.toLocaleDateString("pt-BR");
        
        if (d.toDateString() === now.toDateString()) key = "Hoje";
        else {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) key = "Ontem";
        }
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    return Object.keys(groups).map(date => ({
        title: date,
        data: groups[date]
    }));
  }, [filteredItems]);

  const renderSectionHeader = ({ section: { title } }: any) => (
      <View style={{ backgroundColor: "#0f231c", paddingVertical: 12, marginTop: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontWeight: "700", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {title}
          </Text>
      </View>
  );

  const renderItem = ({ item }: { item: StatementItem }) => {
    const isCredit = item.amount >= 0;
    const time = new Date(item.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity activeOpacity={0.9}>
        <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderRadius: 20,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)"
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isCredit ? "rgba(2,222,149,0.1)" : "rgba(239,68,68,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: isCredit ? "rgba(2,222,149,0.2)" : "rgba(239,68,68,0.2)"
                }}>
                    <MaterialIcons 
                        name={item.type === 'withdrawal' ? 'account-balance-wallet' : 'directions-car'} 
                        size={22} 
                        color={isCredit ? "#02de95" : "#ef4444"} 
                    />
                </View>
                <View>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                        {item.description}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                            {time}
                        </Text>
                        {item.type === "withdrawal" && (
                            <>
                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                                <Text style={{ 
                                    color: item.status === "pending" ? "#fbbf24" :
                                            item.status === "paid" ? "#02de95" : "#ef4444",
                                    fontSize: 12,
                                    fontWeight: "600"
                                }}>
                                    {item.status === "pending" ? "Processando" :
                                    item.status === "paid" ? "Pago" : "Rejeitado"}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </View>

            <Text
            style={{
                color: isCredit ? "#02de95" : "#fff",
                fontWeight: "900",
                fontSize: 18,
            }}
            >
            {isCredit ? "+" : ""}{formatBRL(item.amount)}
            </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <DriverScreen title="Extrato">
      <View style={{ marginBottom: 20 }}>
        {/* Summary Card */}
        <LinearGradient
            colors={['#162e25', '#0f231c']}
            style={{ 
                padding: 20, 
                borderRadius: 24, 
                borderWidth: 1, 
                borderColor: filter === 'all' ? "rgba(2,222,149,0.2)" : "rgba(255,255,255,0.05)",
                marginBottom: 20
            }}
        >
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" }}>
                {filter === 'all' ? 'Saldo do Período' : filter === 'credit' ? 'Total Entradas' : 'Total Saídas'}
            </Text>
            <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 4 }}>
                {formatBRL(summary.total)}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center", gap: 6 }}>
                <MaterialIcons name="receipt" size={16} color="#02de95" />
                <Text style={{ color: "#02de95", fontWeight: "600" }}>{summary.count} lançamentos</Text>
            </View>
        </LinearGradient>

        {/* Filters */}
        <View style={{ flexDirection: "row", gap: 10 }}>
            {([
                { key: "all", label: "Tudo" },
                { key: "credit", label: "Entradas" },
                { key: "debit", label: "Saídas" }
            ] as const).map(opt => (
                <TouchableOpacity
                    key={opt.key}
                    onPress={() => handleFilterChange(opt.key)}
                    style={{
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 30,
                        backgroundColor: filter === opt.key ? "#02de95" : "transparent",
                        borderWidth: 1,
                        borderColor: filter === opt.key ? "#02de95" : "rgba(255,255,255,0.15)"
                    }}
                >
                    <Text style={{ 
                        color: filter === opt.key ? "#0f231c" : "rgba(255,255,255,0.7)", 
                        fontWeight: "700",
                        fontSize: 13 
                    }}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 40 }} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <SectionList
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 40 }}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", marginTop: 40, opacity: 0.5 }}>
                    <MaterialIcons name="receipt-long" size={64} color="#fff" />
                    <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>
                        Nenhuma movimentação
                    </Text>
                    </View>
                }
            />
        </Animated.View>
      )}
    </DriverScreen>
  );
}
