// Teste rápido dos endpoints criados
const http = require("http");

const testEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: `/api${path}`,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(
            `   Dados:`,
            JSON.stringify(json, null, 2).substring(0, 200)
          );
          resolve(true);
        } catch (e) {
          console.log(`\n❌ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Erro:`, e.message);
          console.log(`   Response:`, data.substring(0, 200));
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.log(`\n❌ ${description}`);
      console.log(`   Erro de conexão:`, error.message);
      resolve(false);
    });

    req.end();
  });
};

const runTests = async () => {
  console.log("🧪 Testando endpoints criados...\n");

  await testEndpoint("/auth/users", "GET /api/auth/users");
  await testEndpoint(
    "/auth/users?userType=driver",
    "GET /api/auth/users?userType=driver"
  );
  await testEndpoint("/driver-location/all", "GET /api/driver-location/all");

  console.log("\n✅ Testes concluídos!");
  process.exit(0);
};

// Aguardar 1 segundo antes de iniciar
setTimeout(runTests, 1000);
