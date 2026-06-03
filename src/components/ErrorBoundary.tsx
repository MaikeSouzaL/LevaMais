import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      'ERROR_BOUNDARY',
      `Erro em ${this.props.componentName || 'Componente'}`,
      error
    );
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.errorBox}>
              <Icon name="error-outline" size={48} color="#ef4444" />
              <Text style={styles.title}>Algo deu errado</Text>
              <Text style={styles.message}>
                {this.state.errorInfo || 'Um erro inesperado ocorreu'}
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.devInfo}>
                  <Text style={styles.devTitle}>📋 Detalhes do Erro (Dev):</Text>
                  <Text style={styles.devText}>{this.state.error.message}</Text>
                  {this.state.error.stack && (
                    <Text style={styles.stackTrace}>{this.state.error.stack}</Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Icon name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#091A2F',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 24,
    width: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  devInfo: {
    marginTop: 20,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  devTitle: {
    color: '#fbbf24',
    fontWeight: '600',
    marginBottom: 8,
  },
  devText: {
    color: '#60a5fa',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    color: '#f87171',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#02de95',
    marginHorizontal: 20,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#091A2F',
    fontWeight: '700',
    fontSize: 16,
  },
});
