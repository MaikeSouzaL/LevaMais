/**
 * ChatScreen - Versão Refatorada
 * Chat com o motorista
 */

import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Design System
import { colors, spacing, fontSize } from '@/theme';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now(), text: message, sent: true }]);
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.message, item.sent && styles.messageSent]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Digite uma mensagem..."
          placeholderTextColor={colors.text.tertiary}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <MaterialIcons name="send" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  message: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    margin: spacing.sm,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageSent: { alignSelf: 'flex-end', backgroundColor: colors.primary[500] },
  messageText: { color: colors.text.primary, fontSize: fontSize.base },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  sendButton: { justifyContent: 'center', padding: spacing.sm },
});
