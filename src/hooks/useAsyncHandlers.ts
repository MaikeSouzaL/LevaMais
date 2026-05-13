import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';
import Toast from 'react-native-toast-message';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  category: string,
  immediate = true
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(category, 'Erro na operação async', err);
      setState({ data: null, loading: false, error: err });
      throw err;
    }
  }, [asyncFunction, category]);

  if (immediate) {
    // Executar na montagem
    execute().catch(() => {});
  }

  return { ...state, execute };
}

export function useErrorHandler(category: string) {
  const handleError = useCallback(
    (error: Error | any, defaultMessage = 'Algo deu errado') => {
      const message = error?.message || defaultMessage;
      logger.error(category, message, error);

      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
        topOffset: 40,
      });
    },
    [category]
  );

  return { handleError };
}

export function useRetry(fn: () => Promise<void>, maxRetries = 3) {
  const [retrying, setRetrying] = useState(false);

  const executeWithRetry = useCallback(
    async (category: string) => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          setRetrying(true);
          await fn();
          setRetrying(false);
          logger.info(category, `Operação bem-sucedida na tentativa ${attempt}`);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          logger.warn(
            category,
            `Tentativa ${attempt}/${maxRetries} falhou, tentando novamente...`,
            lastError
          );

          if (attempt < maxRetries) {
            // Esperar antes de tentar novamente (backoff exponencial)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
            );
          }
        }
      }

      setRetrying(false);
      logger.error(category, 'Todas as tentativas falharam', lastError);
      throw lastError;
    },
    [fn, maxRetries]
  );

  return { executeWithRetry, retrying };
}

export function useLoadingWithTimeout(defaultTimeout = 30000) {
  const [loading, setLoading] = useState(false);

  const executeWithTimeout = useCallback(
    async <T>(
      fn: () => Promise<T>,
      category: string,
      timeout = defaultTimeout
    ): Promise<T> => {
      setLoading(true);
      try {
        return await Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout na operação')),
              timeout
            )
          ),
        ]);
      } catch (error) {
        logger.error(
          category,
          'Erro com timeout',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [defaultTimeout]
  );

  return { loading, executeWithTimeout };
}
