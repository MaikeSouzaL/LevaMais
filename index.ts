import { registerRootComponent } from 'expo';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Configura o logger do Reanimated para desabilitar o strict mode
// Isso elimina os warnings sobre leitura/escrita de valores durante o render
configureReanimatedLogger({
  strict: false, // Desabilita o strict mode que causa os warnings
  level: ReanimatedLogLevel.error, // Mostra apenas erros, não warnings
});

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
