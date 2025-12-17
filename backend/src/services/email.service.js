const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

class EmailService {
  constructor() {
    // Configurar transporter SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verificar configuração ao inicializar
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Servidor de email configurado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao conectar ao servidor de email:", error.message);
      console.error("⚠️  Verifique as configurações SMTP no arquivo .env");
    }
  }

  // Carregar template HTML
  loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/emails",
        `${templateName}.html`
      );
      let html = fs.readFileSync(templatePath, "utf8");

      // Substituir variáveis no template
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, variables[key]);
      });

      return html;
    } catch (error) {
      console.error(`Erro ao carregar template ${templateName}:`, error);
      // Retornar template básico em caso de erro
      return this.getBasicTemplate(variables);
    }
  }

  // Template básico de fallback
  getBasicTemplate(variables) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset de Senha - Leva+</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #00E096 0%, #00B87A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Leva+</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Código de Verificação</h2>
          <p>Olá,</p>
          <p>Você solicitou a redefinição de senha. Use o código abaixo para continuar:</p>
          <div style="background: white; border: 2px solid #00E096; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #00E096; letter-spacing: 5px; margin: 0;">${
              variables.code || ""
            }</p>
          </div>
          <p style="color: #666; font-size: 14px;">Este código expira em 10 minutos.</p>
          <p style="color: #666; font-size: 14px;">Se você não solicitou esta alteração, ignore este email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Leva+. Todos os direitos reservados.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Enviar email de reset de senha
  async sendPasswordResetEmail(email, code) {
    try {
      const html = this.loadTemplate("password-reset", {
        code,
        email,
        appName: "Leva+",
        year: new Date().getFullYear(),
      });

      const mailOptions = {
        from: `"Leva+" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "🔐 Código de Verificação - Redefinição de Senha",
        html,
        text: `Seu código de verificação é: ${code}\n\nEste código expira em 10 minutos.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email enviado com sucesso:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Erro ao enviar email:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new EmailService();
