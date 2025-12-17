const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Token inválido ou expirado",
          });
        }

        try {
          const user = await User.findById(decoded.id);

          if (!user) {
            return res.status(401).json({
              success: false,
              message: "Usuário não encontrado",
            });
          }

          if (!user.isActive) {
            return res.status(401).json({
              success: false,
              message: "Conta desativada",
            });
          }

          req.user = {
            id: user._id,
            email: user.email,
            userType: user.userType,
          };

          next();
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erro ao verificar usuário",
            error: error.message,
          });
        }
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro na autenticação",
      error: error.message,
    });
  }
}

module.exports = {
  authenticateToken,
};
