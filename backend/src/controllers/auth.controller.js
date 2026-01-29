const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const crypto = require("crypto");

class AuthController {
  // Gerar token JWT
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
  }

  // Cadastrar usuário com email e senha
  async register(req, res) {
    try {
      const {
        name,
        email,
        password,
        phone,
        city,
        userType,
        acceptedTerms,
        // Tipo de documento
        documentType,
        // Documentos
        cpf,
        cnpj,
        // Dados da empresa
        companyName,
        companyEmail,
        companyPhone,
        // Endereço
        address,
        // Preferências
        preferredPayment,
        notificationsEnabled,
        // Driver
        vehicleType,
        vehicleInfo,
      } = req.body;

      // Validar campos obrigatórios
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Nome, email e senha são obrigatórios",
        });
      }

      // Verificar se o email já existe
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email já cadastrado",
        });
      }

      // Se tiver address com city, usar o city do address, senão usar o city direto
      const userCity = address?.city || city;

      // Preparar objeto de criação do usuário (remover campos undefined/vazios)
      const userData = {
        name,
        email: email.toLowerCase(),
        password,
        userType: userType || "client",
        acceptedTerms: acceptedTerms || false,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (phone && phone.trim() !== "") userData.phone = phone.trim();
      if (userCity && userCity.trim() !== "") userData.city = userCity.trim();

      // Documentos
      if (cpf && cpf.trim() !== "") userData.cpf = cpf.trim();
      if (cnpj && cnpj.trim() !== "") userData.cnpj = cnpj.trim();

      // Dados da empresa
      if (companyName && companyName.trim() !== "")
        userData.companyName = companyName.trim();
      if (companyEmail && companyEmail.trim() !== "")
        userData.companyEmail = companyEmail.toLowerCase().trim();
      if (companyPhone && companyPhone.trim() !== "")
        userData.companyPhone = companyPhone.trim();

      // Endereço (só adiciona se tiver pelo menos street e number)
      if (address && address.street && address.number) {
        userData.address = {
          street: address.street.trim(),
          number: address.number.trim(),
        };
        if (address.complement)
          userData.address.complement = address.complement.trim();
        if (address.neighborhood)
          userData.address.neighborhood = address.neighborhood.trim();
        if (address.city) userData.address.city = address.city.trim();
        if (address.state)
          userData.address.state = address.state.trim().substring(0, 2);
        if (address.zipCode) userData.address.zipCode = address.zipCode.trim();
        if (address.referencePoint)
          userData.address.referencePoint = address.referencePoint.trim();
        if (address.latitude !== undefined)
          userData.address.latitude = address.latitude;
        if (address.longitude !== undefined)
          userData.address.longitude = address.longitude;
      }

      // Preferências
      if (preferredPayment) userData.preferredPayment = preferredPayment;
      userData.notificationsEnabled =
        notificationsEnabled !== undefined ? notificationsEnabled : true;

      // Dados do motorista
      if ((userType || "client") === "driver") {
        if (vehicleType) userData.vehicleType = vehicleType;
        if (vehicleInfo) userData.vehicleInfo = vehicleInfo;
      }

      // Criar novo usuário
      const user = await User.create(userData);

      // Gerar token
      const token = this.generateToken(user._id);

      res.status(201).json({
        success: true,
        message: "Usuário cadastrado com sucesso",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao cadastrar usuário",
        error: error.message,
      });
    }
  }

  // Login com email e senha
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos obrigatórios
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email e senha são obrigatórios",
        });
      }

      // Buscar usuário com senha
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email ou senha inválidos",
        });
      }

      // Verificar se a conta está ativa
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Conta desativada",
        });
      }

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email ou senha inválidos",
        });
      }

      // Gerar token
      const token = this.generateToken(user._id);

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao fazer login",
        error: error.message,
      });
    }
  }

  // Login ou cadastro com Google
  async googleAuth(req, res) {
    try {
      const { googleId, email, name, profilePhoto } = req.body;

      if (!googleId || !email) {
        return res.status(400).json({
          success: false,
          message: "Google ID e email são obrigatórios",
        });
      }

      // Buscar usuário existente por googleId ou email
      let user = await User.findOne({
        $or: [{ googleId }, { email: email.toLowerCase() }],
      });

      if (user) {
        // Atualizar informações do Google se necessário
        if (!user.googleId) {
          user.googleId = googleId;
        }
        if (profilePhoto && !user.profilePhoto) {
          user.profilePhoto = profilePhoto;
        }
        await user.save();
      } else {
        // Criar novo usuário
        user = await User.create({
          googleId,
          email: email.toLowerCase(),
          name,
          profilePhoto,
          userType: "client",
          acceptedTerms: true,
        });
      }

      // Gerar token
      const token = this.generateToken(user._id);

      res.json({
        success: true,
        message: "Autenticação Google realizada com sucesso",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Erro na autenticação Google:", error);
      res.status(500).json({
        success: false,
        message: "Erro na autenticação Google",
        error: error.message,
      });
    }
  }

  // Buscar perfil do usuário autenticado
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      res.json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar perfil",
        error: error.message,
      });
    }
  }

  // Solicitar reset de senha (envia código por email)
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório",
        });
      }

      // Verificar se o usuário existe
      const user = await User.findOne({ email: email.toLowerCase() });

      // Por segurança, sempre retornar sucesso mesmo se o email não existir
      // Isso previne enumeração de emails
      if (!user) {
        return res.json({
          success: true,
          message: "Se o email existir, você receberá um código de verificação",
        });
      }

      // Gerar código de 6 dígitos
      const code = crypto.randomInt(100000, 999999).toString();

      // Definir expiração (10 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Invalidar códigos anteriores não usados do mesmo email
      await PasswordReset.updateMany(
        { email: email.toLowerCase(), used: false },
        { used: true }
      );

      // Salvar código no banco
      await PasswordReset.create({
        email: email.toLowerCase(),
        code,
        expiresAt,
      });

      // Enviar email
      const emailResult = await emailService.sendPasswordResetEmail(
        email.toLowerCase(),
        code
      );

      if (!emailResult.success) {
        console.error("Erro ao enviar email:", emailResult.error);
        return res.status(500).json({
          success: false,
          message: "Erro ao enviar email. Tente novamente mais tarde.",
        });
      }

      res.json({
        success: true,
        message: "Código de verificação enviado para seu email",
      });
    } catch (error) {
      console.error("Erro ao solicitar reset de senha:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao processar solicitação",
        error: error.message,
      });
    }
  }

  // Verificar código de reset
  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: "Email e código são obrigatórios",
        });
      }

      // Buscar código válido
      const resetRequest = await PasswordReset.findOne({
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { $gt: new Date() }, // Ainda não expirou
      });

      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message: "Código inválido ou expirado",
        });
      }

      res.json({
        success: true,
        message: "Código verificado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao verificar código",
        error: error.message,
      });
    }
  }

  // Redefinir senha com código
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, código e nova senha são obrigatórios",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "A senha deve ter no mínimo 6 caracteres",
        });
      }

      // Buscar código válido
      const resetRequest = await PasswordReset.findOne({
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message: "Código inválido ou expirado",
        });
      }

      // Buscar usuário
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      // Marcar código como usado
      resetRequest.used = true;
      await resetRequest.save();

      res.json({
        success: true,
        message: "Senha redefinida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao redefinir senha",
        error: error.message,
      });
    }
  }

  // Salvar push token do dispositivo
  async savePushToken(req, res) {
    try {
      const { pushToken } = req.body;
      const userId = req.user.id;

      // Validar token
      if (!pushToken || typeof pushToken !== "string") {
        return res.status(400).json({
          success: false,
          message: "Push token é obrigatório",
        });
      }

      // Validar formato do token Expo
      if (
        !pushToken.startsWith("ExponentPushToken[") &&
        !pushToken.startsWith("ExpoPushToken[")
      ) {
        return res.status(400).json({
          success: false,
          message: "Formato de push token inválido",
        });
      }

      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Atualizar push token
      user.pushToken = pushToken;
      user.pushTokenUpdatedAt = new Date();
      await user.save();

      console.log(`Push token salvo para usuário ${user.email}: ${pushToken}`);

      res.json({
        success: true,
        message: "Push token salvo com sucesso",
        data: {
          pushToken: user.pushToken,
          pushTokenUpdatedAt: user.pushTokenUpdatedAt,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar push token:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao salvar push token",
        error: error.message,
      });
    }
  }

  // Remover push token (quando usuário faz logout ou desativa notificações)
  async removePushToken(req, res) {
    try {
      const userId = req.user.id;

      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Remover push token
      user.pushToken = null;
      user.pushTokenUpdatedAt = new Date();
      await user.save();

      console.log(`Push token removido para usuário ${user.email}`);

      res.json({
        success: true,
        message: "Push token removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover push token:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao remover push token",
        error: error.message,
      });
    }
  }

  // Listar usuários (para admin)
  async listUsers(req, res) {
    try {
      const { userType, isActive, limit = 100, page = 1 } = req.query;

      const query = {};

      if (userType) {
        query.userType = userType;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      const users = await User.find(query)
        .select("-password")
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao listar usuários",
        error: error.message,
      });
    }
  }

  // Buscar usuário por ID (para admin)
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar usuário",
        error: error.message,
      });
    }
  }
}

const authController = new AuthController();

module.exports = authController;
