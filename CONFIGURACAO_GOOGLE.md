# 🔐 Configuração do Google Sign In - Leva Mais

## ⚠️ Erro DEVELOPER_ERROR

Este erro ocorre porque o **SHA-1 fingerprint** não está configurado no Google Cloud Console.

## 📋 Informações do Projeto

- **Package Name**: `com.maikesouzaleite.Leva_Mais`
- **SHA-1 (Debug)**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **SHA-256 (Debug)**: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
- **Web Client ID atual**: `422301870316-9u5rkfq44pngmak5keip0sct07ga1sbe.apps.googleusercontent.com`

## 🚀 Passos para Configurar

### 1. Acesse o Google Cloud Console

1. Vá para: https://console.cloud.google.com/
2. Selecione o projeto (ou crie um novo)

### 2. Criar Credencial OAuth 2.0 para Android

1. Vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ CRIAR CREDENCIAIS** > **ID do Cliente OAuth**
3. Selecione **Aplicativo Android**
4. Preencha:
   - **Nome**: `Leva Mais Android Debug`
   - **Nome do pacote**: `com.maikesouzaleite.Leva_Mais`
   - **Impressão digital do certificado SHA-1**: 
     ```
     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
     ```
   - **Impressão digital do certificado SHA-256**: 
     ```
     FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
     ```
5. Clique em **CRIAR**

### 3. Verificar/Criar Credencial OAuth 2.0 para Web

1. Na mesma página de **Credenciais**
2. Verifique se já existe um **ID do Cliente OAuth** do tipo **Aplicativo da Web**
3. Se não existir, crie:
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: `Leva Mais Web Client`
   - Copie o **ID do Cliente** gerado

### 4. Configurar Variáveis de Ambiente (Opcional)

Se quiser usar variáveis de ambiente ao invés de hardcode:

1. Crie um arquivo `.env` na raiz do projeto:
```env
GOOGLE_WEB_CLIENT_ID=422301870316-9u5rkfq44pngmak5keip0sct07ga1sbe.apps.googleusercontent.com
```

2. Adicione ao `.gitignore`:
```
.env
```

## ✅ Verificação

Após configurar:

1. Aguarde alguns minutos para as mudanças propagarem
2. Recompile o app:
   ```bash
   npm run android
   ```
3. Teste o login com Google novamente

## 📝 Notas Importantes

- ⏱️ Pode levar alguns minutos para as mudanças no Google Cloud Console serem aplicadas
- 🔄 Se ainda der erro, verifique se o package name está exatamente igual: `com.maikesouzaleite.Leva_Mais`
- 🔐 Para produção, você precisará adicionar também o SHA-1 do certificado de produção
- 📱 Certifique-se de que o Google Play Services está instalado no dispositivo de teste

## 🔗 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentação react-native-google-signin](https://react-native-google-signin.github.io/docs/)
- [Troubleshooting Guide](https://react-native-google-signin.github.io/docs/troubleshooting)

