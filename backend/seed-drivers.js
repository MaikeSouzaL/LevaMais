console.log("Seed desativado: cadastre motoristas via web/app. Este script não executa mais operações no banco.");
process.exit(0);
        vehicleType,
        vehicleInfo: vehicle,
      });
      await user.save();

      console.log(`✅ Motorista criado: ${user.name} (${user.email})`);

      // Se latitude/longitude foram fornecidas, criar localização
      if (latitude && longitude) {
        const driverLocation = new DriverLocation({
          driverId: user._id,
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          status: "available",
          vehicleType,
          vehicle,
        });

        await driverLocation.save();
        console.log(`   📍 Localização definida: ${latitude}, ${longitude}`);
      } else {
        console.log(
          `   ⚠️  Localização não definida - adicione manualmente depois`
        );
      }
    }

    console.log("\n✅ Seed de motoristas concluído!");
    console.log("\n📝 IMPORTANTE:");
    console.log("Você precisa atualizar as localizações dos motoristas!");
    console.log(
      "Edite o arquivo seed-drivers.js e adicione latitude/longitude."
    );
    console.log("\nOu use a API:");
    console.log("POST /api/driver-location/update");
    console.log("Body: { latitude: -23.550520, longitude: -46.633308, ... }");

    console.log("\n📧 Credenciais dos motoristas:");
    mockDrivers.forEach((driver) => {
      console.log(`\n${driver.name}:`);
      console.log(`  Email: ${driver.email}`);
      console.log(`  Senha: ${driver.password}`);
      console.log(`  Veículo: ${driver.vehicle.model} (${driver.vehicleType})`);
    });
  } catch (error) {
    console.error("❌ Erro ao criar seed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Desconectado do MongoDB");
  }
}

seedDrivers();
