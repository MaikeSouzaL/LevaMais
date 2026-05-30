import { BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: BaseToastProps) => ({
    ...props,
    style: {
      backgroundColor: '#11253E',
      borderLeftColor: '#02DE95',
      borderLeftWidth: 4,
      borderRadius: 12,
      marginHorizontal: 16,
    },
    text1Style: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    text2Style: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  }),
  error: (props: BaseToastProps) => ({
    ...props,
    style: {
      backgroundColor: '#11253E',
      borderLeftColor: '#EF4444',
      borderLeftWidth: 4,
      borderRadius: 12,
      marginHorizontal: 16,
    },
    text1Style: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    text2Style: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  }),
  info: (props: BaseToastProps) => ({
    ...props,
    style: {
      backgroundColor: '#11253E',
      borderLeftColor: '#38BDF8',
      borderLeftWidth: 4,
      borderRadius: 12,
      marginHorizontal: 16,
    },
    text1Style: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    text2Style: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  }),
};
