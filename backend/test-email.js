/**
 * Script de teste rápido para verificar o envio de email
 * 
 * Uso: node test-email.js
 */

require('dotenv').config();
const emailService = require('./src/services/email.service');

async function testEmail() {
  console.log('🧪 Testando envio de email...\n');
  
  // Verificar se as variáveis estão configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Variáveis SMTP não configuradas no .env');
    console.error('   Configure: SMTP_HOST, SMTP_USER, SMTP_PASS');
    process.exit(1);
  }

  console.log('📧 Configurações SMTP:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT || 587}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Pass: ${process.env.SMTP_PASS ? '***' : 'NÃO CONFIGURADO'}\n`);

  // Email de teste (pode ser alterado)
  const testEmail = process.argv[2] || process.env.SMTP_USER;
  const testCode = '123456';

  console.log(`📨 Enviando email de teste para: ${testEmail}\n`);

  try {
    const result = await emailService.sendPasswordResetEmail(testEmail, testCode);
    
    if (result.success) {
      console.log('✅ Email enviado com sucesso!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`\n📬 Verifique a caixa de entrada de: ${testEmail}`);
      console.log('   (Verifique também a pasta de SPAM)');
    } else {
      console.error('❌ Erro ao enviar email:');
      console.error(`   ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Executar teste
testEmail();

