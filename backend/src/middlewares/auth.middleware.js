const jwt = require("jsonwebtoken");
const User = require("../models/User");

function extractBearerToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (String(scheme || "").toLowerCase() !== "bearer") return null;
  return token || null;
}

async function resolveUserFromToken(token) {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log(`[AuthMiddleware] User NOT found for ID: ${decoded.id}`);
      return null;
    }
    if (!user.isActive) {
      console.log(`[AuthMiddleware] User FOUND but INACTIVE for ID: ${decoded.id}`);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

// Middleware para verificar token JWT
async function authenticateToken(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token nao fornecido",
      });
    }

    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token invalido, expirado ou usuario inativo",
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      userType: user.userType,
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro na autenticacao",
      error: error.message,
    });
  }
}

// Middleware para autorizar por tipo de usuario (RBAC)
function authorizeRoles(...roles) {
  const normalized = roles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    const userRole = String(req?.user?.userType || "").toLowerCase();

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: "Usuario nao autenticado",
      });
    }

    if (!normalized.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Voce nao tem permissao para acessar este recurso",
      });
    }

    return next();
  };
}

// Admin auth de transicao: JWT admin OU chave administrativa
async function requireAdmin(req, res, next) {
  try {
    const adminApiKey = process.env.ADMIN_API_KEY || "dev-admin-key";
    const providedKey = req.headers["x-admin-key"];

    if (providedKey && providedKey === adminApiKey) {
      req.user = {
        id: "admin-api-key",
        email: "admin@system.local",
        userType: "admin",
      };
      return next();
    }

    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Credenciais administrativas nao fornecidas",
      });
    }

    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token invalido, expirado ou usuario inativo",
      });
    }

    if (String(user.userType).toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso restrito a administradores",
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      userType: user.userType,
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro na autenticacao administrativa",
      error: error.message,
    });
  }
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
};
