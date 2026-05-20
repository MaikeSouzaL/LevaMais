const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'screens', '(authenticated)', 'Driver', 'DriverHomeScreen.tsx');
console.log('Target file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('File not found!');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Inserir o estado isIncomingRequestDismissed
content = content.replace(
  'const [incomingRequest, setIncomingRequest] = useState<any>(null);',
  'const [incomingRequest, setIncomingRequest] = useState<any>(null);\n  const [isIncomingRequestDismissed, setIsIncomingRequestDismissed] = useState(false);'
);

// 2. Resetar isIncomingRequestDismissed ao receber nova oferta em showIncomingRideRequest
content = content.replace(
  'const alreadyShowing = incomingRequest?.rideId === payload.rideId;\n    setIncomingRequest(payload);',
  'const alreadyShowing = incomingRequest?.rideId === payload.rideId;\n    setIncomingRequest(payload);\n    setIsIncomingRequestDismissed(false);'
);

// 3. Resetar isIncomingRequestDismissed ao limpar chamado em clearIncoming
content = content.replace(
  'const clearIncoming = async () => {\n    setIncomingRequest(null);',
  'const clearIncoming = async () => {\n    setIncomingRequest(null);\n    setIsIncomingRequestDismissed(false);'
);

// 4. Atualizar propriedades do NewIncomingOfferSheet
content = content.replace(
  '            <NewIncomingOfferSheet\n              isVisible={!!incomingRequest?.rideId}\n              request={incomingRequest}\n              countdown={countdown}\n              onAccept={acceptIncoming}\n              onReject={rejectIncoming}',
  '            <NewIncomingOfferSheet\n              isVisible={!!incomingRequest?.rideId && !isIncomingRequestDismissed}\n              request={incomingRequest}\n              countdown={countdown}\n              onAccept={acceptIncoming}\n              onReject={rejectIncoming}\n              onClose={() => {\n                setIsIncomingRequestDismissed(true);\n                driverAlertService.stop().catch(() => {});\n              }}'
);

// 5. Inserir o Banner Amarelo de Alerta Ativo
const bannerCode = `              {/* ⚠️ ACTIVE OFFER PENDING BANNER */}
              {isIncomingRequestDismissed && incomingRequest?.rideId && (
                <MotiView
                  from={{ opacity: 0, translateY: -20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{
                    position: "absolute",
                    top: 120,
                    left: 16,
                    right: 16,
                    zIndex: 40,
                    backgroundColor: "#FBBF24",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 10,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: "#091A2F", fontSize: 13, fontWeight: "900" }}>
                      Chamado Ativo Pendente! 🔔
                    </Text>
                    <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                      Você tem 1 oferta ativa aguardando.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleNotifications}
                    style={{
                      backgroundColor: "#091A2F",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "900" }}>VER DETALHES</Text>
                  </TouchableOpacity>
                </MotiView>
              )}\n`;

content = content.replace(
  '              {/* ⚠️ URGENT QUEUE BANNER */}',
  bannerCode + '\n              {/* ⚠️ URGENT QUEUE BANNER */}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('DriverHomeScreen changes applied successfully!');
