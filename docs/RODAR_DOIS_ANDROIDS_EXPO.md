# Rodar o app em dois Androids com Expo

Este guia resolve o erro:

```text
Unable to load script.
Make sure you're running Metro...
adb reverse tcp:8081 tcp:8081
```

## Por que acontece

O app Android precisa acessar o Metro Bundler na porta `8081`.

Quando existe apenas um dispositivo conectado, este comando costuma funcionar:

```bash
adb reverse tcp:8081 tcp:8081
```

Com dois dispositivos conectados, o ADB nao sabe em qual aparelho aplicar o reverse e pode retornar:

```text
error: more than one device/emulator
```

Por isso precisamos informar o serial de cada dispositivo.

## 1. Ver dispositivos conectados

```bash
adb devices
```

Exemplo neste projeto:

```text
RX8N70776XH     device
0cce08d77d81    device
```

## 2. Configurar o Metro para os dois aparelhos

Rode um comando para cada serial:

```bash
adb -s RX8N70776XH reverse tcp:8081 tcp:8081
adb -s 0cce08d77d81 reverse tcp:8081 tcp:8081
```

Conferir se ficou ativo:

```bash
adb -s RX8N70776XH reverse --list
adb -s 0cce08d77d81 reverse --list
```

Resultado esperado:

```text
UsbFfs tcp:8081 tcp:8081
```

## 3. Rodar o Metro

Use o Metro em modo dev client:

```bash
npx expo start --dev-client
```

Mantenha esse terminal aberto.

## 4. Instalar/abrir o app em cada aparelho

Se precisar recompilar ou instalar o app em cada dispositivo:

```bash
npx expo run:android --device RX8N70776XH
npx expo run:android --device 0cce08d77d81
```

Se o app ja estiver instalado, normalmente basta abrir o app nos dois aparelhos com o Metro rodando.

## 5. Se aparecer tela vermelha

Na tela vermelha `Unable to load script`:

1. Confirme que o Metro esta rodando na porta `8081`.
2. Rode novamente os dois comandos de reverse:

```bash
adb -s RX8N70776XH reverse tcp:8081 tcp:8081
adb -s 0cce08d77d81 reverse tcp:8081 tcp:8081
```

3. Toque em `Reload` no aparelho.

## Comando rapido do dia a dia

```bash
adb -s RX8N70776XH reverse tcp:8081 tcp:8081
adb -s 0cce08d77d81 reverse tcp:8081 tcp:8081
npx expo start --dev-client
```

Depois abra/recarregue o app nos dois Androids.

## Usando seu atalho SCRCPY_TODOS_OS_APARELHOS.bat

Voce tambem pode iniciar os aparelhos pelo arquivo:

```text
C:\Users\Administrator\Desktop\SCRCPY_TODOS_OS_APARELHOS.bat
```

Esse arquivo foi ajustado para fazer duas coisas automaticamente para cada aparelho online:

1. Configurar o reverse do Metro:

```bash
adb -s SERIAL_DO_APARELHO reverse tcp:8081 tcp:8081
```

2. Abrir uma janela do scrcpy para o aparelho:

```bash
scrcpy -s SERIAL_DO_APARELHO
```

Fluxo recomendado:

```bash
npx expo start --dev-client
```

Depois execute:

```text
C:\Users\Administrator\Desktop\SCRCPY_TODOS_OS_APARELHOS.bat
```

Se aparecer a tela vermelha `Unable to load script`, execute o `.bat` novamente e toque em `Reload` no aparelho.
