import { Platform } from 'react-native';

export const Fonts = {
  display: 'System',
  body: 'System',
  mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
};
