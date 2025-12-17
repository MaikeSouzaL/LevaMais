# Configuração do Google Sign In

## Erro DEVELOPER_ERROR

Este erro geralmente ocorre quando o SHA-1 fingerprint não está configurado no Google Cloud Console.

## Passos para Configuração

### 1. Obter o SHA-1 Fingerprint

#### Para desenvolvimento (debug):

```bash
cd android
./gradlew signingReport
```

Ou usando keytool:

```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### Para produção:

```bash
keytool -list -v -keystore seu-keystore.jks -alias seu-alias
```

### 2. Configurar no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **APIs e Serviços** > **Credenciais**
4. Clique em **Criar credenciais** > **ID do Cliente OAuth**
5. Configure:

   - **Tipo de aplicativo**: Android
   - **Nome**: Leva Mais Android
   - **Nome do pacote**: `com.maikesouzaleite.Leva_Mais` (verifique no app.json)
   - **Impressão digital do certificado SHA-1**: Cole o SHA-1 obtido no passo 1
   - **Impressão digital do certificado SHA-256**: Cole o SHA-256 (também obtido no passo 1)

6. Crie também um **ID do Cliente OAuth para Web**:
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: Leva Mais Web Client
   - Copie o **ID do Cliente** gerado (será usado como `GOOGLE_WEB_CLIENT_ID`)

### 3. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto:

```env
GOOGLE_WEB_CLIENT_ID=seu-web-client-id-aqui.apps.googleusercontent.com
```

2. Adicione `.env` ao `.gitignore`:

```
.env
```

### 4. Instalar react-native-dotenv (se necessário)

```bash
npm install react-native-dotenv --save-dev
```

### 5. Configurar Babel

No arquivo `babel.config.js`, adicione o plugin:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ],
    ],
  };
};
```

### 6. Verificar Package Name

Certifique-se de que o package name no `app.json` corresponde ao configurado no Google Cloud Console:

- Package: `com.maikesouzaleite.Leva_Mais`

## Troubleshooting

- **DEVELOPER_ERROR**: Verifique se o SHA-1 está correto e se o package name corresponde
- **SIGN_IN_CANCELLED**: Usuário cancelou o login (não é um erro)
- **PLAY_SERVICES_NOT_AVAILABLE**: Instale o Google Play Services no dispositivo

## Links Úteis

- [Documentação react-native-google-signin](https://react-native-google-signin.github.io/docs/)
- [Troubleshooting Guide](https://react-native-google-signin.github.io/docs/troubleshooting)
- [Google Cloud Console](https://console.cloud.google.com/)
