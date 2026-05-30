import Toast from 'react-native-toast-message';

export function showSuccessToast(title: string, message?: string) {
  Toast.show({ type: 'success', text1: title, text2: message, visibilityTime: 3000 });
}

export function showErrorToast(title: string, message?: string) {
  // Sanitize raw error messages from the backend
  const sanitized = message?.replace(/Error: /g, '').replace(/details:.*/g, '').trim();
  Toast.show({ type: 'error', text1: title, text2: sanitized, visibilityTime: 4000 });
}

export function showInfoToast(title: string, message?: string) {
  Toast.show({ type: 'info', text1: title, text2: message, visibilityTime: 3000 });
}
