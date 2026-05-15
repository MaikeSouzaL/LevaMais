const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(public)", "SelectProfileScreen", "index.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Refactor async function handleProceed() to unify client/driver login flows
const targetProceed = `  async function handleProceed() {
    if (!user) {
            return;
    }
    
    const choice = selectedProfile || "client";

    if (choice === "client") {
      setLoading(true);
      try {
        // 🌐 Scenerio A: User originated from Google (Already in DB, has _id and token)
        if (user._id && user._id.length > 5) {
          
          // 🚀 CRITICAL FIX: Persist validated phone number to Backend DATABASE before finalizing login!
          // This prevents the login sequence from repeatedly asking for phone updates!
          if (user.phone && initialToken) {
            try {
              await userService.updateProfile({ phone: user.phone }, initialToken);
                          } catch (err) {
                            // Keep going, we won't block entry, but this should pass.
            }
          }

          login(
            "client",
            {
              id: user._id,
              name: user.name,
              nome: user.name,
              email: user.email,
              telefone: user.phone || "",
              cidade: user.city || "",
              fotoPerfil: user.profilePhoto,
              googleId: user.googleId,
              aceitouTermos: true,
            },
            initialToken || "",
          );
          Toast.show({
            type: "success",
            text1: "Acesso liberado!",
            text2: \`Bem-vindo ao Leva+, \${user.name}!\`,
          });
          return;
        }

        // 📝 Scenerio B: Manual User Signup (Needs to be persisted in backend)
        const response = await registerUser({
          name: user.name,
          email: user.email,
          password: user.password || "",
          phone: user.phone,
          city: user.city,
          userType: "client",
          acceptedTerms: true,
          googleId: user.googleId, // 🔗 Important: Ensure metadata links correctly!
          profilePhoto: user.profilePhoto,
        });

        if (response.success && response.data) {
          const { user: registeredUser, token } = response.data;
          login(
            "client",
            {
              id: registeredUser._id,
              name: registeredUser.name,
              nome: registeredUser.name,
              email: registeredUser.email,
              telefone: registeredUser.phone || "",
              cidade: registeredUser.city || "",
              fotoPerfil: registeredUser.profilePhoto,
              googleId: registeredUser.googleId,
              aceitouTermos: true,
            },
            token,
          );
          Toast.show({
            type: "success",
            text1: "Conta criada!",
            text2: "Seja bem-vindo!",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Erro ao finalizar acesso",
            text2: response.message || "Tente novamente em instantes",
          });
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Falha na conexão",
          text2: "Verifique sua internet e tente novamente",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Diverting into High-Conversion Benefits Intro Screen first!
      navigation.navigate("DriverIntro", {
        selectedProfile: choice,
        user,
        token: initialToken,
      });
    }
  }`;

const replacementProceed = `  async function handleProceed() {
    if (!user) {
      return;
    }
    
    const choice = selectedProfile || "client";
    setLoading(true);

    try {
      // 🌐 Scenario A: User originated from Google (Already in DB, has _id and token)
      if (user._id && user._id.length > 5) {
        
        // 🚀 CRITICAL FIX: Persist validated phone number and UserType update to database before finalizing login!
        if (initialToken) {
          try {
            await userService.updateProfile({ 
              phone: user.phone,
              userType: choice
            }, initialToken);
          } catch (err) {
            // Silent fail - keep going
          }
        }

        login(
          choice,
          {
            id: user._id,
            name: user.name,
            nome: user.name,
            email: user.email,
            telefone: user.phone || "",
            cidade: user.city || "",
            fotoPerfil: user.profilePhoto,
            googleId: user.googleId,
            aceitouTermos: true,
            driverStatus: choice === "driver" ? "none" : undefined,
          },
          initialToken || "",
        );
        Toast.show({
          type: "success",
          text1: "Acesso liberado!",
          text2: \`Bem-vindo ao Leva Mais, \${user.name}!\`,
        });
        return;
      }

      // 📝 Scenario B: Manual User Signup (Needs to be persisted in backend)
      const response = await registerUser({
        name: user.name,
        email: user.email,
        password: user.password || "",
        phone: user.phone,
        city: user.city,
        userType: choice,
        acceptedTerms: true,
        googleId: user.googleId,
        profilePhoto: user.profilePhoto,
      });

      if (response.success && response.data) {
        const { user: registeredUser, token } = response.data;
        login(
          choice,
          {
            id: registeredUser._id,
            name: registeredUser.name,
            nome: registeredUser.name,
            email: registeredUser.email,
            telefone: registeredUser.phone || "",
            cidade: registeredUser.city || "",
            fotoPerfil: registeredUser.profilePhoto,
            googleId: registeredUser.googleId,
            aceitouTermos: true,
            driverStatus: choice === "driver" ? "none" : undefined,
          },
          token,
        );
        Toast.show({
          type: "success",
          text1: "Conta criada!",
          text2: choice === "driver" ? "Bem-vindo, parceiro!" : "Seja bem-vindo!",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao finalizar acesso",
          text2: response.message || "Tente novamente em instantes",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Falha na conexão",
        text2: "Verifique sua internet e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }`;

if (content.includes("choice === \"client\"")) {
  content = content.replace(targetProceed, replacementProceed);
  console.log("Unified profile flow inside SelectProfileScreen successfully!");
} else {
  console.log("Target proceed block not found or already refactored.");
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("Profile screen updated successfully!");
